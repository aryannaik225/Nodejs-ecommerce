"use client";

import { useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";

interface PaypalCheckoutProps {
  amount: number;
  onSuccess: () => void;
}

export default function PaypalCheckout({
  amount,
  onSuccess,
}: PaypalCheckoutProps) {
  const [status, setStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const initialOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
    currency: "USD",
    intent: "capture",
    components: "buttons",
  };

  const handleCreateOrder = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/paypal/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amount }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("BACKEND ERROR RESPONSE:", errorData);
        throw new Error("Could not create order")
      };

      const order = await res.json();
      return order.id;
    } catch (error) {
      console.error(error);
      return "";
    }
  };

  const handleOnApprove = async (data: any) => {
    setStatus("processing");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/paypal/capture-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderID: data.orderID }),
      });

      const orderData = await res.json();

      if (!res.ok || orderData.status !== "COMPLETED") {
        const errorDetail = orderData?.details?.[0];
        const failureReason = errorDetail?.issue;

        if (failureReason === "INSTRUMENT_DECLINED") {
          setErrorMessage(
            "Payment declined. Please check your balance or try a different card."
          );
        } else if (failureReason === "TRANSACTION_REFUSED") {
          setErrorMessage("The transaction was refused by your bank.");
        } else {
          setErrorMessage(
            errorDetail?.description || "Payment could not be processed."
          );
        }
        setStatus("error");
        return;
      }
      setStatus("success");
      onSuccess();
    } catch (error) {
      console.warn("Payment System Error:", error);
      setErrorMessage("A network error occurred. Please try again.");
      setStatus("error");
    }
  };

  if (status === "processing") {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in">
        <Loader2 className="w-12 h-12 text-gray-900 animate-spin mb-4" />
        <h3 className="text-lg font-bold text-gray-900">Processing Payment</h3>
        <p className="text-sm text-gray-500">
          Please do not close this window...
        </p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center animate-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" /> 
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Payment Successful!
        </h3>
        <p className="text-gray-500 text-sm max-w-xs mx-auto">
          Thank you for your purchase. A confirmation email has been sent to
          you.
        </p>
        <div className="mt-6 w-full bg-gray-50 rounded-lg p-3 border border-gray-100">
          <p className="text-xs text-gray-400">
            Redirecting to store in 5 seconds...
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center animate-in zoom-in-95">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <XCircle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Failed</h3>
        <p className="text-red-500 text-sm mb-6">{errorMessage}</p>
        <button
          onClick={() => setStatus("idle")}
          className="flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      </div>
    );
  }

  return (
    <PayPalScriptProvider options={initialOptions}>
      <div className="space-y-4 w-full animate-in fade-in">
        <div className="relative z-0">
          <PayPalButtons
            fundingSource="paypal"
            style={{
              layout: "vertical",
              color: "black",
              shape: "rect",
              label: "pay",
              height: 48,
            }}
            createOrder={handleCreateOrder}
            onApprove={handleOnApprove}
            onError={() => {
              setErrorMessage("An unexpected error occurred with PayPal.");
              setStatus("error");
            }}
          />
        </div>

        <div className="relative flex items-center py-1">
          <div className="grow border-t border-gray-200"></div>
          <span className="shrink-0 mx-4 text-gray-400 text-xs font-medium uppercase tracking-wider">
            Or pay with card
          </span>
          <div className="grow border-t border-gray-200"></div>
        </div>

        <div className="relative z-0">
          <PayPalButtons
            fundingSource="card"
            style={{
              layout: "vertical",
              color: "white",
              shape: "rect",
              height: 48,
            }}
            createOrder={handleCreateOrder}
            onApprove={handleOnApprove}
            onError={() => {
              setErrorMessage("Card payment failed.");
              setStatus("error");
            }}
          />
        </div>
      </div>
    </PayPalScriptProvider>
  );
}
