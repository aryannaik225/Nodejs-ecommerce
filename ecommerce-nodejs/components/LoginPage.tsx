"use client";

import React, { useEffect, useState } from "react";
import { Eye, EyeOff, Lock, Mail, User, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

const LoginPage: React.FC = () => {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/home");
    }
  }, [router]);

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const endpoint = isLogin ? "login" : "signup";
      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/${endpoint}`;

      const payload = isLogin
        ? { email, password }
        : { name: fullName, email, password };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      if (isLogin) {
        localStorage.setItem("token", data.token);
        
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }

        router.push("/home"); 
      } else {
        setIsLogin(true);
        alert("Account created! Please log in.");
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        <div className="px-8 pt-8 pb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {isLogin ? "Welcome back" : "Create an account"}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {isLogin
              ? "Please enter your details to sign in"
              : "Enter your details to get started"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {!isLogin && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-300">
              <label
                htmlFor="fullName"
                className="text-sm font-medium text-gray-700 block"
              >
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="fullName"
                  type="text"
                  required={!isLogin}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all text-sm text-gray-900 placeholder-gray-400"
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-gray-700 block"
            >
              Email address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all text-sm text-gray-900 placeholder-gray-400"
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-700"
              >
                Password
              </label>
              {isLogin && (
                <a
                  href="#"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Forgot password?
                </a>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all text-sm text-gray-900 placeholder-gray-400"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2.5 rounded-lg transition-all duration-200 shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center mt-2"
          >
            {isLoading ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : isLogin ? (
              "Sign in"
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 flex justify-center">
          <p className="text-xs text-gray-500">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={toggleMode}
              className="font-semibold text-gray-900 hover:underline focus:outline-none"
            >
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;