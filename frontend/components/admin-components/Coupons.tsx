"use client";

import {
  Search,
  Plus,
  TicketPercent,
  X,
  ChevronDown,
  Check,
  ChevronsUpDown,
  Edit,
  Trash2,
  Calendar,
  Layers,
  User,
  DollarSign,
  Gift,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Coupon, Product } from "@/lib/utils/types";
import { motion, AnimatePresence } from "framer-motion";

interface CouponsProps {
  isCouponLoading: boolean;
  coupons?: Coupon[];
  expiredCoupons?: Coupon[];
  getAuthHeaders: () => { [key: string]: string };
  products: Product[];
  fetchActiveCoupons: () => void;
}

interface ExtendedFormData {
  code: string;
  discountAmount: string;
  discountType: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
  description: string;
  limit: number | null;
  userLimit: number | null;
  minCartAmount: number | null;
  maxDiscountAmount: number | null;
  startsAt: string;
  expiresAt: string;
  allProducts: boolean;
  productIds: string[];
  newUsersOnly: boolean;
  isStackable: boolean;
  applyStrategy: "ALL_ITEMS" | "HIGHEST_ITEM" | "CHEAPEST_ITEM";
  freeProductId: string | null;
}

const Coupons = ({
  isCouponLoading,
  coupons = [],
  expiredCoupons = [],
  getAuthHeaders,
  products,
  fetchActiveCoupons,
}: CouponsProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [showDiscountOptions, setShowDiscountOptions] = useState(false);
  const [showStrategyOptions, setShowStrategyOptions] = useState(false);

  const [isAllProducts, setIsAllProducts] = useState(true);
  const [productSearch, setProductSearch] = useState("");
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);

  const [isFreeProductDropdownOpen, setIsFreeProductDropdownOpen] =
    useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const freeProductRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<ExtendedFormData>({
    code: "",
    discountAmount: "",
    discountType: "PERCENTAGE",
    description: "",
    limit: null,
    userLimit: null,
    minCartAmount: null,
    maxDiscountAmount: null,
    startsAt: new Date().toISOString().split("T")[0],
    expiresAt: "",
    allProducts: true,
    productIds: [],
    newUsersOnly: false,
    isStackable: false,
    applyStrategy: "ALL_ITEMS",
    freeProductId: null,
  });

  const spring = {
    type: "spring" as const,
    stiffness: 700,
    damping: 30,
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsProductDropdownOpen(false);
      }
      if (
        freeProductRef.current &&
        !freeProductRef.current.contains(event.target as Node)
      ) {
        setIsFreeProductDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormData({
      code: "",
      discountAmount: "",
      discountType: "PERCENTAGE",
      description: "",
      limit: null,
      userLimit: null,
      minCartAmount: null,
      maxDiscountAmount: null,
      startsAt: new Date().toISOString().split("T")[0],
      expiresAt: "",
      allProducts: true,
      productIds: [],
      newUsersOnly: false,
      isStackable: false,
      applyStrategy: "ALL_ITEMS",
      freeProductId: null,
    });
    setIsAllProducts(true);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => setIsCreateModalOpen(false);

  const filterCoupon = (c: Coupon) => {
    const query = searchQuery.toLowerCase();
    return c.code.toLowerCase().includes(query) || String(c.id).includes(query);
  };

  const filteredActiveCoupons = coupons.filter(filterCoupon);
  const filteredExpiredCoupons = expiredCoupons.filter(filterCoupon);

  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(productSearch.toLowerCase()),
  );

  const toggleProduct = (productId: string) => {
    const currentIds = formData.productIds;
    let newIds;
    if (currentIds.includes(productId)) {
      newIds = currentIds.filter((id) => id !== productId);
    } else {
      newIds = [...currentIds, productId];
    }
    setFormData({ ...formData, productIds: newIds });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEditing = !!editingCoupon;
    const url = isEditing
      ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/coupon/update/${editingCoupon?.id}`
      : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/coupon/create`;

    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method: method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to submit coupon form");

      closeCreateModal();
      fetchActiveCoupons();
    } catch (error) {
      alert("Error submitting coupon form");
    }
  };

  const handleExpire = async (id: number) => {
    if (
      !confirm(
        "Are you sure you want to expire this coupon? It will be moved to history.",
      )
    )
      return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/coupon/delete/${id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        },
      );

      if (!res.ok) throw new Error("Failed to expire coupon");

      fetchActiveCoupons();
    } catch (error) {
      alert("Error expiring coupon");
    }
  };

  const renderTable = (data: Coupon[], type: "active" | "expired") => (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
            <th className="px-6 py-4 w-12">#</th>
            <th className="px-6 py-4">Code & Description</th>
            <th className="px-6 py-4">Discount</th>
            <th className="px-6 py-4">Validity</th>
            <th className="px-6 py-4">Usage</th>
            <th className="px-6 py-4">Rules</th>
            {type === "active" && (
              <th className="px-6 py-4 text-right">Actions</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.map((coupon: any, index) => (
            <tr
              key={coupon.id}
              className="hover:bg-gray-50/80 transition-colors group"
            >
              <td className="px-6 py-4 text-xs text-gray-400 font-mono">
                {index + 1}
              </td>

              <td className="px-6 py-4">
                <div className="flex flex-col gap-1.5">
                  <span
                    className={`font-bold font-mono text-sm px-2.5 py-1 rounded-md w-fit ${
                      type === "active"
                        ? "bg-blue-50 text-blue-700 border border-blue-100"
                        : "bg-gray-100 text-gray-500 border border-gray-200 line-through"
                    }`}
                  >
                    {coupon.code}
                  </span>

                  {coupon.description ? (
                    <p
                      className="text-xs text-gray-500 max-w-64 line-clamp-2 leading-relaxed"
                      title={coupon.description}
                    >
                      {coupon.description}
                    </p>
                  ) : (
                    <span className="text-xs text-gray-300 italic">
                      No description
                    </span>
                  )}

                  {coupon.newUsersOnly && (
                    <span className="text-[10px] text-orange-600 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded w-fit font-medium">
                      New Users Only
                    </span>
                  )}
                </div>
              </td>

              <td className="px-6 py-4">
                <div className="font-medium text-gray-900">
                  {coupon.discountType === "FREE_SHIPPING" ? (
                    <span className="text-purple-600">Free Shipping</span>
                  ) : (
                    <>
                      {coupon.discountAmount}
                      {coupon.discountType === "PERCENTAGE" ? "%" : " OFF"}
                    </>
                  )}
                </div>
                {coupon.maxDiscountAmount && (
                  <div className="text-[10px] text-gray-500">
                    Max: {coupon.maxDiscountAmount}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 text-xs text-gray-600">
                <div className="flex flex-col gap-1">
                  <span>
                    Start:{" "}
                    {new Date(coupon.startsAt).toLocaleDateString("en-GB")}
                  </span>
                  <span>
                    End:{" "}
                    {coupon.expiresAt
                      ? new Date(coupon.expiresAt).toLocaleDateString("en-GB")
                      : "Never"}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-900">
                    {coupon.uses}
                  </span>
                  <span className="text-gray-400">/</span>
                  <span className="text-gray-600">{coupon.limit ?? "∞"}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-xs text-gray-500 space-y-1">
                {coupon.minCartAmount && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> Min:{" "}
                    {coupon.minCartAmount}
                  </div>
                )}
                {coupon.isStackable && (
                  <div className="flex items-center gap-1 text-green-600">
                    <Layers className="w-3 h-3" /> Stackable
                  </div>
                )}
                {coupon.freeProduct && (
                  <div className="flex items-center gap-1 text-pink-600">
                    <Gift className="w-3 h-3" /> Free Gift
                  </div>
                )}
              </td>

              {type === "active" && (
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingCoupon(coupon);
                        setFormData({
                          code: coupon.code,
                          discountAmount: String(coupon.discountAmount),
                          discountType: coupon.discountType,
                          description: coupon.description || "",
                          limit: coupon.limit,
                          userLimit: coupon.userLimit,
                          minCartAmount: coupon.minCartAmount,
                          maxDiscountAmount: coupon.maxDiscountAmount,
                          startsAt: coupon.startsAt
                            ? new Date(coupon.startsAt)
                                .toISOString()
                                .split("T")[0]
                            : "",
                          expiresAt: coupon.expiresAt
                            ? new Date(coupon.expiresAt)
                                .toISOString()
                                .split("T")[0]
                            : "",
                          allProducts: coupon.allProducts,
                          productIds:
                            coupon.ProductDiscountCodeRelation?.map((r: any) =>
                              String(r.productId),
                            ) || [],
                          newUsersOnly: coupon.newUsersOnly,
                          isStackable: coupon.isStackable,
                          applyStrategy: coupon.applyStrategy,
                          freeProductId: coupon.freeProductId
                            ? String(coupon.freeProductId)
                            : null,
                        });
                        setIsAllProducts(coupon.allProducts);
                        setIsCreateModalOpen(true);
                      }}
                      className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleExpire(coupon.id)}
                      className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 fonts-sans text-gray-900 selection:bg-gray-900 selection:text-white">
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Discount Coupons
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage your active and expired campaigns.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative group flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
              <input
                type="text"
                placeholder="Search by code or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all"
              />
            </div>
            <button
              onClick={openCreateModal}
              className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg cursor-pointer flex items-center gap-2 text-sm font-medium transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" /> Create Coupon
            </button>
          </div>
        </div>

        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-6 w-1 bg-green-500 rounded-full"></div>
            <h2 className="text-lg font-bold text-gray-900">Active Coupons</h2>
            <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {filteredActiveCoupons.length}
            </span>
          </div>
          <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 overflow-hidden">
            {isCouponLoading ? (
              <div className="p-12 text-center text-gray-500 text-sm animate-pulse">
                Loading active coupons...
              </div>
            ) : filteredActiveCoupons.length === 0 ? (
              <div className="p-12 text-center text-sm text-gray-500">
                No active coupons.
              </div>
            ) : (
              renderTable(filteredActiveCoupons, "active")
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-6 w-1 bg-gray-400 rounded-full"></div>
            <h2 className="text-lg font-bold text-gray-900">Expired History</h2>
            <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {filteredExpiredCoupons.length}
            </span>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden opacity-90">
            {isCouponLoading ? (
              <div className="p-12 text-center text-gray-500 text-sm animate-pulse">
                Loading history...
              </div>
            ) : filteredExpiredCoupons.length === 0 ? (
              <div className="p-12 text-center text-sm text-gray-500">
                No expired coupons.
              </div>
            ) : (
              renderTable(filteredExpiredCoupons, "expired")
            )}
          </div>
        </div>
      </main>

      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm"
              onClick={closeCreateModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                <h3 className="font-semibold text-gray-900">
                  {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
                </h3>
                <button
                  onClick={closeCreateModal}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        Coupon Code
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="SUMMER2026"
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-gray-900 uppercase"
                        value={formData.code}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            code: e.target.value.toUpperCase(),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        Start Date
                      </label>
                      <input
                        type="date"
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900"
                        value={formData.startsAt}
                        onChange={(e) =>
                          setFormData({ ...formData, startsAt: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        End Date (Optional)
                      </label>
                      <input
                        type="date"
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900"
                        value={formData.expiresAt}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            expiresAt: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <div className="flex w-full justify-between items-center">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                          Description (Optional) (Max 256 characters)
                        </label>
                        <span className="text-xs text-gray-400">
                          {formData.description?.length || 0}/256
                        </span>
                      </div>
                      <textarea
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 h-24 resize-none"
                        value={formData.description || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value.slice(0, 256),
                          })
                        }
                      />
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <TicketPercent className="w-4 h-4" /> Discount Rules
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                          Type
                        </label>
                        <div
                          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 flex items-center justify-between cursor-pointer"
                          onClick={() =>
                            setShowDiscountOptions(!showDiscountOptions)
                          }
                        >
                          {formData.discountType.replace("_", " ")}{" "}
                          <ChevronDown className="w-4 h-4" />
                        </div>
                        {showDiscountOptions && (
                          <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                            {["PERCENTAGE", "FIXED", "FREE_SHIPPING"].map(
                              (type) => (
                                <div
                                  key={type}
                                  className="px-4 py-2.5 text-sm hover:bg-gray-50 cursor-pointer"
                                  onClick={() => {
                                    setFormData({
                                      ...formData,
                                      discountType: type as any,
                                    });
                                    setShowDiscountOptions(false);
                                  }}
                                >
                                  {type.replace("_", " ")}
                                </div>
                              ),
                            )}
                          </div>
                        )}
                      </div>

                      {formData.discountType !== "FREE_SHIPPING" && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                            Value
                          </label>
                          <input
                            type="number"
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm"
                            placeholder={
                              formData.discountType === "PERCENTAGE"
                                ? "10 (%)"
                                : "100 ($)"
                            }
                            value={formData.discountAmount}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                discountAmount: e.target.value,
                              })
                            }
                          />
                        </div>
                      )}

                      {formData.discountType !== "FREE_SHIPPING" && (
                        <div className="relative col-span-2">
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                            Application Strategy
                          </label>
                          <div
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 flex items-center justify-between cursor-pointer"
                            onClick={() =>
                              setShowStrategyOptions(!showStrategyOptions)
                            }
                          >
                            {formData.applyStrategy.replace("_", " ")}{" "}
                            <ChevronDown className="w-4 h-4" />
                          </div>
                          {showStrategyOptions && (
                            <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                              {[
                                "ALL_ITEMS",
                                "HIGHEST_ITEM",
                                "CHEAPEST_ITEM",
                              ].map((strat) => (
                                <div
                                  key={strat}
                                  className="px-4 py-2.5 text-sm hover:bg-gray-50 cursor-pointer"
                                  onClick={() => {
                                    setFormData({
                                      ...formData,
                                      applyStrategy: strat as any,
                                    });
                                    setShowStrategyOptions(false);
                                  }}
                                >
                                  {strat.replace("_", " ")}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {formData.discountType === "PERCENTAGE" && (
                        <div className="col-span-2">
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                            Max Discount Cap (Optional)
                          </label>
                          <input
                            type="number"
                            placeholder="e.g. 500 (Don't discount more than $500)"
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm"
                            value={formData.maxDiscountAmount || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                maxDiscountAmount: e.target.value
                                  ? Number(e.target.value)
                                  : null,
                              })
                            }
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <User className="w-4 h-4" /> Usage Limits & Constraints
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                          Total Limit
                        </label>
                        <input
                          type="number"
                          placeholder="∞"
                          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm"
                          value={formData.limit || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              limit: e.target.value
                                ? Number(e.target.value)
                                : null,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                          User Limit
                        </label>
                        <input
                          type="number"
                          placeholder="∞"
                          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm"
                          value={formData.userLimit || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              userLimit: e.target.value
                                ? Number(e.target.value)
                                : null,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                          Min Cart Value
                        </label>
                        <input
                          type="number"
                          placeholder="0"
                          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm"
                          value={formData.minCartAmount || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              minCartAmount: e.target.value
                                ? Number(e.target.value)
                                : null,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="flex gap-6 mt-4">
                      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                          checked={formData.newUsersOnly}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              newUsersOnly: e.target.checked,
                            })
                          }
                        />
                        New Users Only
                      </label>
                      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                          checked={formData.isStackable}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              isStackable: e.target.checked,
                            })
                          }
                        />
                        Stackable (Can use with others)
                      </label>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Layers className="w-4 h-4" /> Scope & Rewards
                    </h4>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Applied Products
                        </label>
                        <div
                          className="flex items-center cursor-pointer group"
                          onClick={() => {
                            setIsAllProducts(!isAllProducts);
                            setFormData({
                              ...formData,
                              allProducts: !isAllProducts,
                            });
                            if (!isAllProducts)
                              setFormData((prev) => ({
                                ...prev,
                                productIds: [],
                              }));
                          }}
                        >
                          <span
                            className={`text-xs mr-2 font-medium ${isAllProducts ? "text-gray-900" : "text-gray-500"}`}
                          >
                            All Products
                          </span>
                          <div
                            className={`relative flex items-center p-1 w-8 h-5 rounded-full ${isAllProducts ? "bg-gray-900" : "bg-gray-200"}`}
                          >
                            <motion.div
                              className="w-3 h-3 bg-white rounded-full shadow-sm"
                              layout
                              transition={spring}
                              animate={{ x: isAllProducts ? 12 : 0 }}
                            />
                          </div>
                        </div>
                      </div>

                      {!isAllProducts && (
                        <div className="relative" ref={dropdownRef}>
                          <div
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 cursor-pointer flex justify-between items-center"
                            onClick={() =>
                              setIsProductDropdownOpen(!isProductDropdownOpen)
                            }
                          >
                            <span>
                              {formData.productIds.length} products selected
                            </span>
                            <ChevronsUpDown className="w-4 h-4 text-gray-400" />
                          </div>
                          {isProductDropdownOpen && (
                            <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden max-h-60 flex flex-col">
                              <div className="p-2 border-b border-gray-100">
                                <input
                                  type="text"
                                  autoFocus
                                  placeholder="Search..."
                                  className="w-full text-xs border rounded p-1"
                                  value={productSearch}
                                  onChange={(e) =>
                                    setProductSearch(e.target.value)
                                  }
                                />
                              </div>
                              <div className="overflow-y-auto p-1">
                                {filteredProducts.map((product) => (
                                  <div
                                    key={product.id}
                                    className={`flex justify-between px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer ${formData.productIds.includes(String(product.id)) ? "bg-gray-50 font-medium" : ""}`}
                                    onClick={() =>
                                      toggleProduct(String(product.id))
                                    }
                                  >
                                    {product.title}{" "}
                                    {formData.productIds.includes(
                                      String(product.id),
                                    ) && <Check className="w-3 h-3" />}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        Free Product Reward (Optional)
                      </label>
                      <div className="relative" ref={freeProductRef}>
                        <div
                          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 cursor-pointer flex justify-between items-center"
                          onClick={() =>
                            setIsFreeProductDropdownOpen(
                              !isFreeProductDropdownOpen,
                            )
                          }
                        >
                          {formData.freeProductId ? (
                            products.find(
                              (p) => String(p.id) === formData.freeProductId,
                            )?.title || "Unknown Product"
                          ) : (
                            <span className="text-gray-400">None selected</span>
                          )}
                          {formData.freeProductId ? (
                            <X
                              className="w-4 h-4 hover:text-red-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFormData({
                                  ...formData,
                                  freeProductId: null,
                                });
                              }}
                            />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        {isFreeProductDropdownOpen && (
                          <div className="absolute bottom-full mb-1 left-0 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden max-h-40 flex flex-col">
                            <div className="p-2 border-b border-gray-100">
                              <input
                                type="text"
                                autoFocus
                                placeholder="Search..."
                                className="w-full text-xs border rounded p-1"
                                value={productSearch}
                                onChange={(e) =>
                                  setProductSearch(e.target.value)
                                }
                              />
                            </div>
                            <div className="overflow-y-auto p-1">
                              {filteredProducts.map((product) => (
                                <div
                                  key={product.id}
                                  className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                                  onClick={() => {
                                    setFormData({
                                      ...formData,
                                      freeProductId: String(product.id),
                                    });
                                    setIsFreeProductDropdownOpen(false);
                                  }}
                                >
                                  {product.title}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-gray-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-black"
                  >
                    {editingCoupon ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Coupons;
