"use client";

import { useEffect, useState } from "react";
import { Trash2, Plus, Minus, ShoppingCart } from "lucide-react";
import { Product } from "@/lib/utils/types";

interface CartItem extends Product {
  quantity: number;
  product_id: number;
}

interface CartPageProps {
  setCartItemCount: React.Dispatch<React.SetStateAction<number>>;
  onCheckout?: () => void;
  variant?: "drawer" | "summary";
  setAmount?: React.Dispatch<React.SetStateAction<number>>;
}

const CartPage = ({
  setCartItemCount,
  onCheckout,
  setAmount,
  variant = "drawer",
}: CartPageProps) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const isEditable = variant === "drawer";

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
        const rawCart = data.cart || [];
        const mergedCart = rawCart.reduce(
          (acc: CartItem[], currentItem: CartItem) => {
            const existingItem = acc.find(
              (item) => item.product_id === currentItem.product_id
            );
            if (existingItem) {
              existingItem.quantity += currentItem.quantity;
            } else {
              acc.push({ ...currentItem });
            }
            return acc;
          },
          []
        );

        const totalCount = mergedCart.reduce(
          (acc: number, item: CartItem) => acc + item.quantity,
          0
        );
        setCartItemCount(totalCount);
        setCartItems(mergedCart);
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

  const updateQuantity = async (
    productId: number,
    newQty: number,
    update: number
  ) => {
    setCartItems((items) =>
      items.map((item) =>
        item.product_id === productId ? { ...item, quantity: newQty } : item
      )
    );
    setCartItemCount((count) => count + update);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/cart/update`,
        {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify({ productId, quantity: newQty }),
        }
      );
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
      await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/cart/remove/${productId}`,
        { method: "DELETE", headers: getHeaders() }
      );
      fetchCart();
    } catch (error) {
      fetchCart();
    }
  };

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  useEffect(() => {
    if (setAmount) {
      setAmount(subtotal);
    }
  }, [subtotal, setAmount]);

  if (loading)
    return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div
      className={`flex flex-col ${
        variant === "drawer" ? "h-full bg-white" : "h-auto bg-transparent"
      }`}
    >
      {variant === "drawer" && (
        <div className="p-6 border-b border-gray-100 bg-white">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" /> Your Cart
          </h1>
        </div>
      )}

      <div
        className={`flex-1 overflow-y-auto ${
          variant === "drawer" ? "p-6 space-y-6" : "space-y-4"
        }`}
      >
        {cartItems.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">Your cart is empty.</p>
          </div>
        ) : (
          cartItems.map((item) => (
            <div
              key={item.product_id}
              className={`flex gap-4 ${
                variant === "summary"
                  ? "bg-white p-3 rounded-xl border border-gray-100 shadow-sm"
                  : ""
              }`}
            >
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
                  <h3 className="font-semibold text-gray-900 line-clamp-1 text-sm">
                    {item.title}
                  </h3>
                  <p className="text-gray-500 text-xs mt-1">${item.price}</p>
                </div>

                {isEditable ? (
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border border-gray-200">
                      <button
                        onClick={() =>
                          updateQuantity(item.product_id, item.quantity - 1, -1)
                        }
                        className="w-5 h-5 flex items-center justify-center hover:bg-white rounded text-gray-600 shadow-sm transition-all"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-medium w-6 text-center text-[#1f1f1f]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.product_id, item.quantity + 1, 1)
                        }
                        className="w-5 h-5 flex items-center justify-center hover:bg-white rounded text-gray-600 shadow-sm transition-all"
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
                ) : (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                      Qty: {item.quantity}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {cartItems.length > 0 && (
        <div
          className={`mt-4 ${
            variant === "drawer"
              ? "p-6 border-t border-gray-100 bg-gray-50"
              : "pt-4 border-t border-dashed border-gray-200"
          }`}
        >
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-gray-600 text-sm">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {variant === "summary" && (
              <div className="flex justify-between text-gray-600 text-sm">
                <span>Shipping</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
            )}
            <div
              className={`flex justify-between font-bold text-gray-900 ${
                variant === "summary"
                  ? "text-xl pt-2 border-t border-gray-200 mt-2"
                  : "text-lg"
              }`}
            >
              <span>Total</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
          </div>

          {variant === "drawer" && onCheckout && (
            <button
              onClick={onCheckout}
              className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors shadow-lg shadow-gray-900/10"
            >
              Checkout
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CartPage;