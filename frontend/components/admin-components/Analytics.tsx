"use client";

import { authFetch } from '@/lib/utils/apiClient';
import { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { DollarSign, ShoppingBag, TrendingUp, Package, Loader2 } from 'lucide-react';

interface AnalyticsData {
  kpis: { total_orders: number; total_revenue: number };
  orderStatuses: { order_status: string; count: number }[];
  topProducts: { title: string; total_sold: number; revenue_generated: number }[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Analytics({ getAuthHeaders }: { getAuthHeaders: () => Record<string, string> }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await authFetch('/analytics/dashboard', {
          method: 'GET',
          headers: getAuthHeaders()
        });
        const json = await res.json();
        
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.message);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to connect to the analytics server.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center flex-col gap-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-lg font-medium text-slate-600">Querying Databricks Lakehouse...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 m-4 bg-red-50 border border-red-200 rounded-xl text-red-600 font-medium">
        ⚠️ Analytics Error: {error}
      </div>
    );
  }

  // Formatting currency helper
  const formatUSD = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="p-8 space-y-8 bg-[#f8fafc] min-h-screen text-slate-900">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight">Executive Dashboard</h2>
          <p className="text-slate-500 mt-1">Real-time insights powered by Databricks Serverless.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 text-sm font-medium text-slate-600">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* --- KPI Row --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5">
          <div className="p-4 bg-green-50 rounded-xl text-green-600">
            <DollarSign size={28} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase">Total Revenue</p>
            <p className="text-3xl font-bold">{formatUSD(data.kpis.total_revenue)}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5">
          <div className="p-4 bg-blue-50 rounded-xl text-blue-600">
            <ShoppingBag size={28} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase">Total Orders</p>
            <p className="text-3xl font-bold">{data.kpis.total_orders}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5">
          <div className="p-4 bg-purple-50 rounded-xl text-purple-600">
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase">Avg Order Value</p>
            <p className="text-3xl font-bold">
              {formatUSD(data.kpis.total_revenue / data.kpis.total_orders)}
            </p>
          </div>
        </div>
      </div>

      {/* --- Charts Section --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Sales Performance Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-6">
            <Package className="text-slate-400" size={20} />
            <h3 className="text-lg font-bold text-slate-800">Top Product Performance</h3>
          </div>
          <div className="h-87.5 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topProducts} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="title" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="revenue_generated" name="Revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Donut Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-6">
            <Loader2 className="text-slate-400" size={20} />
            <h3 className="text-lg font-bold text-slate-800">Order Fulfilment Status</h3>
          </div>
          <div className="h-87.5 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.orderStatuses}
                  dataKey="count"
                  nameKey="order_status"
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                >
                  {data.orderStatuses.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}