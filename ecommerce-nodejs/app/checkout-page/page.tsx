import React from "react";
import PaypalCheckout from "@/components/PayPalCheckout";

interface CheckoutPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Home({ searchParams }: CheckoutPageProps) {
  const resolvedParams = await searchParams;
  const amountStr = resolvedParams.amount;
  const validAmountString = Array.isArray(amountStr) ? amountStr[0] : amountStr;
  const amount = parseFloat(validAmountString || "0");

  return (
    <div>
      <PaypalCheckout amount={amount} />
    </div>
  );
}