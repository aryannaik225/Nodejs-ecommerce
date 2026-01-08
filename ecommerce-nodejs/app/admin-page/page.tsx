"use client";

import React, { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Search,
  LayoutDashboard,
  Package,
  ChevronRight,
  ImageIcon,
  ShoppingBag,
} from "lucide-react";
import { Product } from "@/lib/utils/types";

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    image: "",
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/products/`);
      const data = await res.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/products/delete/${id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );
      if (res.ok) fetchProducts();
    } catch (error) {
      alert("Failed to delete product");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!editingProduct;
    const url = isEdit
      ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/products/update/${editingProduct.id}`
      : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/products/create`;

    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method: method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Operation failed");

      closeModal();
      fetchProducts();
    } catch (error) {
      alert("Error saving product. Check if you are logged in.");
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({ title: "", description: "", price: "", image: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      description: product.description,
      price: product.price.toString(),
      image: product.image || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-gray-900 selection:text-white">
      
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="flex items-center gap-2 font-medium text-gray-900">
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </span>
            <ChevronRight className="w-4 h-4" />
            <span className="font-medium text-gray-900">Products</span>
          </div> */}

          <a href="/" className="flex items-center gap-2 shrink-0">
            <div className="bg-gray-900 text-white p-1.5 rounded-lg">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900 hidden sm:block">Store.</span>
          </a>
          
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-700">
              AD
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Inventory
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage your products, pricing, and stock.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative group flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all"
              />
            </div>
            <button
              onClick={openCreateModal}
              className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg cursor-pointer flex items-center gap-2 text-sm font-medium transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
          </div>
        </div>

        
        <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 overflow-hidden">
          
          {isLoading && (
            <div className="p-12 text-center text-gray-500 text-sm">
              Loading inventory...
            </div>
          )}

          {!isLoading && filteredProducts.length === 0 && (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                <Package className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-gray-900 font-medium mb-1">
                No products found
              </h3>
              <p className="text-gray-500 text-sm">
                Try adjusting your search or add a new product.
              </p>
            </div>
          )}

          {!isLoading && filteredProducts.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                    <th className="px-6 py-4 w-20">Image</th>
                    <th className="px-6 py-4">Product Name</th>
                    <th className="px-6 py-4 w-30">Price</th>
                    <th className="px-6 py-4 w-25 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="group hover:bg-gray-50/80 transition-colors duration-200"
                    >
                      <td className="px-6 py-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-gray-300" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="font-medium text-gray-900">
                          {product.title}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-sm font-light mt-0.5">
                          {product.description}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">
                        ${Number(product.price).toFixed(2)}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(product)}
                            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-white rounded-lg transition-all border border-transparent hover:border-gray-200 hover:shadow-sm"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg transition-all border border-transparent hover:border-gray-200 hover:shadow-sm"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 text-xs text-gray-500 flex justify-between items-center">
            <span>Showing {filteredProducts.length} products</span>
            <span>Admin View</span>
          </div>
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          
          <div
            className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={closeModal}
          />

          
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-semibold text-gray-900">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Product Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Wireless Headphones"
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Price ($)
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="0.00"
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Image URL
                    </label>
                    <input
                      type="text"
                      placeholder="https://..."
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                      value={formData.image}
                      onChange={(e) =>
                        setFormData({ ...formData, image: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Description
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe your product..."
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 resize-none focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-gray-900 hover:bg-black text-white py-3 rounded-lg text-sm font-semibold shadow-lg shadow-gray-900/10 hover:shadow-gray-900/20 transition-all active:scale-[0.99] flex justify-center items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingProduct ? "Update Product" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
