"use client";

import { useEffect, useState } from "react";
import { Trash2, Plus, Minus, ShoppingCart } from "lucide-react";
import { Product } from "@/lib/utils/types";

interface CartItem extends Product {
  quantity: number;
  product_id: number;
}

const CartPage = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const fetchCart = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/cart?t=${Date.now()}`,
        {
          headers: getHeaders(),
          cache: "no-store",
        }
      );

      if (res.ok) {
        const data = await res.json();
        setCartItems(data.cart || []);
      }
    } catch (error) {
      console.error("Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const updateQuantity = async (productId: number, newQty: number) => {
    setCartItems((items) =>
      items.map((item) =>
        item.product_id === productId ? { ...item, quantity: newQty } : item
      )
    );
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/cart/update`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ productId, quantity: newQty }),
      });
      if (newQty === 0 || !res.ok) fetchCart();
    } catch (error) {
      fetchCart();
    }
  };

  const removeItem = async (productId: number) => {
    setCartItems((prev) =>
      prev.filter((item) => item.product_id !== productId)
    );

    try {
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/cart/remove/${productId}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
    } catch (error) {
      fetchCart();
    }
  };

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  if (loading) return <div className="p-8 text-center">Loading cart...</div>;

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-6 border-b border-gray-100 bg-white">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" /> Your Cart
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {cartItems.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">Your cart is empty.</p>
          </div>
        ) : (
          cartItems.map((item) => (
            <div key={item.product_id} className="flex gap-4">
              <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                    No Img
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-gray-500 text-sm">₹{item.price}</p>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border border-gray-200">
                    <button
                      onClick={() =>
                        updateQuantity(item.product_id, item.quantity - 1)
                      }
                      className="w-6 h-6 flex items-center justify-center hover:bg-white rounded text-gray-600 shadow-sm transition-all"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-medium w-6 text-center text-[#1f1f1f]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.product_id, item.quantity + 1)
                      }
                      className="w-6 h-6 flex items-center justify-center hover:bg-white rounded text-gray-600 shadow-sm transition-all"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.product_id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {cartItems.length > 0 && (
        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-gray-600 text-sm">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg text-gray-900">
              <span>Total</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
          </div>
          <button className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors shadow-lg shadow-gray-900/10">
            Checkout
          </button>
        </div>
      )}
    </div>
  );
};

export default CartPage;
