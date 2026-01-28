"use client";

import React, { useEffect, useState } from "react";
import { loginAdminAction, verifyAdminTokenAction } from "@/lib/utils/actions";
import { Lock, Loader2, ShoppingBag, LogOut } from "lucide-react";
import Inventory from "@/components/admin-components/Inventory";
import Coupons from "@/components/admin-components/Coupons";
import { Product, Category, Coupon } from "@/lib/utils/types";

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [adminPassword, setAdminPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [activeTab, setActiveTab] = useState("Inventory");

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isInventoryLoading, setIsInventoryLoading] = useState(true);

  const [isCouponLoading, setIsCouponLoading] = useState(true);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [expiredCoupons, setExpiredCoupons] = useState<Coupon[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProducts();
      fetchCategories();
      fetchActiveCoupons();
      fetchExpiredCoupons();
    }
  }, [isAuthenticated]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/categories`,
      );
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Fetch categories error:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/products/`,
      );
      const data = await res.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsInventoryLoading(false);
    }
  };

  const fetchActiveCoupons = async () => {
    try {
      const res = await fetch (
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/coupon/active`,
      );
      const data = await res.json();
      setCoupons(data.coupons || []);
    } catch (error) {
      console.error("Fetch active coupons error:", error);
    } finally {
      fetchExpiredCoupons();
    }
  }

  const fetchExpiredCoupons = async () => {
    try {
      const res = await fetch (
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/coupon/expired`,
      );
      const data = await res.json();
      setExpiredCoupons(data.coupons || []);
    } catch (error) {
      console.error("Fetch expired coupons error: ", error);
    } finally {
      setIsCouponLoading(false);
    } 
  }

  useEffect(() => {
    const checkAuth = async () => {
      const admin_token = localStorage.getItem("admin_token");

      if (!admin_token) {
        setIsAuthChecking(false);
        return;
      }

      const result = await verifyAdminTokenAction(admin_token);

      if (result.isValid) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem("admin_token");
        setIsAuthenticated(false);
      }
      setIsAuthChecking(false);
    };

    checkAuth();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setLoginError("");

    try {
      const result = await loginAdminAction(adminPassword);

      if (result.success && result.token) {
        localStorage.setItem("admin_token", result.token);
        setIsAuthenticated(true);
      } else {
        setLoginError("Incorrect password");
      }
    } catch (error) {
      setLoginError("Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setIsAuthenticated(false);
    setAdminPassword("");
  };

  const tabs = [
    {
      name: "Inventory",
      component: (
        <Inventory
          setIsAuthenticated={setIsAuthenticated}
          setIsAuthChecking={setIsAuthChecking}
          getAuthHeaders={getAuthHeaders}
          fetchProducts={fetchProducts}
          products={products}
          categories={categories}
          isInventoryLoading={isInventoryLoading}
        />
      ),
    },
    {
      name: "Coupons",
      component: (
        <Coupons
          isCouponLoading={isCouponLoading}
          coupons={coupons}
          expiredCoupons={expiredCoupons}
          products={products}
          getAuthHeaders={getAuthHeaders}
          fetchActiveCoupons={fetchActiveCoupons}
        />
      ),
    },
  ];

  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-gray-900/20">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Admin Access
            </h2>
            <p className="text-gray-500 text-sm mb-8">
              Please enter the secure password to manage inventory.
            </p>

            <form onSubmit={handleLogin} className="space-y-4 text-left">
              <div>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                  autoFocus
                />
                {loginError && (
                  <p className="text-red-500 text-xs mt-2 font-medium ml-1">
                    {loginError}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={isVerifying}
                className="w-full bg-gray-900 hover:bg-black text-white py-3 rounded-xl font-semibold shadow-lg shadow-gray-900/10 hover:shadow-gray-900/20 transition-all active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {isVerifying && <Loader2 className="w-4 h-4 animate-spin" />}
                {isVerifying ? "Verifying..." : "Access Dashboard"}
              </button>
            </form>
          </div>
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 text-center">
            <a
              href="/"
              className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
            >
              ← Back to Store
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center shrink-0 h-full">
            <a href="/" className="flex items-center gap-2 shrink-0">
              <div className="bg-gray-900 text-white p-1.5 rounded-lg">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-900 hidden sm:block">
                Store.
              </span>
            </a>

            <div className="flex h-full gap-6 ml-8">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.name;
                return (
                  <button
                    key={tab.name}
                    onClick={() => setActiveTab(tab.name)}
                    className={`
                relative h-full flex items-center text-sm font-medium transition-colors duration-200
                ${isActive ? "text-gray-900" : "text-gray-500 hover:text-gray-900"}
              `}
                  >
                    {tab.name}
                    <span
                      className={`
                  absolute bottom-0 left-0 h-0.5 bg-gray-900 transition-all duration-300 ease-out rounded-t-full
                  ${isActive ? "w-full opacity-100" : "w-0 opacity-0 left-1/2"}
                `}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 pr-4 border-r border-gray-200 mr-2">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-700">
                AD
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">
                Admin
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>
      {tabs.find((tab) => tab.name === activeTab)?.component}
    </div>
  );
}
