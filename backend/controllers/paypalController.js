import dotenv from "dotenv";
import { decrementStock, incrementStock } from "../TiDB/product-queries.js";
import { createOrderTransaction, updateOrderStatus } from "../TiDB/order-queries.js";
// import { redis } from "../redis/lib/redis.js";
import { getRedisKey, setRedisKey, deleteRedisKey } from "../redis/redis-queries.js";
import prisma from "../config/prisma.js";

dotenv.config();

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;
const BASE_URL = "https://api-m.sandbox.paypal.com";

const generateAccessToken = async () => {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error("MISSING_API_CREDENTIALS");
  }

  const auth = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const response = await fetch(`${BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    body: "grant_type=client_credentials",
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  const data = await response.json();
  return data.access_token;
};

export const createOrder = async (req, res) => {
  let order = null;
  let cartItems = []
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { amount } = req.body;
    cartItems = await prisma.cart_items.findMany({
      where: { user_id: req.user.id }
    })
    const userId = req.user.id;

    const existingOrderId = await getRedisKey(`checkout:user:${userId}`);
    if (existingOrderId) {
      return res.status(409).json({
        error: "You already have a pending payment. Please complete or wait for it to expire.",
      })
    }

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const decrementedItems = []

    for (const item of cartItems) {
      const ok = await decrementStock(item.product_id, item.quantity)
      if (!ok) {
        for (const prev of decrementedItems) {
          await incrementStock(prev.product_id, prev.quantity);
        }
        return res.status(409).json({ error: `Insufficient stock` });
      }
      decrementedItems.push(item);
    }

    order = await createOrderTransaction(
      userId,
      "PayPal",
      "pending"
    )

    const accessToken = await generateAccessToken();
    const response = await fetch(`${BASE_URL}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: amount.toFixed(2).toString(),
            },
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      for (const item of cartItems) {
        await incrementStock(item.product_id, item.quantity);
      }
      await updateOrderStatus(order.id, "cancelled", "failed");
      return res.status(response.status).json(data);
    }

    await setRedisKey(
      `checkout:order:${data.id}`,
      {
        userId,
        dbOrderId: order.id,
        items: cartItems.map((item) => ({
          productId: item.product_id,
          quantity: item.quantity,
        })),
        createdAt: Date.now(),
      },
      { ex: 900 }
    );

    await setRedisKey(
      `checkout:user:${userId}`,
      data.id,
      { ex: 900 }
    )

    return res.status(200).json({ id: data.id });

  } catch (error) {
    console.error("Error creating PayPal order:", error);

    if (error.message === "REDIS_UNAVAILABLE") {
      if (cartItems && cartItems.length > 0) {
        for (const item of cartItems) {
          await incrementStock(item.product_id, item.quantity);
        }
      }
      if (order?.id) {
        await updateOrderStatus(order.id, "cancelled", "failed");
      }
      return res.status(503).json({ error: "Service temporarily unavailable. Please try again later." });
    }

    if (order?.id) {
      await updateOrderStatus(order.id, "cancelled", "failed");
    }
    return res.status(500).json({ error: "Failed to create order" });
  }
};


export const captureOrder = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { orderID } = req.body;
    const userId = req.user.id;

    // 1. NEW: Fetch from Redis FIRST before touching PayPal's Capture API
    const redisData = await getRedisKey(`checkout:order:${orderID}`);

    if (!redisData || !redisData.dbOrderId) {
      await updateOrderStatus(orderID, "cancelled", "failed");
      return res.status(400).json({ error: "Order data not found or expired" });
    }

    // 2. Now that we know we have the data, capture the funds
    const accessToken = await generateAccessToken();
    const response = await fetch(
      `${BASE_URL}/v2/checkout/orders/${orderID}/capture`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();

    // 3. Handle PayPal rejection
    if (data.status !== "COMPLETED") {
      if (redisData?.items) {
        for (const item of redisData.items) {
          await incrementStock(item.productId, item.quantity);
        }
      }

      // We attempt to delete, but if the circuit opened in the last 2 seconds, 
      // it will throw. We should catch it locally so we can still return the 400.
      try {
        await deleteRedisKey(`checkout:order:${orderID}`);
        await deleteRedisKey(`checkout:user:${userId}`);
      } catch (cleanupError) {
        console.warn("Could not clean up Redis keys after failed capture:", cleanupError);
      }

      return res.status(400).json({
        message: "Payment not completed",
        paypalStatus: data.status,
      });
    }

    // 4. Update the Database
    await updateOrderStatus(redisData.dbOrderId, "placed", "paid");

    await prisma.cart_items.deleteMany({
      where: { user_id: userId }
    });

    // 5. Cleanup Redis
    try {
      await deleteRedisKey(`checkout:order:${orderID}`);
      await deleteRedisKey(`checkout:user:${userId}`);
    } catch (cleanupError) {
      console.warn("Could not clean up Redis keys after successful capture:", cleanupError);
    }

    return res.status(200).json({
      message: "Payment & order successful",
      orderId: redisData.dbOrderId,
      paypalOrderId: orderID,
    });

  } catch (error) {
    console.error("Error capturing PayPal order:", error);
    
    // NEW: Handle Circuit Breaker Error
    if (error.message === "REDIS_UNAVAILABLE") {
       return res.status(503).json({ 
         error: "Service temporarily unavailable. Your payment was not captured. Please try again." 
       });
    }

    return res.status(500).json({ error: "Failed to capture PayPal order" });
  }
};