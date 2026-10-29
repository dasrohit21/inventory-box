"use client";

import { useEffect, useState, useMemo } from "react";
import TopBar from "@/components/TopBar";
import { getSuppliers, addSupplier, updateSupplier, deleteSupplier, CATEGORIES, type Supplier } from "@/lib/data";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [viewSupplier, setViewSupplier] = useState<Supplier | null>(null);

  // Advanced filters
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [reliabilityMin, setReliabilityMin] = useState(0);
  const [reliabilityMax, setReliabilityMax] = useState(100);
  const [minRating, setMinRating] = useState(0);
  const [minOrders, setMinOrders] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "rating" | "reliability" | "totalOrders">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Form
  const [fName, setFName] = useState("");
  const [fContact, setFContact] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fPhone, setFPhone] = useState("");
  const [fCategory, setFCategory] = useState("Facade");
  const [fRating, setFRating] = useState("4.5");
  const [fReliability, setFReliability] = useState("85");
  const [fStatus, setFStatus] = useState<Supplier["status"]>("Active");

  useEffect(() => { setSuppliers(getSuppliers()); }, []);

  const filtered = useMemo(() => {
    const list = suppliers.filter((s) => {
      const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.contact.toLowerCase().includes(search.toLowerCase()) || s.category.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "All" || s.status === statusFilter;
      const matchCategory = categoryFilter === "All" || s.category === categoryFilter;
      const matchReliability = s.reliability >= reliabilityMin && s.reliability <= reliabilityMax;
      const matchRating = s.rating >= minRating;
      const matchOrders = !minOrders || s.totalOrders >= parseInt(minOrders);
      return matchSearch && matchStatus && matchCategory && matchReliability && matchRating && matchOrders;
    });
    list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name") cmp = a.name.localeCompare(b.name);
      else if (sortBy === "rating") cmp = a.rating - b.rating;
      else if (sortBy === "reliability") cmp = a.reliability - b.reliability;
      else if (sortBy === "totalOrders") cmp = a.totalOrders - b.totalOrders;
      return sortOrder === "asc" ? cmp : -cmp;
    });
    return list;
  }, [suppliers, search, statusFilter, categoryFilter, reliabilityMin, reliabilityMax, minRating, minOrders, sortBy, sortOrder]);

  const activeFilterCount = (categoryFilter !== "All" ? 1 : 0)
    + (reliabilityMin > 0 || reliabilityMax < 100 ? 1 : 0)
    + (minRating > 0 ? 1 : 0)
    + (minOrders ? 1 : 0);

  const resetAdvanced = () => {
    setCategoryFilter("All");
    setReliabilityMin(0); setReliabilityMax(100);
    setMinRating(0); setMinOrders("");
    setSortBy("name"); setSortOrder("asc");
  };

  const stats = useMemo(() => ({
    total: suppliers.length,
    active: suppliers.filter((s) => s.status === "Active").length,
    onHold: suppliers.filter((s) => s.status === "On Hold").length,
    avgReliability: suppliers.length > 0 ? Math.round(suppliers.reduce((sum, s) => sum + s.reliability, 0) / suppliers.length) : 0,
  }), [suppliers]);

  const openAdd = () => {
    setEditing(null);
    setFName(""); setFContact(""); setFEmail(""); setFPhone(""); setFCategory("Facade"); setFRating("4.5"); setFReliability("85"); setFStatus("Active");
    setShowModal(true);
  };

  const openEdit = (s: Supplier) => {
    setEditing(s);
    setFName(s.name); setFContact(s.contact); setFEmail(s.email); setFPhone(s.phone); setFCategory(s.category); setFRating(s.rating.toString()); setFReliability(s.reliability.toString()); setFStatus(s.status);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!fName || !fContact || !fEmail) return;
    const data = { name: fName, contact: fContact, email: fEmail, phone: fPhone, category: fCategory, rating: parseFloat(fRating) || 0, reliability: parseInt(fReliability) || 0, status: fStatus, totalOrders: editing?.totalOrders || 0, lastDelivery: editing?.lastDelivery || "N/A" };
    if (editing) {
      updateSupplier(editing.id, data);
    } else {
      addSupplier(data);
    }
    setSuppliers(getSuppliers());
    setShowModal(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteSupplier(deleteTarget.id);
    setSuppliers(getSuppliers());
    setDeleteTarget(null);
  };

  const statusStyle = (status: string) => {
    if (status === "Active") return { bg: "bg-emerald-500/10 text-emerald-400", dot: "bg-emerald-400" };
    if (status === "On Hold") return { bg: "bg-amber-500/10 text-amber-400", dot: "bg-amber-400" };
    return { bg: "bg-rose-500/10 text-rose-500", dot: "bg-rose-500" };
  };

  const reliabilityColor = (pct: number) => {
    if (pct >= 90) return "bg-emerald-400";
    if (pct >= 75) return "bg-primary";
    return "bg-tertiary";
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`material-symbols-outlined text-sm ${i < Math.round(rating) ? "text-amber-400" : "text-surface-container-highest"}`} style={i < Math.round(rating) ? { fontVariationSettings: "'FILL' 1" } : undefined}>star</span>
    ));
  };

  return (
    <>
      <TopBar subtitle="Suppliers" />
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <section className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-4xl font-black tracking-tight text-on-surface mb-2">Suppliers</h2>
            <p className="text-on-surface-variant font-medium">Manage your vendor network and supply chain partners.</p>
          </div>
          <button onClick={openAdd} className="bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold px-8 py-4 rounded-xl shadow-[0_10px_20px_rgba(128,131,255,0.2)] hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3">
            <span className="material-symbols-outlined font-bold">add</span>
            Add Supplier
          </button>
        </section>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: "Total Suppliers", value: stats.total, icon: "groups", iconBg: "bg-indigo-500/10 text-indigo-400", bgIcon: "local_shipping" },
            { label: "Active Partners", value: stats.active, icon: "check_circle", iconBg: "bg-emerald-500/10 text-emerald-400", bgIcon: "handshake" },
            { label: "On Hold", value: stats.onHold, icon: "pause_circle", iconBg: "bg-amber-500/10 text-amber-400", bgIcon: "pending" },
            { label: "Avg Reliability", value: `${stats.avgReliability}%`, icon: "speed", iconBg: "bg-primary/10 text-primary", bgIcon: "verified" },
          ].map((card) => (
            <div key={card.label} className="bg-surface-container-highest p-5 rounded-xl border-t border-white/5 shadow-xl relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg ${card.iconBg}`}>
                  <span className="material-symbols-outlined">{card.icon}</span>
                </div>
              </div>
              <p className="uppercase tracking-widest text-on-surface-variant/60 font-semibold mb-1 text-[10px]">{card.label}</p>
              <p className="text-3xl font-black text-on-surface tracking-tighter">{card.value}</p>
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-8xl" style={{ fontVariationSettings: "'wght' 700" }}>{card.bgIcon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8">
          <div className="md:col-span-7 bg-surface-container rounded-xl p-1 flex items-center border border-outline-variant/10">
            <div className="pl-4 pr-2 text-on-surface-variant">
              <span className="material-symbols-outlined">search</span>
            </div>
            <input className="w-full bg-transparent border-none focus:ring-0 text-on-surface py-3 text-sm placeholder:text-outline/50" placeholder="Search by name, contact or category..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="md:col-span-3 bg-surface-container rounded-xl flex items-center border border-outline-variant/10 px-4 py-3">
            <span className="material-symbols-outlined text-sm text-on-surface-variant mr-3">filter_list</span>
            <select className="w-full bg-transparent border-none focus:ring-0 text-sm text-on-surface cursor-pointer p-0" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="On Hold">On Hold</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <button onClick={() => setShowAdvanced(!showAdvanced)} className={`md:col-span-2 rounded-xl flex items-center justify-center gap-2 hover:bg-surface-bright transition-colors py-3 text-sm font-medium relative ${showAdvanced ? "bg-primary/10 text-primary ring-2 ring-primary/40" : "bg-surface-container-highest text-on-surface-variant"}`}>
            <span className="material-symbols-outlined text-primary text-lg">tune</span> Filters
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-primary rounded-full flex items-center justify-center text-[10px] font-bold text-on-primary px-1">{activeFilterCount}</span>
            )}
          </button>
        </section>

        {showAdvanced && (
          <section className="mb-8 bg-surface-container rounded-xl border border-outline-variant/10 p-6 shadow-xl" style={{ animation: "fade-in 0.15s ease-out" }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">tune</span>
                Advanced Filters
              </h3>
              <button onClick={resetAdvanced} className="text-[11px] font-bold text-primary hover:text-primary-fixed-dim transition-colors uppercase tracking-wider">
                Reset All
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Category + Sort */}
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 block">Category</label>
                  <select className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/50" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                    <option value="All">All Categories</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 block">Sort By</label>
                  <div className="space-y-1">
                    {([
                      { value: "name" as const, label: "Name", icon: "sort_by_alpha" },
                      { value: "rating" as const, label: "Rating", icon: "star" },
                      { value: "reliability" as const, label: "Reliability", icon: "speed" },
                      { value: "totalOrders" as const, label: "Total Orders", icon: "shopping_cart" },
                    ]).map((opt) => (
                      <button key={opt.value} onClick={() => {
                        if (sortBy === opt.value) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        else { setSortBy(opt.value); setSortOrder("desc"); }
                      }} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${sortBy === opt.value ? "bg-primary/10 text-primary" : "text-on-surface-variant hover:bg-surface-container-highest"}`}>
                        <span className="flex items-center gap-2"><span className="material-symbols-outlined text-base">{opt.icon}</span><span className="font-medium">{opt.label}</span></span>
                        {sortBy === opt.value && <span className="material-symbols-outlined text-base">{sortOrder === "asc" ? "arrow_upward" : "arrow_downward"}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reliability + Rating + Orders */}
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 block">Reliability Range: <span className="text-primary">{reliabilityMin}% – {reliabilityMax}%</span></label>
                  <div className="flex items-center gap-2">
                    <input type="range" min="0" max="100" value={reliabilityMin} onChange={(e) => setReliabilityMin(Math.min(parseInt(e.target.value), reliabilityMax))} className="flex-1 accent-primary" />
                    <input type="range" min="0" max="100" value={reliabilityMax} onChange={(e) => setReliabilityMax(Math.max(parseInt(e.target.value), reliabilityMin))} className="flex-1 accent-primary" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 block">Minimum Rating</label>
                  <div className="flex items-center gap-2">
                    {[0, 1, 2, 3, 4, 5].map((r) => (
                      <button key={r} onClick={() => setMinRating(r)} className={`flex-1 px-2 py-2 rounded-lg text-xs font-bold transition-all ${minRating === r ? "bg-primary text-on-primary" : "bg-surface-container-highest text-on-surface-variant hover:text-on-surface"}`}>
                        {r === 0 ? "Any" : `≥${r}`}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 block">Min Orders</label>
                  <input type="number" min="0" placeholder="e.g. 100" className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 placeholder:text-outline/50" value={minOrders} onChange={(e) => setMinOrders(e.target.value)} />
                </div>
              </div>

              {/* Active Summary */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 block">Active Filters</label>
                <div className="bg-surface-container-highest rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm"><span className="text-on-surface-variant">Sort</span><span className="font-medium text-on-surface capitalize">{sortBy} ({sortOrder === "asc" ? "↑" : "↓"})</span></div>
                  {categoryFilter !== "All" && (<div className="flex items-center justify-between text-sm"><span className="text-on-surface-variant">Category</span><span className="font-medium text-primary">{categoryFilter}</span></div>)}
                  {(reliabilityMin > 0 || reliabilityMax < 100) && (<div className="flex items-center justify-between text-sm"><span className="text-on-surface-variant">Reliability</span><span className="font-medium text-on-surface">{reliabilityMin}% – {reliabilityMax}%</span></div>)}
                  {minRating > 0 && (<div className="flex items-center justify-between text-sm"><span className="text-on-surface-variant">Min Rating</span><span className="font-medium text-on-surface">≥ {minRating}</span></div>)}
                  {minOrders && (<div className="flex items-center justify-between text-sm"><span className="text-on-surface-variant">Min Orders</span><span className="font-medium text-on-surface">≥ {minOrders}</span></div>)}
                  <div className="pt-2 border-t border-outline-variant/10 text-sm">
                    <span className="text-on-surface-variant">Results: </span>
                    <span className="font-bold text-primary">{filtered.length} suppliers</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Supplier Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((s) => {
            const ss = statusStyle(s.status);
            return (
              <div key={s.id} className="bg-surface-container rounded-xl border border-outline-variant/5 shadow-xl overflow-hidden group hover:border-primary/20 transition-all">
                {/* Card Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-lg font-black text-primary border border-outline-variant/10">
                        {s.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <h3 className="font-bold text-on-surface group-hover:text-primary transition-colors">{s.name}</h3>
                        <span className="text-[10px] text-on-surface-variant">{s.category}</span>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${ss.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${ss.dot}`} /> {s.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="material-symbols-outlined text-on-surface-variant text-base">person</span>
                      <span className="text-on-surface">{s.contact}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="material-symbols-outlined text-on-surface-variant text-base">mail</span>
                      <span className="text-on-surface-variant">{s.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="material-symbols-outlined text-on-surface-variant text-base">phone</span>
                      <span className="text-on-surface-variant">{s.phone}</span>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex">{renderStars(s.rating)}</div>
                    <span className="text-xs font-bold text-on-surface">{s.rating}</span>
                  </div>

                  {/* Reliability Bar */}
                  <div className="mb-1">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-on-surface-variant uppercase tracking-widest font-bold">Reliability</span>
                      <span className="font-bold text-on-surface">{s.reliability}%</span>
                    </div>
                    <div className="w-full bg-surface-container-highest rounded-full h-1.5">
                      <div className={`${reliabilityColor(s.reliability)} h-1.5 rounded-full transition-all`} style={{ width: `${s.reliability}%` }} />
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="bg-surface-container-high/50 px-6 py-3 flex items-center justify-between border-t border-outline-variant/5">
                  <div className="flex items-center gap-4 text-[10px] text-on-surface-variant">
                    <span><strong className="text-on-surface">{s.totalOrders}</strong> orders</span>
                    <span>Last: {s.lastDelivery}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setViewSupplier(s)} className="w-7 h-7 rounded-lg bg-surface-container-highest text-on-surface-variant hover:text-primary transition-all flex items-center justify-center">
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                    </button>
                    <button onClick={() => openEdit(s)} className="w-7 h-7 rounded-lg bg-surface-container-highest text-on-surface-variant hover:text-primary transition-all flex items-center justify-center">
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button onClick={() => setDeleteTarget(s)} className="w-7 h-7 rounded-lg bg-surface-container-highest text-on-surface-variant hover:text-error transition-all flex items-center justify-center">
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl mb-2 block opacity-30">local_shipping</span>
              No suppliers found matching your criteria.
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-surface-container-low rounded-2xl shadow-2xl border border-outline-variant/10 w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto" style={{ animation: "fade-in 0.2s ease-out" }}>
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <h3 className="text-xl font-bold text-on-surface mb-6">{editing ? "Edit Supplier" : "Add New Supplier"}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Company Name</label>
                <input className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50 placeholder:text-outline/50" placeholder="e.g. AeroTech Industries" value={fName} onChange={(e) => setFName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Contact Person</label>
                  <input className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50 placeholder:text-outline/50" placeholder="Full name" value={fContact} onChange={(e) => setFContact(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Category</label>
                  <select className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50" value={fCategory} onChange={(e) => setFCategory(e.target.value)}>
                    {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Email</label>
                <input type="email" className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50 placeholder:text-outline/50" placeholder="supplier@company.com" value={fEmail} onChange={(e) => setFEmail(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Phone</label>
                <input className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50 placeholder:text-outline/50" placeholder="+1 (555) 000-0000" value={fPhone} onChange={(e) => setFPhone(e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Rating</label>
                  <input type="number" step="0.1" min="0" max="5" className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50" value={fRating} onChange={(e) => setFRating(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Reliability %</label>
                  <input type="number" min="0" max="100" className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50" value={fReliability} onChange={(e) => setFReliability(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Status</label>
                  <select className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50" value={fStatus} onChange={(e) => setFStatus(e.target.value as Supplier["status"])}>
                    <option value="Active">Active</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setShowModal(false)} className="px-6 py-3 rounded-lg bg-surface-container-highest text-on-surface-variant font-medium hover:bg-surface-bright transition-colors">Cancel</button>
              <button onClick={handleSave} className="px-6 py-3 rounded-lg bg-gradient-to-br from-primary to-primary-container text-on-primary-container font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all">
                {editing ? "Update" : "Add Supplier"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-surface-container-low rounded-2xl shadow-2xl border border-outline-variant/10 w-full max-w-sm p-8 text-center" style={{ animation: "fade-in 0.2s ease-out" }}>
            <span className="material-symbols-outlined text-error text-5xl mb-4">warning</span>
            <h3 className="text-lg font-bold text-on-surface mb-2">Delete Supplier?</h3>
            <p className="text-sm text-on-surface-variant mb-6">Are you sure you want to remove <strong className="text-on-surface">{deleteTarget.name}</strong>?</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-6 py-3 rounded-lg bg-surface-container-highest text-on-surface-variant font-medium hover:bg-surface-bright transition-colors">Cancel</button>
              <button onClick={handleDelete} className="px-6 py-3 rounded-lg bg-error-container text-on-error-container font-bold hover:brightness-110 active:scale-95 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewSupplier && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewSupplier(null)} />
          <div className="relative bg-surface-container-low rounded-2xl shadow-2xl border border-outline-variant/10 w-full max-w-md p-8" style={{ animation: "fade-in 0.2s ease-out" }}>
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-surface-container-highest flex items-center justify-center text-xl font-black text-primary border border-outline-variant/10">
                {viewSupplier.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-on-surface">{viewSupplier.name}</h3>
                <p className="text-sm text-on-surface-variant">{viewSupplier.category}</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: "Contact", value: viewSupplier.contact, icon: "person" },
                { label: "Email", value: viewSupplier.email, icon: "mail" },
                { label: "Phone", value: viewSupplier.phone, icon: "phone" },
                { label: "Rating", value: `${viewSupplier.rating} / 5.0`, icon: "star" },
                { label: "Reliability", value: `${viewSupplier.reliability}%`, icon: "speed" },
                { label: "Total Orders", value: viewSupplier.totalOrders.toString(), icon: "shopping_cart" },
                { label: "Last Delivery", value: viewSupplier.lastDelivery, icon: "calendar_today" },
                { label: "Status", value: viewSupplier.status, icon: "info" },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3 py-2 border-b border-outline-variant/10 last:border-none">
                  <span className="material-symbols-outlined text-on-surface-variant text-lg">{row.icon}</span>
                  <span className="text-sm text-on-surface-variant flex-1">{row.label}</span>
                  <span className="text-sm font-bold text-on-surface">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-8">
              <button onClick={() => setViewSupplier(null)} className="px-6 py-3 rounded-lg bg-surface-container-highest text-on-surface-variant font-medium hover:bg-surface-bright transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
