"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/utils/apiClient";
import Link from "next/link";
import { Package, Check, X, ShoppingBag, CreditCard, Calendar, PackageOpen } from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";

interface OrderItem {
  id: number;
  product_title: string;
  product_price: number;
  quantity: number;
  products?: { image?: string };
}

interface Order {
  id: number;
  total_amount: number;
  payment_status: string;
  order_status: "placed" | "shipped" | "delivered" | "cancelled";
  created_at: string;
  order_items: OrderItem[];
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  },
  exit: { opacity: 0 }
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, type: "spring" as const, stiffness: 100, damping: 15 }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { duration: 0.3 }
  }
};

const OrderDetailsModal = ({ order, onClose }: { order: Order; onClose: () => void }) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Order Details</h3>
            <p className="text-xs text-gray-500">#{order.id} • {new Date(order.created_at).toLocaleDateString()}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="overflow-y-auto p-6 space-y-4">
          {order.order_items.map((item) => (
            <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{item.product_title}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                </div>
              </div>
              <p className="font-semibold text-gray-900">${item.product_price * item.quantity}</p>
            </div>
          ))}
        </div>
        <div className="bg-gray-50 p-6 space-y-3">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>${order.total_amount}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Shipping</span>
            <span>Free</span>
          </div>
          <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
            <span className="font-bold text-gray-900">Total</span>
            <span className="font-bold text-xl text-black">${order.total_amount}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const TimelineStep = ({
  label,
  status,
  isLast,
}: {
  label: string;
  status: 'completed' | 'active' | 'pending';
  isLast?: boolean;
}) => {
  return (
    <div className="relative flex flex-col items-center flex-1">
      
      {!isLast && (
        <div className="absolute top-3 left-1/2 w-full h-0.5 -translate-y-1/2 bg-gray-100 rounded-full overflow-hidden">
           <motion.div 
             initial={{ width: "0%" }}
             animate={{ width: status === 'completed' ? "100%" : "0%" }}
             transition={{ duration: 0.6, ease: "easeInOut", delay: 0.2 }}
             className="h-full bg-black"
           />
        </div>
      )}

      <motion.div
        initial={false}
        animate={{
            scale: status === 'active' ? 1.1 : 1,
            backgroundColor: status === 'completed' ? "#000000" : "#ffffff",
            borderColor: status === 'completed' || status === 'active' ? "#000000" : "#e5e7eb"
        }}
        transition={{ duration: 0.3 }}
        className={`w-6 h-6 rounded-full flex items-center justify-center border-2 z-10 relative bg-white`}
      >
        {status === 'completed' && (
            <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
                <Check className="w-3 h-3 text-white" />
            </motion.div>
        )}
        {status === 'active' && (
            <motion.div 
                className="w-2 h-2 bg-black rounded-full"
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            />
        )}
      </motion.div>

      <motion.span
        animate={{ color: status === 'completed' || status === 'active' ? "#000000" : "#9ca3af" }}
        className="text-[10px] sm:text-xs mt-2 font-medium tracking-wide uppercase"
      >
        {label}
      </motion.span>
    </div>
  );
};

