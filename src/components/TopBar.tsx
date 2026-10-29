"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getProducts, getOrders, getUser, logout, searchAll, type Product, type Order, type SearchHit } from "@/lib/data";
import Link from "next/link";

interface Notification {
  id: string;
  icon: string;
  iconColor: string;
  title: string;
  message: string;
  time: string;
  link: string;
  read: boolean;
}

function buildNotifications(products: Product[], orders: Order[]): Notification[] {
  const notifs: Notification[] = [];

  // Low stock alerts
  products
    .filter((p) => p.status === "Low Stock")
    .forEach((p) => {
      notifs.push({
        id: `low-${p.id}`,
        icon: "warning",
        iconColor: "text-amber-400 bg-amber-400/10",
        title: "Low Stock Alert",
        message: `${p.name} has only ${p.stock} units remaining.`,
        time: p.updated,
        link: "/products",
        read: false,
      });
    });

  // Out of stock alerts
  products
    .filter((p) => p.status === "Out of Stock")
    .forEach((p) => {
      notifs.push({
        id: `oos-${p.id}`,
        icon: "error",
        iconColor: "text-rose-500 bg-rose-500/10",
        title: "Out of Stock",
        message: `${p.name} is completely out of stock. Reorder needed.`,
        time: p.updated,
        link: "/products",
        read: false,
      });
    });

  // Recent pending orders
  orders
    .filter((o) => o.status === "Pending")
    .slice(0, 3)
    .forEach((o) => {
      notifs.push({
        id: `ord-${o.id}`,
        icon: "shopping_cart",
        iconColor: "text-tertiary bg-tertiary/10",
        title: "Pending Order",
        message: `Order ${o.id} from ${o.customer} is awaiting processing.`,
        time: o.date,
        link: "/orders",
        read: false,
      });
    });

  // System notification
  notifs.push({
    id: "sys-1",
    icon: "system_update",
    iconColor: "text-primary bg-primary/10",
    title: "System Update",
    message: "Inventory Management v2.4.0 is now live with new features.",
    time: "Today",
    link: "/settings",
    read: true,
  });

  return notifs;
}

