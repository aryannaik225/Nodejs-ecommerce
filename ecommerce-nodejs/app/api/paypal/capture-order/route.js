import { NextResponse } from "next/server";
import { generateAccessToken } from "../../../../lib/paypal";

export async function POST(request) {
  try {
    const { orderID } = await request.json();
    const accessToken = await generateAccessToken();

    const baseUrl = 'https://api-m.sandbox.paypal.com'

    const response = await fetch(
      `${baseUrl}/v2/checkout/orders/${orderID}/capture`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();
    // console.log('Capture Order Response:', data);

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  }
  catch (error) {
    // console.error('Error capturing order:', error);
    return NextResponse.json({ error: 'Failed to capture order' }, { status: 500 });
  }
}