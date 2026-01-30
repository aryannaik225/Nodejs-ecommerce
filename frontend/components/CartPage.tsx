"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  TicketPercent,
  Loader2,
  X,
  Check,
} from "lucide-react";
import { Product, Coupon } from "@/lib/utils/types";

interface CartItem extends Product {
  quantity: number,
  product_id: number,
}

interface CartPageProps {
  setCartItemCount: React.Dispatch<React.SetStateAction<number>>;
  onCheckout?: () => void;
  variant?: "drawer" | "summary";
  setAmount?: React.Dispatch<React.SetStateAction<number>>;
  addToCart?: (product: Product, quantity?: number) => void;
  cartItems: CartItem[];
  setCartItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
}

const Toast = ({
  message,
  onClose,
  type,
}: {
  message: string;
  onClose: () => void;
  type: "success" | "error" | "info" | "warning" | "normal";
}) => (
  <div className="fixed bottom-6 right-6 z-60 animate-in slide-in-from-bottom-5 fade-in duration-300">
    <div className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
      <div
        className={`rounded-full p-1 ${
          type === "success"
            ? "bg-green-500"
            : type === "error"
            ? "bg-red-500"
            : type === "info"
            ? "bg-blue-500"
            : type === "warning"
            ? "bg-yellow-500"
            : "bg-gray-500"
        }`}
      >
        <Check className="w-3 h-3 text-white" />
      </div>
      <p className="text-sm font-medium">{message}</p>
      <button onClick={onClose} className="ml-2 text-gray-400 hover:text-white">
        <X className="w-4 h-4" />
      </button>
    </div>
  </div>
);