export default function TopBar({ subtitle }: { subtitle?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchHighlight, setSearchHighlight] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const user = getUser();

  useEffect(() => {
    setNotifications(buildNotifications(getProducts(), getOrders()));
  }, []);

  const searchResults = useMemo(() => searchAll(searchQuery, 5), [searchQuery]);
  const flatHits: SearchHit[] = useMemo(() => [
    ...searchResults.products,
    ...searchResults.orders,
    ...searchResults.customers,
    ...searchResults.suppliers,
    ...searchResults.purchaseOrders,
  ], [searchResults]);

  useEffect(() => { setSearchHighlight(0); }, [searchQuery]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    if (open || profileOpen || searchOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, profileOpen, searchOpen]);

  const handleSearchKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { setSearchOpen(false); return; }
    if (flatHits.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSearchHighlight((h) => Math.min(h + 1, flatHits.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSearchHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = flatHits[searchHighlight];
      if (hit) {
        router.push(hit.link);
        setSearchQuery("");
        setSearchOpen(false);
      }
    }
  };

  const markAllRead = () => {
    setReadIds(new Set(notifications.map((n) => n.id)));
  };

  const markRead = (id: string) => {
    setReadIds((prev) => new Set(prev).add(id));
  };

  const unreadCount = notifications.filter((n) => !n.read && !readIds.has(n.id)).length;

  return (
    <header className="w-full sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex justify-between items-center px-6 md:px-8 h-16">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-black text-indigo-400 tracking-tighter">Inventory Box</h1>
        {subtitle && (
          <>
            <span className="mx-4 h-4 w-[1px] bg-outline-variant/20 hidden sm:block" />
            <span className="text-sm font-medium text-slate-100 hidden sm:block">{subtitle}</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-6">
        <div className="relative hidden sm:block" ref={searchRef}>
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            search
          </span>
          <input
            className="bg-slate-800/50 border-none rounded-full py-1.5 pl-10 pr-4 text-sm text-slate-200 w-72 focus:ring-1 focus:ring-indigo-400 transition-all placeholder:text-slate-500"
            placeholder="Search products, orders, customers…"
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={handleSearchKey}
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(""); setSearchOpen(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          )}

          {searchOpen && searchQuery.trim().length > 0 && (
            <div className="absolute right-0 top-12 w-[460px] bg-surface-container-low rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-outline-variant/10 overflow-hidden z-50" style={{ animation: "fade-in 0.15s ease-out" }}>
              <div className="px-4 py-2 border-b border-outline-variant/10 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center justify-between">
                <span>{searchResults.total} result{searchResults.total === 1 ? "" : "s"}</span>
                <span className="text-on-surface-variant/60 normal-case font-medium tracking-normal">↑↓ navigate · ↵ select · esc</span>
              </div>
              <div className="max-h-[460px] overflow-y-auto">
                {searchResults.total === 0 && (
                  <div className="py-10 text-center text-on-surface-variant text-sm">
                    <span className="material-symbols-outlined text-3xl block opacity-30 mb-2">search_off</span>
                    No matches for &quot;{searchQuery}&quot;
                  </div>
                )}
                {([
                  { label: "Products", hits: searchResults.products },
                  { label: "Orders", hits: searchResults.orders },
                  { label: "Customers", hits: searchResults.customers },
                  { label: "Suppliers", hits: searchResults.suppliers },
                  { label: "Purchase Orders", hits: searchResults.purchaseOrders },
                ]).map((group) => group.hits.length === 0 ? null : (
                  <div key={group.label}>
                    <p className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/60">{group.label}</p>
                    {group.hits.map((hit) => {
                      const flatIdx = flatHits.indexOf(hit);
                      const active = flatIdx === searchHighlight;
                      return (
                        <Link key={`${hit.type}-${hit.id}`} href={hit.link} onClick={() => { setSearchQuery(""); setSearchOpen(false); }}
                          onMouseEnter={() => setSearchHighlight(flatIdx)}
                          className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${active ? "bg-primary/10" : "hover:bg-surface-container-high/40"}`}>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${hit.iconColor}`}>
                            <span className="material-symbols-outlined text-base">{hit.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-on-surface truncate">{hit.title}</p>
                            <p className="text-[11px] text-on-surface-variant truncate">{hit.subtitle}</p>
                          </div>
                          {active && <span className="material-symbols-outlined text-primary text-base">subdirectory_arrow_left</span>}
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          {/* Notification Bell */}
          <div className="relative" ref={panelRef}>
            <button
              onClick={() => setOpen(!open)}
              className="relative text-slate-400 hover:text-primary transition-colors p-2 rounded-full hover:bg-slate-800/80"
            >
              <span className="material-symbols-outlined">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-primary rounded-full flex items-center justify-center text-[10px] font-bold text-on-primary leading-none px-1">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown Panel */}
            {open && (
              <div
                className="absolute right-0 top-12 w-96 bg-surface-container-low rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-outline-variant/10 overflow-hidden z-50"
                style={{ animation: "fade-in 0.15s ease-out" }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/10">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-on-surface">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] font-bold text-primary hover:text-primary-fixed-dim transition-colors uppercase tracking-wider"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Notifications List */}
                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-12 text-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-3xl mb-2 block opacity-30">notifications_off</span>
                      <p className="text-sm">No notifications</p>
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      const isRead = notif.read || readIds.has(notif.id);
                      return (
                        <Link
                          key={notif.id}
                          href={notif.link}
                          onClick={() => { markRead(notif.id); setOpen(false); }}
                          className={`flex items-start gap-3 px-5 py-4 hover:bg-surface-container-high/50 transition-colors border-b border-outline-variant/5 last:border-none ${!isRead ? "bg-primary/[0.03]" : ""}`}
                        >
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${notif.iconColor}`}>
                            <span className="material-symbols-outlined text-lg">{notif.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-sm font-medium ${!isRead ? "text-on-surface" : "text-on-surface-variant"}`}>
                                {notif.title}
                              </p>
                              {!isRead && (
                                <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                              )}
                            </div>
                            <p className="text-[12px] text-on-surface-variant leading-relaxed mt-0.5 line-clamp-2">
                              {notif.message}
                            </p>
                            <p className="text-[10px] text-on-surface-variant/50 mt-1">{notif.time}</p>
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-outline-variant/10 bg-surface-container/50">
                  <Link
                    href="/activity"
                    onClick={() => setOpen(false)}
                    className="text-[11px] font-bold text-primary hover:text-primary-fixed-dim transition-colors uppercase tracking-wider text-center block"
                  >
                    View All Activity
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Profile Avatar */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => { setProfileOpen(!profileOpen); setOpen(false); }}
              className="h-8 w-8 rounded-full bg-primary-container/30 flex items-center justify-center text-xs font-bold text-primary border border-primary/20 hover:ring-2 hover:ring-primary/30 transition-all"
            >
              {user.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) || "JT"}
            </button>

            {profileOpen && (
              <div
                className="absolute right-0 top-12 w-64 bg-surface-container-low rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-outline-variant/10 overflow-hidden z-50"
                style={{ animation: "fade-in 0.15s ease-out" }}
              >
                {/* Profile Info */}
                <div className="px-5 py-4 border-b border-outline-variant/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-container/30 flex items-center justify-center text-sm font-bold text-primary">
                      {user.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) || "JT"}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-on-surface">{user.name}</p>
                      <p className="text-[11px] text-on-surface-variant">{user.role}</p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <Link
                    href="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-5 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container-high/50 hover:text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">person</span>
                    My Profile
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-5 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container-high/50 hover:text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">settings</span>
                    Settings
                  </Link>
                  <Link
                    href="/reports"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-5 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container-high/50 hover:text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">analytics</span>
                    Reports
                  </Link>
                </div>

                {/* Logout */}
                <div className="border-t border-outline-variant/10 py-2">
                  <button
                    onClick={() => { logout(); router.push("/"); }}
                    className="flex items-center gap-3 px-5 py-2.5 text-sm text-error hover:bg-error-container/10 transition-colors w-full"
                  >
                    <span className="material-symbols-outlined text-lg">logout</span>
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
