"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import {
  getPurchaseOrders,
  addPurchaseOrder,
  updatePurchaseOrder,
  receivePurchaseOrder,
  getProducts,
  getSuppliers,
  formatCurrency,
  type PurchaseOrder,
  type Product,
  type Supplier,
} from "@/lib/data";

function todayStr() {
  return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function plusDaysStr(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const restockProductId = searchParams.get("restock");

  const [pos, setPOs] = useState<PurchaseOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [formProductId, setFormProductId] = useState("");
  const [formSupplierId, setFormSupplierId] = useState("");
  const [formQuantity, setFormQuantity] = useState("50");
  const [formUnitCost, setFormUnitCost] = useState("");
  const [formExpected, setFormExpected] = useState(plusDaysStr(7));
  const [formNotes, setFormNotes] = useState("");
  const [restockHandled, setRestockHandled] = useState(false);

  useEffect(() => {
    setPOs(getPurchaseOrders());
    setProducts(getProducts());
    setSuppliers(getSuppliers());
  }, []);

  // Pre-open create modal when /purchase-orders?restock=<id> — fire once both data sources are ready.
  useEffect(() => {
    if (restockHandled) return;
    if (!restockProductId) return;
    if (products.length === 0 || suppliers.length === 0) return;

    const product = products.find((p) => p.id.toString() === restockProductId);
    if (!product) {
      setRestockHandled(true);
      return;
    }
    setFormProductId(restockProductId);
    setFormUnitCost((product.price * 0.65).toFixed(2));
    setFormQuantity(String(Math.max(50, (product.reorderQty || 25) * 2)));
    const matchedSupplier = suppliers.find((s) => s.category === product.category && s.status === "Active");
    if (matchedSupplier) setFormSupplierId(matchedSupplier.id.toString());
    setFormNotes(`Restock for ${product.name} — current stock: ${product.stock}`);
    setShowCreate(true);
    setRestockHandled(true);
  }, [restockProductId, products, suppliers, restockHandled]);

  const selectedProduct = products.find((p) => p.id.toString() === formProductId);
  const selectedSupplier = suppliers.find((s) => s.id.toString() === formSupplierId);
  const calcTotal = (parseFloat(formUnitCost) || 0) * (parseInt(formQuantity) || 0);

  const filtered = useMemo(() => {
    return pos.filter((po) => {
      const matchSearch = !search || po.id.toLowerCase().includes(search.toLowerCase()) || po.productName.toLowerCase().includes(search.toLowerCase()) || po.supplierName.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "All" || po.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [pos, search, statusFilter]);

  const stats = useMemo(() => ({
    total: pos.length,
    sent: pos.filter((p) => p.status === "Sent").length,
    received: pos.filter((p) => p.status === "Received").length,
    spend: pos.filter((p) => p.status !== "Cancelled").reduce((s, p) => s + p.total, 0),
  }), [pos]);

  const resetForm = () => {
    setFormProductId(""); setFormSupplierId(""); setFormQuantity("50");
    setFormUnitCost(""); setFormExpected(plusDaysStr(7)); setFormNotes("");
  };

  const handleCreate = () => {
    if (!selectedProduct || !selectedSupplier || !formQuantity || !formUnitCost) return;
    addPurchaseOrder({
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      sku: selectedProduct.sku,
      supplierId: selectedSupplier.id,
      supplierName: selectedSupplier.name,
      quantity: parseInt(formQuantity),
      unitCost: parseFloat(formUnitCost),
      status: "Sent",
      createdDate: todayStr(),
      expectedDate: formExpected,
      notes: formNotes,
    });
    setPOs(getPurchaseOrders());
    setShowCreate(false);
    resetForm();
    if (restockProductId) router.replace("/purchase-orders");
  };

  const handleStatusChange = (id: string, status: PurchaseOrder["status"]) => {
    if (status === "Received") {
      receivePurchaseOrder(id);
    } else {
      updatePurchaseOrder(id, { status });
    }
    setPOs(getPurchaseOrders());
    setProducts(getProducts());
  };

  const statusBadge = (status: string) => {
    if (status === "Received") return "bg-emerald-500/10 text-emerald-400";
    if (status === "Sent") return "bg-primary/10 text-primary";
    if (status === "Draft") return "bg-tertiary/10 text-tertiary";
    return "bg-error/10 text-error";
  };

  const handleCloseCreate = () => {
    setShowCreate(false);
    resetForm();
    if (restockProductId) router.replace("/purchase-orders");
  };

  return (
    <>
      <TopBar subtitle="Purchase Orders" />
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-on-surface">Purchase Orders & Restock</h2>
            <p className="text-on-surface-variant text-sm mt-1">Raise restock requests to suppliers and track inbound stock.</p>
          </div>
          <button onClick={() => { resetForm(); setShowCreate(true); }} className="bg-gradient-to-r from-primary to-primary-container text-on-primary-container px-5 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-primary/20 flex items-center gap-2 active:scale-95 transition-all w-fit">
            <span className="material-symbols-outlined text-lg">add_shopping_cart</span> New Purchase Order
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="glass-card p-6 rounded-xl border border-outline-variant/5">
            <p className="uppercase tracking-widest text-on-surface-variant text-[10px] mb-2 font-semibold">Total POs</p>
            <h3 className="text-3xl font-black tracking-tight text-on-surface">{stats.total}</h3>
            <p className="text-xs mt-2 text-on-surface-variant/60">All-time count</p>
          </div>
          <div className="glass-card p-6 rounded-xl border border-outline-variant/5">
            <p className="uppercase tracking-widest text-on-surface-variant text-[10px] mb-2 font-semibold">Awaiting Delivery</p>
            <h3 className="text-3xl font-black tracking-tight text-primary">{stats.sent}</h3>
            <p className="text-xs mt-2 text-on-surface-variant/60">Sent to suppliers</p>
          </div>
          <div className="glass-card p-6 rounded-xl border border-outline-variant/5">
            <p className="uppercase tracking-widest text-on-surface-variant text-[10px] mb-2 font-semibold">Received</p>
            <h3 className="text-3xl font-black tracking-tight text-emerald-400">{stats.received}</h3>
            <p className="text-xs mt-2 text-on-surface-variant/60">Stock fulfilled</p>
          </div>
          <div className="glass-card p-6 rounded-xl border border-outline-variant/5">
            <p className="uppercase tracking-widest text-on-surface-variant text-[10px] mb-2 font-semibold">Total Spend</p>
            <h3 className="text-3xl font-black tracking-tight text-tertiary">{formatCurrency(stats.spend)}</h3>
            <p className="text-xs mt-2 text-on-surface-variant/60">Across active POs</p>
          </div>
        </div>

        {/* Table */}
        <section className="bg-surface-container rounded-xl overflow-hidden shadow-2xl">
          <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-xl font-bold tracking-tight text-on-surface">All Purchase Orders</h2>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <input className="bg-surface-container-highest border-none rounded-lg py-2 pl-10 pr-4 text-sm text-on-surface w-56 focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/50" placeholder="Search POs..." value={search} onChange={(e) => setSearch(e.target.value)} />
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
              </div>
              <select className="bg-surface-container-highest border-none text-sm rounded-lg text-on-surface font-medium focus:ring-0 px-4 py-2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="All">All Status</option>
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Received">Received</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high/50">
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">PO #</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Product</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Supplier</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant text-center">Qty</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant text-right">Total</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">ETA</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Status</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {filtered.map((po) => (
                  <tr key={po.id} className="hover:bg-surface-container-high transition-colors">
                    <td className="px-6 py-4 font-mono text-indigo-400 text-sm">{po.id}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-on-surface">{po.productName}</p>
                      <p className="text-[11px] font-mono text-on-surface-variant/60">{po.sku}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">{po.supplierName}</td>
                    <td className="px-6 py-4 text-sm text-center text-on-surface font-bold">{po.quantity}</td>
                    <td className="px-6 py-4 text-sm font-bold text-on-surface text-right">{formatCurrency(po.total)}</td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">{po.expectedDate}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusBadge(po.status)}`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {po.status === "Sent" && (
                        <button onClick={() => handleStatusChange(po.id, "Received")} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[11px] font-bold uppercase tracking-wider hover:bg-emerald-500/20 transition-colors flex items-center gap-1 ml-auto">
                          <span className="material-symbols-outlined text-base">check_circle</span> Receive
                        </button>
                      )}
                      {po.status === "Draft" && (
                        <button onClick={() => handleStatusChange(po.id, "Sent")} className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wider hover:bg-primary/20 transition-colors flex items-center gap-1 ml-auto">
                          <span className="material-symbols-outlined text-base">send</span> Send
                        </button>
                      )}
                      {(po.status === "Sent" || po.status === "Draft") && (
                        <button onClick={() => handleStatusChange(po.id, "Cancelled")} className="text-[11px] text-on-surface-variant hover:text-error mt-1 ml-auto block">Cancel</button>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-4xl mb-2 block opacity-30">receipt_long</span>
                      No purchase orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Create / Restock Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCloseCreate} />
          <div className="relative bg-surface-container-low rounded-2xl shadow-2xl border border-outline-variant/10 w-full max-w-xl max-h-[92vh] overflow-y-auto p-8" style={{ animation: "fade-in 0.2s ease-out" }}>
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">add_shopping_cart</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-on-surface">{restockProductId ? "Restock Product" : "New Purchase Order"}</h3>
                <p className="text-xs text-on-surface-variant">Raise an order to a supplier and track delivery.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Product</label>
                <select className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50" value={formProductId} onChange={(e) => {
                  setFormProductId(e.target.value);
                  const p = products.find((x) => x.id.toString() === e.target.value);
                  if (p) {
                    setFormUnitCost((p.price * 0.65).toFixed(2));
                    const sup = suppliers.find((s) => s.category === p.category && s.status === "Active");
                    if (sup) setFormSupplierId(sup.id.toString());
                  }
                }}>
                  <option value="">Select a product</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
                </select>
                {selectedProduct && (
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-on-surface-variant">
                    <span className={`w-2 h-2 rounded-full ${selectedProduct.status === "Out of Stock" ? "bg-error" : selectedProduct.status === "Low Stock" ? "bg-tertiary" : "bg-emerald-400"}`} />
                    Current stock: <span className="font-bold text-on-surface">{selectedProduct.stock}</span> · Status: {selectedProduct.status}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Supplier</label>
                <select className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50" value={formSupplierId} onChange={(e) => setFormSupplierId(e.target.value)}>
                  <option value="">Select a supplier</option>
                  {suppliers.filter((s) => s.status === "Active").map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.category}) · Reliability {s.reliability}%</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Quantity</label>
                  <input type="number" min="1" className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50" value={formQuantity} onChange={(e) => setFormQuantity(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Unit Cost</label>
                  <input type="number" min="0" step="0.01" className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50" value={formUnitCost} onChange={(e) => setFormUnitCost(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Expected Delivery</label>
                <input className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50" value={formExpected} onChange={(e) => setFormExpected(e.target.value)} />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Notes</label>
                <textarea rows={2} className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 placeholder:text-outline/50 resize-none" placeholder="Internal notes for this PO..." value={formNotes} onChange={(e) => setFormNotes(e.target.value)} />
              </div>

              <div className="bg-surface-container-highest rounded-lg p-4 flex justify-between items-center">
                <span className="text-sm text-on-surface-variant">PO Total</span>
                <span className="text-lg font-black text-primary">{formatCurrency(calcTotal)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button onClick={handleCloseCreate} className="px-6 py-3 rounded-lg bg-surface-container-highest text-on-surface-variant font-medium hover:bg-surface-bright transition-colors">Cancel</button>
              <button onClick={handleCreate} className="px-6 py-3 rounded-lg bg-gradient-to-br from-primary to-primary-container text-on-primary-container font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-base">send</span> Send PO
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
