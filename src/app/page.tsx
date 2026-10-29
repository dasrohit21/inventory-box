"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login, isLoggedIn, isValidEmail } from "@/lib/data";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (isLoggedIn()) router.replace("/dashboard");
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please fill in all fields");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address (e.g. you@company.com)");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    if (login(email, password)) {
      router.push("/dashboard");
    } else {
      setError("Login failed. Please check your credentials.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 overflow-hidden relative">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#0f172a] to-[#1e293b]" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[20%] w-[20%] h-[20%] bg-tertiary/5 rounded-full blur-[100px] pointer-events-none" />

      <main className="relative z-10 w-full max-w-[440px]" style={{ animation: "fade-in 0.6s ease-out" }}>
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-16 h-16 mb-6 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-primary/20 rounded-2xl" style={{ animation: "spin-slow 12s linear infinite" }} />
            <div className="absolute inset-0 bg-primary-container/30 rounded-2xl" style={{ animation: "spin-reverse 8s linear infinite" }} />
            <span className="material-symbols-outlined text-primary text-4xl relative z-10">architecture</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tighter text-on-surface mb-2">Inventory Management System</h1>
          <p className="text-on-surface-variant font-medium tracking-tight">Login to manage your inventory</p>
        </div>

        <div className={`bg-surface-container-low p-8 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.4)] border border-outline-variant/10 backdrop-blur-xl relative overflow-hidden ${shake ? "animate-[shake_0.5s]" : ""}`}>
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-error-container/20 border border-error/20 text-error text-sm px-4 py-3 rounded-lg">{error}</div>
            )}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Email or Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline text-lg group-focus-within:text-primary transition-colors">person</span>
                </div>
                <input
                  className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-outline/50"
                  placeholder="admin@inventorybox.io"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Password</label>
                <span className="text-xs font-semibold text-primary cursor-pointer hover:text-primary-fixed-dim transition-colors">Forgot Password?</span>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline text-lg group-focus-within:text-primary transition-colors">lock</span>
                </div>
                <input
                  className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg pl-12 pr-12 py-3.5 focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-outline/50"
                  placeholder="••••••••••••"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-outline hover:text-on-surface transition-colors">
                  <span className="material-symbols-outlined text-lg">{showPassword ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-3 px-1">
              <input className="w-5 h-5 rounded border-none bg-surface-container-highest text-primary focus:ring-primary/50 cursor-pointer" id="remember_me" type="checkbox" />
              <label className="text-sm font-medium text-on-surface-variant cursor-pointer select-none" htmlFor="remember_me">Remember Me</label>
            </div>
            <div className="pt-4">
              <button type="submit" className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary-container font-bold py-4 rounded-lg shadow-lg hover:shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group">
                <span>Login</span>
                <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            </div>
          </form>
          <div className="mt-8 pt-6 border-t border-outline-variant/10 text-center">
            <p className="text-sm text-on-surface-variant">Internal System Access Only</p>
          </div>
        </div>

        <div className="mt-12 flex justify-between items-center px-4">
          <div className="flex gap-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-outline/40">v2.4.0-Final</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-outline/40">Node: Alpha-12</span>
          </div>
          <div className="flex gap-4">
            <span className="material-symbols-outlined text-outline/30 text-sm">security</span>
            <span className="material-symbols-outlined text-outline/30 text-sm">language</span>
          </div>
        </div>
      </main>
    </div>
  );
}
