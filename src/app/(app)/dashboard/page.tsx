"use client";

import { useEffect, useMemo, useState } from "react";
import TopBar from "@/components/TopBar";
import { getDashboardStats, getOrders, getProducts, formatCurrency, type Order, type Product } from "@/lib/data";
import Link from "next/link";

type ChartPeriod = "today" | "week" | "month" | "30d" | "90d";

interface Bucket { label: string; subLabel: string; value: number; orderCount: number; }

function localYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildBuckets(orders: Order[], period: ChartPeriod): Bucket[] {
  const now = new Date();
  if (period === "today") {
    const buckets: Bucket[] = Array.from({ length: 12 }, (_, i) => ({ label: `${i * 2}h`, subLabel: `${String(i * 2).padStart(2, "0")}:00 - ${String(i * 2 + 2).padStart(2, "0")}:00`, value: 0, orderCount: 0 }));
    const todayStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    orders.filter((o) => o.date === todayStr && o.status !== "Cancelled").forEach((o) => {
      const idx = Math.min(11, Math.floor(new Date().getHours() / 2));
      buckets[idx].value += o.amount;
      buckets[idx].orderCount += 1;
    });
    return buckets;
  }
  const days = period === "week" ? 7 : period === "month" ? 30 : period === "30d" ? 30 : 90;
  const buckets: (Bucket & { _ymd: string })[] = Array.from({ length: days }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (days - 1 - i));
    const subLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const label = days <= 7 ? d.toLocaleDateString("en-US", { weekday: "short" }) : `${d.getDate()}`;
    return { label, subLabel, value: 0, orderCount: 0, _ymd: localYmd(d) };
  });
  orders.filter((o) => o.status !== "Cancelled").forEach((o) => {
    const d = new Date(o.date);
    if (isNaN(d.getTime())) return;
    const ymd = localYmd(d);
    const b = buckets.find((x) => x._ymd === ymd);
    if (b) { b.value += o.amount; b.orderCount += 1; }
  });
  return buckets;
}

