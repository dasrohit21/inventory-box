"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import TopBar from "@/components/TopBar";
import {
  getOrders,
  addOrder,
  updateOrder,
  deleteOrder,
  getProducts,
  getCustomers,
  getSuppliers,
  getEventsForOrder,
  formatCurrency,
  type Order,
  type OrderItem,
  type Product,
  type Customer,
  type Supplier,
  type ShippingAddress,
  type OrderTracking,
  type OrderEvent,
} from "@/lib/data";

type DraftItem = { productId: string; quantity: string };

const EMPTY_ADDRESS: ShippingAddress = { line1: "", line2: "", city: "", state: "", pincode: "", country: "India" };

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const filterToday = searchParams.get("filter") === "today";
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliersList, setSuppliersList] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState<"all" | "today">(filterToday ? "today" : "all");
  const [page, setPage] = useState(1);
  const perPage = 5;

  const [showCreate, setShowCreate] = useState(false);
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [showBulkStatus, setShowBulkStatus] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<Order["status"]>("Completed");

  // Create form
  const [formCustomer, setFormCustomer] = useState("");
  const [formCustomerCustom, setFormCustomerCustom] = useState("");
  const [formItems, setFormItems] = useState<DraftItem[]>([{ productId: "", quantity: "1" }]);
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formAddress, setFormAddress] = useState<ShippingAddress>(EMPTY_ADDRESS);
  const [formNotes, setFormNotes] = useState("");

  // View modal edit state
  const [editStatus, setEditStatus] = useState<Order["status"]>("Pending");
  const [editTracking, setEditTracking] = useState<OrderTracking>({ carrier: "", trackingNumber: "", eta: "", shipmentStatus: "Not Shipped" });
  const [editNotes, setEditNotes] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);
  const [orderEvents, setOrderEvents] = useState<OrderEvent[]>([]);

  useEffect(() => {
    setOrders(getOrders());
    setProducts(getProducts());
    setCustomers(getCustomers());
    setSuppliersList(getSuppliers());
  }, []);

  useEffect(() => {
    if (viewOrder) {
      setEditStatus(viewOrder.status);
      setEditTracking(viewOrder.tracking);
      setEditNotes(viewOrder.notes);
      setSavedFlash(false);
      setOrderEvents(getEventsForOrder(viewOrder.id));
    }
  }, [viewOrder]);

  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }, []);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch = !search || o.id.toLowerCase().includes(search.toLowerCase()) || o.customer.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "All" || o.status === statusFilter;
      const matchDate = dateFilter === "all" || o.date === todayStr;
      return matchSearch && matchStatus && matchDate;
    });
  }, [orders, search, statusFilter, dateFilter, todayStr]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  useEffect(() => { setPage(1); }, [search, statusFilter, dateFilter]);

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((o) => o.status === "Pending").length,
    completed: orders.filter((o) => o.status === "Completed").length,
    avgRevenue: orders.length > 0 ? orders.reduce((s, o) => s + o.amount, 0) / orders.length : 0,
  }), [orders]);

  const calcDraftAmount = useMemo(() => {
    return formItems.reduce((sum, item) => {
      const p = products.find((x) => x.id.toString() === item.productId);
      const qty = parseInt(item.quantity) || 0;
      return sum + (p ? p.price * qty : 0);
    }, 0);
  }, [formItems, products]);

  const resetCreate = () => {
    setFormCustomer("");
    setFormCustomerCustom("");
    setFormItems([{ productId: "", quantity: "1" }]);
    setFormAddress(EMPTY_ADDRESS);
    setFormNotes("");
  };

  const handleCustomerSelect = (val: string) => {
    setFormCustomer(val);
    if (val !== "__other__") {
      const cust = customers.find((c) => c.name === val);
      if (cust) setFormAddress(cust.address);
    }
  };

  const handleCreate = () => {
    const customerName = formCustomer === "__other__" ? formCustomerCustom : formCustomer;
    if (!customerName) return;
    const built: OrderItem[] = formItems
      .filter((i) => i.productId && parseInt(i.quantity) > 0)
      .map((i) => {
        const p = products.find((x) => x.id.toString() === i.productId)!;
        return { productId: p.id, name: p.name, sku: p.sku, quantity: parseInt(i.quantity), unitPrice: p.price };
      });
    if (built.length === 0) return;
    const amount = built.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
    const d = new Date(formDate);
    addOrder({
      customer: customerName,
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      status: "Pending",
      amount,
      items: built,
      shippingAddress: formAddress,
      notes: formNotes,
    });
    setOrders(getOrders());
    setShowCreate(false);
    resetCreate();
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteOrder(deleteTarget.id);
    setOrders(getOrders());
    if (viewOrder && viewOrder.id === deleteTarget.id) setViewOrder(null);
    setDeleteTarget(null);
  };

  const allFilteredSelected = filtered.length > 0 && filtered.every((o) => selectedIds.has(o.id));
  const someFilteredSelected = filtered.some((o) => selectedIds.has(o.id));

  const toggleAllFiltered = () => {
    if (allFilteredSelected) {
      const next = new Set(selectedIds);
      filtered.forEach((o) => next.delete(o.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      filtered.forEach((o) => next.add(o.id));
      setSelectedIds(next);
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkDelete = () => {
    selectedIds.forEach((id) => deleteOrder(id));
    setOrders(getOrders());
    clearSelection();
    setShowBulkDelete(false);
  };

  const handleBulkStatus = () => {
    selectedIds.forEach((id) => updateOrder(id, { status: bulkStatus }));
    setOrders(getOrders());
    setShowBulkStatus(false);
  };

  const handleBulkExport = () => {
    const selected = orders.filter((o) => selectedIds.has(o.id));
    const csvEscape = (v: string | number) => /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v);
    const lines: string[] = [];
    lines.push("Order ID,Customer,Date,Status,Items,Amount,Carrier,Tracking,Shipment Status");
    selected.forEach((o) => {
      lines.push([csvEscape(o.id), csvEscape(o.customer), csvEscape(o.date), o.status, o.items.length, o.amount.toFixed(2), csvEscape(o.tracking.carrier), csvEscape(o.tracking.trackingNumber), o.tracking.shipmentStatus].join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleQuickCancel = (order: Order) => {
    updateOrder(order.id, { status: "Cancelled" });
    setOrders(getOrders());
  };

  const handleSaveOrder = () => {
    if (!viewOrder) return;
    const updated = updateOrder(viewOrder.id, { status: editStatus, tracking: editTracking, notes: editNotes });
    if (updated) {
      setOrders(getOrders());
      setViewOrder(updated);
      setOrderEvents(getEventsForOrder(updated.id));
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1800);
    }
  };

  const handlePrintInvoice = () => {
    if (!viewOrder) return;
    const cust = customers.find((c) => c.name === viewOrder.customer);
    const subtotal = viewOrder.items.reduce((s, it) => s + it.unitPrice * it.quantity, 0) || viewOrder.amount;
    const gstRate = 0.18;
    const gstAmount = subtotal * gstRate;
    const grandTotal = subtotal + gstAmount;
    const cgst = gstAmount / 2;
    const sgst = gstAmount / 2;
    const itemsHtml = viewOrder.items.map((it, i) => `
      <tr>
        <td class="num muted">${i + 1}</td>
        <td><strong>${it.name}</strong><div class="muted">${it.sku}</div></td>
        <td class="num">${it.quantity}</td>
        <td class="num">${formatCurrency(it.unitPrice)}</td>
        <td class="num">${formatCurrency(it.unitPrice * it.quantity)}</td>
      </tr>`).join("");
    const addr = viewOrder.shippingAddress;
    const invoiceNum = `INV-${viewOrder.id.replace(/^ORD-/, "")}`;
    const dueDate = (() => { const d = new Date(viewOrder.date); if (isNaN(d.getTime())) return "—"; d.setDate(d.getDate() + 30); return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); })();

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${invoiceNum}</title>
      <style>
        @page { size: A4; margin: 0; }
        body{font-family:'Helvetica Neue',Arial,sans-serif;color:#0b1326;margin:0;background:#f3f4f6}
        .page{max-width:210mm;margin:0 auto;background:white;padding:40px 48px;min-height:297mm;box-sizing:border-box}
        @media print{body{background:white}.page{padding:24mm 18mm;box-shadow:none}}
        @media screen{.page{margin:24px auto;box-shadow:0 4px 20px rgba(0,0,0,0.08)}}
        .brand-bar{height:6px;background:linear-gradient(90deg,#494bd6,#8083ff,#ffb783);border-radius:3px;margin-bottom:32px}
        .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px}
        .brand{display:flex;align-items:center;gap:12px}
        .logo{width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#494bd6,#8083ff);display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:20px;letter-spacing:-1px}
        .brand-name{font-size:18px;font-weight:800;letter-spacing:-0.5px}
        .brand-sub{font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:#6b7280;font-weight:600}
        .invoice-meta{text-align:right}
        .invoice-meta h1{margin:0;font-size:32px;font-weight:900;letter-spacing:-1.5px;color:#0b1326}
        .pill{display:inline-block;padding:4px 12px;border-radius:20px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-top:6px}
        .pill-completed{background:#d1fae5;color:#047857}
        .pill-pending{background:#fef3c7;color:#92400e}
        .pill-cancelled{background:#fee2e2;color:#991b1b}
        .from-block{font-size:11px;color:#374151;line-height:1.6;margin-bottom:24px;padding-bottom:16px;border-bottom:1px dashed #e5e7eb}
        .from-block strong{color:#0b1326;font-size:13px}
        .grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;margin-bottom:32px}
        .label{font-size:9px;text-transform:uppercase;letter-spacing:0.12em;color:#6b7280;font-weight:700;margin-bottom:4px}
        .val{font-size:12px;line-height:1.5;color:#0b1326}
        .val strong{font-size:13px;display:block;margin-bottom:2px}
        table{width:100%;border-collapse:collapse;margin-top:8px}
        thead{background:#0b1326;color:white}
        th{text-align:left;padding:12px 10px;font-size:10px;text-transform:uppercase;letter-spacing:0.08em;font-weight:700}
        td{padding:12px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;vertical-align:top}
        td.num,th.num{text-align:right}
        .muted{color:#6b7280;font-size:10px}
        .totals{margin-top:24px;display:flex;justify-content:flex-end}
        .totals-table{width:280px}
        .totals-table tr td{padding:6px 0;border:none;font-size:12px}
        .totals-table tr td:last-child{text-align:right;font-weight:600}
        .totals-table tr.grand{border-top:2px solid #0b1326}
        .totals-table tr.grand td{padding-top:10px;font-size:16px;font-weight:900}
        .terms{margin-top:36px;padding:16px;background:#f9fafb;border-left:3px solid #494bd6;font-size:11px;color:#374151;line-height:1.6;border-radius:4px}
        .terms strong{color:#0b1326;display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.1em;font-size:9px}
        .signature{display:flex;justify-content:space-between;margin-top:40px;padding-top:24px;border-top:1px solid #e5e7eb}
        .sig-block{text-align:center;width:200px}
        .sig-line{border-top:1px solid #0b1326;margin-bottom:6px;padding-top:32px}
        .sig-label{font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:0.1em}
        .footer-fine{margin-top:24px;text-align:center;color:#9ca3af;font-size:9px;letter-spacing:0.1em;text-transform:uppercase}
      </style></head><body>
      <div class="page">
        <div class="brand-bar"></div>

        <div class="header">
          <div class="brand">
            <div class="logo">IB</div>
            <div>
              <div class="brand-name">Inventory Box Systems</div>
              <div class="brand-sub">Industrial Instrumentation Solutions</div>
            </div>
          </div>
          <div class="invoice-meta">
            <h1>INVOICE</h1>
            <div style="font-family:monospace;font-size:14px;font-weight:700;color:#0b1326;margin-top:4px">${invoiceNum}</div>
            <div class="pill pill-${viewOrder.status.toLowerCase()}">${viewOrder.status}</div>
          </div>
        </div>

        <div class="from-block">
          <strong>Inventory Box Systems Pvt. Ltd.</strong>
          204, Tech Park Tower, Whitefield, Bengaluru, Karnataka 560066, India<br/>
          GSTIN: 29AABCI1234L1ZK · CIN: U72200KA2022PTC123456 · PAN: AABCI1234L<br/>
          accounts@inventorybox.io · +91 80 4000 5000
        </div>

        <div class="grid">
          <div>
            <div class="label">Bill To</div>
            <div class="val">
              <strong>${viewOrder.customer}</strong>
              ${cust ? `${cust.contact}<br/>${cust.email}<br/>${cust.phone}<br/>GSTIN: <span style="font-family:monospace">${cust.gstin}</span>` : ""}
            </div>
          </div>
          <div>
            <div class="label">Ship To</div>
            <div class="val">
              ${addr.line1}${addr.line2 ? `<br/>${addr.line2}` : ""}<br/>
              ${addr.city}, ${addr.state} ${addr.pincode}<br/>
              ${addr.country}
            </div>
          </div>
          <div>
            <div class="label">Invoice Date</div>
            <div class="val" style="margin-bottom:10px">${viewOrder.date}</div>
            <div class="label">Payment Due</div>
            <div class="val" style="margin-bottom:10px">${dueDate}</div>
            <div class="label">Tracking</div>
            <div class="val muted" style="font-family:monospace">${viewOrder.tracking.trackingNumber || "—"}<br/>via ${viewOrder.tracking.carrier || "—"}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr><th class="num" style="width:32px">#</th><th>Description</th><th class="num" style="width:60px">Qty</th><th class="num" style="width:110px">Unit Price</th><th class="num" style="width:120px">Amount</th></tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>

        <div class="totals">
          <table class="totals-table">
            <tr><td>Subtotal</td><td>${formatCurrency(subtotal)}</td></tr>
            <tr><td>CGST (9%)</td><td>${formatCurrency(cgst)}</td></tr>
            <tr><td>SGST (9%)</td><td>${formatCurrency(sgst)}</td></tr>
            <tr class="grand"><td>Grand Total</td><td>${formatCurrency(grandTotal)}</td></tr>
          </table>
        </div>

        ${viewOrder.notes ? `<div class="terms" style="margin-top:24px"><strong>Order Notes</strong>${viewOrder.notes}</div>` : ""}

        <div class="terms">
          <strong>Payment Terms</strong>
          Net 30 days from invoice date. Payments accepted via NEFT / RTGS / UPI to A/c: <strong style="font-family:monospace;font-weight:600">HDFC Bank · 50100123456789 · IFSC HDFC0000123</strong>. A late fee of 1.5% per month applies on overdue amounts. All disputes are subject to Bengaluru jurisdiction.
        </div>

        <div class="signature">
          <div class="sig-block">
            <div class="sig-line"></div>
            <div class="sig-label">Customer Signature</div>
          </div>
          <div class="sig-block">
            <div class="sig-line"></div>
            <div class="sig-label">For Inventory Box Systems</div>
          </div>
        </div>

        <div class="footer-fine">This is a computer-generated invoice and does not require a physical signature. Generated ${new Date().toLocaleString()}</div>
      </div>
      <script>window.onload=function(){window.print();};</script>
      </body></html>`;
    const w = window.open("", "_blank", "width=900,height=900");
    if (w) { w.document.write(html); w.document.close(); }
  };

  const statusBadge = (status: string) => {
    if (status === "Completed") return { bg: "bg-emerald-500/10 text-emerald-400", dot: "bg-emerald-400" };
    if (status === "Pending") return { bg: "bg-tertiary/10 text-tertiary", dot: "bg-tertiary" };
    return { bg: "bg-error/10 text-error", dot: "bg-error" };
  };

  const shipmentBadge = (s: string) => {
    if (s === "Delivered") return "bg-emerald-500/10 text-emerald-400";
    if (s === "In Transit" || s === "Out for Delivery") return "bg-primary/10 text-primary";
    if (s === "Picked Up") return "bg-tertiary/10 text-tertiary";
    return "bg-surface-container-highest text-on-surface-variant";
  };

  const chartHeights = [35, 50, 40, 65, 55, 80, 70, 90, 60, 75];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];

  const topSuppliers = useMemo(() => {
    const palette = ["bg-emerald-400", "bg-primary", "bg-tertiary"];
    return [...suppliersList]
      .filter((s) => s.status === "Active")
      .sort((a, b) => b.reliability - a.reliability)
      .slice(0, 3)
      .map((s, i) => ({ name: s.name, pct: s.reliability, color: palette[i] || "bg-primary" }));
  }, [suppliersList]);

  return (
    <>
      <TopBar subtitle="Orders Management" />
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          {[
            { label: "Total Orders", value: stats.total.toLocaleString(), sub: "+12.5% vs last month", subColor: "text-emerald-400", icon: "trending_up" },
            { label: "Pending", value: stats.pending.toString(), sub: "Requires immediate action", subColor: "text-on-surface-variant/60", valueColor: "text-tertiary" },
            { label: "Completed", value: stats.completed.toString(), sub: "Successfully fulfilled", subColor: "text-on-surface-variant/60" },
            { label: "Avg. Revenue", value: formatCurrency(stats.avgRevenue), sub: "Per order basis", subColor: "text-indigo-400" },
          ].map((card) => (
            <div key={card.label} className="glass-card p-6 rounded-xl border border-outline-variant/5">
              <p className="uppercase tracking-widest text-on-surface-variant text-[10px] mb-2 font-semibold">{card.label}</p>
              <h3 className={`text-3xl font-black tracking-tight ${card.valueColor || "text-on-surface"}`}>{card.value}</h3>
              <p className={`text-xs mt-2 flex items-center gap-1 ${card.subColor}`}>
                {card.icon && <span className="material-symbols-outlined text-sm">{card.icon}</span>}
                {card.sub}
              </p>
            </div>
          ))}
        </div>

        {/* Orders Table Section */}
        <section className="bg-surface-container rounded-xl overflow-hidden shadow-2xl">
          <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-on-surface">Recent Transactional History</h2>
              <p className="text-sm text-on-surface-variant/70">Manage and monitor your global distribution cycle.</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <input className="bg-surface-container-highest border-none rounded-lg py-2 pl-10 pr-4 text-sm text-on-surface w-48 focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/50" placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} />
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
              </div>
              <div className="flex items-center bg-surface-container-highest rounded-lg overflow-hidden">
                <button onClick={() => setDateFilter("all")} className={`px-3 py-2 text-sm font-medium transition-colors ${dateFilter === "all" ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-on-surface"}`}>All Time</button>
                <button onClick={() => setDateFilter("today")} className={`px-3 py-2 text-sm font-medium transition-colors ${dateFilter === "today" ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-on-surface"}`}>Today</button>
              </div>
              <select className="bg-surface-container-highest border-none text-sm rounded-lg text-on-surface font-medium focus:ring-0 px-4 py-2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="All">All Status</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <button onClick={() => setShowCreate(true)} className="bg-gradient-to-r from-primary to-primary-container text-on-primary-container px-5 py-2 rounded-lg text-sm font-bold shadow-lg shadow-primary/20 flex items-center gap-2 active:scale-95 transition-all">
                <span className="material-symbols-outlined text-lg">add</span> Create Order
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high/50">
                  <th className="pl-6 pr-2 py-4 w-10">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded text-primary focus:ring-primary/50 bg-surface-container-highest border-outline-variant cursor-pointer"
                      checked={allFilteredSelected}
                      ref={(el) => { if (el) el.indeterminate = someFilteredSelected && !allFilteredSelected; }}
                      onChange={toggleAllFiltered}
                      aria-label="Select all"
                    />
                  </th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Order ID</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Customer</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Date</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Status</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant text-right">Total Amount</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {paginated.map((order) => {
                  const sb = statusBadge(order.status);
                  const isSelected = selectedIds.has(order.id);
                  return (
                    <tr key={order.id} className={`transition-colors group ${isSelected ? "bg-primary/[0.04]" : "hover:bg-surface-container-high"}`}>
                      <td className="pl-6 pr-2 py-5 w-10">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded text-primary focus:ring-primary/50 bg-surface-container-highest border-outline-variant cursor-pointer"
                          checked={isSelected}
                          onChange={() => toggleOne(order.id)}
                          aria-label={`Select ${order.id}`}
                        />
                      </td>
                      <td className="px-6 py-5 text-sm font-mono text-indigo-400">{order.id}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full bg-${order.color}-500/10 flex items-center justify-center text-[10px] font-bold text-${order.color}-300`}>
                            {order.initials}
                          </div>
                          <span className="text-sm font-medium">{order.customer}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-on-surface-variant">{order.date}</td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${sb.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sb.dot}`} /> {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm font-bold text-on-surface text-right">{formatCurrency(order.amount)}</td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setViewOrder(order)} title="View / Edit" className="w-8 h-8 rounded-lg bg-surface-container-highest text-on-surface-variant hover:text-primary transition-all flex items-center justify-center">
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>
                          {order.status !== "Cancelled" && (
                            <button onClick={() => handleQuickCancel(order)} title="Quick cancel" className="w-8 h-8 rounded-lg bg-surface-container-highest text-on-surface-variant hover:text-tertiary transition-all flex items-center justify-center">
                              <span className="material-symbols-outlined text-[18px]">block</span>
                            </button>
                          )}
                          <button onClick={() => setDeleteTarget(order)} title="Delete" className="w-8 h-8 rounded-lg bg-surface-container-highest text-on-surface-variant hover:text-error transition-all flex items-center justify-center">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-4xl mb-2 block opacity-30">shopping_cart</span>
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-6 bg-surface-container-low border-t border-outline-variant/10 flex justify-between items-center">
            <p className="text-xs text-on-surface-variant">Showing {paginated.length} of {filtered.length} results</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="w-8 h-8 rounded bg-surface-container-highest flex items-center justify-center text-on-surface hover:bg-surface-bright transition-colors disabled:opacity-30">
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((p) => (
                <button key={p} onClick={() => setPage(p)} className={`px-3 text-xs font-bold cursor-pointer ${p === page ? "text-primary" : "text-on-surface-variant hover:text-on-surface"}`}>{p}</button>
              ))}
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="w-8 h-8 rounded bg-surface-container-highest flex items-center justify-center text-on-surface hover:bg-surface-bright transition-colors disabled:opacity-30">
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </div>
          </div>
        </section>

        {/* Bottom Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-10">
          <div className="lg:col-span-2 glass-card p-6 rounded-xl border border-outline-variant/5">
            <h3 className="font-bold text-on-surface mb-1">Order Volume Projection</h3>
            <p className="text-xs text-on-surface-variant mb-6">Monthly order trends</p>
            <div className="h-48 flex items-end gap-2">
              {chartHeights.map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-gradient-to-t from-primary/10 to-primary/50 rounded-t-lg"
                    style={{ height: `${h}%`, transformOrigin: "bottom", animation: `grow-up 0.6s ease-out ${i * 0.08}s both` }}
                  />
                  <span className="text-[9px] text-on-surface-variant/50 font-bold">{months[i]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-outline-variant/5">
            <h3 className="font-bold text-on-surface mb-1">Supplier Performance</h3>
            <p className="text-xs text-on-surface-variant mb-6">Reliability metrics</p>
            <div className="space-y-5">
              {topSuppliers.length === 0 && (
                <p className="text-xs text-on-surface-variant text-center py-4">No active suppliers yet.</p>
              )}
              {topSuppliers.map((s) => (
                <div key={s.name}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-on-surface truncate pr-2">{s.name}</span>
                    <span className="text-xs font-bold text-on-surface">{s.pct}%</span>
                  </div>
                  <div className="w-full bg-surface-container-highest rounded-full h-2">
                    <div className={`${s.color} h-2 rounded-full transition-all duration-1000`} style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create Order Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative bg-surface-container-low rounded-2xl shadow-2xl border border-outline-variant/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8" style={{ animation: "fade-in 0.2s ease-out" }}>
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <h3 className="text-xl font-bold text-on-surface mb-6">Create New Order</h3>
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Customer</label>
                <select className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50" value={formCustomer} onChange={(e) => handleCustomerSelect(e.target.value)}>
                  <option value="">Select customer</option>
                  {customers.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                  <option value="__other__">Other (new customer)</option>
                </select>
                {formCustomer === "__other__" && (
                  <input className="mt-2 w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50 placeholder:text-outline/50" placeholder="Customer name" value={formCustomerCustom} onChange={(e) => setFormCustomerCustom(e.target.value)} />
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Line Items</label>
                  <button type="button" onClick={() => setFormItems([...formItems, { productId: "", quantity: "1" }])} className="text-xs font-bold text-primary hover:text-primary-fixed-dim flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">add</span> Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  {formItems.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <select className="flex-1 bg-surface-container-highest border-none text-on-surface rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/50" value={item.productId} onChange={(e) => {
                        const next = [...formItems]; next[idx] = { ...next[idx], productId: e.target.value }; setFormItems(next);
                      }}>
                        <option value="">Select a product</option>
                        {products.map((p) => (<option key={p.id} value={p.id}>{p.name} - {formatCurrency(p.price)}</option>))}
                      </select>
                      <input type="number" min="1" className="w-20 bg-surface-container-highest border-none text-on-surface rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/50" value={item.quantity} onChange={(e) => {
                        const next = [...formItems]; next[idx] = { ...next[idx], quantity: e.target.value }; setFormItems(next);
                      }} />
                      {formItems.length > 1 && (
                        <button type="button" onClick={() => setFormItems(formItems.filter((_, i) => i !== idx))} className="text-on-surface-variant hover:text-error p-2">
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Date</label>
                <input type="date" className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Shipping Address</label>
                <div className="grid grid-cols-2 gap-2">
                  <input className="col-span-2 bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 placeholder:text-outline/50" placeholder="Address line 1" value={formAddress.line1} onChange={(e) => setFormAddress({ ...formAddress, line1: e.target.value })} />
                  <input className="col-span-2 bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 placeholder:text-outline/50" placeholder="Address line 2 (optional)" value={formAddress.line2 || ""} onChange={(e) => setFormAddress({ ...formAddress, line2: e.target.value })} />
                  <input className="bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 placeholder:text-outline/50" placeholder="City" value={formAddress.city} onChange={(e) => setFormAddress({ ...formAddress, city: e.target.value })} />
                  <input className="bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 placeholder:text-outline/50" placeholder="State" value={formAddress.state} onChange={(e) => setFormAddress({ ...formAddress, state: e.target.value })} />
                  <input className="bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 placeholder:text-outline/50" placeholder="Pincode" value={formAddress.pincode} onChange={(e) => setFormAddress({ ...formAddress, pincode: e.target.value })} />
                  <input className="bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 placeholder:text-outline/50" placeholder="Country" value={formAddress.country} onChange={(e) => setFormAddress({ ...formAddress, country: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Notes</label>
                <textarea rows={2} className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 placeholder:text-outline/50 resize-none" placeholder="Special instructions, delivery notes..." value={formNotes} onChange={(e) => setFormNotes(e.target.value)} />
              </div>

              <div className="bg-surface-container-highest rounded-lg p-4 flex justify-between items-center">
                <span className="text-sm text-on-surface-variant">Estimated Total</span>
                <span className="text-lg font-black text-primary">{formatCurrency(calcDraftAmount)}</span>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => { setShowCreate(false); resetCreate(); }} className="px-6 py-3 rounded-lg bg-surface-container-highest text-on-surface-variant font-medium hover:bg-surface-bright transition-colors">Cancel</button>
              <button onClick={handleCreate} className="px-6 py-3 rounded-lg bg-gradient-to-br from-primary to-primary-container text-on-primary-container font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all">Create Order</button>
            </div>
          </div>
        </div>
      )}

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
          <button onClick={() => setShowBulkStatus(true)} className="px-3 py-1.5 rounded-lg text-sm font-medium text-on-surface hover:bg-surface-container-highest transition-colors flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base">flag</span> Change Status
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
            <h3 className="text-lg font-bold text-on-surface mb-2">Delete {selectedIds.size} Orders?</h3>
            <p className="text-sm text-on-surface-variant mb-6">This will permanently delete the selected orders along with their event history. This action cannot be undone.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setShowBulkDelete(false)} className="px-6 py-3 rounded-lg bg-surface-container-highest text-on-surface-variant font-medium hover:bg-surface-bright transition-colors">Cancel</button>
              <button onClick={handleBulkDelete} className="px-6 py-3 rounded-lg bg-error-container text-on-error-container font-bold hover:brightness-110 active:scale-95 transition-all">Delete {selectedIds.size}</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Status Change */}
      {showBulkStatus && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowBulkStatus(false)} />
          <div className="relative bg-surface-container-low rounded-2xl shadow-2xl border border-outline-variant/10 w-full max-w-md p-8" style={{ animation: "fade-in 0.2s ease-out" }}>
            <h3 className="text-lg font-bold text-on-surface mb-2">Change Status</h3>
            <p className="text-sm text-on-surface-variant mb-5">Set <strong className="text-on-surface">{selectedIds.size}</strong> selected order{selectedIds.size === 1 ? "" : "s"} to a new status.</p>
            <select className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/50 mb-6 font-bold" value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value as Order["status"])}>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowBulkStatus(false)} className="px-6 py-3 rounded-lg bg-surface-container-highest text-on-surface-variant font-medium hover:bg-surface-bright transition-colors">Cancel</button>
              <button onClick={handleBulkStatus} className="px-6 py-3 rounded-lg bg-gradient-to-br from-primary to-primary-container text-on-primary-container font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all">Apply</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-surface-container-low rounded-2xl shadow-2xl border border-outline-variant/10 w-full max-w-sm p-8 text-center" style={{ animation: "fade-in 0.2s ease-out" }}>
            <span className="material-symbols-outlined text-error text-5xl mb-4">warning</span>
            <h3 className="text-lg font-bold text-on-surface mb-2">Delete Order?</h3>
            <p className="text-sm text-on-surface-variant mb-6">Permanently delete <strong className="font-mono text-on-surface">{deleteTarget.id}</strong> from <strong className="text-on-surface">{deleteTarget.customer}</strong>? This action cannot be undone.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-6 py-3 rounded-lg bg-surface-container-highest text-on-surface-variant font-medium hover:bg-surface-bright transition-colors">Cancel</button>
              <button onClick={handleDelete} className="px-6 py-3 rounded-lg bg-error-container text-on-error-container font-bold hover:brightness-110 active:scale-95 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* View Order Modal — full detail */}
      {viewOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewOrder(null)} />
          <div className="relative bg-surface-container-low rounded-2xl shadow-2xl border border-outline-variant/10 w-full max-w-3xl max-h-[92vh] overflow-y-auto" style={{ animation: "fade-in 0.2s ease-out" }}>
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            {/* Header */}
            <div className="p-6 md:p-8 border-b border-outline-variant/10 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">Order Details</span>
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusBadge(viewOrder.status).bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusBadge(viewOrder.status).dot}`} /> {viewOrder.status}
                  </span>
                </div>
                <h3 className="text-2xl font-black tracking-tight text-on-surface font-mono">{viewOrder.id}</h3>
                <p className="text-sm text-on-surface-variant mt-1">Placed on {viewOrder.date}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Total</p>
                <p className="text-2xl font-black text-primary">{formatCurrency(viewOrder.amount)}</p>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {/* Customer */}
              {(() => {
                const cust = customers.find((c) => c.name === viewOrder.customer);
                return (
                  <div className="bg-surface-container rounded-xl p-4">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-full bg-${viewOrder.color}-500/10 flex items-center justify-center text-sm font-bold text-${viewOrder.color}-300`}>
                        {viewOrder.initials}
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Customer</p>
                        <p className="text-base font-bold text-on-surface">{viewOrder.customer}</p>
                        {cust && <p className="text-xs text-on-surface-variant mt-0.5">{cust.contact} · {cust.industry}</p>}
                      </div>
                      {cust && (
                        <a href="/customers" className="text-[11px] font-bold uppercase tracking-widest text-primary hover:underline">View Profile</a>
                      )}
                    </div>
                    {cust && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3 pt-3 border-t border-outline-variant/10">
                        <a href={`mailto:${cust.email}`} className="flex items-center gap-2 text-xs text-on-surface hover:text-primary transition-colors min-w-0">
                          <span className="material-symbols-outlined text-base text-on-surface-variant">mail</span>
                          <span className="truncate">{cust.email}</span>
                        </a>
                        <a href={`tel:${cust.phone}`} className="flex items-center gap-2 text-xs text-on-surface hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-base text-on-surface-variant">call</span>
                          <span>{cust.phone}</span>
                        </a>
                        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                          <span className="material-symbols-outlined text-base">badge</span>
                          <span className="font-mono">{cust.gstin}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Line Items */}
              <div>
                <h4 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">inventory_2</span> Line Items
                </h4>
                <div className="bg-surface-container rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-surface-container-high/40 text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                        <th className="px-4 py-3 text-left">Product</th>
                        <th className="px-4 py-3 text-right w-20">Qty</th>
                        <th className="px-4 py-3 text-right w-32">Unit Price</th>
                        <th className="px-4 py-3 text-right w-32">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/5">
                      {viewOrder.items.length === 0 && (
                        <tr><td colSpan={4} className="px-4 py-6 text-center text-on-surface-variant text-xs">No line items recorded for this order.</td></tr>
                      )}
                      {viewOrder.items.map((it, i) => (
                        <tr key={i}>
                          <td className="px-4 py-3">
                            <div className="font-medium text-on-surface">{it.name}</div>
                            <div className="text-[11px] font-mono text-on-surface-variant/70">{it.sku}</div>
                          </td>
                          <td className="px-4 py-3 text-right text-on-surface">{it.quantity}</td>
                          <td className="px-4 py-3 text-right text-on-surface-variant">{formatCurrency(it.unitPrice)}</td>
                          <td className="px-4 py-3 text-right font-bold text-on-surface">{formatCurrency(it.unitPrice * it.quantity)}</td>
                        </tr>
                      ))}
                      <tr className="bg-surface-container-high/30">
                        <td colSpan={3} className="px-4 py-3 text-right text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Total</td>
                        <td className="px-4 py-3 text-right font-black text-primary">{formatCurrency(viewOrder.amount)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Shipping + Tracking grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-surface-container rounded-xl p-4">
                  <h4 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">location_on</span> Shipping Address
                  </h4>
                  {viewOrder.shippingAddress.line1 ? (
                    <div className="text-sm text-on-surface-variant leading-relaxed">
                      <p className="text-on-surface font-medium">{viewOrder.shippingAddress.line1}</p>
                      {viewOrder.shippingAddress.line2 && <p>{viewOrder.shippingAddress.line2}</p>}
                      <p>{viewOrder.shippingAddress.city}, {viewOrder.shippingAddress.state} {viewOrder.shippingAddress.pincode}</p>
                      <p>{viewOrder.shippingAddress.country}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-on-surface-variant/60 italic">No address on file.</p>
                  )}
                </div>

                <div className="bg-surface-container rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">local_shipping</span> Delivery Tracking
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Carrier</p>
                      <input className="w-full bg-surface-container-highest border-none text-on-surface rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-primary/50" value={editTracking.carrier} onChange={(e) => setEditTracking({ ...editTracking, carrier: e.target.value })} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">ETA</p>
                      <input className="w-full bg-surface-container-highest border-none text-on-surface rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-primary/50" value={editTracking.eta} onChange={(e) => setEditTracking({ ...editTracking, eta: e.target.value })} />
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Tracking #</p>
                      <input className="w-full bg-surface-container-highest border-none text-on-surface rounded-md px-2 py-1.5 text-sm font-mono focus:ring-2 focus:ring-primary/50" value={editTracking.trackingNumber} onChange={(e) => setEditTracking({ ...editTracking, trackingNumber: e.target.value })} />
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Shipment Status</p>
                      <select className={`w-full bg-surface-container-highest border-none rounded-md px-2 py-1.5 text-sm font-bold focus:ring-2 focus:ring-primary/50 ${shipmentBadge(editTracking.shipmentStatus)}`} value={editTracking.shipmentStatus} onChange={(e) => setEditTracking({ ...editTracking, shipmentStatus: e.target.value as OrderTracking["shipmentStatus"] })}>
                        <option value="Not Shipped">Not Shipped</option>
                        <option value="Picked Up">Picked Up</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status edit + Notes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-surface-container rounded-xl p-4">
                  <h4 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">flag</span> Order Status
                  </h4>
                  <select className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-primary/50" value={editStatus} onChange={(e) => setEditStatus(e.target.value as Order["status"])}>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="md:col-span-2 bg-surface-container rounded-xl p-4">
                  <h4 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">sticky_note_2</span> Order Notes
                  </h4>
                  <textarea rows={2} className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 resize-none placeholder:text-outline/50" placeholder="Add internal notes..." value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-surface-container rounded-xl p-4">
                <h4 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">timeline</span> Order Timeline
                  <span className="text-[10px] font-medium text-on-surface-variant ml-auto">{orderEvents.length} event{orderEvents.length === 1 ? "" : "s"}</span>
                </h4>
                {orderEvents.length === 0 ? (
                  <p className="text-xs text-on-surface-variant/60 italic text-center py-4">No events yet — changes you save will appear here.</p>
                ) : (
                  <ol className="relative ml-3 border-l-2 border-outline-variant/20 space-y-4 pl-5">
                    {orderEvents.map((ev) => {
                      const icon = ev.type === "Created" ? "add_circle" : ev.type === "Status Changed" ? "swap_horiz" : ev.type === "Tracking Updated" ? "local_shipping" : ev.type === "Note Updated" ? "sticky_note_2" : "edit";
                      const dotColor = ev.type === "Created" ? "bg-emerald-400" : ev.type === "Status Changed" ? "bg-primary" : ev.type === "Tracking Updated" ? "bg-tertiary" : "bg-on-surface-variant";
                      return (
                        <li key={ev.id} className="relative">
                          <span className={`absolute -left-[27px] top-1 w-3 h-3 rounded-full ring-4 ring-surface-container ${dotColor}`} />
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="material-symbols-outlined text-[14px] text-on-surface-variant">{icon}</span>
                                <p className="text-xs font-bold text-on-surface">{ev.type}</p>
                              </div>
                              <p className="text-xs text-on-surface-variant leading-relaxed">{ev.message}</p>
                              <p className="text-[10px] text-on-surface-variant/60 mt-1">{ev.byUser} · {new Date(ev.timestamp).toLocaleString()}</p>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            </div>

            {/* Footer actions */}
            <div className="px-6 md:px-8 py-4 bg-surface-container/50 border-t border-outline-variant/10 flex flex-wrap items-center justify-end gap-3 sticky bottom-0">
              {savedFlash && <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 mr-auto"><span className="material-symbols-outlined text-base">check_circle</span> Saved</span>}
              <button onClick={handlePrintInvoice} className="px-4 py-2 rounded-lg bg-surface-container-highest text-on-surface font-medium hover:bg-surface-bright transition-colors flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-base">download</span> Print Invoice
              </button>
              <button onClick={() => setViewOrder(null)} className="px-4 py-2 rounded-lg bg-surface-container-highest text-on-surface-variant font-medium hover:bg-surface-bright transition-colors text-sm">Close</button>
              <button onClick={handleSaveOrder} className="px-5 py-2 rounded-lg bg-gradient-to-br from-primary to-primary-container text-on-primary-container font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-base">save</span> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
