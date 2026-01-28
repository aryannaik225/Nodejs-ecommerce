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

const Coupons = ({
  isCouponLoading,
  coupons = [],
  expiredCoupons = [],
  getAuthHeaders,
  products,
  fetchActiveCoupons
}: CouponsProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showDiscountOptions, setShowDiscountOptions] = useState(false);
  
  const [isAllProducts, setIsAllProducts] = useState(true);
  const [productSearch, setProductSearch] = useState("");
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    code: "",
    discountAmount: "",
    discountType: "PERCENTAGE",
    limit: null as null | number,
    expiresAt: "",
    allProducts: isAllProducts,
    productIds: [] as string[],
  });

  const spring = {
    type: "spring" as const,
    stiffness: 700,
    damping: 30,
  };
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProductDropdownOpen(false);
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
      limit: null,
      expiresAt: "",
      allProducts: true,
      productIds: [],
    });
    setIsAllProducts(true);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => setIsCreateModalOpen(false);

  const filterCoupon = (c: Coupon) => 
    c.code.toLowerCase().includes(searchQuery.toLowerCase());

  const filteredActiveCoupons = coupons.filter(filterCoupon);
  const filteredExpiredCoupons = expiredCoupons.filter(filterCoupon);

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(productSearch.toLowerCase())
  );

  const toggleProduct = (productId: string) => {
    const currentIds = formData.productIds;
    let newIds;
    if (currentIds.includes(productId)) {
      newIds = currentIds.filter(id => id !== productId);
    } else {
      newIds = [...currentIds, productId];
    }
    setFormData({ ...formData, productIds: newIds });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEditing = !!editingCoupon
    const url = isEditing 
      ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/coupon/update/${editingCoupon?.id}` 
      : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/coupon/create`;

    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method: method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      })

      if (!res.ok) throw new Error("Failed to submit coupon form");

      closeCreateModal()
      fetchActiveCoupons();
    } catch (error) {
      alert("Error submitting coupon form");
    }
  };

  const handleExpire = async (id: number) => {
    if (!confirm("Are you sure you want to expire this coupon? It will be moved to history.")) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/coupon/delete/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error("Failed to expire coupon");

      fetchActiveCoupons();
    } catch (error) {
      alert("Error expiring coupon");
    }
  };

  const renderTable = (data: Coupon[], type: 'active' | 'expired') => (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
            <th className="px-6 py-4 w-12">#</th>
            <th className="px-6 py-4">Code</th>
            <th className="px-6 py-4">Discount</th>
            <th className="px-6 py-4">Type</th>
            <th className="px-6 py-4">Expires</th>
            <th className="px-6 py-4">Usage</th>
            <th className="px-6 py-4">Scope</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.map((coupon, index) => (
            <tr key={coupon.id} className="hover:bg-gray-50/80 transition-colors group">
              <td className="px-6 py-4 text-xs text-gray-400 font-mono">
                {index + 1}
              </td>
              <td className="px-6 py-4">
                <span className={`font-bold font-mono text-sm px-2.5 py-1 rounded-md ${type === 'active' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-gray-100 text-gray-500 border border-gray-200 line-through'}`}>
                  {coupon.code}
                </span>
              </td>
              <td className="px-6 py-4 font-medium text-gray-900">
                {coupon.discountAmount}
                {coupon.discountType === 'PERCENTAGE' ? '%' : ' OFF'}
              </td>
              <td className="px-6 py-4 text-xs text-gray-500 capitalize">
                {coupon.discountType.toLowerCase()}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {coupon.expiresAt 
                  ? new Date(coupon.expiresAt).toLocaleDateString() 
                  : <span className="text-gray-400 italic">Never</span>}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-900">{coupon.uses}</span>
                  <span className="text-gray-400">/</span>
                  <span className="text-gray-600">{coupon.limit ?? '∞'}</span>
                </div>
                {coupon.limit && coupon.uses >= coupon.limit && (
                   <span className="text-[10px] text-red-500 font-medium">Limit Reached</span>
                )}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {coupon.allProducts ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-100">
                    <Check className="w-3 h-3" /> Store-wide
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-yellow-50 text-yellow-700 text-xs font-medium border border-yellow-100">
                    Specific Products
                  </span>
                )}
              </td>
              <td className="px-6 py-4 text-right">
                {type === 'active' && (
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                         setEditingCoupon(coupon);
                         setFormData({
                           code: coupon.code,
                           discountAmount: String(coupon.discountAmount),
                           discountType: coupon.discountType.toUpperCase(),
                           limit: coupon.limit,
                           expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] : "",
                           allProducts: coupon.allProducts,
                           productIds: coupon.ProductDiscountCodeRelation?.map((r: any) => String(r.productId)) || [],
                         });
                         setIsAllProducts(coupon.allProducts);
                         setIsCreateModalOpen(true);
                      }}
                      className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit Coupon"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleExpire(coupon.id)}
                      className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-red-600 transition-colors"
                      title="Expire this coupon"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </td>
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
                placeholder="Search by code..."
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
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-3">
                  <TicketPercent className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="text-gray-900 font-medium mb-1">No active coupons</h3>
                <p className="text-gray-500 text-sm">Create a new coupon to get started.</p>
              </div>
            ) : (
              renderTable(filteredActiveCoupons, 'active')
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
              <div className="p-12 text-center flex flex-col items-center justify-center">
                 <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                  <Calendar className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-gray-900 font-medium mb-1">No expired coupons</h3>
                <p className="text-gray-500 text-sm">Past coupons will appear here.</p>
              </div>
            ) : (
              renderTable(filteredExpiredCoupons, 'expired')
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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]"
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

              <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Coupon Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="SAVE100"
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all uppercase"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Amount
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="10"
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                      value={formData.discountAmount}
                      onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
                    />
                  </div>
                  <div className="flex-1 relative">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Type
                    </label>
                    <div
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all flex items-center justify-between capitalize cursor-pointer select-none"
                      onClick={() => setShowDiscountOptions(!showDiscountOptions)}
                    >
                      {formData.discountType[0].toUpperCase()+formData.discountType.slice(1).toLowerCase()}
                      <ChevronDown className={`w-4 h-4 ${showDiscountOptions ? "rotate-180" : ""} transition-all duration-200`} />
                    </div>
                    
                    <AnimatePresence>
                      {showDiscountOptions && (
                        <motion.div 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden"
                        >
                          {["percentage", "fixed"].map((type) => (
                            <div
                              key={type}
                              className="px-4 py-2.5 text-sm text-gray-900 hover:bg-gray-50 cursor-pointer capitalize transition-colors"
                              onClick={() => {
                                setFormData({ ...formData, discountType: type.toUpperCase() });
                                setShowDiscountOptions(false);
                              }}
                            >
                              {type[0].toUpperCase()+type.slice(1).toLowerCase()}
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Usage Limit
                    </label>
                    <input
                      type="number"
                      placeholder="Unlimited"
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                      value={formData.limit || ""}
                      onChange={(e) => setFormData({
                        ...formData,
                        limit: e.target.value ? Number(e.target.value) : null,
                      })}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Expires At
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between mb-4">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Applied Products
                      </label>
                    <div 
                      className="flex items-center cursor-pointer group"
                      onClick={() => {
                        setIsAllProducts(!isAllProducts);
                        setFormData({ ...formData, allProducts: !isAllProducts });
                        
                        if(!isAllProducts) setFormData(prev => ({...prev, productIds: []}));
                      }}
                    >
                      <span className={`text-sm mr-3 font-medium transition-colors ${isAllProducts ? "text-gray-900" : "text-gray-500"}`}>
                        All Products
                      </span>
                      <motion.div
                        className={`relative flex items-center p-1 w-10 h-6 rounded-full cursor-pointer ${isAllProducts ? "bg-gray-900" : "bg-gray-200"}`}
                        layout
                      >
                        <motion.div
                          className="w-4 h-4 bg-white rounded-full shadow-sm"
                          layout
                          transition={spring}
                          animate={{ x: isAllProducts ? 16 : 0 }}
                        />
                      </motion.div>
                    </div>
                  </div>
                  
                  <AnimatePresence mode="wait">
                    {!isAllProducts && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3"
                      >
                        
                        {formData.productIds.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2 p-3 bg-gray-50 border border-gray-100 rounded-lg">
                            {formData.productIds.map(id => {
                              const product = products.find(p => String(p.id) === id);
                              if (!product) return null;
                              return (
                                <motion.span 
                                  layout
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  key={id} 
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white border border-gray-200 text-gray-800 shadow-sm"
                                >
                                  {product.title}
                                  <button 
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); toggleProduct(id); }}
                                    className="hover:bg-gray-100 rounded-full p-0.5 transition-colors"
                                  >
                                    <X className="w-3 h-3 text-gray-400 hover:text-red-500" />
                                  </button>
                                </motion.span>
                              );
                            })}
                          </div>
                        )}
                        
                        <div className="relative" ref={dropdownRef}>
                          <div 
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 cursor-pointer flex justify-between items-center hover:border-gray-300 transition-colors"
                            onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
                          >
                            <span className={formData.productIds.length === 0 ? "text-gray-400" : "text-gray-900"}>
                              {formData.productIds.length === 0 
                                ? "Select specific products..." 
                                : `${formData.productIds.length} product(s) selected`}
                            </span>
                            <ChevronsUpDown className="w-4 h-4 text-gray-400" />
                          </div>
                          
                          <AnimatePresence>
                            {isProductDropdownOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden max-h-60 flex flex-col"
                              >
                                <div className="p-2 border-b border-gray-100 bg-gray-50/50 sticky top-0">
                                  <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                    <input 
                                      type="text"
                                      autoFocus
                                      placeholder="Search products..."
                                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                                      value={productSearch}
                                      onChange={(e) => setProductSearch(e.target.value)}
                                    />
                                  </div>
                                </div>
                                <div className="overflow-y-auto p-1">
                                  {filteredProducts.length === 0 ? (
                                    <div className="p-3 text-center text-xs text-gray-500">No products found</div>
                                  ) : (
                                    filteredProducts.map(product => {
                                      const isSelected = formData.productIds.includes(String(product.id));
                                      return (
                                        <div
                                          key={product.id}
                                          className={`flex items-center justify-between px-3 py-2 text-sm rounded-md cursor-pointer transition-colors ${isSelected ? "bg-gray-50 text-gray-900 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                                          onClick={() => toggleProduct(String(product.id))}
                                        >
                                          <span>{product.title}</span>
                                          {isSelected && <Check className="w-4 h-4 text-gray-900" />}
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <div className="pt-4 mt-6 border-t border-gray-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-all shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-black transition-all shadow-md shadow-gray-900/10 active:scale-95"
                  >
                    {editingCoupon ? "Update Coupon" : "Create Coupon"}
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