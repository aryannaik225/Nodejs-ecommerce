import { NextResponse } from "next/server";
import { generateAccessToken } from "../../../../lib/paypal";

export async function POST(request) {
  try {
    const { amount } = await request.json();

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const accessToken = await generateAccessToken();
    
    const response = await fetch("https://api-m.sandbox.paypal.com/v2/checkout/orders", {
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

    const order = await response.json();
    
    if (!response.ok) {
      console.error("PayPal Error Details:", order);
      throw new Error("Failed to create order");
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}