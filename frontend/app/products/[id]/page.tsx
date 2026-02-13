"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingCart,
  Star,
  Check,
  Share2,
  MapPin,
  Lock,
  User,
  ChevronRight,
  ChevronLeft, // Import ChevronLeft
} from "lucide-react";
import { Product } from "@/lib/utils/types";
import { authFetch } from "@/lib/utils/apiClient";
import { decodeId, encodeId } from "@/lib/utils/idHandler";
import Navbar from "@/components/NavBar";

interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  users: { name: string };
}

interface ProductWithReviews extends Product {
  reviews: Review[];
}

interface RecommendedProduct {
  id: number;
  title: string;
  description: string;
  image: string;
  price: number;
  score: number;
  rating?: number;
  reviewCount?: number;
}

const Toast = ({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) => (
  <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
    <div className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
      <div className="bg-green-500 rounded-full p-1">
        <Check className="w-3 h-3 text-white" />
      </div>
      <p className="text-sm font-medium">{message}</p>
    </div>
  </div>
);

const StarRating = ({
  rating,
  interactive = false,
  setRating,
  size = "md",
}: {
  rating: number;
  interactive?: boolean;
  setRating?: (r: number) => void;
  size?: "sm" | "md";
}) => {
  const iconSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && setRating && setRating(star)}
          className={`${
            interactive
              ? "cursor-pointer hover:scale-110 transition-transform"
              : "cursor-default"
          }`}
        >
          <Star
            className={`${iconSize} ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-200 text-gray-200"
            }`}
          />
        </button>
      ))}
    </div>
  );
};

