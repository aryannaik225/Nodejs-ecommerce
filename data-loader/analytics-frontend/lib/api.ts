const API_BASE = "http://localhost:5000";

export interface Kpis {
  totalRevenue: number;
  totalOrders: number;
}

export interface DailyRevenue {
  day: string;
  revenue: number;
}

export interface TopProduct {
  product_name: string;
  units_sold: number;
  revenue: number;
}

export async function getKpis(): Promise<Kpis> {
  const res = await fetch(`${API_BASE}/kpis`);
  return res.json();
}

export async function getDailyRevenue(): Promise<DailyRevenue[]> {
  const res = await fetch(`${API_BASE}/revenue/daily`);
  return res.json();
}

export async function getTopProducts(): Promise<TopProduct[]> {
  const res = await fetch(`${API_BASE}/products/top`);
  return res.json();
}
