"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import { getProducts, addProduct, updateProduct, deleteProduct, getSuppliers, formatCurrency, CATEGORIES, UOMS, type Product, type Supplier } from "@/lib/data";

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "All");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [showBulkCategory, setShowBulkCategory] = useState(false);
  const [bulkCategory, setBulkCategory] = useState(CATEGORIES[0]);

  // Form state — basic
  const [formName, setFormName] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formCategory, setFormCategory] = useState("Transmitters");
  const [formPrice, setFormPrice] = useState("");
  const [formStock, setFormStock] = useState("");

  // Form state — extended
  const [formDescription, setFormDescription] = useState("");
  const [formUom, setFormUom] = useState("pcs");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formSupplierIds, setFormSupplierIds] = useState<number[]>([]);
  const [formReorderQty, setFormReorderQty] = useState("25");
  const [formWeight, setFormWeight] = useState("");
  const [formLength, setFormLength] = useState("");
  const [formWidth, setFormWidth] = useState("");
  const [formHeight, setFormHeight] = useState("");
  const [formLeadTime, setFormLeadTime] = useState("14");
  const [formTab, setFormTab] = useState<"basic" | "details" | "logistics">("basic");

  // Sort & filter panel
  const [showSortPanel, setShowSortPanel] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "price" | "stock" | "category" | "status">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [stockMin, setStockMin] = useState("");
  const [stockMax, setStockMax] = useState("");

  useEffect(() => {
    const list = getProducts();
    setProducts(list);
    setSuppliers(getSuppliers());
    const editId = searchParams.get("edit");
    if (editId) {
      const p = list.find((x) => x.id.toString() === editId);
      if (p) openEdit(p);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    let result = products.filter((p) => {
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === "All" || p.category === categoryFilter;
      const matchStatus = statusFilter === "All" || p.status === statusFilter;
      const matchPriceMin = !priceMin || p.price >= parseFloat(priceMin);
      const matchPriceMax = !priceMax || p.price <= parseFloat(priceMax);
      const matchStockMin = !stockMin || p.stock >= parseInt(stockMin);
      const matchStockMax = !stockMax || p.stock <= parseInt(stockMax);
      return matchSearch && matchCategory && matchStatus && matchPriceMin && matchPriceMax && matchStockMin && matchStockMax;
    });

    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name") cmp = a.name.localeCompare(b.name);
      else if (sortBy === "price") cmp = a.price - b.price;
      else if (sortBy === "stock") cmp = a.stock - b.stock;
      else if (sortBy === "category") cmp = a.category.localeCompare(b.category);
      else if (sortBy === "status") cmp = a.status.localeCompare(b.status);
      return sortOrder === "asc" ? cmp : -cmp;
    });

    return result;
  }, [products, search, categoryFilter, statusFilter, sortBy, sortOrder, priceMin, priceMax, stockMin, stockMax]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  useEffect(() => { setPage(1); }, [search, categoryFilter, statusFilter, rowsPerPage, sortBy, sortOrder, priceMin, priceMax, stockMin, stockMax]);

  const resetForm = () => {
    setFormName(""); setFormSku(""); setFormCategory(CATEGORIES[0]); setFormPrice(""); setFormStock("");
    setFormDescription(""); setFormUom("pcs"); setFormImageUrl(""); setFormSupplierIds([]);
    setFormReorderQty("25"); setFormWeight(""); setFormLength(""); setFormWidth(""); setFormHeight(""); setFormLeadTime("14");
    setFormTab("basic");
  };

  const openAdd = () => {
    setEditingProduct(null);
    resetForm();
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name); setFormSku(p.sku); setFormCategory(p.category); setFormPrice(p.price.toString()); setFormStock(p.stock.toString());
    setFormDescription(p.description || "");
    setFormUom(p.uom || "pcs");
    setFormImageUrl(p.imageUrl || "");
    setFormSupplierIds(p.supplierIds || []);
    setFormReorderQty((p.reorderQty ?? 25).toString());
    setFormWeight((p.weightKg ?? "").toString());
    setFormLength((p.dimensions?.length ?? "").toString());
    setFormWidth((p.dimensions?.width ?? "").toString());
    setFormHeight((p.dimensions?.height ?? "").toString());
    setFormLeadTime((p.leadTimeDays ?? 14).toString());
    setFormTab("basic");
    setShowModal(true);
  };

  const buildPayload = () => {
    const dims = (formLength || formWidth || formHeight)
      ? { length: parseFloat(formLength) || 0, width: parseFloat(formWidth) || 0, height: parseFloat(formHeight) || 0 }
      : undefined;
    return {
      name: formName,
      sku: formSku,
      category: formCategory,
      price: parseFloat(formPrice),
      stock: parseInt(formStock) || 0,
      description: formDescription || undefined,
      uom: formUom,
      imageUrl: formImageUrl || undefined,
      supplierIds: formSupplierIds.length > 0 ? formSupplierIds : undefined,
      reorderQty: parseInt(formReorderQty) || 0,
      weightKg: formWeight ? parseFloat(formWeight) : undefined,
      dimensions: dims,
      leadTimeDays: parseInt(formLeadTime) || 0,
    };
  };

  const handleSave = () => {
    if (!formName || !formSku || !formPrice) return;
    const payload = buildPayload();
    if (editingProduct) {
      updateProduct(editingProduct.id, payload);
    } else {
      addProduct(payload);
    }
    setProducts(getProducts());
    setShowModal(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteProduct(deleteTarget.id);
    setProducts(getProducts());
    setDeleteTarget(null);
  };

  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selectedIds.has(p.id));
  const someFilteredSelected = filtered.some((p) => selectedIds.has(p.id));

  const toggleAllFiltered = () => {
    if (allFilteredSelected) {
      const next = new Set(selectedIds);
      filtered.forEach((p) => next.delete(p.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      filtered.forEach((p) => next.add(p.id));
      setSelectedIds(next);
    }
  };

  const toggleOne = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkDelete = () => {
    selectedIds.forEach((id) => deleteProduct(id));
    setProducts(getProducts());
    clearSelection();
    setShowBulkDelete(false);
  };

  const handleBulkCategory = () => {
    selectedIds.forEach((id) => updateProduct(id, { category: bulkCategory }));
    setProducts(getProducts());
    setShowBulkCategory(false);
  };

  const handleBulkExport = () => {
    const selected = products.filter((p) => selectedIds.has(p.id));
    const lines: string[] = [];
    lines.push("ID,SKU,Name,Category,UoM,Price,Stock,Status,Reorder Qty,Lead Time,Weight (kg),Description");
    const csvEscape = (v: string | number | undefined | null) => {
      const s = v === undefined || v === null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    selected.forEach((p) => {
      lines.push([p.id, csvEscape(p.sku), csvEscape(p.name), csvEscape(p.category), csvEscape(p.uom || "pcs"), p.price.toFixed(2), p.stock, p.status, p.reorderQty ?? "", p.leadTimeDays ?? "", p.weightKg ?? "", csvEscape(p.description || "")].join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `products-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusColor = (status: string) => {
    if (status === "In Stock") return { text: "text-emerald-400", dot: "bg-emerald-400", shadow: "shadow-[0_0_8px_rgba(52,211,153,0.6)]" };
    if (status === "Low Stock") return { text: "text-amber-400", dot: "bg-amber-400", shadow: "shadow-[0_0_8px_rgba(251,191,36,0.6)]" };
    return { text: "text-rose-500", dot: "bg-rose-500", shadow: "shadow-[0_0_8px_rgba(244,63,94,0.6)]" };
  };

  const pageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const categoryIcon = (cat: string) => {
    const map: Record<string, string> = { "Transmitters": "sensors", "Gauges": "speed", "Switches": "toggle_on", "Temperature Sensors": "thermostat", "Indicators & Controllers": "dashboard", "Multimeters & Testers": "electric_meter", "Wires & Cables": "cable" };
    return map[cat] || "category";
  };

  return (
    <>
      <TopBar subtitle="Catalog" />
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <section className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-4xl font-black tracking-tight text-on-surface mb-2">Products Management</h2>
            <p className="text-on-surface-variant font-medium">Manage your industrial instrumentation products and inventory.</p>
          </div>
          <button onClick={openAdd} className="bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold px-8 py-4 rounded-xl shadow-[0_10px_20px_rgba(128,131,255,0.2)] hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3">
            <span className="material-symbols-outlined font-bold">add</span>
            Add Product
          </button>
        </section>

        {/* Filters */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8">
          <div className="md:col-span-5 bg-surface-container rounded-xl p-1 flex items-center border border-outline-variant/10">
            <div className="pl-4 pr-2 text-on-surface-variant">
              <span className="material-symbols-outlined">search</span>
            </div>
            <input className="w-full bg-transparent border-none focus:ring-0 text-on-surface py-3 text-sm placeholder:text-outline/50" placeholder="Search by SKU, Name or Category..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="md:col-span-3 bg-surface-container rounded-xl flex items-center border border-outline-variant/10 px-4 py-3">
            <span className="material-symbols-outlined text-sm text-on-surface-variant mr-3">category</span>
            <select className="w-full bg-transparent border-none focus:ring-0 text-sm text-on-surface cursor-pointer p-0" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="All">All Categories</option>
              {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
          </div>
          <div className="md:col-span-3 bg-surface-container rounded-xl flex items-center border border-outline-variant/10 px-4 py-3">
            <span className="material-symbols-outlined text-sm text-on-surface-variant mr-3">filter_list</span>
            <select className="w-full bg-transparent border-none focus:ring-0 text-sm text-on-surface cursor-pointer p-0" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All Statuses</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>
          <div className="md:col-span-1 relative">
            <button onClick={() => setShowSortPanel(!showSortPanel)} className={`w-full h-full bg-surface-container-highest rounded-xl flex items-center justify-center hover:bg-surface-bright transition-colors py-3 ${showSortPanel ? "ring-2 ring-primary/50" : ""}`}>
              <span className="material-symbols-outlined text-primary">tune</span>
            </button>
          </div>
        </section>

        {/* Sort & Filter Panel */}
        {showSortPanel && (
          <section className="mb-8 bg-surface-container rounded-xl border border-outline-variant/10 p-6 shadow-xl" style={{ animation: "fade-in 0.15s ease-out" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">tune</span>
                Sort & Advanced Filters
              </h3>
              <button onClick={() => { setSortBy("name"); setSortOrder("asc"); setPriceMin(""); setPriceMax(""); setStockMin(""); setStockMax(""); }} className="text-[11px] font-bold text-primary hover:text-primary-fixed-dim transition-colors uppercase tracking-wider">
                Reset All
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Sort */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 block">Sort By</label>
                <div className="space-y-1">
                  {([
                    { value: "name", label: "Product Name", icon: "sort_by_alpha" },
                    { value: "price", label: "Price", icon: "attach_money" },
                    { value: "stock", label: "Stock Quantity", icon: "inventory" },
                    { value: "category", label: "Category", icon: "category" },
                    { value: "status", label: "Status", icon: "info" },
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        if (sortBy === opt.value) {
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        } else {
                          setSortBy(opt.value);
                          setSortOrder("asc");
                        }
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${sortBy === opt.value ? "bg-primary/10 text-primary" : "text-on-surface-variant hover:bg-surface-container-highest"}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">{opt.icon}</span>
                        <span className="font-medium">{opt.label}</span>
                      </div>
                      {sortBy === opt.value && (
                        <span className="material-symbols-outlined text-base">
                          {sortOrder === "asc" ? "arrow_upward" : "arrow_downward"}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 block">Price Range (₹)</label>
                <div className="flex items-center gap-2">
                  <input type="number" placeholder="Min" className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 placeholder:text-outline/50" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} />
                  <span className="text-on-surface-variant">—</span>
                  <input type="number" placeholder="Max" className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 placeholder:text-outline/50" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} />
                </div>
                <div className="mt-4">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 block">Stock Range</label>
                  <div className="flex items-center gap-2">
                    <input type="number" placeholder="Min" className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 placeholder:text-outline/50" value={stockMin} onChange={(e) => setStockMin(e.target.value)} />
                    <span className="text-on-surface-variant">—</span>
                    <input type="number" placeholder="Max" className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 placeholder:text-outline/50" value={stockMax} onChange={(e) => setStockMax(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Active Filters Summary */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 block">Active Filters</label>
                <div className="bg-surface-container-highest rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-on-surface-variant">Sort</span>
                    <span className="font-medium text-on-surface capitalize">{sortBy} ({sortOrder === "asc" ? "A→Z" : "Z→A"})</span>
                  </div>
                  {categoryFilter !== "All" && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-on-surface-variant">Category</span>
                      <span className="font-medium text-primary">{categoryFilter}</span>
                    </div>
                  )}
                  {statusFilter !== "All" && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-on-surface-variant">Status</span>
                      <span className="font-medium text-primary">{statusFilter}</span>
                    </div>
                  )}
                  {(priceMin || priceMax) && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-on-surface-variant">Price</span>
                      <span className="font-medium text-on-surface">{priceMin || "0"} — {priceMax || "∞"}</span>
                    </div>
                  )}
                  {(stockMin || stockMax) && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-on-surface-variant">Stock</span>
                      <span className="font-medium text-on-surface">{stockMin || "0"} — {stockMax || "∞"}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-outline-variant/10 text-sm">
                    <span className="text-on-surface-variant">Results: </span>
                    <span className="font-bold text-primary">{filtered.length} products</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Table */}
        <div className="bg-surface-container rounded-2xl overflow-hidden border border-outline-variant/5 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-high">
                <tr>
                  <th className="pl-6 pr-2 py-5 w-10">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded text-primary focus:ring-primary/50 bg-surface-container-highest border-outline-variant cursor-pointer"
                      checked={allFilteredSelected}
                      ref={(el) => { if (el) el.indeterminate = someFilteredSelected && !allFilteredSelected; }}
                      onChange={toggleAllFiltered}
                      aria-label="Select all"
                    />
                  </th>
                  {([
                    { key: "name", label: "Product Name", align: "" },
                    { key: null, label: "SKU", align: "" },
                    { key: "category", label: "Category", align: "" },
                    { key: "price", label: "Price", align: "text-right" },
                    { key: "stock", label: "Stock", align: "text-center" },
                    { key: "status", label: "Status", align: "" },
                    { key: null, label: "Actions", align: "text-center" },
                  ] as const).map((col, i) => (
                    <th
                      key={i}
                      className={`px-6 py-5 text-[10px] font-black uppercase tracking-[0.1em] text-on-surface-variant ${col.align} ${col.key ? "cursor-pointer hover:text-primary transition-colors select-none" : ""}`}
                      onClick={col.key ? () => { if (sortBy === col.key) setSortOrder(sortOrder === "asc" ? "desc" : "asc"); else { setSortBy(col.key); setSortOrder("asc"); } } : undefined}
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        {col.key && sortBy === col.key && (
                          <span className="material-symbols-outlined text-primary text-xs">{sortOrder === "asc" ? "arrow_upward" : "arrow_downward"}</span>
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {paginated.map((p) => {
                  const sc = statusColor(p.status);
                  const isSelected = selectedIds.has(p.id);
                  return (
                    <tr key={p.id} className={`transition-all group cursor-pointer ${isSelected ? "bg-primary/[0.04]" : "hover:bg-surface-container-high/50"}`} onClick={() => router.push(`/products/${p.id}`)}>
                      <td className="pl-6 pr-2 py-5 w-10" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded text-primary focus:ring-primary/50 bg-surface-container-highest border-outline-variant cursor-pointer"
                          checked={isSelected}
                          onChange={() => toggleOne(p.id)}
                          aria-label={`Select ${p.name}`}
                        />
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center border border-outline-variant/10">
                            <span className="material-symbols-outlined text-primary text-lg">{categoryIcon(p.category)}</span>
                          </div>
                          <div>
                            <div className="font-bold text-on-surface group-hover:text-primary transition-colors">{p.name}</div>
                            <div className="text-[10px] text-on-surface-variant">Last updated: {p.updated}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 font-mono text-xs text-on-surface-variant">{p.sku}</td>
                      <td className="px-6 py-5">
                        <span className="bg-surface-container-highest text-on-surface-variant text-[10px] font-bold px-3 py-1 rounded-full border border-outline-variant/20 uppercase tracking-tighter">{p.category}</span>
                      </td>
                      <td className="px-6 py-5 text-right font-bold text-on-surface">{formatCurrency(p.price)}</td>
                      <td className="px-6 py-5 text-center text-sm font-medium">{p.stock.toLocaleString()}</td>
                      <td className="px-6 py-5">
                        <div className={`flex items-center gap-2 ${sc.text} font-bold text-[11px] uppercase tracking-wider`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${sc.shadow}`} />
                          {p.status}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-3">
                          <button onClick={(e) => { e.stopPropagation(); openEdit(p); }} className="w-8 h-8 rounded-lg bg-surface-container-highest text-on-surface-variant hover:text-primary transition-all active:scale-90 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(p); }} className="w-8 h-8 rounded-lg bg-surface-container-highest text-on-surface-variant hover:text-error transition-all active:scale-90 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-4xl mb-2 block opacity-30">inventory_2</span>
                      No products found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <footer className="mt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-xs text-on-surface-variant font-medium">
            Showing <span className="text-on-surface font-bold">{filtered.length === 0 ? 0 : (page - 1) * rowsPerPage + 1}-{Math.min(page * rowsPerPage, filtered.length)}</span> of <span className="text-on-surface font-bold">{filtered.length}</span> products
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container text-on-surface-variant hover:bg-primary-container/20 hover:text-primary transition-all disabled:opacity-30">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            {pageNumbers().map((p, i) =>
              typeof p === "string" ? (
                <span key={`ellipsis-${i}`} className="px-2 text-on-surface-variant">...</span>
              ) : (
                <button key={p} onClick={() => setPage(p)} className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-all ${p === page ? "bg-primary text-on-primary shadow-lg shadow-primary/20" : "bg-surface-container text-on-surface hover:bg-surface-container-highest"}`}>
                  {p}
                </button>
              )
            )}
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container text-on-surface-variant hover:bg-primary-container/20 hover:text-primary transition-all disabled:opacity-30">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-on-surface-variant">Rows per page</span>
            <div className="bg-surface-container rounded-lg border border-outline-variant/10 px-3 py-1.5">
              <select className="bg-transparent border-none focus:ring-0 text-xs font-bold text-on-surface p-0 cursor-pointer" value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))}>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </footer>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] bg-surface-container-low rounded-2xl shadow-2xl border border-outline-variant/15 px-5 py-3 flex items-center gap-3" style={{ animation: "fade-in 0.15s ease-out" }}>
          <span className="text-sm font-bold text-on-surface flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-black">{selectedIds.size}</span>
            selected
          </span>
          <div className="w-[1px] h-6 bg-outline-variant/20" />
          <button onClick={handleBulkExport} className="px-3 py-1.5 rounded-lg text-sm font-medium text-on-surface hover:bg-surface-container-highest transition-colors flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base">download</span> Export
          </button>
          <button onClick={() => setShowBulkCategory(true)} className="px-3 py-1.5 rounded-lg text-sm font-medium text-on-surface hover:bg-surface-container-highest transition-colors flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base">category</span> Change Category
          </button>
          <button onClick={() => setShowBulkDelete(true)} className="px-3 py-1.5 rounded-lg text-sm font-medium text-error hover:bg-error/10 transition-colors flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base">delete</span> Delete
          </button>
          <div className="w-[1px] h-6 bg-outline-variant/20" />
          <button onClick={clearSelection} className="text-on-surface-variant hover:text-on-surface" title="Clear selection">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}

      {/* Bulk Delete Confirmation */}
      {showBulkDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowBulkDelete(false)} />
          <div className="relative bg-surface-container-low rounded-2xl shadow-2xl border border-outline-variant/10 w-full max-w-sm p-8 text-center" style={{ animation: "fade-in 0.2s ease-out" }}>
            <span className="material-symbols-outlined text-error text-5xl mb-4">warning</span>
            <h3 className="text-lg font-bold text-on-surface mb-2">Delete {selectedIds.size} Products?</h3>
            <p className="text-sm text-on-surface-variant mb-6">This will permanently delete the selected products. This action cannot be undone.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setShowBulkDelete(false)} className="px-6 py-3 rounded-lg bg-surface-container-highest text-on-surface-variant font-medium hover:bg-surface-bright transition-colors">Cancel</button>
              <button onClick={handleBulkDelete} className="px-6 py-3 rounded-lg bg-error-container text-on-error-container font-bold hover:brightness-110 active:scale-95 transition-all">Delete {selectedIds.size}</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Category Change */}
      {showBulkCategory && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowBulkCategory(false)} />
          <div className="relative bg-surface-container-low rounded-2xl shadow-2xl border border-outline-variant/10 w-full max-w-md p-8" style={{ animation: "fade-in 0.2s ease-out" }}>
            <h3 className="text-lg font-bold text-on-surface mb-2">Change Category</h3>
            <p className="text-sm text-on-surface-variant mb-5">Move <strong className="text-on-surface">{selectedIds.size}</strong> selected product{selectedIds.size === 1 ? "" : "s"} to a new category.</p>
            <select className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50 mb-6" value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value)}>
              {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowBulkCategory(false)} className="px-6 py-3 rounded-lg bg-surface-container-highest text-on-surface-variant font-medium hover:bg-surface-bright transition-colors">Cancel</button>
              <button onClick={handleBulkCategory} className="px-6 py-3 rounded-lg bg-gradient-to-br from-primary to-primary-container text-on-primary-container font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all">Apply</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-surface-container-low rounded-2xl shadow-2xl border border-outline-variant/10 w-full max-w-2xl max-h-[92vh] overflow-y-auto p-8" style={{ animation: "fade-in 0.2s ease-out" }}>
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <h3 className="text-xl font-bold text-on-surface mb-6">{editingProduct ? "Edit Product" : "Add New Product"}</h3>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-surface-container rounded-xl p-1 border border-outline-variant/10">
              {([
                { id: "basic" as const, label: "Basic Info", icon: "info" },
                { id: "details" as const, label: "Details", icon: "description" },
                { id: "logistics" as const, label: "Logistics", icon: "local_shipping" },
              ]).map((t) => (
                <button key={t.id} onClick={() => setFormTab(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${formTab === t.id ? "bg-primary text-on-primary shadow-lg shadow-primary/20" : "text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface"}`}>
                  <span className="material-symbols-outlined text-base">{t.icon}</span>
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              ))}
            </div>

            {/* Basic */}
            {formTab === "basic" && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Product Name</label>
                  <input className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50 placeholder:text-outline/50" placeholder="e.g. DPharp Pressure Transmitter" value={formName} onChange={(e) => setFormName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">SKU</label>
                    <input className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50 placeholder:text-outline/50 font-mono" placeholder="e.g. TX-PRS-1001" value={formSku} onChange={(e) => setFormSku(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Category</label>
                    <select className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50" value={formCategory} onChange={(e) => setFormCategory(e.target.value)}>
                      {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Price</label>
                    <input type="number" step="0.01" className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50 placeholder:text-outline/50" placeholder="0.00" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">UoM</label>
                    <select className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50" value={formUom} onChange={(e) => setFormUom(e.target.value)}>
                      {UOMS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Stock Qty</label>
                    <div className="flex items-center gap-0 rounded-lg overflow-hidden border border-outline-variant/10">
                      <button type="button" onClick={() => setFormStock(String(Math.max(0, (parseInt(formStock) || 0) - 1)))} className="w-10 h-[46px] bg-error/10 hover:bg-error/20 text-error flex items-center justify-center transition-colors active:scale-95 shrink-0">
                        <span className="material-symbols-outlined text-xl font-bold">remove</span>
                      </button>
                      <input type="number" className="w-full bg-surface-container-highest border-none text-on-surface text-center px-2 py-3 focus:ring-2 focus:ring-primary/50 placeholder:text-outline/50" placeholder="0" value={formStock} onChange={(e) => setFormStock(e.target.value)} />
                      <button type="button" onClick={() => setFormStock(String((parseInt(formStock) || 0) + 1))} className="w-10 h-[46px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 flex items-center justify-center transition-colors active:scale-95 shrink-0">
                        <span className="material-symbols-outlined text-xl font-bold">add</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Details */}
            {formTab === "details" && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Description</label>
                  <textarea rows={4} className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50 placeholder:text-outline/50 resize-none" placeholder="Technical specs, features, materials..." value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Image URL</label>
                  <input className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50 placeholder:text-outline/50" placeholder="https://..." value={formImageUrl} onChange={(e) => setFormImageUrl(e.target.value)} />
                  {formImageUrl && (
                    <div className="mt-3 inline-block bg-surface-container-highest rounded-lg overflow-hidden border border-outline-variant/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={formImageUrl} alt="Preview" className="w-24 h-24 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Linked Suppliers</label>
                  <div className="bg-surface-container-highest rounded-lg p-3 max-h-40 overflow-y-auto space-y-1">
                    {suppliers.length === 0 && <p className="text-xs text-on-surface-variant/60 text-center py-2">No suppliers available — add some in Suppliers.</p>}
                    {suppliers.map((s) => {
                      const checked = formSupplierIds.includes(s.id);
                      return (
                        <label key={s.id} className="flex items-center gap-2 text-sm text-on-surface hover:bg-surface-container rounded px-2 py-1.5 cursor-pointer">
                          <input type="checkbox" className="rounded text-primary focus:ring-primary/50 bg-surface-container border-outline-variant" checked={checked} onChange={() => {
                            setFormSupplierIds(checked ? formSupplierIds.filter((id) => id !== s.id) : [...formSupplierIds, s.id]);
                          }} />
                          <span className="flex-1">{s.name}</span>
                          <span className="text-[10px] text-on-surface-variant">{s.category}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Logistics */}
            {formTab === "logistics" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Min. Reorder Qty</label>
                    <input type="number" min="0" className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50" value={formReorderQty} onChange={(e) => setFormReorderQty(e.target.value)} />
                    <p className="text-[10px] text-on-surface-variant mt-1">Trigger restock when stock hits this level.</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Lead Time (days)</label>
                    <input type="number" min="0" className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50" value={formLeadTime} onChange={(e) => setFormLeadTime(e.target.value)} />
                    <p className="text-[10px] text-on-surface-variant mt-1">Avg supplier delivery time.</p>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Weight (kg)</label>
                  <input type="number" step="0.01" min="0" className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50" placeholder="0.00" value={formWeight} onChange={(e) => setFormWeight(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Dimensions (mm)</label>
                  <div className="grid grid-cols-3 gap-2">
                    <input type="number" min="0" className="bg-surface-container-highest border-none text-on-surface rounded-lg px-3 py-3 focus:ring-2 focus:ring-primary/50 placeholder:text-outline/50 text-sm" placeholder="Length" value={formLength} onChange={(e) => setFormLength(e.target.value)} />
                    <input type="number" min="0" className="bg-surface-container-highest border-none text-on-surface rounded-lg px-3 py-3 focus:ring-2 focus:ring-primary/50 placeholder:text-outline/50 text-sm" placeholder="Width" value={formWidth} onChange={(e) => setFormWidth(e.target.value)} />
                    <input type="number" min="0" className="bg-surface-container-highest border-none text-on-surface rounded-lg px-3 py-3 focus:ring-2 focus:ring-primary/50 placeholder:text-outline/50 text-sm" placeholder="Height" value={formHeight} onChange={(e) => setFormHeight(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setShowModal(false)} className="px-6 py-3 rounded-lg bg-surface-container-highest text-on-surface-variant font-medium hover:bg-surface-bright transition-colors">Cancel</button>
              <button onClick={handleSave} className="px-6 py-3 rounded-lg bg-gradient-to-br from-primary to-primary-container text-on-primary-container font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all">
                {editingProduct ? "Update" : "Add Product"}
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
            <h3 className="text-lg font-bold text-on-surface mb-2">Delete Product?</h3>
            <p className="text-sm text-on-surface-variant mb-6">Are you sure you want to delete <strong className="text-on-surface">{deleteTarget.name}</strong>? This action cannot be undone.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-6 py-3 rounded-lg bg-surface-container-highest text-on-surface-variant font-medium hover:bg-surface-bright transition-colors">Cancel</button>
              <button onClick={handleDelete} className="px-6 py-3 rounded-lg bg-error-container text-on-error-container font-bold hover:brightness-110 active:scale-95 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