const CartPage = ({
  setCartItemCount,
  onCheckout,
  setAmount,
  variant = "drawer",
  addToCart,
  cartItems,
  setCartItems
}: CartPageProps) => {
  const [loading, setLoading] = useState(true);

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupons, setAppliedCoupons] = useState<Coupon[]>([]);
  const [discountValue, setDiscountValue] = useState(0);

  const [isCouponValidating, setIsCouponValidating] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [showCouponList, setShowCouponList] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<
    "success" | "error" | "info" | "warning" | "normal"
  >("normal");

  const isEditable = variant === "drawer";

  const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const fetchCart = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/cart?t=${Date.now()}`,
        { headers: getHeaders(), cache: "no-store" }
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

        appliedCoupons.forEach((coupon) => {
          if (coupon.freeProductId) {
            const hasFreeProduct = mergedCart.some(
              (item: CartItem) => 
                String(item.product_id) === String(coupon.freeProductId)
            );
            if (!hasFreeProduct) {
              removeCoupon(coupon.code);
            }
          }
        });
      }
    } catch (error) {
      console.error("Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableCoupons = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/coupon/active`,
        { headers: getHeaders() }
      );
      if (res.ok) {
        const data = await res.json();
        setAvailableCoupons(data.coupons || []);
      }
    } catch (error) {
      console.log("Failed to load coupons");
    }
  };

  useEffect(() => {
    fetchCart();
    fetchAvailableCoupons();
  }, []);

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const total = Math.max(0, subtotal - discountValue);

  const addFreeProductFromCoupon = (coupon: Coupon, currentCart: CartItem[]) => {
    if (!addToCart) return;

    if (coupon && coupon.freeProductId) {
      const alreadyInCart = currentCart.some(
        (item) => 
            String(item.product_id) === String(coupon.freeProductId)
      );

      if (alreadyInCart) return;

      const freeProduct: Product = {
        id: coupon.freeProductId,
        title: "Free Gift",
        price: 0,
        image: "",
        stock: 0,
        description: "A special free gift for you!",
      };

      addToCart(freeProduct, 1);
      setToastType("success");
      setToastMessage("Free gift added to your cart!");
    }
  };

  const validateCouponParams = useCallback(
    async (
      codeToValidate: string,
      currentCartItems: CartItem[],
      currentSubtotal: number,
      isRestoring: boolean = false
    ) => {
      if (!codeToValidate) return;

      if (!isRestoring) {
        const existingCoupon = appliedCoupons.find(
          (c) => c.code === codeToValidate
        );
        if (existingCoupon) {
          setToastType("warning");
          setToastMessage("Coupon already applied");
          return;
        }

        if (appliedCoupons.length >= 2) {
          setToastType("error");
          setToastMessage("Maximum 2 coupons can be applied.");
          return;
        }

        if (
          appliedCoupons.length >= 2 &&
          !appliedCoupons.find((c) => c.code === codeToValidate)
        ) {
          setToastType("error");
          setToastMessage("Maximum 2 coupons can be applied.");
          return;
        }
      }

      if (!isRestoring) setIsCouponValidating(true);

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/coupon/validate`,
          {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({
              code: codeToValidate,
              cartTotal: currentSubtotal,
              cartItems: currentCartItems,
            }),
          }
        );

        const data = await res.json();

        if (!res.ok) {
          const storedCoupons = JSON.parse(
            localStorage.getItem("applied_coupons") || "[]"
          );
          if (storedCoupons.includes(codeToValidate)) {
            removeCoupon(codeToValidate);
          }
          throw new Error(data.message || "Invalid Coupon");
        }

        const newCoupon: Coupon = data.coupon;

        if (!isRestoring) {
          const hasNonStackable = appliedCoupons.some((c) => !c.isStackable);
          if (!newCoupon.isStackable && hasNonStackable) {
            throw new Error("Cannot stack two non-stackable coupons.");
          }
        }

        setAppliedCoupons((prev) => {
          const exists = prev.some((c) => c.code === newCoupon.code);
          let updatedList;
          if (exists) {
            updatedList = prev.map((c) =>
              c.code === newCoupon.code ? newCoupon : c
            );
          } else {
            updatedList = [...prev, newCoupon];
          }
          const codes = updatedList.map((c) => c.code);
          localStorage.setItem("applied_coupons", JSON.stringify(codes));
          setShowCouponList(false);
          return updatedList;
        });

        addFreeProductFromCoupon(newCoupon, currentCartItems);

        if (!isRestoring) {
          setDiscountValue((prev) => prev + data.calculatedDiscount);
          setCouponCode("");
          if (document.activeElement?.tagName === "BUTTON") {
            setToastType("success");
            setToastMessage("Coupon applied!");
          }
        } else {
          setDiscountValue((prev) => prev + data.calculatedDiscount);
        }
      } catch (error: any) {
        if (!isRestoring) {
          setToastType("error");
          setToastMessage(error.message);
        }
      } finally {
        if (!isRestoring) setIsCouponValidating(false);
      }
    },
    [addToCart, appliedCoupons]
  );

  useEffect(() => {
    if (cartItems.length > 0 && !loading && appliedCoupons.length === 0) {
      const savedCouponsRaw = localStorage.getItem("applied_coupons");

      if (savedCouponsRaw) {
        try {
          const codes: string[] = JSON.parse(savedCouponsRaw);
          if (Array.isArray(codes) && codes.length > 0) {
            const currentTotal = cartItems.reduce(
              (acc, item) => acc + item.price * item.quantity,
              0
            );

            const restore = async () => {
              setDiscountValue(0);
              for (const code of codes) {
                await validateCouponParams(code, cartItems, currentTotal, true);
              }
            };
            restore();
          }
        } catch (e) {
          localStorage.removeItem("applied_coupons");
        }
      }
    }
  }, [cartItems.length, loading]);

  const handleApplyClick = () => {
    validateCouponParams(couponCode, cartItems, subtotal);
  };

  const removeCoupon = (codeToRemove: string) => {
    const updatedCoupons = appliedCoupons.filter(
      (c) => c.code !== codeToRemove
    );
    setAppliedCoupons(updatedCoupons);

    if (updatedCoupons.length === 0) {
      localStorage.removeItem("applied_coupons");
    } else {
      localStorage.setItem(
        "applied_coupons",
        JSON.stringify(updatedCoupons.map((c) => c.code))
      );
    }

    setDiscountValue(0); 
    const currentTotal = cartItems.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
    
    updatedCoupons.forEach((c) =>
      validateCouponParams(c.code, cartItems, currentTotal, true)
    );

    setToastType("info");
    setToastMessage("Coupon removed");
  };

  const updateQuantity = async (
    productId: number,
    newQty: number,
    update: number
  ) => {
    const updatedCart = cartItems.map((item) =>
      item.product_id === productId ? { ...item, quantity: newQty } : item
    );
    setCartItems(updatedCart);
    setCartItemCount((count) => count + update);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/cart/update`,
        {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify({ productId, quantity: newQty }),
        }
      );
      if (newQty === 0 || !res.ok) {
        fetchCart();
      } else {
        const newTotal = updatedCart.reduce(
          (acc, item) => acc + item.price * item.quantity,
          0
        );

        setDiscountValue(0);
        const currentCoupons = [...appliedCoupons];

        for (const coupon of currentCoupons) {
          await validateCouponParams(coupon.code, updatedCart, newTotal, true);
        }
      }
    } catch (error) {
      fetchCart();
    }
  };

  const removeItem = async (productId: number) => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/cart/remove/${productId}`,
        { method: "DELETE", headers: getHeaders() }
      );
      fetchCart();
    } catch (error) {
      fetchCart();
    }
  };

  const getFilteredCoupons = () => {
    if (appliedCoupons.length >= 2) return [];
    const hasNonStackable = appliedCoupons.some((c) => !c.isStackable);

    if (hasNonStackable) {
      const stackables = availableCoupons.filter((c) => c.isStackable);
      if (stackables.length === 0) return [];
      return stackables;
    }

    return availableCoupons.filter(
      (c) => !appliedCoupons.find((ac) => ac.code === c.code)
    );
  };

  const filteredAvailableCoupons = getFilteredCoupons();

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    if (setAmount) {
      setAmount(total);
    }
  }, [total, setAmount]);

  if (loading)
    return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className={`flex flex-col ${variant === "drawer" ? "h-full bg-white" : "h-auto bg-transparent"}`}>
      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage("")}
          type={toastType}
        />
      )}

      {variant === "drawer" && (
        <div className="p-6 border-b border-gray-100 bg-white">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" /> Your Cart
          </h1>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto ${variant === "drawer" ? "p-6 space-y-6" : "space-y-4"}`}>
        {cartItems.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">Your cart is empty.</p>
          </div>
        ) : (
          cartItems.map((item) => (
            <div
              key={item.product_id}
              className={`flex gap-4 ${variant === "summary" ? "bg-white p-3 rounded-xl border border-gray-100 shadow-sm" : ""}`}
            >
              <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                <img
                  src={item.image || ""}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 line-clamp-1 text-sm">
                    {item.title}
                  </h3>
                  <p className="text-gray-500 text-xs mt-1">${item.price}</p>
                </div>
                <div className="flex items-center justify-between mt-2">
                  {isEditable ? (
                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border border-gray-200">
                      <button
                        onClick={() =>
                          updateQuantity(item.product_id, item.quantity - 1, -1)
                        }
                        className="w-5 h-5 flex items-center justify-center hover:bg-white rounded text-gray-600 shadow-sm"
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
                        className="w-5 h-5 flex items-center justify-center hover:bg-white rounded text-gray-600 shadow-sm"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">
                      Qty: {item.quantity}
                    </span>
                  )}
                  {isEditable && (
                    <button
                      onClick={() => removeItem(item.product_id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {cartItems.length > 0 && (
        <div className={`mt-4 ${variant === "drawer" ? "p-6 border-t border-gray-100 bg-gray-50" : "pt-4 border-t border-dashed border-gray-200"}`}>
          <div className="mb-6">
            {appliedCoupons.length < 2 && (
              <div className="space-y-3 mb-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <TicketPercent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Promo Code"
                      value={couponCode}
                      onChange={(e) =>
                        setCouponCode(e.target.value.toUpperCase())
                      }
                      className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-900 uppercase placeholder:normal-case placeholder:text-gray-400 transition-colors text-gray-800"
                    />
                  </div>
                  <button
                    onClick={handleApplyClick}
                    disabled={isCouponValidating || !couponCode}
                    className="px-4 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isCouponValidating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Apply"
                    )}
                  </button>
                </div>

                {filteredAvailableCoupons.length > 0 && (
                  <div>
                    <button
                      onClick={() => setShowCouponList(!showCouponList)}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      {showCouponList ? "Hide" : "View"} available coupons (
                      {filteredAvailableCoupons.length})
                    </button>

                    {showCouponList && (
                      <div className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                        {filteredAvailableCoupons.map((c) => (
                          <div
                            key={c.id}
                            className="border border-gray-200 rounded-lg p-3 flex justify-between items-center bg-gray-50 hover:bg-white transition-colors hover:border-gray-300"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-900 uppercase border border-gray-200 bg-white px-1.5 py-0.5 rounded">
                                  {c.code}
                                </span>
                                {c.isStackable && (
                                  <span className="text-[10px] text-purple-600 font-bold border border-purple-200 bg-purple-50 px-1 rounded">
                                    STACKABLE
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-gray-500 mt-1">
                                {c.description}
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                validateCouponParams(
                                  c.code,
                                  cartItems,
                                  subtotal
                                )
                              }
                              className="text-xs bg-white border border-gray-200 px-2 py-1 rounded font-medium hover:bg-gray-100 text-gray-700"
                            >
                              Use
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {appliedCoupons.length > 0 && (
              <div className="space-y-2">
                {appliedCoupons.map((coupon, index) => (
                  <div
                    key={`${coupon.code}-${index}`}
                    className="flex items-center justify-between bg-green-50 px-3 py-2.5 rounded-lg border border-green-200"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="bg-green-100 p-1 rounded-full">
                        <Check className="w-3 h-3 text-green-700" />
                      </div>
                      <div>
                        <div className="flex gap-2 items-center">
                          <p className="text-xs font-bold text-green-800 uppercase tracking-wide">
                            {coupon.code}
                          </p>
                          {coupon.isStackable && (
                            <span className="text-[9px] text-green-600 border border-green-200 px-1 rounded">
                              STACKABLE
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-green-600 font-medium">
                          Coupon applied
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeCoupon(coupon.code)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-gray-600 text-sm">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>

            {appliedCoupons.length > 0 && (
              <div className="flex justify-between text-green-600 text-sm font-medium animate-in fade-in slide-in-from-top-1">
                <span className="flex items-center gap-1">
                  Discount
                  <span className="text-xs bg-green-100 px-1.5 py-0.5 rounded text-green-700 uppercase">
                    ({appliedCoupons.length} applied)
                  </span>
                </span>
                <span>-${discountValue.toFixed(2)}</span>
              </div>
            )}

            <div className={`flex justify-between font-bold text-gray-900 ${variant === "summary" ? "text-xl pt-3 border-t border-gray-200" : "text-lg pt-3 border-t border-gray-200"}`}>
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {variant === "drawer" && onCheckout && (
            <button
              onClick={onCheckout}
              className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-semibold hover:bg-black transition-all active:scale-[0.99] shadow-lg shadow-gray-900/10 flex items-center justify-center gap-2"
            >
              Checkout{" "}
              <span className="opacity-70 font-normal">
                | ${total.toFixed(2)}
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CartPage;