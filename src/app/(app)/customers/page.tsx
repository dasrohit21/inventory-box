"use client";

import { useEffect, useMemo, useState } from "react";
import TopBar from "@/components/TopBar";
import {
  getCustomers,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerStats,
  formatCurrency,
  type Customer,
  type ShippingAddress,
} from "@/lib/data";

const EMPTY_ADDRESS: ShippingAddress = { line1: "", line2: "", city: "", state: "", pincode: "", country: "India" };

const EMPTY_FORM: Omit<Customer, "id" | "initials"> = {
  name: "",
  contact: "",
  email: "",
  phone: "",
  industry: "",
  gstin: "",
  address: EMPTY_ADDRESS,
  status: "Active",
  since: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
  color: "indigo",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const perPage = 6;

  const [showCreate, setShowCreate] = useState(false);
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<typeof EMPTY_FORM>(EMPTY_FORM);

  useEffect(() => { setCustomers(getCustomers()); }, []);

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.contact.toLowerCase().includes(search.toLowerCase()) || c.industry.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "All" || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [customers, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const stats = useMemo(() => {
    const all = customers;
    let topName = "—";
    let topValue = 0;
    all.forEach((c) => {
      const s = typeof window !== "undefined" ? getCustomerStats(c.name) : { lifetimeValue: 0 };
      if (s.lifetimeValue > topValue) { topValue = s.lifetimeValue; topName = c.name; }
    });
    return {
      total: all.length,
      active: all.filter((c) => c.status === "Active").length,
      onHold: all.filter((c) => c.status === "On Hold").length,
      topName,
      topValue,
    };
  }, [customers]);

  const statusBadge = (status: string) => {
    if (status === "Active") return "bg-emerald-500/10 text-emerald-400";
    if (status === "On Hold") return "bg-tertiary/10 text-tertiary";
    return "bg-error/10 text-error";
  };

  const handleSubmit = () => {
    if (!form.name) return;
    if (editing && viewCustomer) {
      updateCustomer(viewCustomer.id, form);
    } else {
      addCustomer(form);
    }
    setCustomers(getCustomers());
    setShowCreate(false);
    setEditing(false);
    setForm(EMPTY_FORM);
  };

  const startEdit = (c: Customer) => {
    setForm({
      name: c.name, contact: c.contact, email: c.email, phone: c.phone,
      industry: c.industry, gstin: c.gstin, address: c.address, status: c.status, since: c.since, color: c.color,
    });
    setEditing(true);
    setShowCreate(true);
  };

  const handleDelete = (id: number) => {
    deleteCustomer(id);
    setCustomers(getCustomers());
    setViewCustomer(null);
  };

  const customerStats = viewCustomer ? getCustomerStats(viewCustomer.name) : null;

  return (
    <>
      <TopBar subtitle="Customers" />
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-on-surface">Customer Directory</h2>
            <p className="text-on-surface-variant text-sm mt-1">Manage B2B clients, contact details, and order history.</p>
          </div>
          <button onClick={() => { setForm(EMPTY_FORM); setEditing(false); setShowCreate(true); }} className="bg-gradient-to-r from-primary to-primary-container text-on-primary-container px-5 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-primary/20 flex items-center gap-2 active:scale-95 transition-all w-fit">
            <span className="material-symbols-outlined text-lg">person_add</span> Add Customer
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="glass-card p-6 rounded-xl border border-outline-variant/5">
            <p className="uppercase tracking-widest text-on-surface-variant text-[10px] mb-2 font-semibold">Total Customers</p>
            <h3 className="text-3xl font-black tracking-tight text-on-surface">{stats.total}</h3>
            <p className="text-xs mt-2 text-on-surface-variant/60 flex items-center gap-1"><span className="material-symbols-outlined text-sm">groups</span> Across all industries</p>
          </div>
          <div className="glass-card p-6 rounded-xl border border-outline-variant/5">
            <p className="uppercase tracking-widest text-on-surface-variant text-[10px] mb-2 font-semibold">Active</p>
            <h3 className="text-3xl font-black tracking-tight text-emerald-400">{stats.active}</h3>
            <p className="text-xs mt-2 text-on-surface-variant/60">Currently transacting</p>
          </div>
          <div className="glass-card p-6 rounded-xl border border-outline-variant/5">
            <p className="uppercase tracking-widest text-on-surface-variant text-[10px] mb-2 font-semibold">On Hold</p>
            <h3 className="text-3xl font-black tracking-tight text-tertiary">{stats.onHold}</h3>
            <p className="text-xs mt-2 text-on-surface-variant/60">Pending review</p>
          </div>
          <div className="glass-card p-6 rounded-xl border border-outline-variant/5">
            <p className="uppercase tracking-widest text-on-surface-variant text-[10px] mb-2 font-semibold">Top Customer (LTV)</p>
            <h3 className="text-lg font-black tracking-tight text-primary truncate">{stats.topName}</h3>
            <p className="text-xs mt-2 text-on-surface-variant/60">{formatCurrency(stats.topValue)} lifetime</p>
          </div>
        </div>

        {/* Search/Filter Bar */}
        <section className="bg-surface-container rounded-xl overflow-hidden shadow-2xl">
          <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-on-surface">All Customers</h2>
              <p className="text-sm text-on-surface-variant/70">Click a row to view full profile and order history.</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <input className="bg-surface-container-highest border-none rounded-lg py-2 pl-10 pr-4 text-sm text-on-surface w-56 focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/50" placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} />
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
              </div>
              <select className="bg-surface-container-highest border-none text-sm rounded-lg text-on-surface font-medium focus:ring-0 px-4 py-2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="On Hold">On Hold</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high/50">
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Customer</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Contact</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant hidden lg:table-cell">Industry</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant text-center">Orders</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant text-right">Lifetime Value</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {paginated.map((c) => {
                  const cs = getCustomerStats(c.name);
                  return (
                    <tr key={c.id} onClick={() => setViewCustomer(c)} className="hover:bg-surface-container-high transition-colors group cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-full bg-${c.color}-500/10 flex items-center justify-center text-xs font-bold text-${c.color}-300`}>
                            {c.initials}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-on-surface">{c.name}</p>
                            <p className="text-[11px] text-on-surface-variant/60">Since {c.since}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-on-surface">{c.contact}</p>
                        <p className="text-[11px] text-on-surface-variant/60">{c.email}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant hidden lg:table-cell">{c.industry}</td>
                      <td className="px-6 py-4 text-sm text-center text-on-surface font-bold">{cs.totalOrders}</td>
                      <td className="px-6 py-4 text-sm font-bold text-primary text-right">{formatCurrency(cs.lifetimeValue)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusBadge(c.status)}`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-4xl mb-2 block opacity-30">person_off</span>
                      No customers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-6 bg-surface-container-low border-t border-outline-variant/10 flex justify-between items-center">
            <p className="text-xs text-on-surface-variant">Showing {paginated.length} of {filtered.length} customers</p>
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
      </div>

      {/* Customer Detail Modal */}
      {viewCustomer && customerStats && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewCustomer(null)} />
          <div className="relative bg-surface-container-low rounded-2xl shadow-2xl border border-outline-variant/10 w-full max-w-3xl max-h-[92vh] overflow-y-auto" style={{ animation: "fade-in 0.2s ease-out" }}>
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            <div className="p-6 md:p-8 border-b border-outline-variant/10">
              <div className="flex items-start gap-4">
                <div className={`h-14 w-14 rounded-full bg-${viewCustomer.color}-500/10 flex items-center justify-center text-base font-bold text-${viewCustomer.color}-300`}>
                  {viewCustomer.initials}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-black tracking-tight text-on-surface">{viewCustomer.name}</h3>
                  <p className="text-sm text-on-surface-variant mt-1">{viewCustomer.industry} · Customer since {viewCustomer.since}</p>
                </div>
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusBadge(viewCustomer.status)}`}>{viewCustomer.status}</span>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {/* KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-surface-container rounded-xl p-3 text-center">
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Orders</p>
                  <p className="text-xl font-black text-on-surface mt-1">{customerStats.totalOrders}</p>
                </div>
                <div className="bg-surface-container rounded-xl p-3 text-center">
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Completed</p>
                  <p className="text-xl font-black text-emerald-400 mt-1">{customerStats.completedOrders}</p>
                </div>
                <div className="bg-surface-container rounded-xl p-3 text-center">
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Pending</p>
                  <p className="text-xl font-black text-tertiary mt-1">{customerStats.pendingOrders}</p>
                </div>
                <div className="bg-surface-container rounded-xl p-3 text-center">
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Lifetime Value</p>
                  <p className="text-xl font-black text-primary mt-1">{formatCurrency(customerStats.lifetimeValue)}</p>
                </div>
              </div>

              {/* Contact & Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-surface-container rounded-xl p-4">
                  <h4 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">contact_page</span> Contact
                  </h4>
                  <div className="text-sm space-y-1.5">
                    <div className="flex justify-between"><span className="text-on-surface-variant">Person</span><span className="text-on-surface font-medium">{viewCustomer.contact}</span></div>
                    <div className="flex justify-between"><span className="text-on-surface-variant">Email</span><span className="text-on-surface font-medium truncate ml-2">{viewCustomer.email}</span></div>
                    <div className="flex justify-between"><span className="text-on-surface-variant">Phone</span><span className="text-on-surface font-medium">{viewCustomer.phone}</span></div>
                    <div className="flex justify-between"><span className="text-on-surface-variant">GSTIN</span><span className="text-on-surface font-mono text-[12px]">{viewCustomer.gstin}</span></div>
                  </div>
                </div>
                <div className="bg-surface-container rounded-xl p-4">
                  <h4 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">location_on</span> Billing Address
                  </h4>
                  <div className="text-sm text-on-surface-variant leading-relaxed">
                    <p className="text-on-surface font-medium">{viewCustomer.address.line1}</p>
                    {viewCustomer.address.line2 && <p>{viewCustomer.address.line2}</p>}
                    <p>{viewCustomer.address.city}, {viewCustomer.address.state} {viewCustomer.address.pincode}</p>
                    <p>{viewCustomer.address.country}</p>
                  </div>
                </div>
              </div>

              {/* Order History */}
              <div>
                <h4 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">history</span> Order History
                </h4>
                <div className="bg-surface-container rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-surface-container-high/40 text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                        <th className="px-4 py-3 text-left">Order ID</th>
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/5">
                      {customerStats.orders.length === 0 && (
                        <tr><td colSpan={4} className="px-4 py-6 text-center text-on-surface-variant text-xs">No orders yet.</td></tr>
                      )}
                      {customerStats.orders.map((o) => (
                        <tr key={o.id}>
                          <td className="px-4 py-3 font-mono text-indigo-400">{o.id}</td>
                          <td className="px-4 py-3 text-on-surface-variant">{o.date}</td>
                          <td className="px-4 py-3"><span className={`inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${o.status === "Completed" ? "bg-emerald-500/10 text-emerald-400" : o.status === "Pending" ? "bg-tertiary/10 text-tertiary" : "bg-error/10 text-error"}`}>{o.status}</span></td>
                          <td className="px-4 py-3 text-right font-bold text-on-surface">{formatCurrency(o.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="px-6 md:px-8 py-4 bg-surface-container/50 border-t border-outline-variant/10 flex flex-wrap items-center justify-end gap-3 sticky bottom-0">
              <button onClick={() => handleDelete(viewCustomer.id)} className="px-4 py-2 rounded-lg bg-error/10 text-error font-medium hover:bg-error/20 transition-colors text-sm flex items-center gap-2 mr-auto">
                <span className="material-symbols-outlined text-base">delete</span> Delete
              </button>
              <button onClick={() => setViewCustomer(null)} className="px-4 py-2 rounded-lg bg-surface-container-highest text-on-surface-variant font-medium hover:bg-surface-bright transition-colors text-sm">Close</button>
              <button onClick={() => { startEdit(viewCustomer); setViewCustomer(null); }} className="px-5 py-2 rounded-lg bg-gradient-to-br from-primary to-primary-container text-on-primary-container font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-base">edit</span> Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Customer Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowCreate(false); setEditing(false); }} />
          <div className="relative bg-surface-container-low rounded-2xl shadow-2xl border border-outline-variant/10 w-full max-w-2xl max-h-[92vh] overflow-y-auto p-8" style={{ animation: "fade-in 0.2s ease-out" }}>
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <h3 className="text-xl font-bold text-on-surface mb-6">{editing ? "Edit Customer" : "Add New Customer"}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Company Name</label>
                  <input className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Contact Person</label>
                  <input className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Email</label>
                  <input className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Phone</label>
                  <input className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Industry</label>
                  <input className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">GSTIN</label>
                  <input className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-primary/50" value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Billing Address</label>
                <div className="grid grid-cols-2 gap-2">
                  <input className="col-span-2 bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 placeholder:text-outline/50" placeholder="Address line 1" value={form.address.line1} onChange={(e) => setForm({ ...form, address: { ...form.address, line1: e.target.value } })} />
                  <input className="col-span-2 bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 placeholder:text-outline/50" placeholder="Address line 2 (optional)" value={form.address.line2 || ""} onChange={(e) => setForm({ ...form, address: { ...form.address, line2: e.target.value } })} />
                  <input className="bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 placeholder:text-outline/50" placeholder="City" value={form.address.city} onChange={(e) => setForm({ ...form, address: { ...form.address, city: e.target.value } })} />
                  <input className="bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 placeholder:text-outline/50" placeholder="State" value={form.address.state} onChange={(e) => setForm({ ...form, address: { ...form.address, state: e.target.value } })} />
                  <input className="bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 placeholder:text-outline/50" placeholder="Pincode" value={form.address.pincode} onChange={(e) => setForm({ ...form, address: { ...form.address, pincode: e.target.value } })} />
                  <input className="bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 placeholder:text-outline/50" placeholder="Country" value={form.address.country} onChange={(e) => setForm({ ...form, address: { ...form.address, country: e.target.value } })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Status</label>
                  <select className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Customer["status"] })}>
                    <option value="Active">Active</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">Customer Since</label>
                  <input className="w-full bg-surface-container-highest border-none text-on-surface rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50" placeholder="e.g. Jan 2024" value={form.since} onChange={(e) => setForm({ ...form, since: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => { setShowCreate(false); setEditing(false); }} className="px-6 py-3 rounded-lg bg-surface-container-highest text-on-surface-variant font-medium hover:bg-surface-bright transition-colors">Cancel</button>
              <button onClick={handleSubmit} className="px-6 py-3 rounded-lg bg-gradient-to-br from-primary to-primary-container text-on-primary-container font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all">{editing ? "Save Changes" : "Add Customer"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
