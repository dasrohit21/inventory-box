"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import { getActivityLog, type ActivityItem } from "@/lib/data";

const FILTERS: { id: ActivityItem["type"] | "all"; label: string; icon: string }[] = [
  { id: "all", label: "All", icon: "list" },
  { id: "alert", label: "Alerts", icon: "warning" },
  { id: "order", label: "Orders", icon: "shopping_cart" },
  { id: "purchase", label: "Purchase Orders", icon: "add_shopping_cart" },
  { id: "stock", label: "Stock", icon: "inventory_2" },
  { id: "customer", label: "Customers", icon: "groups" },
  { id: "system", label: "System", icon: "system_update" },
];

export default function ActivityPage() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [filter, setFilter] = useState<ActivityItem["type"] | "all">("all");
  const [search, setSearch] = useState("");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => { setItems(getActivityLog()); }, []);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      const typeMatch = filter === "all" || it.type === filter;
      const searchMatch = !search || it.title.toLowerCase().includes(search.toLowerCase()) || it.message.toLowerCase().includes(search.toLowerCase());
      return typeMatch && searchMatch;
    });
  }, [items, filter, search]);

  const counts = useMemo(() => ({
    all: items.length,
    alert: items.filter((i) => i.type === "alert").length,
    order: items.filter((i) => i.type === "order").length,
    purchase: items.filter((i) => i.type === "purchase").length,
    stock: items.filter((i) => i.type === "stock").length,
    customer: items.filter((i) => i.type === "customer").length,
    system: items.filter((i) => i.type === "system").length,
  }), [items]);

  const markAllRead = () => setReadIds(new Set(items.map((i) => i.id)));

  return (
    <>
      <TopBar subtitle="Activity & Notifications" />
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-on-surface">Activity Feed</h2>
            <p className="text-on-surface-variant text-sm mt-1">Every notification, alert, and system event in one place.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={markAllRead} className="bg-surface-container-highest hover:bg-surface-bright text-primary text-sm px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">mark_email_read</span> Mark all read
            </button>
            <Link href="/dashboard" className="bg-surface-container-highest hover:bg-surface-bright text-on-surface text-sm px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">dashboard</span> Dashboard
            </Link>
          </div>
        </div>

        {/* Filter strip */}
        <div className="bg-surface-container rounded-xl border border-outline-variant/5 p-3 mb-6 shadow-xl flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <input className="w-full bg-surface-container-highest border-none rounded-lg py-2 pl-10 pr-4 text-sm text-on-surface focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/50" placeholder="Search activity..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
          </div>
          {FILTERS.map((f) => {
            const c = counts[f.id as keyof typeof counts] ?? 0;
            const active = filter === f.id;
            return (
              <button key={f.id} onClick={() => setFilter(f.id)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${active ? "bg-primary text-on-primary" : "bg-surface-container-highest text-on-surface-variant hover:text-on-surface"}`}>
                <span className="material-symbols-outlined text-base">{f.icon}</span>
                {f.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? "bg-on-primary/20" : "bg-surface-container"}`}>{c}</span>
              </button>
            );
          })}
        </div>

        {/* Feed */}
        <div className="bg-surface-container rounded-xl border border-outline-variant/5 shadow-xl overflow-hidden">
          {filtered.length === 0 && (
            <div className="py-20 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl block opacity-30 mb-3">notifications_off</span>
              <p className="text-sm">No activity matching your filters.</p>
            </div>
          )}
          <ul className="divide-y divide-outline-variant/5">
            {filtered.map((it) => {
              const isRead = readIds.has(it.id);
              return (
                <li key={it.id}>
                  <Link href={it.link} onClick={() => setReadIds((p) => new Set(p).add(it.id))} className={`flex items-start gap-4 px-6 py-4 hover:bg-surface-container-high/40 transition-colors ${isRead ? "" : "bg-primary/[0.02]"}`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${it.iconColor}`}>
                      <span className="material-symbols-outlined text-lg">{it.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={`text-sm font-bold ${isRead ? "text-on-surface-variant" : "text-on-surface"}`}>{it.title}</p>
                        <span className="text-[9px] uppercase tracking-widest font-bold text-on-surface-variant/60 bg-surface-container-highest px-2 py-0.5 rounded-full">{it.type}</span>
                        {!isRead && <span className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      <p className="text-xs text-on-surface-variant leading-relaxed">{it.message}</p>
                      <p className="text-[10px] text-on-surface-variant/50 mt-1">{it.time}</p>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant/30 mt-2 shrink-0">chevron_right</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </>
  );
}
