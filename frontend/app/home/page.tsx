"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, LogOut, ArrowRight, Heart, Star } from "lucide-react";
import { Product, Category } from "@/lib/utils/types";
import { authFetch } from "@/lib/utils/apiClient";
import { motion } from "framer-motion";
import Link from "next/link";
import { encodeId } from "@/lib/utils/idHandler";
import { useCart } from "@/components/CartProvider";
import Navbar from "@/components/NavBar";

interface UserData {
  name: string;
  email: string;
}

const ProductSkeleton = () => (
  <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm animate-pulse">
    <div className="bg-gray-200 h-48 w-full rounded-xl mb-4" />
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
    <div className="h-10 bg-gray-200 rounded-lg w-full" />
  </div>
);

export const UserMenu = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user data");
      }
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("admin_token");
    router.push("/auth");
  };

  if (!user) {
    return (
      <button
        onClick={() => router.push("/auth")}
        className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
      >
        Sign In
      </button>
    );
  }

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold tracking-wider hover:bg-gray-800 transition-colors shadow-sm ring-2 ring-transparent focus:ring-gray-200"
      >
        {initials}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {user.name}
            </p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

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
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && setRating && setRating(star)}
          className={`${interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"}`}
        >
          <Star
            className={`w-3.5 h-3.5 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-100 text-gray-300"}`}
          />
        </button>
      ))}
    </div>
  );
};

