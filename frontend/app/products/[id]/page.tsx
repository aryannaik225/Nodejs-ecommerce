"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Minus, 
  Plus, 
  ShoppingCart, 
  Star, 
  Check, 
  Share2,
  Heart,
  AlertCircle
} from "lucide-react";
import { Product } from "@/lib/utils/types";
import { authFetch } from "@/lib/utils/apiClient";
import { decodeId, encodeId } from "@/lib/utils/idHandler";

const Toast = ({ message, onClose }: { message: string; onClose: () => void }) => (
  <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
    <div className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
      <div className="bg-green-500 rounded-full p-1">
        <Check className="w-3 h-3 text-white" />
      </div>
      <p className="text-sm font-medium">{message}</p>
    </div>
  </div>
);

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const maxQuantity = product ? Math.min(5, product.stock) : 1;

  useEffect(() => {
    const fetchProduct = async () => {
      const idString = Array.isArray(params.id) ? params.id[0] : params.id;
      if (!idString) {
        setLoading(false);
        return;
      }
      const decodedId = decodeId(idString);
      if (!decodedId) {
        setLoading(false);
        return;
      }

      try {
        const res = await authFetch(`products/${decodedId}`, { method: "GET" });
        const data = await res.json();
        const productData = data.product || data; 
        
        setProduct(productData);
        setActiveImage(productData.image);
        if (productData.stock < 1) setQuantity(0);
      } catch (error) {
        console.error("Failed to fetch product", error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) fetchProduct();
  }, [params.id]);

  const addToCart = async () => {
    if (!product || quantity === 0) return;
    
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth");
      return;
    }

    setIsAdding(true);
    try {
      const productId = decodeId(encodeId(product.id));
      
      const requests = [];
      for (let i = 0; i < quantity; i++) {
        requests.push(
          authFetch("cart/add", {
            method: "POST",
            body: JSON.stringify({ productId: productId, quantity: 1 }),
          })
        );
      }

      await Promise.all(requests);

      setToastMessage(`Added ${quantity} ${product.title} to cart`);
      setTimeout(() => setToastMessage(""), 3000);
    } catch (error) {
      console.error("Error adding to cart", error);
    } finally {
      setIsAdding(false);
    }
  };

  if (loading) return <ProductDetailSkeleton />;
  if (!product) return <div className="p-20 text-center">Product not found</div>;

  const isOutOfStock = product.stock === 0;

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-gray-900 selection:text-white">
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage("")} />}
      
      <nav className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Store
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          
          <div className="space-y-6">
            <div className="aspect-square bg-gray-50 rounded-3xl overflow-hidden border border-gray-100 relative group">
              <img 
                src={activeImage} 
                alt={product.title}
                className={`w-full h-full object-cover object-center mix-blend-multiply transition-transform duration-500 ${isOutOfStock ? 'grayscale opacity-50' : 'group-hover:scale-105'}`}
              />
              {!isOutOfStock && (
                <div className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-red-500">
                  <Heart className="w-5 h-5" />
                </div>
              )}
              {isOutOfStock && (
                 <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-gray-900 text-white px-4 py-2 rounded-lg font-bold">Out of Stock</span>
                 </div>
              )}
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <div className="mb-8">
              <div className="flex gap-2 mb-4">
                 {product.categories?.map((c) => (
                    <span key={c.id} className="text-xs font-bold tracking-wider uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                      {c.name}
                    </span>
                 ))}
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight mb-4 leading-tight">
                {product.title}
              </h1>

              <div className="flex items-center gap-4 mb-6">
                <span className="text-3xl font-bold text-gray-900">${product.price}</span>
                <div className="h-6 w-px bg-gray-200"></div>
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-sm font-medium text-gray-900 mt-0.5">4.8</span>
                  <span className="text-sm text-gray-400 mt-0.5">(124 reviews)</span>
                </div>
              </div>

              <p className="text-lg text-gray-500 leading-relaxed mb-8">
                {product.description}
              </p>
            </div>

            <div className="border-t border-b border-gray-100 py-8 mb-8 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Quantity</span>
                <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-4 bg-gray-50 rounded-full px-4 py-2 border border-gray-200">
                    <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={isOutOfStock || quantity <= 1}
                        className="p-1 hover:text-gray-900 text-gray-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-bold w-4 text-center text-gray-900">{quantity}</span>
                    <button 
                        onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                        disabled={isOutOfStock || quantity >= maxQuantity}
                        className="p-1 hover:text-gray-900 text-gray-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                    </div>
                    {/* Max limit feedback */}
                    {quantity >= 5 && !isOutOfStock && product.stock > 5 && (
                        <span className="text-[10px] text-gray-400 font-medium">Max limit reached</span>
                    )}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={addToCart}
                disabled={isAdding || isOutOfStock}
                className="flex-1 bg-gray-900 text-white h-14 rounded-full font-bold text-lg flex items-center justify-center gap-3 hover:bg-gray-800 transition-all shadow-lg shadow-gray-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {isAdding ? (
                   <span className="animate-pulse">Adding...</span>
                ) : isOutOfStock ? (
                   <span>Out of Stock</span>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    Add to Cart
                  </>
                )}
              </button>
              
              <button className="h-14 w-14 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mt-8 flex items-center gap-3 text-sm text-gray-500">
               {!isOutOfStock ? (
                  <>
                    <div className={`flex items-center gap-2 ${product.stock < 10 ? 'text-orange-600 font-medium' : ''}`}>
                        <div className={`w-2 h-2 rounded-full animate-pulse ${product.stock < 10 ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                        {product.stock < 10 ? `Only ${product.stock} items left!` : 'In Stock'}
                    </div>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span>Free Shipping</span>
                  </>
               ) : (
                  <div className="flex items-center gap-2 text-red-500 font-medium">
                      <AlertCircle className="w-4 h-4" />
                      Currently Unavailable
                  </div>
               )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

const ProductDetailSkeleton = () => (
  <div className="max-w-7xl mx-auto px-6 py-12 lg:py-16 animate-pulse bg-white min-h-screen">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div className="aspect-square bg-gray-200 rounded-3xl" />
      <div className="space-y-6 py-8">
        <div className="h-4 w-24 bg-gray-200 rounded" />
        <div className="h-12 w-3/4 bg-gray-200 rounded" />
        <div className="h-8 w-32 bg-gray-200 rounded" />
        <div className="space-y-3">
          <div className="h-4 w-full bg-gray-200 rounded" />
          <div className="h-4 w-full bg-gray-200 rounded" />
          <div className="h-4 w-2/3 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  </div>
);