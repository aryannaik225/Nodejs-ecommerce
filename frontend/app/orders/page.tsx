"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/utils/apiClient";
import Link from "next/link";

interface OrderItem {
  id: number;
  product_title: string;
  product_price: number;
  quantity: number;
}

interface Order {
  id: number;
  total_amount: number;
  payment_status: string;
  order_status: "placed" | "shipped" | "delivered" | "cancelled";
  created_at: string;
  order_items: OrderItem[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await authFetch("/orders/my-orders");
        
        if (!res.ok) {
           throw new Error("Failed to load orders");
        }

        const data = await res.json();
        if (data.success) {
          setOrders(data.orders);
        } else {
          setError(data.message || "Something went wrong");
        }
      } catch (err) {
        console.error(err);
        setError("Could not load orders. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) return <div className="p-10 text-center">Loading your orders...</div>;
  if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">My Order History</h1>

      {orders.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">You haven't placed any orders yet.</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              
              <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b">
                <div>
                  <p className="text-sm text-gray-500">Order Placed</p>
                  <p className="font-medium text-gray-900">
                    {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <div className="mt-2 sm:mt-0 text-right">
                   <p className="text-sm text-gray-500">Total Amount</p>
                   <p className="font-bold text-gray-900">${order.total_amount}</p>
                </div>
              </div>

              <div className="px-6 py-4">
                 <OrderStatusBadge status={order.order_status} />
              </div>

              <div className="px-6 py-4 border-t border-gray-100">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-2">
                    <div className="flex items-center">
                        <div className="h-2 w-2 bg-gray-300 rounded-full mr-3"></div>
                        <span className="text-gray-700 font-medium">{item.product_title}</span>
                        <span className="text-gray-400 text-sm ml-2">x{item.quantity}</span>
                    </div>
                    <span className="text-gray-600">${item.product_price}</span>
                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const styles = {
    placed: "bg-yellow-100 text-yellow-800 border-yellow-200",
    shipped: "bg-blue-100 text-blue-800 border-blue-200",
    delivered: "bg-green-100 text-green-800 border-green-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
  };

  const getProgress = (s: string) => {
    if (s === 'placed') return 'w-1/3';
    if (s === 'shipped') return 'w-2/3';
    if (s === 'delivered') return 'w-full';
    return 'w-0';
  };

  const currentStyle = styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";

  return (
    <div>
        <div className="flex items-center justify-between mb-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${currentStyle}`}>
                {status}
            </span>
            {status === 'delivered' && <span className="text-green-600 text-sm font-semibold">✓ Completed</span>}
        </div>
        
        {status !== 'cancelled' && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div className={`bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ${getProgress(status)}`}></div>
            </div>
        )}
    </div>
  );
}