function HomeContent() {
  const { addToCart } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get("category")
    ? Number(searchParams.get("category"))
    : null;
  const searchQuery = searchParams.get("q") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [bestDealProducts, setBestDealProducts] = useState<Product[]>([]);
  const [hasPersonalizedDeals, setHasPersonalizedDeals] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [bestDealsLoading, setBestDealsLoading] = useState(true);
  const [likedProducts, setLikedProducts] = useState<Set<number>>(new Set());
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const categoryCards = [
    {
      id: 1,
      name: "Smartphones",
      image: "/smartphones-category-card.png",
      color: "#dedfd4",
    },
    {
      id: 2,
      name: "Laptops",
      image: "/laptops-category-card.png",
      color: "#5b7454",
    },
    {
      id: 30017,
      name: "Clothes",
      image: "/fashion-category-card.png",
      color: "#9e6151",
    },
    {
      id: 30018,
      name: "Footwear",
      image: "/footwear-category-card.png",
      color: "#c5b6a4",
    },
    {
      id: 30004,
      name: "Gaming",
      image: "/gaming-category-card.png",
      color: "#7a8a99",
    },
    {
      id: 30008,
      name: "Home & Kitchen",
      image: "/home-kitchen-category-card.png",
      color: "#d4cfc4",
    },
  ];

  const ITEMS_PER_BATCH = 40;
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_BATCH);

  useEffect(() => {
    setVisibleCount(ITEMS_PER_BATCH);
  }, [searchQuery, selectedCategory]);

  const fetchWishlistIds = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await authFetch("wishlist/ids");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLikedProducts(new Set(data.ids));
        }
      }
    } catch (error) {
      console.error("Failed to fetch wishlist ids", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await authFetch("products", {
        method: "GET",
      });
      const data = await res.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await authFetch("categories", {
        method: "GET",
      });
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Failed to fetch categories", error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchWishlistIds();
  }, []);

  const toggleWishlist = async (productId: number) => {
    setLikedProducts((prev) => {
      const newLiked = new Set(prev);
      if (newLiked.has(productId)) {
        newLiked.delete(productId);
      } else {
        newLiked.add(productId);
      }
      return newLiked;
    });

    try {
      const res = await authFetch("wishlist/toggle", {
        method: "POST",
        body: JSON.stringify({ productId }),
      });

      if (!res.ok) {
        fetchWishlistIds();
      }
    } catch (error) {
      console.error("Wishlist toggle failed", error);
      fetchWishlistIds();
    }
  };

  const filteredProducts = products.filter((product) => {
    const query = searchQuery.toLowerCase();

    const matchesSearch =
      product.title.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query);

    const matchesCategory =
      selectedCategory === null ||
      (product.categories &&
        product.categories.some((c) => c.id === selectedCategory));

    return matchesSearch && matchesCategory;
  });

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  useEffect(() => {
    if (!loadMoreRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + ITEMS_PER_BATCH);
        }
      },
      {
        rootMargin: "200px",
      },
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasMore, ITEMS_PER_BATCH]);

  useEffect(() => {
    const fetchPersonalizedDeals = async () => {
      try {
        const res = await authFetch("recommendations/user", {
          method: "GET",
        });
        const data = await res.json();

        if (data.success && data.data && data.data.length > 0) {
          setBestDealProducts(data.data);
          setHasPersonalizedDeals(true);
          setBestDealsLoading(false);
        } else {
        }
      } catch (error) {
        console.error("Failed to fetch personalized recommendations", error);
      }
    };

    fetchPersonalizedDeals();
  }, []);

  useEffect(() => {
    if (!hasPersonalizedDeals && products.length > 0) {
      setBestDealProducts(
        [...products].sort(() => 0.5 - Math.random()).slice(0, 8),
      );
      setBestDealsLoading(false);
    }
  }, [products, hasPersonalizedDeals]);

  const updateCategory = (id: number) => {
    router.push(`/home/?category=${id}`);
  };

  const HeartButton = ({
    productId,
    className,
  }: {
    productId: number;
    className: string;
  }) => (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(productId);
      }}
      className={className}
    >
      <Heart
        className={`w-4 h-4 transition-colors ${
          likedProducts.has(productId)
            ? "fill-red-500 text-red-500"
            : "text-gray-400"
        }`}
      />
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-gray-900 selection:text-white">
      <Navbar />

      <div className="relative w-full bg-[url('/home-page-banner.png')] bg-cover bg-center min-h-125 lg:aspect-3/1 flex items-center">
        <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/50 to-transparent" />

        <div className="relative z-10 container mx-auto px-12 md:px-20 flex flex-col justify-center items-start">
          <span className="text-gray-300 font-bold tracking-wider uppercase text-sm mb-2">
            New Arrivals
          </span>

          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-4 drop-shadow-lg max-w-3xl">
            Discover Your Next <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-emerald-400">
              Favorite Product
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-xl leading-relaxed drop-shadow-md">
            Browse our curated selection of top-quality items tailored to your
            needs. Quality you can trust, prices you'll love.
          </p>

          <button
            onClick={() => {
              const productsSection = document.querySelector("main");
              productsSection?.scrollIntoView({ behavior: "smooth" });
            }}
            className="group px-8 py-4 bg-white text-gray-900 hover:bg-blue-50 transition-all duration-300 rounded-full font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center gap-2"
          >
            Shop Now
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      <main className="max-w-11/12 mx-auto px-6 py-20">
        <div className="w-full flex flex-col items-start gap-10">
          <span className="text-black font-semibold text-2xl">
            Shop Our Top Categories
          </span>
          <div className="w-full flex justify-between overflow-x-auto pb-8 px-4 no-scrollbar snap-x">
            {categoryCards.map((card) => (
              <div
                key={card.id}
                onClick={() => {
                  updateCategory(card.id);
                }}
                className="relative min-w-50 aspect-2/3 rounded-2xl overflow-hidden cursor-pointer group shrink-0 shadow-md hover:shadow-xl transition-all duration-300 snap-center"
              >
                <img
                  src={card.image}
                  alt={card.name}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/50 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-90" />
                <div className="absolute bottom-0 left-0 w-full p-6 translate-y-2 transition-transform duration-300 group-hover:translate-y-0">
                  <span className="block text-white font-bold text-2xl tracking-wide drop-shadow-md">
                    {card.name}
                  </span>
                  <span className="text-gray-300 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75 block mt-1">
                    Shop Now &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full flex flex-col items-start gap-10 mt-20">
          <span className="text-black font-semibold text-2xl">
            {hasPersonalizedDeals
              ? "Based on your past purchases"
              : "Today's Best Deals For You!"}
          </span>
          <div className="w-full grid grid-flow-col auto-cols-[minmax(280px,1fr)] sm:auto-cols-[minmax(300px,1fr)] gap-8 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth custom-thin-scrollbar">
            {bestDealsLoading
              ? [...Array(4)].map((_, i) => <ProductSkeleton key={i} />)
              : bestDealProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="snap-center group bg-white rounded-2xl p-4 border border-transparent hover:border-gray-100 hover:shadow-xl transition-all duration-300 flex flex-col"
                  >
                    <Link
                      href={`/products/${encodeId(product.id)}`}
                      className="relative cursor-pointer aspect-square bg-gray-50 rounded-xl overflow-hidden mb-4 flex justify-center items-center"
                    >
                      <HeartButton
                        productId={product.id}
                        className="absolute top-4 right-4 bg-white text-gray-900 p-2 rounded-full shadow-lg hover:shadow-xl transition-all cursor-pointer z-10"
                      />
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.title}
                          className="max-h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 mix-blend-multiply"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          No Image
                        </div>
                      )}

                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addToCart(product);
                        }}
                        className="absolute bottom-4 right-4 bg-white text-gray-900 p-2 rounded-full shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-gray-900 hover:text-white cursor-pointer"
                      >
                        <PlusIcon className="w-5 h-5" />
                      </button>
                    </Link>

                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <Link
                          href={`/products/${encodeId(product.id)}`}
                          className="hover:underline decoration-blue-500"
                        >
                          <h3 className="text-base font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                            {product.title}
                          </h3>
                        </Link>
                        <span className="font-bold text-gray-900 text-sm">
                          ${product.price}
                        </span>
                      </div>

                      <div className="flex gap-1 mb-2 overflow-hidden flex-wrap">
                        {product.categories?.slice(0, 2).map((c) => (
                          <span
                            key={c.id}
                            className="text-[10px] uppercase font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100"
                          >
                            {c.name}
                          </span>
                        ))}
                      </div>

                      <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                        {product.description}
                      </p>

                      <button
                        onClick={() => addToCart(product)}
                        className="w-full bg-gray-50 text-gray-900 hover:bg-gray-900 hover:text-white py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </motion.div>
                ))}
          </div>
        </div>

        <div className="flex items-center justify-between mb-8 mt-20">
          <h2 className="text-2xl font-bold text-gray-900">
            {selectedCategory
              ? categories.find((c) => c.id === selectedCategory)?.name
              : "New Arrivals"}
          </h2>
          <span className="text-sm text-gray-500 font-medium">
            {loading
              ? "..."
              : `Showing ${Math.min(visibleCount, filteredProducts.length)} of ${filteredProducts.length} items`}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {loading ? (
            [...Array(8)].map((_, i) => <ProductSkeleton key={i} />)
          ) : filteredProducts.length > 0 ? (
            visibleProducts.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="group bg-white rounded-2xl p-4 border border-transparent hover:border-gray-100 hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                <Link
                  href={`/products/${encodeId(product.id)}`}
                  className="relative cursor-pointer aspect-square bg-gray-50 rounded-xl overflow-hidden mb-4 flex justify-center items-center"
                >
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.title}
                      className="max-h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 mix-blend-multiply"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      No Image
                    </div>
                  )}
                  <HeartButton 
                    productId={product.id} 
                    className="absolute top-4 right-4 bg-white text-gray-900 p-2 rounded-full shadow-lg hover:shadow-xl transition-all cursor-pointer z-10"
                  />

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      addToCart(product);
                    }}
                    className="absolute bottom-4 right-4 bg-white text-gray-900 p-2 rounded-full shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-gray-900 hover:text-white cursor-pointer"
                  >
                    <PlusIcon className="w-5 h-5" />
                  </button>
                </Link>

                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <Link
                      href={`/products/${encodeId(product.id)}`}
                      className="hover:underline decoration-blue-500"
                    >
                      <h3 className="text-base font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {product.title}
                      </h3>
                    </Link>
                    <span className="font-bold text-gray-900 text-sm">
                      ${product.price}
                    </span>
                  </div>

                  <div className="flex gap-1 mb-2 overflow-hidden flex-wrap">
                    {product.categories?.slice(0, 2).map((c) => (
                      <span
                        key={c.id}
                        className="text-[10px] uppercase font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100"
                      >
                        {c.name}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center mb-2">
                    <StarRating rating={product.averageRating || 0} />
                    <span className="text-xs text-gray-500 ml-2">
                      ({product.reviewCount || 0})
                    </span>
                  </div>

                  <button
                    onClick={() => addToCart(product)}
                    className="w-full bg-gray-50 text-gray-900 hover:bg-gray-900 hover:text-white py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer"
                  >
                    Add to Cart
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <div className="inline-flex bg-gray-100 p-4 rounded-full mb-4">
                <Search className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                No products found
              </h3>
              <p className="text-gray-500">
                We couldn't find any items matching "{searchQuery}"{" "}
                {selectedCategory && "in this category"}.
              </p>
              {selectedCategory && (
                <button
                  onClick={() => router.push("/home")}
                  className="mt-4 text-sm text-blue-600 hover:underline font-medium"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
        {hasMore && !loading && (
          <div className="flex justify-center mt-14">
            <button
              className="px-8 py-3 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-all duration-200 shadow-md"
              onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_BATCH)}
            >
              Show More
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}

const PlusIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);
