// frontend/components/admin-components/Analytics.tsx
import React, { useEffect, useState } from "react";
import { authFetch } from "@/lib/utils/apiClient";
import { TrendingUp, ShoppingCart, DollarSign, Package } from "lucide-react";
// Assuming you use framer-motion based on your project stack
import { motion } from "framer-motion";

export default function Analytics({ getAuthHeaders }: { getAuthHeaders: () => any }) {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    abandonmentRate: 0,
  });
  const [topProducts, setTopProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // These would hit the new Express API routes you built earlier
      const [kpiRes, productsRes] = await Promise.all([
        authFetch("analytics/kpis", { method: "GET", headers: getAuthHeaders() }),
        authFetch("analytics/products/top", { method: "GET", headers: getAuthHeaders() })
      ]);

      const kpiData = await kpiRes.json();
      const productsData = await productsRes.json();

      setStats({
        totalRevenue: kpiData.totalRevenue || 0,
        totalOrders: kpiData.totalOrders || 0,
        // Assuming your backend calculates this based on cart_items vs orders
        abandonmentRate: kpiData.abandonmentRate || 0, 
      });
      setTopProducts(productsData || []);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Store Analytics</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { title: "Total Revenue", value: `$${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-green-600", bg: "bg-green-100" },
          { title: "Total Orders", value: stats.totalOrders.toLocaleString(), icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-100" },
          { title: "Cart Abandonment", value: `${stats.abandonmentRate}%`, icon: TrendingUp, color: "text-red-600", bg: "bg-red-100" },
        ].map((kpi, idx) => (
          <motion.div 
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4"
          >
            <div className={`p-4 rounded-lg ${kpi.bg}`}>
              <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{kpi.title}</p>
              <h3 className="text-2xl font-bold text-gray-900">{kpi.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-2">
          <Package className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Top Performing Products</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="bg-gray-50 text-gray-700 uppercase">
              <tr>
                <th className="px-6 py-4 font-medium">Product Name</th>
                <th className="px-6 py-4 font-medium text-right">Units Sold</th>
                <th className="px-6 py-4 font-medium text-right">Revenue Generated</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product: any, idx) => (
                <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{product.product_name}</td>
                  <td className="px-6 py-4 text-right">{product.units_sold}</td>
                  <td className="px-6 py-4 text-right text-green-600 font-medium">
                    ${product.revenue.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}