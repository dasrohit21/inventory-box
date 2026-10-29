"use client";

import { useEffect, useState, useMemo } from "react";
import TopBar from "@/components/TopBar";
import { getProducts, getOrders, getSuppliers, formatCurrency, CATEGORIES, type Product, type Order } from "@/lib/data";

type PresetKey = "7d" | "30d" | "thisMonth" | "lastMonth" | "thisQuarter" | "thisYear" | "all" | "custom";

function isoDate(d: Date) {
  return d.toISOString().split("T")[0];
}

function rangeFor(preset: PresetKey, today: Date): { start: string; end: string } {
  const t = new Date(today);
  const end = isoDate(t);
  if (preset === "7d") {
    const s = new Date(t); s.setDate(s.getDate() - 6); return { start: isoDate(s), end };
  }
  if (preset === "30d") {
    const s = new Date(t); s.setDate(s.getDate() - 29); return { start: isoDate(s), end };
  }
  if (preset === "thisMonth") {
    const s = new Date(t.getFullYear(), t.getMonth(), 1); return { start: isoDate(s), end };
  }
  if (preset === "lastMonth") {
    const s = new Date(t.getFullYear(), t.getMonth() - 1, 1);
    const e = new Date(t.getFullYear(), t.getMonth(), 0);
    return { start: isoDate(s), end: isoDate(e) };
  }
  if (preset === "thisQuarter") {
    const q = Math.floor(t.getMonth() / 3);
    const s = new Date(t.getFullYear(), q * 3, 1);
    return { start: isoDate(s), end };
  }
  if (preset === "thisYear") {
    const s = new Date(t.getFullYear(), 0, 1);
    return { start: isoDate(s), end };
  }
  // "all" — span 2 years back rather than the Unix epoch
  const s = new Date(t); s.setFullYear(s.getFullYear() - 2); return { start: isoDate(s), end };
}

