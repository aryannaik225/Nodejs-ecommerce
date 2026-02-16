"use client";

import Navbar from "@/components/NavBar";
import { ChevronRight, Heart, PackageOpen, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import OrderSection from "@/components/OrderSection";
import WishList from "@/components/WishList";
import ProfileSection from "@/components/ProfileSection";

interface UserData {
  name: string;
  email: string;
}

const UserProfile = () => {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse user data");
      }
    }
  }, []);

  if (!user) {
    return (
      <button
        onClick={() => router.push("/auth")}
        className="px-6 py-2 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-all"
      >
        Login
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
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
      <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center text-sm font-bold tracking-wider shadow-lg shadow-gray-200">
        {initials}
      </div>

      <div className="flex flex-col items-start justify-center">
        <span className="text-sm font-bold text-gray-900">{user.name}</span>
        <span className="text-xs text-gray-500">{user.email}</span>
      </div>
    </div>
  );
};

export default function Home() {
  const [selectedSection, setSelectedSection] = useState<
    "profile" | "orders" | "wishlist"
  >("wishlist");

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-gray-200">
      <Navbar />

      <div className="mt-6 w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 mx-auto py-8 gap-8 px-4 sm:px-6">
        
        <div className="hidden lg:flex lg:col-span-3 flex-col gap-6 sticky top-24 self-start h-fit">
          <UserProfile />

          <nav className="flex flex-col gap-2 w-full">
            {/* <SidebarButton 
              active={selectedSection === "profile"} 
              onClick={() => setSelectedSection("profile")}
              icon={<UserRound className="w-4 h-4" />}
              label="Profile Settings"
            /> */}
            <SidebarButton 
              active={selectedSection === "wishlist"} 
              onClick={() => setSelectedSection("wishlist")}
              icon={<Heart className="w-4 h-4" />}
              label="Wishlist"
            />
            <SidebarButton 
              active={selectedSection === "orders"} 
              onClick={() => setSelectedSection("orders")}
              icon={<PackageOpen className="w-4 h-4" />}
              label="My Orders"
            />
          </nav>
        </div>

        <div className="col-span-1 lg:col-span-9 min-h-125">
          {selectedSection === "profile" && <ProfileSection />}
          {selectedSection === "orders" && <OrderSection />}
          {selectedSection === "wishlist" && <WishList />}
        </div>
      </div>
    </div>
  );
}

const SidebarButton = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`w-full group flex items-center justify-between p-4 rounded-xl text-sm font-medium transition-all duration-200 border ${
      active 
        ? "bg-black text-white border-black shadow-lg shadow-gray-200" 
        : "bg-white text-gray-600 border-transparent hover:bg-gray-50 hover:border-gray-200"
    }`}
  >
    <div className="flex items-center gap-3">
      <span className={active ? "text-gray-300" : "text-gray-400 group-hover:text-gray-900"}>{icon}</span>
      {label}
    </div>
    <ChevronRight className={`w-4 h-4 transition-transform ${active ? "text-white" : "text-gray-300 group-hover:text-gray-600 group-hover:translate-x-1"}`} />
  </button>
);