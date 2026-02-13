"use client";

import React, { useEffect, useState, useRef } from "react";
import { ShoppingBag, ArrowLeft, ShieldCheck } from "lucide-react";
import PaypalCheckout from "@/components/PayPalCheckout";
import { Product, Category } from "@/lib/utils/types";
import CartPage from "@/components/CartPage"

interface UserData {
  name: string;
  email: string;
}



const NavNCart = () => {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  return (
    <>
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-gray-100 overflow-y-auto animate-in fade-in duration-200">
          <div className="min-h-screen flex flex-col">
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
              <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-gray-900 text-white p-1.5 rounded-lg">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <span className="text-xl font-bold tracking-tight text-gray-900">
                    Store. Checkout
                  </span>
                </div>
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                  <ShieldCheck className="w-4 h-4" /> Secure Payment
                </div>
              </div>
            </div>

            <div className="flex-1 max-w-7xl mx-auto w-full p-6 lg:p-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                <div className="lg:col-span-7 space-y-6">
                  <button
                    onClick={() => setIsCheckoutOpen(false)}
                    className="flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors mb-4 group"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                    Return to shopping
                  </button>

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">
                      Payment Method
                    </h2>
                    <p className="text-gray-500 text-sm mb-6">
                      Complete your purchase securely using PayPal.
                    </p>

                    <div className="w-full">
                      <PaypalCheckout
                        amount={amount}
                        onSuccess={handlePaymentSuccess}
                        cartItems={cartItems}
                      />
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 w-full">
                  <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 sm:p-8 sticky top-24">
                    <h2 className="text-lg font-bold text-gray-900 mb-6 flex justify-between items-center">
                      <span>Order Summary</span>
                      <span className="text-sm font-normal text-gray-500">
                        {cartItemCount} Items
                      </span>
                    </h2>

                    <CartPage
                      key={cartRefreshKey}
                      setCartItemCount={setCartItemCount}
                      variant="summary"
                      setAmount={setAmount}
                      addToCart={addToCart}
                      cartItems={cartItems}
                      setCartItems={setCartItems}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NavNCart;
