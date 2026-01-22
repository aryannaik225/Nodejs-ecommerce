"use client";

import { Download } from "lucide-react";
import { DailyRevenue, TopProduct } from "@/lib/api"; 


interface DashboardData {
  kpis: {
    totalRevenue: number | string;
    totalOrders: number | string;
  };
  revenue: DailyRevenue[];
  topProducts: TopProduct[];
}

export default function DownloadButton({ data }: { data: DashboardData }) {
  const handleDownload = () => {
    
    const csvRows = [];
    
    csvRows.push("KPI Summary");
    csvRows.push("Metric,Value");
    csvRows.push(`Total Revenue,${data.kpis.totalRevenue}`);
    csvRows.push(`Total Orders,${data.kpis.totalOrders}`);
    csvRows.push("");

    csvRows.push("Daily Revenue");
    csvRows.push("Date,Revenue");
    data.revenue.forEach((item) => {
      csvRows.push(`${item.day},${item.revenue}`);
    });
    csvRows.push("");

    csvRows.push("Top Products");
    csvRows.push("Product Name,Units Sold,Revenue");
    data.topProducts.forEach((item) => {
      
      const safeName = item.product_name.includes(",") 
        ? `"${item.product_name}"` 
        : item.product_name;
      csvRows.push(`${safeName},${item.units_sold},${item.revenue}`);
    });

    
    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `dashboard_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={handleDownload}
      className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 active:scale-95"
    >
      <Download className="h-4 w-4" />
      Download Report
    </button>
  );
}