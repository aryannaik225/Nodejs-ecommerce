import dotenv from "dotenv";
import { decrementStock, incrementStock } from "../TiDB/product-queries.js";
import { createOrderTransaction } from "../TiDB/order-queries.js";
import { redis } from "../redis/lib/redis.js";

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
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { amount, cartItems } = req.body;
    const userId = req.user.id;

    const existingOrderId = await redis.get(`checkout:user:${userId}`);
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

    for (const item of cartItems) {
      const ok = await decrementStock(item.product_id, item.quantity);
      if (!ok) {
        return res.status(409).json({ error: "Insufficient stock" });
      }
    }

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
      return res.status(response.status).json(data);
    }

    await redis.set(
      `checkout:order:${data.id}`,
      {
        userId,
        items: cartItems.map((item) => ({
          productId: item.product_id,
          quantity: item.quantity,
        })),
        createdAt: Date.now(),
      },
      { ex: 300 }
    );

    await redis.set(
      `checkout:user:${userId}`,
      data.id,
      { ex: 300 }
    )

    return res.status(200).json({ id: data.id });

  } catch (error) {
    console.error("Error creating PayPal order:", error);
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

    if (data.status !== "COMPLETED") {
      const redisData = await redis.get(`checkout:order:${orderID}`);

      if (redisData?.items) {
        for (const item of redisData.items) {
          await incrementStock(item.productId, item.quantity);
        }
      }

      await redis.del(`checkout:order:${orderID}`);
      await redis.del(`checkout:user:${userId}`);

      return res.status(400).json({
        message: "Payment not completed",
        paypalStatus: data.status,
      });
    }

    const order = await createOrderTransaction(
      userId,
      "PayPal",
      "paid"
    );

    await redis.del(`checkout:order:${orderID}`);
    await redis.del(`checkout:user:${userId}`);
    return res.status(200).json({
      message: "Payment & order successful",
      orderId: order.id,
      paypalOrderId: orderID,
    });

  } catch (error) {
    console.error("Error capturing PayPal order:", error);
    return res.status(500).json({ error: "Failed to capture PayPal order" });
  }
};