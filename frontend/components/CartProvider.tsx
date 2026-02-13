"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Check, X, ShieldCheck, ShoppingBag, ArrowLeft } from "lucide-react";
import CartPage from "@/components/CartPage";
import PaypalCheckout from "@/components/PayPalCheckout";
import { authFetch } from "@/lib/utils/apiClient";
import { Product } from "@/lib/utils/types";

interface CartItem extends Product {
  quantity: number;
  product_id: number;
}

interface CartContextType {
  isCartOpen: boolean;
  toggleCart: () => void;
  cartItemCount: number;
  setCartItemCount: (count: number) => void;
  addToCart: (product: Product, quantity?: number) => void;
  openCheckout: () => void;
  cartItems: CartItem[];
  setCartItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
  cartRefreshKey: number;
  setCartRefreshKey: React.Dispatch<React.SetStateAction<number>>;
  setAmount: React.Dispatch<React.SetStateAction<number>>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const Toast = ({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) => (
  <div className="fixed bottom-6 right-6 z-60 animate-in slide-in-from-bottom-5 fade-in duration-300">
    <div className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
      <div className="bg-green-500 rounded-full p-1">
        <Check className="w-3 h-3 text-white" />
      </div>
      <p className="text-sm font-medium">{message}</p>
      <button onClick={onClose} className="ml-2 text-gray-400 hover:text-white">
        <X className="w-4 h-4" />
      </button>
    </div>
  </div>
);

export function CartProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [cartRefreshKey, setCartRefreshKey] = useState(0);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [amount, setAmount] = useState(0);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const toggleCart = () => setIsCartOpen(!isCartOpen);

  const openCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const addToCart = (product: Product, quantity: number = 1) => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth");
      return;
    }

    authFetch("cart/add", {
      method: "POST",
      body: JSON.stringify({ productId: product.id, quantity }),
    })
      .then((res) => {
        if (res.ok) {
          setCartRefreshKey((prev) => prev + 1);
          setToastMessage("Product added to cart successfully");
          setCartItemCount((count) => count + quantity);
        }
      })
      .catch((error) => {
        console.error("Error adding to cart", error);
      });
  };

  const handlePaymentSuccess = async () => {
    setCartItemCount(0);
    setToastMessage("Order placed successfully!");
    if (localStorage.getItem("applied_coupons")) {
      localStorage.removeItem("applied_coupons");
    }
    setCartRefreshKey((prev) => prev + 1);
    setTimeout(() => {
      setIsCheckoutOpen(false);
    }, 5000);
  };

  return (
    <CartContext.Provider
      value={{
        isCartOpen,
        toggleCart,
        cartItemCount,
        setCartItemCount,
        addToCart,
        openCheckout,
        cartItems,
        setCartItems,
        cartRefreshKey,
        setCartRefreshKey,
        setAmount,
      }}
    >
      {children}

      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage("")} />
      )}

      {isCartOpen && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={toggleCart}
          />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl overflow-hidden animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="p-4 flex justify-between items-center border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Your Cart</h2>
              <button
                onClick={toggleCart}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <CartPage
                key={cartRefreshKey}
                setCartItemCount={setCartItemCount}
                onCheckout={openCheckout}
                variant="drawer"
                addToCart={addToCart}
                cartItems={cartItems}
                setCartItems={setCartItems}
              />
            </div>
          </div>
        </div>
      )}

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
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