const OrderCard = ({ order, onOpenDetails }: { order: Order; onOpenDetails: (o: Order) => void }) => {
  
  let activeStepIndex = 0; 
  if (order.order_status === 'placed') activeStepIndex = 1; 
  if (order.order_status === 'shipped') activeStepIndex = 2;
  if (order.order_status === 'delivered') activeStepIndex = 4;
  
  const isCancelled = order.order_status === 'cancelled';

  const getStepStatus = (stepIndex: number) => {
    if (activeStepIndex > stepIndex) return 'completed';
    if (activeStepIndex === stepIndex) return 'active';
    return 'pending';
  };

  const formattedDate = new Date(order.created_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: 'numeric', minute: '2-digit'
  });

  const itemCount = order.order_items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <motion.div 
      variants={cardVariants}
      className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 mb-6"
    >
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gray-900 rounded-xl text-white shadow-lg shadow-gray-200">
             <Package className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-gray-900 font-bold text-lg tracking-tight">Order #{order.id}</h3>
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mt-1">
               <Calendar className="w-3 h-3" />
               {formattedDate}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 self-end sm:self-auto">
           <div className="text-right mr-2 hidden sm:block">
              <span className="block text-xs text-gray-500">Total Amount</span>
              <span className="block font-bold text-lg text-gray-900">${order.total_amount.toFixed(2)}</span>
           </div>
           <motion.button 
             whileHover={{ scale: 1.02 }}
             whileTap={{ scale: 0.98 }}
             onClick={() => onOpenDetails(order)}
             className="bg-white border border-gray-300 text-gray-700 hover:bg-black hover:text-white hover:border-black px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-200"
           >
             Order Details
           </motion.button>
        </div>
      </div>

      {!isCancelled ? (
        <div className="flex justify-between w-full px-2 mb-8">
          <TimelineStep label="Confirmed" status={getStepStatus(0)} />
          <TimelineStep label="Processing" status={getStepStatus(1)} />
          <TimelineStep label="Shipped" status={getStepStatus(2)} />
          <TimelineStep label="Delivered" status={getStepStatus(3)} isLast={true} />
        </div>
      ) : (
        <div className="mb-8 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-100 text-center flex items-center justify-center gap-2">
           <X className="w-4 h-4" /> This order has been cancelled
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500 border-t border-gray-100 pt-5">
        <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
           <ShoppingBag className="w-3 h-3" /> {itemCount} Items
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
           <CreditCard className="w-3 h-3" /> {order.payment_status === 'paid' ? 'Paid Online' : 'Cash on Delivery'}
        </div>
        <div className="sm:hidden ml-auto font-bold text-gray-900 text-sm">
            ${order.total_amount.toFixed(2)}
        </div>
      </div>
    </motion.div>
  );
};

const OrderSection = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await authFetch("/orders/my-orders");
        if (!res.ok) throw new Error("Failed to load orders");
        const data = await res.json();
        if (data.success) {
          setOrders(data.orders);
        } else {
          setError(data.message);
        }
      } catch (err) {
        console.error(err);
        setError("Could not load orders.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const activeOrders = orders.filter(o => ['placed', 'shipped'].includes(o.order_status));
  const historyOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.order_status));
  const displayedOrders = activeTab === 'active' ? activeOrders : historyOrders;

  if (loading) return (
    <div className="p-20 flex justify-center items-center">
        <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
            <PackageOpen className="w-8 h-8 text-gray-300" />
        </motion.div>
    </div>
  );
  
  if (error) return <div className="p-10 text-center text-red-500 bg-red-50 rounded-xl">{error}</div>;

  return (
    <div className="w-full mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-end justify-between mb-8"
      >
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">My Orders</h1>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-gray-200 mb-8 relative">
        {(['active', 'history'] as const).map((tab) => (
            <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-sm font-bold tracking-wide transition-colors relative ${
                    activeTab === tab ? "text-black" : "text-gray-400 hover:text-gray-600"
                }`}
            >
                {tab === 'active' ? `Active Orders (${activeOrders.length})` : `Order History (${historyOrders.length})`}
                {activeTab === tab && (
                    <motion.div 
                        layoutId="activeTabIndicator"
                        className="absolute bottom-0 left-0 w-full h-0.5 bg-black"
                    />
                )}
            </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
         <motion.div 
            key={activeTab}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="min-h-100"
         >
            {displayedOrders.length === 0 ? (
              <motion.div 
                variants={cardVariants}
                className="text-center py-24 bg-gray-50 rounded-2xl border border-dashed border-gray-200"
              >
                <PackageOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No orders found in this section.</p>
                <Link href="/" className="text-black font-bold mt-4 inline-block hover:underline">
                  Start Shopping &rarr;
                </Link>
              </motion.div>
            ) : (
              displayedOrders.map((order) => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  onOpenDetails={(o) => setSelectedOrder(o)}
                />
              ))
            )}
         </motion.div>
      </AnimatePresence>

      <AnimatePresence>
          {selectedOrder && (
            <OrderDetailsModal 
              key="modal"
              order={selectedOrder} 
              onClose={() => setSelectedOrder(null)} 
            />
          )}
      </AnimatePresence>
    </div>
  );
};

export default OrderSection;