"use client";

import React, { useEffect, useState } from "react";
import { authFetch } from "@/lib/utils/apiClient";
import Link from "next/link";
import { 
  Heart, 
  ShoppingCart, 
  Trash2, 
  ShoppingBag,
  ArrowRight 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/components/CartProvider";
import { encodeId } from "@/lib/utils/idHandler";

// --- Types ---
interface Product {
  id: number;
  title: string;
  price: number;
  image: string | null;
  description: string;
  stock: number;
}

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1 // Stagger the entrance of items
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const }
  },
  exit: { 
    opacity: 0, 
    scale: 0.9, 
    transition: { duration: 0.2 } 
  }
};

// --- Component: Wishlist Item Card ---
const WishlistCard = ({ 
  product, 
  onRemove, 
  onAddToCart 
}: { 
  product: Product; 
  onRemove: (id: number) => void;
  onAddToCart: (product: Product) => void;
}) => {
  return (
    <motion.div
      layout
      variants={cardVariants}
      className="group bg-white border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-6 items-start sm:items-center shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 relative overflow-hidden"
    >
      {/* Product Image */}
      <Link 
        href={`/products/${encodeId(product.id)}`} 
        className="relative w-full sm:w-32 aspect-square bg-gray-50 rounded-xl overflow-hidden shrink-0"
      >
        {product.image ? (
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 mix-blend-multiply"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <ShoppingBag className="w-8 h-8" />
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex justify-between items-start">
          <Link href={`/products/${encodeId(product.id)}`} className="group-hover:text-blue-600 transition-colors">
            <h3 className="font-bold text-gray-900 text-lg truncate pr-8">{product.title}</h3>
          </Link>
        </div>
        
        <p className="text-gray-500 text-sm line-clamp-1 mb-2">{product.description}</p>
        
        <div className="flex items-center gap-3">
          <span className="font-bold text-xl text-black">${product.price.toFixed(2)}</span>
          {product.stock > 0 ? (
             <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-50 px-2 py-1 rounded-full">
               In Stock
             </span>
          ) : (
             <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50 px-2 py-1 rounded-full">
               Out of Stock
             </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="w-full sm:w-auto flex flex-row sm:flex-col gap-3 mt-2 sm:mt-0">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onAddToCart(product)}
          disabled={product.stock === 0}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm
            ${product.stock > 0 
              ? "bg-black text-white hover:bg-gray-800" 
              : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span className="sm:hidden lg:inline">Add to Cart</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02, backgroundColor: "#fee2e2", color: "#ef4444" }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onRemove(product.id)}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-50 hover:bg-red-50 hover:text-red-600 transition-colors border border-gray-100"
        >
          <Trash2 className="w-4 h-4" />
          <span className="sm:hidden lg:inline">Remove</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

// --- Main Wishlist Component ---
const WishList = () => {
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      // Run API call AND a 1.5s timer simultaneously
      // Execution waits until BOTH are complete
      const [res] = await Promise.all([
        authFetch("wishlist"),
        new Promise(resolve => setTimeout(resolve, 1500)) 
      ]);

      const data = await res.json();
      if (data.success) {
        setWishlist(data.products || []);
      }
    } catch (error) {
      console.error("Failed to fetch wishlist", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId: number) => {
    // Optimistic UI Update
    const originalList = [...wishlist];
    setWishlist(prev => prev.filter(p => p.id !== productId));

    try {
      const res = await authFetch("wishlist/toggle", {
        method: "POST",
        body: JSON.stringify({ productId }),
      });
      
      if (!res.ok) {
        // Revert if failed
        setWishlist(originalList);
      }
    } catch (error) {
      setWishlist(originalList);
    }
  };

  if (loading) return (
    <div className="w-full h-96 flex flex-col items-center justify-center gap-6">
       <motion.div 
         animate={{ 
            scale: [1, 1.2, 1], 
            rotate: [0, 0, 0] // Keep stable
         }}
         transition={{ 
            repeat: Infinity, 
            duration: 1.5,
            ease: "easeInOut" 
         }}
         className="relative"
       >
         <div className="absolute inset-0 bg-red-100 rounded-full blur-xl animate-pulse"></div>
         <Heart className="w-16 h-16 text-red-200 fill-red-50 relative z-10" />
       </motion.div>
       <p className="text-gray-400 font-medium animate-pulse tracking-wide">
          Curating your wishlist...
       </p>
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-end justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">My Wishlist</h1>
          <p className="text-gray-500 mt-2 text-sm">
            {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved for later
          </p>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {wishlist.length === 0 ? (
          <motion.div 
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center py-24 bg-gray-50 rounded-3xl border border-dashed border-gray-200 text-center px-4"
          >
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
              <Heart className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Your wishlist is empty</h3>
            <p className="text-gray-500 max-w-sm mb-8">
              Looks like you haven't saved any items yet. Start exploring and save your favorites!
            </p>
            <Link href="/" className="inline-flex items-center gap-2 bg-black text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-800 transition-all hover:scale-105 shadow-lg shadow-gray-200">
              Start Shopping <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        ) : (
          <motion.div 
            key="list"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-4"
          >
            <AnimatePresence mode="popLayout">
              {wishlist.map((product) => (
                <WishlistCard 
                  key={product.id} 
                  product={product} 
                  onRemove={handleRemove}
                  onAddToCart={(p) => addToCart(p)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WishList;