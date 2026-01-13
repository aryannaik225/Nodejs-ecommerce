"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, ArrowRight, Github, Twitter } from "lucide-react";

export default function Home() {
  const router = useRouter();

  return (
    <div className="h-screen bg-white flex flex-col items-between font-sans selection:bg-gray-900 selection:text-white">
      <nav className="w-full border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gray-900 text-white p-1.5 rounded-lg">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">Store.</span>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={() => router.push('/auth')}
              className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button 
              onClick={() => router.push('/home')}
              className="bg-gray-900 text-white px-5 py-2.5 cursor-pointer rounded-full text-sm font-medium hover:bg-black transition-all shadow-lg shadow-gray-900/10 active:scale-95"
            >
              Shop Now
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center">
        <div className="max-w-4xl mx-auto px-6 text-center">
          
          <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-1.5 mb-8 animate-in slide-in-from-bottom-4 fade-in duration-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gray-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-900"></span>
            </span>
            <span className="text-sm font-medium text-gray-600">New Collection Available</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-6 animate-in slide-in-from-bottom-8 fade-in duration-700 fill-mode-both delay-100">
            Simply Better <br className="hidden md:block" />
            <span className="text-gray-400">Essentials.</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed animate-in slide-in-from-bottom-8 fade-in duration-700 fill-mode-both delay-200">
            Discover a curated selection of premium products designed for clarity, quality, and everyday utility. No clutter, just what you need.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in slide-in-from-bottom-8 fade-in duration-700 fill-mode-both delay-300">
            <button 
              onClick={() => router.push('/home')}
              className="w-full sm:w-auto bg-gray-900 cursor-pointer text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-black transition-all flex items-center justify-center gap-2 group"
            >
              Start Shopping
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => router.push('/auth')}
              className="w-full sm:w-auto bg-white text-gray-900 cursor-pointer border border-gray-200 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              Log In
            </button>
          </div>

        </div>
      </main>

      <footer className="border-t border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-2">
            <span className="text-gray-900 font-bold tracking-tight">Store.</span>
            <span className="text-gray-400">© {new Date().getFullYear()}</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#" className="text-gray-400 hover:text-gray-900 transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-900 transition-colors">
              <Github className="w-5 h-5" />
            </a>
          </div>

        </div>
      </footer>
    </div>
  );
}