function parseOrderDate(d: string): Date {
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

function csvEscape(v: string | number) {
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export default function ReportsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [supplierCount, setSupplierCount] = useState(0);

  const [preset, setPreset] = useState<PresetKey>("30d");
  const [today] = useState<Date>(() => new Date());
  const [startDate, setStartDate] = useState(() => rangeFor("30d", new Date()).start);
  const [endDate, setEndDate] = useState(() => rangeFor("30d", new Date()).end);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [comparePrevious, setComparePrevious] = useState(false);

  useEffect(() => {
    setProducts(getProducts());
    setOrders(getOrders());
    setSupplierCount(getSuppliers().length);
  }, []);

  const handlePreset = (p: PresetKey) => {
    setPreset(p);
    if (p !== "custom") {
      const r = rangeFor(p, today);
      setStartDate(r.start);
      setEndDate(r.end);
    }
  };

  const startDt = useMemo(() => new Date(startDate + "T00:00:00"), [startDate]);
  const endDt = useMemo(() => { const d = new Date(endDate + "T23:59:59"); return d; }, [endDate]);
  const rangeMs = endDt.getTime() - startDt.getTime();
  const prevStartDt = new Date(startDt.getTime() - rangeMs);
  const prevEndDt = new Date(startDt.getTime() - 1);

  const filteredOrders = useMemo(() => orders.filter((o) => {
    const d = parseOrderDate(o.date);
    return d >= startDt && d <= endDt;
  }), [orders, startDt, endDt]);

  const previousOrders = useMemo(() => orders.filter((o) => {
    const d = parseOrderDate(o.date);
    return d >= prevStartDt && d <= prevEndDt;
  }), [orders, prevStartDt, prevEndDt]);

  const filteredProducts = useMemo(() => {
    return categoryFilter === "All" ? products : products.filter((p) => p.category === categoryFilter);
  }, [products, categoryFilter]);

  const orderCount = filteredOrders.length;
  const revenue = filteredOrders.reduce((s, o) => s + (o.status === "Cancelled" ? 0 : o.amount), 0);
  const prevRevenue = previousOrders.reduce((s, o) => s + (o.status === "Cancelled" ? 0 : o.amount), 0);
  const completedOrders = filteredOrders.filter((o) => o.status === "Completed").length;
  const pendingOrders = filteredOrders.filter((o) => o.status === "Pending").length;
  const cancelledOrders = filteredOrders.filter((o) => o.status === "Cancelled").length;
  const orderFulfillmentRate = orderCount > 0 ? Math.round((completedOrders / orderCount) * 100) : 0;
  const revenueDeltaPct = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;

  const categoryData = useMemo(() => {
    const cats = categoryFilter === "All" ? CATEGORIES : [categoryFilter];
    return cats.map((cat) => {
      const items = products.filter((p) => p.category === cat);
      return {
        name: cat,
        count: items.length,
        totalStock: items.reduce((s, p) => s + p.stock, 0),
        totalValue: items.reduce((s, p) => s + p.price * p.stock, 0),
      };
    }).sort((a, b) => b.totalValue - a.totalValue);
  }, [products, categoryFilter]);

  const stockSummary = useMemo(() => ({
    inStock: filteredProducts.filter((p) => p.status === "In Stock").length,
    lowStock: filteredProducts.filter((p) => p.status === "Low Stock").length,
    outOfStock: filteredProducts.filter((p) => p.status === "Out of Stock").length,
  }), [filteredProducts]);

  const topProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => (b.price * b.stock) - (a.price * a.stock)).slice(0, 5);
  }, [filteredProducts]);

  const maxCatValue = Math.max(...categoryData.map((c) => c.totalValue), 1);
  const totalInventoryValue = filteredProducts.reduce((s, p) => s + p.price * p.stock, 0);
  const totalStockUnits = filteredProducts.reduce((s, p) => s + p.stock, 0);

  const handleExportCSV = () => {
    const lines: string[] = [];
    lines.push("Inventory Box — Report Export");
    lines.push(`Generated,${new Date().toLocaleString()}`);
    lines.push(`Date Range,${startDate} to ${endDate}`);
    lines.push(`Category Filter,${categoryFilter}`);
    lines.push("");
    lines.push("KPI,Value");
    lines.push(`Total Inventory Value,${revenue}`);
    lines.push(`Total Orders,${orderCount}`);
    lines.push(`Revenue,${revenue.toFixed(2)}`);
    lines.push(`Fulfillment Rate,${orderFulfillmentRate}%`);
    lines.push(`Completed,${completedOrders}`);
    lines.push(`Pending,${pendingOrders}`);
    lines.push(`Cancelled,${cancelledOrders}`);
    lines.push("");
    lines.push("Inventory by Category");
    lines.push("Category,Products,Total Stock,Total Value");
    categoryData.forEach((c) => {
      lines.push([csvEscape(c.name), c.count, c.totalStock, c.totalValue.toFixed(2)].join(","));
    });
    lines.push("");
    lines.push("Top Products by Inventory Value");
    lines.push("Rank,SKU,Name,Category,Unit Price,Stock,Total Value");
    topProducts.forEach((p, i) => {
      lines.push([i + 1, csvEscape(p.sku), csvEscape(p.name), csvEscape(p.category), p.price.toFixed(2), p.stock, (p.price * p.stock).toFixed(2)].join(","));
    });
    lines.push("");
    lines.push("Orders in Range");
    lines.push("Order ID,Date,Customer,Status,Amount");
    filteredOrders.forEach((o) => {
      lines.push([csvEscape(o.id), csvEscape(o.date), csvEscape(o.customer), o.status, o.amount.toFixed(2)].join(","));
    });
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-report-${startDate}-to-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    const w = window.open("", "_blank", "width=900,height=900");
    if (!w) return;
    const catRows = categoryData.map((c) => `<tr><td>${c.name}</td><td class="num">${c.count}</td><td class="num">${c.totalStock}</td><td class="num">${formatCurrency(c.totalValue)}</td></tr>`).join("");
    const topRows = topProducts.map((p, i) => `<tr><td>${i + 1}</td><td>${p.name}<div class="muted">${p.sku}</div></td><td>${p.category}</td><td class="num">${p.stock}</td><td class="num">${formatCurrency(p.price * p.stock)}</td></tr>`).join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Inventory Report</title>
      <style>
        body{font-family:Arial,sans-serif;color:#0b1326;padding:32px;max-width:900px;margin:auto}
        h1{margin:0;font-size:26px}
        h2{font-size:15px;text-transform:uppercase;letter-spacing:.08em;margin:28px 0 10px}
        table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:8px}
        th,td{text-align:left;padding:8px 10px;border-bottom:1px solid #e5e7eb}
        th{background:#f3f4f6;font-size:10px;text-transform:uppercase;letter-spacing:.06em}
        td.num,th.num{text-align:right}
        .meta{color:#6b7280;font-size:11px;margin-top:4px}
        .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:16px}
        .kpi{background:#f9fafb;padding:12px;border-radius:8px}
        .kpi-label{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#6b7280;font-weight:700}
        .kpi-val{font-size:18px;font-weight:800;margin-top:4px}
        .muted{color:#6b7280;font-size:10px}
      </style></head><body>
      <h1>Inventory Report</h1>
      <div class="meta">Generated ${new Date().toLocaleString()} · Range: ${startDate} → ${endDate} · Category: ${categoryFilter}</div>
      <div class="grid">
        <div class="kpi"><div class="kpi-label">Inventory Value</div><div class="kpi-val">${formatCurrency(totalInventoryValue)}</div></div>
        <div class="kpi"><div class="kpi-label">Revenue</div><div class="kpi-val">${formatCurrency(revenue)}</div></div>
        <div class="kpi"><div class="kpi-label">Orders</div><div class="kpi-val">${orderCount}</div></div>
        <div class="kpi"><div class="kpi-label">Fulfillment</div><div class="kpi-val">${orderFulfillmentRate}%</div></div>
      </div>
      <h2>Inventory by Category</h2>
      <table><thead><tr><th>Category</th><th class="num">Products</th><th class="num">Stock</th><th class="num">Value</th></tr></thead><tbody>${catRows}</tbody></table>
      <h2>Top Products by Value</h2>
      <table><thead><tr><th>#</th><th>Product</th><th>Category</th><th class="num">Stock</th><th class="num">Total Value</th></tr></thead><tbody>${topRows}</tbody></table>
      <script>window.onload=function(){window.print();};</script>
      </body></html>`;
    w.document.write(html);
    w.document.close();
  };

  const presetButtons: { id: PresetKey; label: string }[] = [
    { id: "7d", label: "Last 7d" },
    { id: "30d", label: "Last 30d" },
    { id: "thisMonth", label: "This Month" },
    { id: "lastMonth", label: "Last Month" },
    { id: "thisQuarter", label: "This Quarter" },
    { id: "thisYear", label: "This Year" },
    { id: "all", label: "All Time" },
  ];

  const formatDelta = (pct: number) => `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;

  return (
    <>
      <TopBar subtitle="Reports" />
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <section className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-4xl font-black tracking-tight text-on-surface mb-2">Reports & Analytics</h2>
            <p className="text-on-surface-variant font-medium">Comprehensive overview of inventory performance and metrics.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleExportPDF} className="bg-surface-container-highest hover:bg-surface-bright text-primary text-sm px-4 py-2.5 rounded-lg font-medium transition-colors border border-outline-variant/15 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">file_download</span> Export PDF
            </button>
            <button onClick={handleExportCSV} className="bg-surface-container-highest hover:bg-surface-bright text-primary text-sm px-4 py-2.5 rounded-lg font-medium transition-colors border border-outline-variant/15 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">table_chart</span> Export CSV
            </button>
          </div>
        </section>

        {/* Filter Bar */}
        <section className="bg-surface-container rounded-xl border border-outline-variant/5 p-4 mb-6 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mr-1">Period</span>
              {presetButtons.map((b) => (
                <button key={b.id} onClick={() => handlePreset(b.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${preset === b.id ? "bg-primary text-on-primary" : "bg-surface-container-highest text-on-surface-variant hover:text-on-surface"}`}>
                  {b.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 lg:ml-auto">
              <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Custom</span>
              <input type="date" className="bg-surface-container-highest border-none text-on-surface rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary/50" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPreset("custom"); }} />
              <span className="text-on-surface-variant text-sm">→</span>
              <input type="date" className="bg-surface-container-highest border-none text-on-surface rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary/50" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPreset("custom"); }} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-outline-variant/10">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant text-sm">category</span>
              <select className="bg-surface-container-highest border-none text-sm rounded-lg text-on-surface focus:ring-0 px-3 py-1.5 font-medium" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="All">All Categories</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-on-surface-variant cursor-pointer">
              <input type="checkbox" className="rounded text-primary focus:ring-primary/50 bg-surface-container-highest" checked={comparePrevious} onChange={(e) => setComparePrevious(e.target.checked)} />
              Compare with previous period
            </label>
            <div className="ml-auto text-xs text-on-surface-variant">
              Showing <span className="font-bold text-on-surface">{orderCount}</span> orders · <span className="font-bold text-on-surface">{filteredProducts.length}</span> products
            </div>
          </div>
        </section>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-surface-container-highest p-5 rounded-xl border-t border-white/5 shadow-xl">
            <div className="p-2 rounded-lg bg-primary/10 text-primary w-fit mb-4"><span className="material-symbols-outlined">account_balance</span></div>
            <p className="uppercase tracking-widest text-on-surface-variant/60 font-semibold mb-1 text-[10px]">Total Inventory Value</p>
            <p className="text-2xl font-black text-on-surface tracking-tighter mb-1">{formatCurrency(totalInventoryValue)}</p>
            <p className="text-[11px] text-on-surface-variant">{totalStockUnits.toLocaleString()} units across {filteredProducts.length} products</p>
          </div>
          <div className="bg-surface-container-highest p-5 rounded-xl border-t border-white/5 shadow-xl">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 w-fit mb-4"><span className="material-symbols-outlined">trending_up</span></div>
            <p className="uppercase tracking-widest text-on-surface-variant/60 font-semibold mb-1 text-[10px]">Revenue</p>
            <p className="text-2xl font-black text-on-surface tracking-tighter mb-1">{formatCurrency(revenue)}</p>
            <p className="text-[11px] text-on-surface-variant flex items-center gap-1">
              From {orderCount} orders
              {comparePrevious && prevRevenue > 0 && (
                <span className={`ml-2 font-bold ${revenueDeltaPct >= 0 ? "text-emerald-400" : "text-error"}`}>
                  {formatDelta(revenueDeltaPct)} vs prev
                </span>
              )}
            </p>
          </div>
          <div className="bg-surface-container-highest p-5 rounded-xl border-t border-white/5 shadow-xl">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 w-fit mb-4"><span className="material-symbols-outlined">task_alt</span></div>
            <p className="uppercase tracking-widest text-on-surface-variant/60 font-semibold mb-1 text-[10px]">Fulfillment Rate</p>
            <p className="text-2xl font-black text-on-surface tracking-tighter mb-1">{orderFulfillmentRate}%</p>
            <p className="text-[11px] text-on-surface-variant">{completedOrders} of {orderCount} orders completed</p>
          </div>
          <div className="bg-surface-container-highest p-5 rounded-xl border-t border-white/5 shadow-xl">
            <div className="p-2 rounded-lg bg-tertiary/10 text-tertiary w-fit mb-4"><span className="material-symbols-outlined">local_shipping</span></div>
            <p className="uppercase tracking-widest text-on-surface-variant/60 font-semibold mb-1 text-[10px]">Active Suppliers</p>
            <p className="text-2xl font-black text-on-surface tracking-tighter mb-1">{supplierCount}</p>
            <p className="text-[11px] text-on-surface-variant">Across all categories</p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Inventory by Category */}
          <div className="lg:col-span-2 bg-surface-container rounded-xl p-6 shadow-2xl border border-outline-variant/5">
            <h3 className="font-bold text-on-surface mb-1">Inventory Value by Category</h3>
            <p className="text-xs text-on-surface-variant mb-6">{categoryFilter === "All" ? "Total stock value distribution" : `Filtered to ${categoryFilter}`}</p>
            <div className="space-y-4">
              {categoryData.map((cat) => (
                <div key={cat.name}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-on-surface">{cat.name}</span>
                      <span className="text-[10px] text-on-surface-variant bg-surface-container-highest px-2 py-0.5 rounded-full">{cat.count} products</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-on-surface-variant">{cat.totalStock.toLocaleString()} units</span>
                      <span className="text-sm font-bold text-on-surface w-28 text-right">{formatCurrency(cat.totalValue)}</span>
                    </div>
                  </div>
                  <div className="w-full bg-surface-container-highest rounded-full h-2">
                    <div className="bg-gradient-to-r from-primary to-primary-container h-2 rounded-full transition-all" style={{ width: `${(cat.totalValue / maxCatValue) * 100}%` }} />
                  </div>
                </div>
              ))}
              {categoryData.length === 0 && (
                <p className="text-sm text-on-surface-variant text-center py-6">No data for selected filter.</p>
              )}
            </div>
          </div>

          {/* Stock Health */}
          <div className="bg-surface-container rounded-xl p-6 shadow-2xl border border-outline-variant/5">
            <h3 className="font-bold text-on-surface mb-1">Stock Health</h3>
            <p className="text-xs text-on-surface-variant mb-6">Current inventory status breakdown</p>

            <div className="relative w-44 h-44 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full" style={{
                background: `conic-gradient(
                  #34d399 0% ${(stockSummary.inStock / Math.max(filteredProducts.length, 1)) * 100}%,
                  #fbbf24 ${(stockSummary.inStock / Math.max(filteredProducts.length, 1)) * 100}% ${((stockSummary.inStock + stockSummary.lowStock) / Math.max(filteredProducts.length, 1)) * 100}%,
                  #f43f5e ${((stockSummary.inStock + stockSummary.lowStock) / Math.max(filteredProducts.length, 1)) * 100}% 100%
                )`
              }} />
              <div className="absolute inset-[16px] rounded-full bg-surface-container" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-on-surface">{filteredProducts.length}</span>
                <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">Products</span>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { label: "In Stock", value: stockSummary.inStock, color: "bg-emerald-400", textColor: "text-emerald-400" },
                { label: "Low Stock", value: stockSummary.lowStock, color: "bg-amber-400", textColor: "text-amber-400" },
                { label: "Out of Stock", value: stockSummary.outOfStock, color: "bg-rose-500", textColor: "text-rose-500" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-xs font-medium text-on-surface">{item.label}</span>
                  </div>
                  <span className={`text-xs font-bold ${item.textColor}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-surface-container rounded-xl overflow-hidden shadow-2xl border border-outline-variant/5">
            <div className="p-6 border-b border-outline-variant/5">
              <h3 className="font-bold text-on-surface">Top Products by Inventory Value</h3>
              <p className="text-xs text-on-surface-variant">Highest value items in stock {categoryFilter !== "All" && `· ${categoryFilter}`}</p>
            </div>
            <table className="w-full text-left">
              <thead className="bg-surface-container-high/50 text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">
                <tr>
                  <th className="px-6 py-3">#</th>
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3 text-right">Unit Price</th>
                  <th className="px-6 py-3 text-center">Stock</th>
                  <th className="px-6 py-3 text-right">Total Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {topProducts.map((p, i) => (
                  <tr key={p.id} className="hover:bg-surface-container-high transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-primary">{i + 1}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-on-surface">{p.name}</div>
                      <div className="text-[10px] text-on-surface-variant">{p.sku}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface text-right">{formatCurrency(p.price)}</td>
                    <td className="px-6 py-4 text-sm text-center">{p.stock.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm font-bold text-on-surface text-right">{formatCurrency(p.price * p.stock)}</td>
                  </tr>
                ))}
                {topProducts.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-on-surface-variant">No products match the current filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-surface-container rounded-xl p-6 shadow-2xl border border-outline-variant/5">
            <h3 className="font-bold text-on-surface mb-1">Order Status Breakdown</h3>
            <p className="text-xs text-on-surface-variant mb-6">Performance metrics for orders in this range</p>

            <div className="space-y-6">
              {[
                { label: "Completed", value: completedOrders, total: orderCount, color: "bg-emerald-400", icon: "check_circle", textColor: "text-emerald-400" },
                { label: "Pending", value: pendingOrders, total: orderCount, color: "bg-amber-400", icon: "schedule", textColor: "text-amber-400" },
                { label: "Cancelled", value: cancelledOrders, total: orderCount, color: "bg-rose-500", icon: "cancel", textColor: "text-rose-500" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`material-symbols-outlined ${item.textColor} text-lg`}>{item.icon}</span>
                      <span className="text-sm font-medium text-on-surface">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${item.textColor}`}>{item.value}</span>
                      <span className="text-[10px] text-on-surface-variant">({item.total > 0 ? Math.round((item.value / item.total) * 100) : 0}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-surface-container-highest rounded-full h-2.5">
                    <div className={`${item.color} h-2.5 rounded-full transition-all`} style={{ width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="bg-surface-container-highest rounded-xl p-4 text-center">
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Avg Order Value</p>
                <p className="text-xl font-black text-on-surface">{formatCurrency(orderCount > 0 ? revenue / orderCount : 0)}</p>
              </div>
              <div className="bg-surface-container-highest rounded-xl p-4 text-center">
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Success Rate</p>
                <p className="text-xl font-black text-emerald-400">{orderFulfillmentRate}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
