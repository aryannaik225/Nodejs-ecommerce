"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  ShoppingBag,
  ShoppingCart,
  Search,
  Check,
  LogOut,
  ShieldCheck,
  PhoneCall,
  ChevronDown,
  Package,
} from "lucide-react";
import { Category } from "@/lib/utils/types";
import { authFetch } from "@/lib/utils/apiClient";
import { motion } from "framer-motion";
import { useCart } from "@/components/CartProvider";
import { encodeId } from "@/lib/utils/idHandler";

interface UserData {
  name: string;
  email: string;
}

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
    localStorage.removeItem("admin_token");
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
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
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
          <div className="px-4 py-3 ">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {user.name}
            </p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
          <button onClick={() => router.push(`/orders`)} className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-50 flex items-center gap-2 transition-colors border-y border-gray-100">
            <Package className="w-4 h-4" />
            View Orders
          </button>
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

export default function Navbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { toggleCart, cartItemCount } = useCart();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);
  
  const selectedCategory = searchParams.get("category") 
    ? Number(searchParams.get("category")) 
    : null;
    
  const searchQuery = searchParams.get("q") || "";

  useEffect(() => {
    fetchCategories();
    
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await authFetch("categories", { method: "GET" });
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Failed to fetch categories", error);
    }
  };

  const handleCategorySelect = (categoryId: number | null) => {
    setIsCategoryOpen(false);
    
    const params = new URLSearchParams(searchParams.toString());
    
    if (categoryId) {
      params.set("category", categoryId.toString());
    } else {
      params.delete("category");
    }

    router.push(`/home/?${params.toString()}`);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    
    if (val) {
      params.set("q", val);
    } else {
      params.delete("q");
    }
    
    if (pathname !== "/home") {
       router.replace(`/home/?${params.toString()}`);
    } else {
       router.replace(`/home/?${params.toString()}`);
    }
  };

  return (
    <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 flex flex-col gap-0 w-full items-center">
      <div className="bg-green-800 w-full py-2 flex justify-around items-center text-white text-xs font-regular tracking-wide">
        <div className="flex items-center gap-2">
          <PhoneCall className="w-4 h-4" />
          <span className="">+001234567890</span>
        </div>
        <span className="">Get Free Delivery On Every Order</span>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          <span className="">100% Secure Payment</span>
        </div>
      </div>

      <div className="max-w-8xl w-full px-6 h-16 flex items-center justify-around relative">
        <a href="/" className="flex items-center gap-2 shrink-0">
          <div className="bg-gray-900 text-white p-1.5 rounded-lg relative">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900 hidden sm:block">
            Store.
          </span>
        </a>

        <div className="flex items-center text-sm gap-5 transition-colors">
          <div className="relative shrink-0" ref={categoryRef}>
            <motion.button
              layout
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={() => setIsCategoryOpen(!isCategoryOpen)}
              className={`flex gap-2 items-center text-sm font-medium px-3 py-2 rounded-full justify-between relative z-20 ${
                isCategoryOpen || selectedCategory !== null
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
              style={{ minWidth: "140px", maxWidth: "200px" }}
            >
              <motion.span layout className="truncate">
                {selectedCategory
                  ? categories.find((c) => c.id === selectedCategory)?.name
                  : "Categories"}
              </motion.span>

              <ChevronDown
                className={`w-3 h-3 shrink-0 transition-transform duration-200 ${
                  isCategoryOpen ? "rotate-180" : ""
                }`}
              />
            </motion.button>

            {isCategoryOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Shop by
                  </div>

                  <button
                    onClick={() => handleCategorySelect(null)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between group transition-colors ${
                      selectedCategory === null
                        ? "bg-gray-900 text-white"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>All Products</span>
                    {selectedCategory === null && <Check className="w-4 h-4" />}
                  </button>

                  <div className="h-px bg-gray-100 my-2 mx-2" />

                  <div className="max-h-64 overflow-y-auto custom-scrollbar">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategorySelect(category.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between group transition-colors mb-1 ${
                          selectedCategory === category.id
                            ? "bg-blue-50 text-blue-700 font-medium"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        <span className="truncate">{category.name}</span>
                        {selectedCategory === category.id && (
                          <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 max-w-md relative hidden sm:block">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search for products..."
              defaultValue={searchQuery}
              onChange={handleSearch}
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
      </div>
    </nav>
  );
}