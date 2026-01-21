import dotenv from "dotenv";
import { createOrderTransaction } from "../TiDB/order-queries.js";
dotenv.config();

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;
const BASE_URL = "https://api-m.sandbox.paypal.com";

const generateAccessToken = async () => {
  try {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      throw new Error("MISSING_API_CREDENTIALS");
    }
    const auth = Buffer.from(
      PAYPAL_CLIENT_ID + ":" + PAYPAL_CLIENT_SECRET
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
  } catch (error) {
    console.error("Failed to generate Access Token:", error);
  }
};

export const createOrder = async (req, res) => {
  try {
    const { amount } = req.body; 

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
    }

    const accessToken = await generateAccessToken();
    const url = `${BASE_URL}/v2/checkout/orders`;
    
    const response = await fetch(url, {
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
    return res.status(response.status).json(data);
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({ error: "Failed to create order" });
  }
};

export const captureOrder = async (req, res) => {
  try {
    const { orderID } = req.body;
    const userId = req.user.id;
    const accessToken = await generateAccessToken();
    const url = `${BASE_URL}/v2/checkout/orders/${orderID}/capture`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (data.status !== "COMPLETED") {
      return res.status(400).json({
        message: "Payment not completed",
        paypalStatus: data.status,
      })
    }

    const order = await createOrderTransaction(
      userId,
      "PayPal",
      "paid"
    )

    console.log("Order created with ID:", order.id);

    return res.status(200).json({
      message: "Payment & order successful",
      orderId: order.id,
      paypalOrderId: orderID,
    });

  } catch (error) {
    console.error("Error capturing Paypal order:", error);
    return res.status(500).json({ error: "Failed to capture PayPal order" });
  }
};