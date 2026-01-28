"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  ShoppingCart,
  Search,
  X,
  Check,
  LogOut,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import { Product, Category } from "@/lib/utils/types";
import CartPage from "@/components/CartPage";
import PaypalCheckout from "@/components/PayPalCheckout";

interface UserData {
  name: string;
  email: string;
}

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

const ProductSkeleton = () => (
  <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm animate-pulse">
    <div className="bg-gray-200 h-48 w-full rounded-xl mb-4" />
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
    <div className="h-10 bg-gray-200 rounded-lg w-full" />
  </div>
);

const UserMenu = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user data");
      }
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("admin_token")
    router.push("/auth");
  };

  if (!user) {
    return (
      <button
        onClick={() => router.push("/auth")}
        className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
      >
        Sign In
      </button>
    );
  }

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold tracking-wider hover:bg-gray-800 transition-colors shadow-sm ring-2 ring-transparent focus:ring-gray-200"
      >
        {initials}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {user.name}
            </p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default function Home() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartRefreshKey, setCartRefreshKey] = useState(0);
  const [toastMessage, setToastMessage] = useState("");
  const [cartItemCount, setCartItemCount] = useState(0);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [amount, setAmount] = useState(0);

  const toggleCart = () => setIsCartOpen(!isCartOpen);

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handlePaymentSuccess = async () => {
    setCartItemCount(0);
    setToastMessage("Order placed successfully!");

    setCartRefreshKey((prev) => prev + 1);
    setTimeout(() => {
      setIsCheckoutOpen(false);
    }, 5000);
};

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const addToCart = (product: Product, quantity: number = 1) => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth");
      return;
    }

    fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/cart/add`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: product.id, quantity }),
      }
    ).then((res) => {
      if (res.ok) {
        setCartRefreshKey((prev) => prev + 1);
        setToastMessage("Product added to cart successfully");
        setCartItemCount((count) => count + quantity);
      }
    }).catch((error) => {
      console.error("Error adding to cart", error);
    });
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/products/`
      );
      const data = await res.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/categories/`
      );
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Failed to fetch categories", error);
    }
  };

  const filteredProducts = products.filter((product) => {
    const query = searchQuery.toLowerCase();
    
    const matchesSearch = 
      product.title.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query);

    const matchesCategory = 
      selectedCategory === null || 
      (product.categories && product.categories.some(c => c.id === selectedCategory));

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-gray-900 selection:text-white">
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage("")} />
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
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
                onCheckout={handleProceedToCheckout}
                variant="drawer"
                addToCart={addToCart}
              />
            </div>
          </div>
        </div>
      )}

      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-2 shrink-0">
            <div className="bg-gray-900 text-white p-1.5 rounded-lg relative">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900 hidden sm:block">
              Store.
            </span>
          </a>

          <div className="flex-1 max-w-md relative hidden sm:block">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-100 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all outline-none placeholder:text-gray-400 text-gray-900"
            />
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="h-4 w-px bg-gray-200 hidden sm:block"></div>
            <button
              onClick={toggleCart}
              className="relative group p-2 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <ShoppingCart className="w-5 h-5" />
              <span
                className={`absolute -top-1 -right-1 bg-red-500/80 text-white text-[10px] font-bold rounded-full px-1 aspect-square flex items-center justify-center shadow-lg group-hover:bg-red-500 transition-colors ${
                  cartItemCount > 0 ? "opacity-100" : "opacity-0"
                }`}
              >
                {cartItemCount}
              </span>
            </button>
            <UserMenu />
          </div>
        </div>
      </nav>

      <div className="bg-white border-b border-gray-100 mb-10 pb-8">
        <div className="max-w-7xl mx-auto px-6 pt-16 md:pt-24 pb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
            Curated Quality.
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10">
            Explore our collection of premium products designed to elevate your lifestyle.
          </p>

          {categories.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border ${
                  selectedCategory === null
                    ? "bg-gray-900 text-white border-gray-900 shadow-md transform scale-105"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                All Products
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border ${
                    selectedCategory === cat.id
                      ? "bg-gray-900 text-white border-gray-900 shadow-md transform scale-105"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 pb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            {selectedCategory 
              ? categories.find(c => c.id === selectedCategory)?.name 
              : "New Arrivals"}
          </h2>
          <span className="text-sm text-gray-500 font-medium">
            {loading ? "..." : filteredProducts.length} Items
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {loading ? (
            [...Array(8)].map((_, i) => <ProductSkeleton key={i} />)
          ) : filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <div
                key={product.id}
                className="group bg-white rounded-2xl p-4 border border-transparent hover:border-gray-100 hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                <div className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden mb-4 flex justify-center items-center">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.title}
                      className="max-h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 mix-blend-multiply"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      No Image
                    </div>
                  )}

                  <button
                    onClick={() => addToCart(product)}
                    className="absolute bottom-4 right-4 bg-white text-gray-900 p-2 rounded-full shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-gray-900 hover:text-white cursor-pointer"
                  >
                    <PlusIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-base font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {product.title}
                    </h3>
                    <span className="font-bold text-gray-900 text-sm">
                      ${product.price}
                    </span>
                  </div>
                  
                  <div className="flex gap-1 mb-2 overflow-hidden flex-wrap">
                    {product.categories?.slice(0, 2).map((c) => (
                       <span key={c.id} className="text-[10px] uppercase font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                         {c.name}
                       </span>
                    ))}
                  </div>

                  <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                    {product.description}
                  </p>

                  <button
                    onClick={() => addToCart(product)}
                    className="w-full bg-gray-50 text-gray-900 hover:bg-gray-900 hover:text-white py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <div className="inline-flex bg-gray-100 p-4 rounded-full mb-4">
                <Search className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                No products found
              </h3>
              <p className="text-gray-500">
                We couldn't find any items matching "{searchQuery}" {selectedCategory && "in this category"}.
              </p>
              {selectedCategory && (
                 <button onClick={() => setSelectedCategory(null)} className="mt-4 text-sm text-blue-600 hover:underline font-medium">
                   Clear Filters
                 </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const PlusIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);