"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout, getStorageBreakdown, formatBytes, type StorageBreakdown } from "@/lib/data";
import { useRouter } from "next/navigation";

const NAV_ITEMS = [
  { label: "Dashboard", icon: "dashboard", href: "/dashboard" },
  { label: "Products", icon: "inventory_2", href: "/products" },
  { label: "Orders", icon: "shopping_cart", href: "/orders" },
  { label: "Customers", icon: "groups", href: "/customers" },
  { label: "Suppliers", icon: "local_shipping", href: "/suppliers" },
  { label: "Purchase Orders", icon: "add_shopping_cart", href: "/purchase-orders" },
  { label: "Reports", icon: "analytics", href: "/reports" },
  { label: "Settings", icon: "settings", href: "/settings" },
];

const PRIMARY_MOBILE_INDICES = [0, 1, 2, 3]; // Dashboard, Products, Orders, Customers

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [storageOpen, setStorageOpen] = useState(false);
  const [breakdown, setBreakdown] = useState<StorageBreakdown | null>(null);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  useEffect(() => {
    setBreakdown(getStorageBreakdown());
  }, [storageOpen]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="h-screen w-64 fixed left-0 top-0 bg-slate-900 border-r border-slate-800/15 flex-col py-6 z-50 hidden md:flex">
        <Link href="/dashboard" className="px-6 mb-10 block group">
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
                inventory_2
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 leading-none group-hover:text-primary transition-colors">Inventory</h2>
              <p className="text-[10px] text-on-surface-variant/60 uppercase tracking-widest mt-1">Management v2.0</p>
            </div>
          </div>
        </Link>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={
                  isActive
                    ? "text-indigo-300 bg-indigo-500/10 border-l-2 border-indigo-400 px-4 py-3 flex items-center gap-3 text-sm font-medium transition-all duration-300"
                    : "text-slate-400 px-4 py-3 flex items-center gap-3 hover:bg-slate-800 hover:text-slate-200 transition-all cursor-pointer text-sm font-medium"
                }
              >
                <span
                  className="material-symbols-outlined text-xl"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 mt-auto space-y-4">
          <button onClick={() => setStorageOpen(true)} className="w-full bg-surface-container-high rounded-xl p-4 border border-outline-variant/10 hover:border-primary/30 hover:bg-surface-container-highest transition-all text-left group">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-on-surface-variant">Storage Status</p>
              <span className="material-symbols-outlined text-on-surface-variant/40 group-hover:text-primary text-base transition-colors">open_in_new</span>
            </div>
            <div className="w-full bg-surface-container-highest rounded-full h-1.5 mb-2">
              <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${breakdown?.pctUsed ?? 0}%` }} />
            </div>
            <p className="text-[10px] text-on-surface-variant/80">{breakdown ? `${breakdown.pctUsed}% Capacity · ${formatBytes(breakdown.totalBytes)}` : "Click to view breakdown"}</p>
          </button>
          <div className="bg-surface-container-high rounded-xl p-4 flex items-center gap-3">
            <Link href="/settings" className="flex items-center gap-3 flex-1 overflow-hidden group">
              <div className="w-8 h-8 rounded-full bg-primary-container/30 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                JT
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-100 truncate group-hover:text-primary transition-colors">Julian Thorne</p>
                <p className="text-[10px] text-on-surface-variant truncate">Admin</p>
              </div>
            </Link>
            <button onClick={handleLogout} className="text-on-surface-variant hover:text-error transition-colors" title="Logout">
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-900 border-t border-slate-800/15 flex items-center justify-around z-50">
        {PRIMARY_MOBILE_INDICES.map((idx) => {
          const item = NAV_ITEMS[idx];
          const isActive = pathname === item.href;
          return (
            <Link key={item.label} href={item.href} className={`flex flex-col items-center ${isActive ? "text-indigo-400" : "text-slate-400"}`}>
              <span className="material-symbols-outlined" style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                {item.icon}
              </span>
              <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
            </Link>
          );
        })}
        <button onClick={() => setMobileMoreOpen(true)} className={`flex flex-col items-center ${mobileMoreOpen ? "text-indigo-400" : "text-slate-400"}`}>
          <span className="material-symbols-outlined">apps</span>
          <span className="text-[10px] font-medium mt-0.5">More</span>
        </button>
      </nav>

      {/* Mobile More Sheet */}
      {mobileMoreOpen && (
        <div className="md:hidden fixed inset-0 z-[60] flex items-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMoreOpen(false)} />
          <div className="relative bg-slate-900 w-full rounded-t-2xl border-t border-slate-800/30 shadow-2xl pb-20" style={{ animation: "fade-in 0.2s ease-out" }}>
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full bg-slate-700" />
            <div className="px-5 pt-6 pb-4 flex items-center justify-between border-b border-slate-800/30">
              <h3 className="text-sm font-bold text-on-surface">All Sections</h3>
              <button onClick={() => setMobileMoreOpen(false)} className="text-slate-400 hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 p-4">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.label} href={item.href} onClick={() => setMobileMoreOpen(false)} className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${isActive ? "bg-indigo-500/10 border-indigo-400/30 text-indigo-300" : "bg-surface-container border-outline-variant/10 text-slate-300 hover:border-primary/30 hover:bg-surface-container-high"}`}>
                    <span className="material-symbols-outlined text-2xl" style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>{item.icon}</span>
                    <span className="text-[11px] font-bold text-center leading-tight">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Storage Breakdown Modal */}
      {storageOpen && breakdown && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setStorageOpen(false)} />
          <div className="relative bg-surface-container-low rounded-2xl shadow-2xl border border-outline-variant/10 w-full max-w-2xl max-h-[88vh] overflow-y-auto" style={{ animation: "fade-in 0.2s ease-out" }}>
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <div className="p-6 md:p-8 border-b border-outline-variant/10 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black tracking-tight text-on-surface">Storage Breakdown</h3>
                <p className="text-sm text-on-surface-variant mt-1">Local storage usage by data type and category.</p>
              </div>
              <button onClick={() => setStorageOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {/* Summary */}
              <div className="bg-surface-container rounded-xl p-5">
                <div className="flex justify-between items-baseline mb-2">
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Total Used</p>
                  <p className="text-[10px] text-on-surface-variant">{formatBytes(breakdown.totalBytes)} of {formatBytes(breakdown.capacityBytes)}</p>
                </div>
                <div className="w-full bg-surface-container-highest rounded-full h-3 mb-2">
                  <div className={`h-3 rounded-full ${breakdown.pctUsed > 85 ? "bg-error" : breakdown.pctUsed > 60 ? "bg-tertiary" : "bg-primary"}`} style={{ width: `${breakdown.pctUsed}%` }} />
                </div>
                <p className="text-xs text-on-surface font-bold">{breakdown.pctUsed}% capacity reached</p>
              </div>

              {/* Per-key */}
              <div>
                <h4 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">database</span> By Data Type
                </h4>
                <div className="bg-surface-container rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-container-high/40 text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                      <tr>
                        <th className="px-4 py-3 text-left">Type</th>
                        <th className="px-4 py-3 text-right">Records</th>
                        <th className="px-4 py-3 text-right">Size</th>
                        <th className="px-4 py-3 text-right w-32">Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/5">
                      {breakdown.byKey.map((b) => {
                        const share = breakdown.totalBytes > 0 ? (b.bytes / breakdown.totalBytes) * 100 : 0;
                        return (
                          <tr key={b.key}>
                            <td className="px-4 py-3 font-medium text-on-surface">{b.label}</td>
                            <td className="px-4 py-3 text-right text-on-surface-variant">{b.count}</td>
                            <td className="px-4 py-3 text-right text-on-surface font-bold">{formatBytes(b.bytes)}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center gap-2 justify-end">
                                <div className="w-16 bg-surface-container-highest rounded-full h-1.5">
                                  <div className="bg-primary h-1.5 rounded-full" style={{ width: `${share}%` }} />
                                </div>
                                <span className="text-[11px] text-on-surface-variant w-10 text-right">{share.toFixed(0)}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Products by category */}
              {breakdown.productsByCategory.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">category</span> Products by Category
                  </h4>
                  <div className="space-y-2">
                    {breakdown.productsByCategory.map((c) => {
                      const max = breakdown.productsByCategory[0]?.bytes || 1;
                      return (
                        <div key={c.category} className="bg-surface-container rounded-lg p-3">
                          <div className="flex justify-between items-center mb-1.5">
                            <div>
                              <span className="text-sm font-medium text-on-surface">{c.category}</span>
                              <span className="text-[10px] text-on-surface-variant ml-2">{c.count} products</span>
                            </div>
                            <span className="text-xs font-bold text-on-surface">{formatBytes(c.bytes)}</span>
                          </div>
                          <div className="w-full bg-surface-container-highest rounded-full h-1.5">
                            <div className="bg-gradient-to-r from-primary to-primary-container h-1.5 rounded-full" style={{ width: `${(c.bytes / max) * 100}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 md:px-8 py-4 bg-surface-container/50 border-t border-outline-variant/10 flex justify-end">
              <button onClick={() => setStorageOpen(false)} className="px-5 py-2 rounded-lg bg-primary text-on-primary font-bold text-sm hover:brightness-110 active:scale-95 transition-all">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
