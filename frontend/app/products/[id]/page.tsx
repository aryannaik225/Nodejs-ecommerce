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
  AlertCircle,
  User,
} from "lucide-react";
import { Product, Category } from "@/lib/utils/types";
import { authFetch } from "@/lib/utils/apiClient";
import { motion } from "framer-motion";
import { decodeId, encodeId } from "@/lib/utils/idHandler";
import { useCart } from "@/components/CartProvider";
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
}: {
  rating: number;
  interactive?: boolean;
  setRating?: (r: number) => void;
}) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && setRating && setRating(star)}
          className={`${interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"}`}
        >
          <Star
            className={`w-4 h-4 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-100 text-gray-300"}`}
          />
        </button>
      ))}
    </div>
  );
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [product, setProduct] = useState<ProductWithReviews | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const maxQuantity = product ? Math.min(5, product.stock) : 1;

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

  useEffect(() => {
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
          }),
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

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (userRating === 0) {
      alert("Please select a star rating");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth");
      return;
    }

    setSubmittingReview(true);
    try {
      const idString = Array.isArray(params.id) ? params.id[0] : params.id;
      if (!idString) return;
      const decodedId = decodeId(idString);

      const res = await authFetch(`products/${decodedId}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating: userRating, comment: userComment }),
      });

      const data = await res.json();

      if (res.ok) {
        setToastMessage("Review submitted successfully!");
        setUserRating(0);
        setUserComment("");
        // Refresh product to show new review
        fetchProduct();
        setTimeout(() => setToastMessage(""), 3000);
      } else {
        alert(data.message || "Failed to submit review");
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

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-gray-900 selection:text-white">
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage("")} />
      )}

      <Navbar />

      <div className="border-b border-gray-100 sticky top-16 bg-white/80 backdrop-blur-md z-20">
         <div className="max-w-7xl mx-auto px-6 h-12 flex items-center">
           <button onClick={() => router.back()} className="...">
             <ArrowLeft className="w-4 h-4" /> Back
           </button>
         </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 mb-20">
          {/* ... Images Section (Unchanged) ... */}
          <div className="space-y-6">
            <div className="aspect-square bg-gray-50 rounded-3xl overflow-hidden border border-gray-100 relative group">
              <img
                src={activeImage}
                alt={product.title}
                className={`w-full h-full object-cover object-center mix-blend-multiply transition-transform duration-500 ${isOutOfStock ? "grayscale opacity-50" : "group-hover:scale-105"}`}
              />
              {/* Heart Icon Logic... */}
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <div className="mb-8">
              {/* Categories ... */}
              <div className="flex gap-2 mb-4">
                {product.categories?.map((c) => (
                  <span
                    key={c.id}
                    className="text-xs font-bold tracking-wider uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded-md"
                  >
                    {c.name}
                  </span>
                ))}
              </div>

              <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight mb-4 leading-tight">
                {product.title}
              </h1>

              {/* Dynamic Ratings Header */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-3xl font-bold text-gray-900">
                  ${product.price}
                </span>
                <div className="h-6 w-px bg-gray-200"></div>
                <div className="flex items-center gap-1">
                  <StarRating rating={Number(product.averageRating)} />
                  <span className="text-sm font-medium text-gray-900 mt-0.5 ml-2">
                    {product.averageRating}
                  </span>
                  <span className="text-sm text-gray-400 mt-0.5">
                    ({product.reviewCount} reviews)
                  </span>
                </div>
              </div>

              <p className="text-lg text-gray-500 leading-relaxed mb-8">
                {product.description}
              </p>
            </div>

            {/* Quantity and Cart Buttons (Unchanged logic) */}
            <div className="border-t border-b border-gray-100 py-8 mb-8 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">
                  Quantity
                </span>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-4 bg-gray-50 rounded-full px-4 py-2 border border-gray-200">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={isOutOfStock || quantity <= 1}
                      className="p-1 hover:text-gray-900 text-gray-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-bold w-4 text-center text-gray-900">
                      {quantity}
                    </span>
                    <button
                      onClick={() =>
                        setQuantity(Math.min(maxQuantity, quantity + 1))
                      }
                      disabled={isOutOfStock || quantity >= maxQuantity}
                      className="p-1 hover:text-gray-900 text-gray-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
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
            </div>
            {/* Stock status... */}
          </div>
        </div>

        {/* --- REVIEW SECTION --- */}
        <div className="border-t border-gray-100 pt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Customer Reviews
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Review Form */}
            <div className="lg:col-span-5">
              <div className="bg-gray-50 rounded-2xl p-8 sticky top-24">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Write a Review
                </h3>
                <form onSubmit={submitReview} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rating
                    </label>
                    <div className="flex gap-2">
                      <StarRating
                        rating={userRating}
                        interactive={true}
                        setRating={setUserRating}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Review
                    </label>
                    <textarea
                      value={userComment}
                      onChange={(e) => setUserComment(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
                      rows={4}
                      placeholder="Share your thoughts about this product..."
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    {submittingReview ? "Submitting..." : "Post Review"}
                  </button>
                </form>
              </div>
            </div>

            {/* Review List */}
            <div className="lg:col-span-7 space-y-8">
              {product.reviews && product.reviews.length > 0 ? (
                product.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="border-b border-gray-100 pb-8 last:border-0"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">
                            {review.users.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(review.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <StarRating rating={review.rating} />
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                      {review.comment}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-white border border-dashed border-gray-200 rounded-2xl">
                  <Star className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">
                    No reviews yet. Be the first to review!
                  </p>
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