export default function DashboardPage() {
  const [stats, setStats] = useState({ totalProducts: 0, lowStock: 0, outOfStock: 0, ordersToday: 0, totalRevenue: 0, completedOrders: 0, pendingOrders: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>("week");
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  useEffect(() => {
    setStats(getDashboardStats());
    setRecentOrders(getOrders().slice(0, 4));
    setLowStockProducts(getProducts().filter((p) => p.status === "Low Stock" || p.status === "Out of Stock").slice(0, 4));
    setAllOrders(getOrders());
  }, []);

  const buckets = useMemo(() => buildBuckets(allOrders, chartPeriod), [allOrders, chartPeriod]);
  const maxBucketValue = Math.max(...buckets.map((b) => b.value), 1);
  const totalPeriodRevenue = buckets.reduce((s, b) => s + b.value, 0);
  const totalPeriodOrders = buckets.reduce((s, b) => s + b.orderCount, 0);

  const statCards = [
    { label: "Total Products", value: stats.totalProducts.toLocaleString(), icon: "category", badge: "+12%", badgeColor: "text-indigo-400/80 bg-indigo-400/10", iconBg: "bg-indigo-500/10 text-indigo-400", bgIcon: "inventory", href: "/products" },
    { label: "Low Stock Items", value: stats.lowStock.toString(), icon: "warning", badge: stats.lowStock > 0 ? "Urgent" : null, badgeColor: "text-error bg-error/10", iconBg: "bg-error/10 text-error", bgIcon: "production_quantity_limits", href: "/products?status=Low+Stock" },
    { label: "Orders Today", value: stats.ordersToday.toString(), icon: "receipt_long", badge: stats.ordersToday > 0 ? "Active" : null, badgeColor: "text-tertiary bg-tertiary/10", iconBg: "bg-tertiary-container/10 text-tertiary", bgIcon: "assignment", href: "/orders?filter=today" },
    { label: "Total Revenue", value: formatCurrency(stats.totalRevenue), icon: "monetization_on", badge: stats.totalRevenue > 0 ? "+8.4k" : null, badgeColor: "text-primary bg-primary/10", iconBg: "bg-primary/10 text-primary", bgIcon: "payments", href: "/reports" },
  ];

  const periodOptions: { id: ChartPeriod; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "week", label: "Last 7 Days" },
    { id: "month", label: "This Month" },
    { id: "30d", label: "Last 30 Days" },
    { id: "90d", label: "Last 90 Days" },
  ];

  const statusBadge = (status: string) => {
    if (status === "Completed") return "bg-green-500/10 text-green-400";
    if (status === "Pending") return "bg-indigo-500/10 text-indigo-400";
    if (status === "Shipped") return "bg-tertiary/10 text-tertiary";
    return "bg-error/10 text-error";
  };

  const statusDot = (status: string) => {
    if (status === "Completed") return "bg-green-400";
    if (status === "Pending") return "bg-indigo-400";
    if (status === "Shipped") return "bg-tertiary";
    return "bg-error";
  };

  return (
    <>
      <TopBar subtitle="Dashboard" />
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-on-surface">Inventory Overview</h2>
            <p className="text-on-surface-variant text-sm mt-1">Industrial instrumentation inventory status and analytics.</p>
          </div>
          <div className="flex gap-2">
            <button className="bg-surface-container-highest hover:bg-surface-bright text-primary text-sm px-4 py-2 rounded-lg font-medium transition-colors border border-outline-variant/15 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">file_download</span> Export CSV
            </button>
            <Link href="/products" className="bg-gradient-to-br from-primary to-primary-container text-on-primary-container text-sm px-4 py-2 rounded-lg font-bold transition-all shadow-lg shadow-primary/10 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">add</span> New Product
            </Link>
          </div>
        </section>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card) => (
            <Link key={card.label} href={card.href} className="bg-surface-container-highest p-5 rounded-xl border-t border-white/5 shadow-xl relative overflow-hidden group cursor-pointer hover:border-primary/20 hover:scale-[1.02] transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg ${card.iconBg}`}>
                  <span className="material-symbols-outlined">{card.icon}</span>
                </div>
                {card.badge && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${card.badgeColor}`}>{card.badge}</span>
                )}
              </div>
              <p className="uppercase tracking-widest text-on-surface-variant/60 font-semibold mb-1 text-[10px]">{card.label}</p>
              <p className="text-3xl font-black text-on-surface tracking-tighter">{card.value}</p>
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-8xl" style={{ fontVariationSettings: "'wght' 700" }}>{card.bgIcon}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Trends */}
          <div className="lg:col-span-2 bg-surface-container-high rounded-xl p-6 shadow-2xl">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6 gap-3">
              <div>
                <h3 className="font-bold text-on-surface">Sales Trends</h3>
                <p className="text-xs text-on-surface-variant">{periodOptions.find((p) => p.id === chartPeriod)?.label} · {totalPeriodOrders} orders · <span className="font-bold text-on-surface">{formatCurrency(totalPeriodRevenue)}</span></p>
              </div>
              <div className="flex flex-wrap gap-1 bg-surface-container-low rounded-lg p-1">
                {periodOptions.map((opt) => (
                  <button key={opt.id} onClick={() => setChartPeriod(opt.id)} className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${chartPeriod === opt.id ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-on-surface"}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-64 relative">
              <div className="h-full flex items-end gap-1 px-2">
                {buckets.map((b, i) => {
                  const heightPct = maxBucketValue > 0 ? (b.value / maxBucketValue) * 100 : 0;
                  const isHovered = hoveredBar === i;
                  return (
                    <div
                      key={i}
                      onMouseEnter={() => setHoveredBar(i)}
                      onMouseLeave={() => setHoveredBar((h) => h === i ? null : h)}
                      className="flex-1 group relative h-full flex items-end cursor-default"
                    >
                      <div
                        className={`w-full rounded-t-lg relative transition-all ${isHovered ? "bg-gradient-to-t from-primary/20 to-primary" : "bg-gradient-to-t from-primary/5 to-primary/40"}`}
                        style={{ height: `${Math.max(heightPct, b.value > 0 ? 4 : 0)}%`, transformOrigin: "bottom", animation: `grow-up 0.5s ease-out ${i * 0.03}s both` }}
                      >
                        {b.value > 0 && (
                          <div className={`absolute -top-1 w-2 h-2 rounded-full left-1/2 -translate-x-1/2 transition-all ${isHovered ? "bg-on-primary-container shadow-[0_0_14px_#c0c1ff]" : "bg-primary shadow-[0_0_10px_#c0c1ff]"}`} />
                        )}
                      </div>
                      {isHovered && (
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full bg-surface-container-low rounded-lg shadow-2xl border border-outline-variant/15 px-3 py-2 z-10 whitespace-nowrap pointer-events-none" style={{ animation: "fade-in 0.1s ease-out" }}>
                          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">{b.subLabel}</p>
                          <p className="text-sm font-black text-primary">{formatCurrency(b.value)}</p>
                          <p className="text-[10px] text-on-surface-variant">{b.orderCount} order{b.orderCount === 1 ? "" : "s"}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-between mt-4 px-2 text-[10px] uppercase tracking-tighter text-on-surface-variant/40 font-black overflow-hidden">
              {buckets.length <= 14 ? buckets.map((b, i) => (<span key={i}>{b.label}</span>)) : buckets.filter((_, i) => i % Math.ceil(buckets.length / 7) === 0).map((b, i) => (<span key={i}>{b.label}</span>))}
            </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-surface-container-high rounded-xl p-6 shadow-2xl">
            <h3 className="font-bold text-on-surface mb-1">Category</h3>
            <p className="text-xs text-on-surface-variant mb-8">Stock distribution</p>
            <div className="relative w-48 h-48 mx-auto mb-8">
              <div className="absolute inset-0 rounded-full" style={{ background: "conic-gradient(#c0c1ff 0% 65%, #ffb783 65% 90%, rgba(128,131,255,0.2) 90% 100%)" }} />
              <div className="absolute inset-[18px] rounded-full bg-surface-container-high" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-on-surface">3.8k</span>
                <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">Units</span>
              </div>
            </div>
            <div className="space-y-3">
              {[{ label: "Transmitters & Sensors", color: "bg-primary", pct: "45%" }, { label: "Gauges & Switches", color: "bg-tertiary", pct: "30%" }, { label: "Cables & Meters", color: "bg-primary-container/20", pct: "25%" }].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-xs font-medium text-on-surface">{item.label}</span>
                  </div>
                  <span className="text-xs font-bold text-on-surface">{item.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-surface-container rounded-xl overflow-hidden shadow-2xl">
            <div className="p-6 flex justify-between items-center border-b border-outline-variant/5">
              <h3 className="font-bold text-on-surface">Recent Activity</h3>
              <Link href="/orders" className="text-primary text-xs font-bold uppercase tracking-widest hover:underline">View All</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-container-high/50 text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">
                  <tr>
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-surface-container-high transition-colors cursor-pointer">
                      <td className="px-6 py-4 text-sm font-medium text-primary">{order.id}</td>
                      <td className="px-6 py-4 text-sm text-on-surface">{order.customer}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadge(order.status)}`}>
                          <div className={`w-1 h-1 rounded-full ${statusDot(order.status)}`} /> {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-on-surface-variant">{order.date}</td>
                      <td className="px-6 py-4 text-sm font-bold text-on-surface">{formatCurrency(order.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Critical Alerts */}
          <div className="bg-surface-container rounded-xl p-6 shadow-2xl flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-error">priority_high</span>
              <h3 className="font-bold text-on-surface">Critical Alerts</h3>
            </div>
            <div className="space-y-4 flex-1">
              {lowStockProducts.map((product) => (
                <div key={product.id} className={`p-4 bg-surface-container-low rounded-r-xl group hover:bg-surface-container-high transition-all ${product.stock <= 10 ? "border-l-4 border-error" : "border-l-4 border-tertiary"}`}>
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-sm font-bold text-on-surface">{product.name}</h4>
                    <span className={`text-[10px] font-black ${product.stock <= 10 ? "text-error" : "text-tertiary"}`}>{product.stock} UNITS LEFT</span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{product.category} - SKU: {product.sku}</p>
                  <div className="mt-3 flex gap-3 items-center">
                    <Link href={`/purchase-orders?restock=${product.id}`} className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-primary/15 text-primary text-[10px] font-bold uppercase tracking-widest hover:bg-primary/25 transition-colors">
                      <span className="material-symbols-outlined text-sm">add_shopping_cart</span> Restock
                    </Link>
                    <Link href="/products" className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors">Manage</Link>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/purchase-orders" className="mt-6 w-full py-3 bg-surface-container-highest border border-outline-variant/10 rounded-xl text-sm font-bold text-on-surface hover:bg-surface-bright transition-all active:scale-[0.98] text-center block">
              View All Purchase Orders
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="p-8 mt-12 border-t border-outline-variant/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary rounded-sm rotate-45" />
              <span className="text-sm font-black text-on-surface tracking-tighter">INVENTORY BOX <span className="text-primary font-medium opacity-50 ml-1">SYSTEMS</span></span>
            </div>
            <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              <span className="hover:text-primary transition-colors cursor-pointer">Security Protocol</span>
              <span className="hover:text-primary transition-colors cursor-pointer">Operational Status</span>
              <span className="hover:text-primary transition-colors cursor-pointer">v2.0.44-Release</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
