"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-gray-900 selection:text-white">
      
      <div className="absolute inset-0 z-0 opacity-[0.03]" 
           style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }} 
      />

      <div className="relative z-10 text-center max-w-lg mx-auto">
        
        <h1 
          className="text-[160px] md:text-[200px] font-black tracking-tighter leading-none select-none"
          style={{
            backgroundImage: 'linear-gradient(to bottom, rgba(17, 24, 39, 0.9) 0%, rgba(17, 24, 39, 0) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: 'transparent'
          }}
        >
          404
        </h1>

        <div className="space-y-6 -mt-8 md:-mt-12 relative animate-in slide-in-from-bottom-4 fade-in duration-700 delay-150">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">
              Page not found
            </h2>
            <p className="text-gray-500 text-sm md:text-base">
              The page you are looking for doesn't exist or has been moved.
            </p>
          </div>
          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              onClick={() => router.back()}
              className="px-6 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-white hover:border-gray-300 hover:text-gray-900 transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
            
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-black transition-all shadow-lg shadow-gray-900/10 flex items-center gap-2 active:scale-95"
            >
              <Home className="w-4 h-4" />
              Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}