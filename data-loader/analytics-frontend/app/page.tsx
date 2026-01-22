import {
  getKpis,
  getDailyRevenue,
  getTopProducts,
} from "@/lib/api";

import KpiCard from "@/components/KpiCard";
import RevenueChart from "@/components/RevenueChart";
import TopProducts from "@/components/TopProducts";
import DownloadButton from "@/components/DownloadButton";
import { DollarSign, ShoppingBag, TrendingUp, Users } from "lucide-react";

export default async function Dashboard() {
  const [kpis, revenue, topProducts] = await Promise.all([
    getKpis(),
    getDailyRevenue(),
    getTopProducts(),
  ]);

  const dashboardData = {
    kpis,
    revenue,
    topProducts,
  };

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="mt-1 text-muted-foreground">
              Overview of your store's performance.
            </p>
          </div>
          <DownloadButton data={dashboardData} />
        </header>

        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard 
            title="Total Revenue" 
            value={`$${kpis.totalRevenue}`} 
            icon={DollarSign}
            trend="+12.5%"
            trendUp={true}
          />
          <KpiCard 
            title="Total Orders" 
            value={kpis.totalOrders} 
            icon={ShoppingBag}
            trend="+8.2%"
            trendUp={true}
          />
          <KpiCard 
            title="Active Customers" 
            value="1,203" 
            icon={Users}
            trend="+2.1%"
            trendUp={true}
          />
          <KpiCard 
            title="Conversion Rate" 
            value="3.4%" 
            icon={TrendingUp}
            trend="-0.4%"
            trendUp={false}
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RevenueChart data={revenue} />
          </div>

          <div className="lg:col-span-1">
            <TopProducts products={topProducts} />
          </div>
        </div>
      </div>
    </main>
  );
}