const ProductDetailSkeleton = () => (
  <div className="max-w-350 mx-auto px-4 py-8 animate-pulse">
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-5 bg-gray-100 h-125 rounded-xl" />
      <div className="lg:col-span-4 space-y-4">
        <div className="h-8 w-3/4 bg-gray-100 rounded" />
        <div className="h-4 w-1/4 bg-gray-100 rounded" />
        <div className="h-px bg-gray-200 my-4" />
        <div className="h-6 w-1/3 bg-gray-100 rounded" />
      </div>
      <div className="lg:col-span-3">
        <div className="border border-gray-200 rounded-lg p-4 h-100 bg-gray-50" />
      </div>
    </div>
  </div>
);

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [product, setProduct] = useState<ProductWithReviews | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [toastMessage, setToastMessage] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState("");

  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const [zoomStyle, setZoomStyle] = useState({
    transformOrigin: "center",
    transform: "scale(1)",
  });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchProduct = async () => {
    const idString = Array.isArray(params.id) ? params.id[0] : params.id;
    if (!idString) return setLoading(false);
    const decodedId = decodeId(idString);
    if (!decodedId) return setLoading(false);

    try {
      const res = await authFetch(`products/${decodedId}`, { method: "GET" });
      const data = await res.json();
      const productData = data.product || data;
      setProduct(productData);
      if (productData.stock < 1) setQuantity(0);
    } catch (error) {
      console.error("Failed to fetch product", error);
    }
  };

  const fetchProductRecommendations = async () => {
    const idString = Array.isArray(params.id) ? params.id[0] : params.id;
    if (!idString) return;
    const decodedId = decodeId(idString);
    if (!decodedId) return;

    try {
      const res = await authFetch(`recommendations/product/${decodedId}`, {
        method: "GET",
      });
      const data = await res.json();
      
      if (data.success && Array.isArray(data.data)) {
        setRecommendations(data.data);
      } else if (Array.isArray(data.products)) {
        setRecommendations(data.products);
      }
    } catch (error) {
      console.error("Failed to fetch recommendations", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchProduct();
      fetchProductRecommendations();
    }

    const date = new Date();
    date.setDate(date.getDate() + 3);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      month: "short",
      day: "numeric",
    };
    setDeliveryDate(date.toLocaleDateString("en-US", options));
  }, [params.id]);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setToastMessage("Link copied to clipboard!");
      setTimeout(() => setToastMessage(""), 3000);
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const { left, top, width, height } =
      imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: "scale(2)",
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({
      transformOrigin: "center",
      transform: "scale(1)",
    });
  };

  const scrollRecommendations = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = 240; 
      if (direction === "left") {
        current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      } else {
        current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    }
  };

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
      await authFetch("cart/add", {
        method: "POST",
        body: JSON.stringify({ productId: productId, quantity }),
      });
      setToastMessage(`Added ${quantity} item(s) to cart`);
      setTimeout(() => setToastMessage(""), 3000);
    } catch (error) {
      console.error("Error adding to cart", error);
    } finally {
      setIsAdding(false);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || userRating === 0) return;
    const token = localStorage.getItem("token");
    if (!token) return router.push("/auth");

    setSubmittingReview(true);
    try {
      const idString = Array.isArray(params.id) ? params.id[0] : params.id;
      const decodedId = decodeId(idString!);
      const res = await authFetch(`products/${decodedId}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating: userRating, comment: userComment }),
      });
      if (res.ok) {
        setToastMessage("Review submitted!");
        setUserRating(0);
        setUserComment("");
        fetchProduct();
      }
    } catch (error) {
      console.error("Error submitting review", error);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <ProductDetailSkeleton />;
  if (!product)
    return <div className="p-20 text-center">Product not found</div>;

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 15;
  const maxQuantity = Math.min(product.stock, 10);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage("")} />
      )}

      <Navbar />

      <div className="border-b border-gray-100 sticky top-16 bg-white/80 backdrop-blur-md z-20">
        <div className="max-w-7xl mx-auto px-6 h-12 flex items-center">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to results
          </button>
        </div>
      </div>

      <main className="max-w-350 mx-auto px-4 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-10 lg:gap-x-12">
          <div className="lg:col-span-5">
            <div className="sticky top-24">
              <div
                className="w-full flex justify-center items-center bg-white rounded-lg relative group overflow-hidden cursor-crosshair"
                ref={imageContainerRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <div className="absolute top-2 right-2 z-10">
                  <button
                    onClick={handleShare}
                    className="p-2 rounded-full bg-white/80 hover:bg-gray-100 transition-colors shadow-sm border border-gray-100"
                    title="Copy Link"
                  >
                    <Share2 className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="relative w-full aspect-4/3 flex items-center justify-center overflow-hidden">
                  <img
                    src={product.image || ""}
                    alt={product.title}
                    style={zoomStyle}
                    className={`max-h-full max-w-full object-contain mix-blend-multiply transition-transform duration-100 ease-out ${
                      isOutOfStock ? "grayscale opacity-50" : ""
                    }`}
                  />
                </div>
              </div>
              <div className="text-center mt-2 text-xs text-gray-500">
                Roll over image to zoom in
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-3">
            <h1 className="text-2xl lg:text-3xl font-medium text-gray-900 leading-tight">
              {product.title}
            </h1>

            <div className="flex items-center gap-2 group cursor-pointer hover:underline decoration-blue-500">
              <div className="flex items-center">
                <span className="text-sm font-bold mr-1 text-gray-900">
                  {product.averageRating}
                </span>
                <StarRating rating={Number(product.averageRating)} size="sm" />
              </div>
              <ChevronRight className="w-3 h-3 text-gray-400" />
              <span className="text-sm text-blue-700 font-medium">
                {product.reviewCount} ratings
              </span>
            </div>

            <div className="h-px w-full bg-gray-200 my-1"></div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-1">
                <span className="text-xs align-top relative -top-1">$</span>
                <span className="text-3xl font-medium text-gray-900">
                  {product.price.toLocaleString()}
                </span>
              </div>
              <div className="text-xs text-gray-900">
                Inclusive of all taxes
              </div>
            </div>

            <div className="h-px w-full bg-gray-200 my-1"></div>

            <div className="py-2">
              <span className="text-sm font-bold text-gray-900 block mb-2">
                Categories:
              </span>
              <div className="flex flex-wrap gap-2">
                {product.categories?.map((c) => (
                  <span
                    key={c.id}
                    className="text-xs text-gray-600 bg-gray-100 border border-gray-200 px-2 py-1 rounded-md"
                  >
                    {c.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="h-px w-full bg-gray-200 my-1"></div>

            <div className="mt-2">
              <h3 className="font-bold text-base text-gray-900 mb-2">
                About this item
              </h3>
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                {product.description}
              </p>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="border border-gray-200 rounded-lg p-5 shadow-sm sticky top-24">
              <div className="mb-4">
                <span className="text-xl font-medium text-gray-900">
                  ${product.price.toLocaleString()}
                </span>
              </div>

              <div className="text-sm text-gray-600 mb-4 space-y-2">
                <div>
                  <span className="text-blue-600 font-medium">
                    FREE delivery
                  </span>
                  <span className="font-bold text-gray-900 ml-1">
                    {deliveryDate}
                  </span>
                  .
                </div>
                <div className="flex items-start gap-1.5 text-blue-600 mt-2">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="text-xs leading-tight">Deliver to User</span>
                </div>
              </div>

              <div className="mb-4">
                {isOutOfStock ? (
                  <span className="text-lg text-red-600 font-medium">
                    Currently unavailable.
                  </span>
                ) : isLowStock ? (
                  <span className="text-lg text-orange-700 font-medium">
                    Only {product.stock} left in stock - order soon.
                  </span>
                ) : (
                  <span className="text-lg text-green-700 font-medium">
                    In Stock.
                  </span>
                )}
              </div>

              {!isOutOfStock && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-2 py-1 bg-gray-50/50 shadow-sm w-fit">
                    <span className="text-xs text-gray-500">Qty:</span>
                    <select
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="bg-transparent border-none text-gray-900 text-sm focus:ring-0 cursor-pointer p-0"
                    >
                      {[...Array(maxQuantity)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={addToCart}
                  disabled={isAdding || isOutOfStock}
                  className="w-full bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-full text-sm px-5 py-2.5 text-center transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAdding ? "Adding..." : "Add to Cart"}
                </button>
              </div>

              <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
                <Lock className="w-3 h-3" />
                <span>Secure transaction</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-gray-200 pt-10 flex flex-col gap-6 items-start w-full">
          <h2 className="text-2xl font-bold text-gray-900">
            Featured items to consider
          </h2>
          
          <div className="relative w-full group/carousel">
            <button 
                onClick={() => scrollRecommendations("left")}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 border border-gray-200 shadow-md p-3 rounded-r-lg hover:bg-white text-gray-600 hidden group-hover/carousel:block transition-all"
            >
                <ChevronLeft className="w-6 h-6" />
            </button>

            <div 
                ref={scrollRef}
                className="flex gap-6 overflow-x-auto scroll-smooth no-scrollbar pb-4 px-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {recommendations.length > 0 ? (
                    recommendations.map((rec) => (
                        <div 
                            key={rec.id} 
                            className="min-w-55 max-w-55 group cursor-pointer flex flex-col gap-2"
                            onClick={() => router.push(`/products/${encodeId(rec.id)}`)}
                        >
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 aspect-square flex items-center justify-center overflow-hidden">
                                <img 
                                    src={rec.image} 
                                    alt={rec.title} 
                                    className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform duration-200 group-hover:scale-105" 
                                />
                            </div>
                            
                            <div className="space-y-1">
                                <h3 className="text-sm font-medium text-blue-700 group-hover:text-orange-700 group-hover:underline line-clamp-2 h-10 leading-snug">
                                    {rec.title}
                                </h3>
                                
                                <div className="flex items-center gap-1">
                                    <StarRating rating={rec.rating || 0} size="sm" />
                                    <span className="text-xs text-blue-700">{rec.reviewCount || 0}</span>
                                </div>

                                <div className="text-lg font-medium text-gray-900">
                                    ${rec.price.toLocaleString()}
                                </div>
                                
                                <div className="text-xs text-gray-500">
                                    Get it by <span className="font-bold text-gray-800">{deliveryDate}</span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    [...Array(6)].map((_, i) => (
                        <div key={i} className="min-w-55 animate-pulse space-y-3">
                            <div className="bg-gray-100 rounded-lg aspect-square" />
                            <div className="h-4 bg-gray-100 rounded w-full" />
                            <div className="h-4 bg-gray-100 rounded w-1/2" />
                        </div>
                    ))
                )}
            </div>

            <button 
                onClick={() => scrollRecommendations("right")}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 border border-gray-200 shadow-md p-3 rounded-l-lg hover:bg-white text-gray-600 hidden group-hover/carousel:block transition-all"
            >
                <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="mt-16 border-t border-gray-200 pt-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Customer reviews
              </h2>
              <div className="flex items-center gap-2 mb-4">
                <StarRating rating={Number(product.averageRating)} size="md" />
                <span className="text-base font-medium text-gray-900">
                  {product.averageRating} out of 5
                </span>
              </div>
              <div className="text-sm text-gray-500 mb-6">
                {product.reviewCount} global ratings
              </div>

              <div className="border-t border-b border-gray-200 py-6 my-6">
                <h3 className="font-bold text-sm mb-2">Review this product</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Share your thoughts with other customers
                </p>
                <form onSubmit={submitReview} className="space-y-3">
                  <div className="flex gap-1">
                    <StarRating
                      rating={userRating}
                      interactive={true}
                      setRating={setUserRating}
                      size="md"
                    />
                  </div>
                  <textarea
                    value={userComment}
                    onChange={(e) => setUserComment(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-yellow-500 outline-none"
                    rows={3}
                    placeholder="Write your review here..."
                  />
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="w-full bg-white border border-gray-300 text-gray-900 hover:bg-gray-50 font-medium rounded-lg text-sm px-4 py-1.5 shadow-sm transition-colors"
                  >
                    Write a customer review
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Top reviews
              </h3>
              <div className="space-y-6">
                {product.reviews && product.reviews.length > 0 ? (
                  product.reviews.map((review) => (
                    <div key={review.id} className="pb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                          <User className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {review.users.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <StarRating rating={review.rating} size="sm" />
                        <span className="text-xs font-bold text-gray-900">
                          Verified Purchase
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        Reviewed on{" "}
                        {new Date(review.created_at).toLocaleDateString()}
                      </div>
                      <p className="text-sm text-gray-800 leading-relaxed">
                        {review.comment}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 text-sm">No reviews yet. Be the first one to talk about this product.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}