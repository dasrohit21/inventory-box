"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import Barcode from "@/components/Barcode";
import {
  getProducts,
  getOrders,
  getSuppliers,
  getPurchaseOrders,
  getMovementsForProduct,
  formatCurrency,
  type Product,
  type Order,
  type Supplier,
  type PurchaseOrder,
  type StockMovement,
} from "@/lib/data";
import { code128SvgString } from "@/lib/barcode";

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(ts).toLocaleDateString();
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string, 10);

  const [product, setProduct] = useState<Product | null>(null);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allPOs, setAllPOs] = useState<PurchaseOrder[]>([]);
  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);

  useEffect(() => {
    const products = getProducts();
    const found = products.find((p) => p.id === id) || null;
    setProduct(found);
    setAllOrders(getOrders());
    setAllPOs(getPurchaseOrders());
    setAllSuppliers(getSuppliers());
    setMovements(getMovementsForProduct(id));
  }, [id]);

  const linkedOrders = useMemo(() => {
    return allOrders.filter((o) => o.items.some((it) => it.productId === id));
  }, [allOrders, id]);

  const linkedPOs = useMemo(() => {
    return allPOs.filter((po) => po.productId === id);
  }, [allPOs, id]);

  const linkedSuppliers = useMemo(() => {
    if (!product?.supplierIds || product.supplierIds.length === 0) return [];
    return allSuppliers.filter((s) => product.supplierIds!.includes(s.id));
  }, [product, allSuppliers]);

  const handlePrintLabel = () => {
    if (!product) return;
    const svg = code128SvgString(product.sku, { moduleWidth: 2, height: 80, textSize: 14 });
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Label · ${product.sku}</title>
      <style>
        @page { size: 4in 2in; margin: 0; }
        body{font-family:Arial,sans-serif;color:#000;margin:0;padding:0}
        .label{width:4in;height:2in;padding:0.2in;display:flex;flex-direction:column;justify-content:space-between;box-sizing:border-box}
        .name{font-size:14px;font-weight:700;line-height:1.2;margin-bottom:4px}
        .meta{font-size:10px;color:#444;margin-bottom:8px}
        .barcode{display:flex;justify-content:center;align-items:center;flex:1}
        .barcode svg{max-width:100%;max-height:100%}
        .footer{font-size:9px;color:#666;text-align:right}
        @media screen{body{background:#eee;padding:24px;display:flex;justify-content:center}.label{background:white;border:1px solid #ccc}}
      </style></head><body>
      <div class="label">
        <div>
          <div class="name">${product.name}</div>
          <div class="meta">${product.category} · ${product.uom || "pcs"} · ${formatCurrency(product.price)}</div>
        </div>
        <div class="barcode">${svg}</div>
        <div class="footer">Inventory Box · ${new Date().toLocaleDateString()}</div>
      </div>
      <script>window.onload=function(){window.print();};</script>
      </body></html>`;
    const w = window.open("", "_blank", "width=600,height=400");
    if (w) { w.document.write(html); w.document.close(); }
  };

  if (!product) {
    return (
      <>
        <TopBar subtitle="Product Detail" />
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          <div className="bg-surface-container rounded-xl border border-outline-variant/5 p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-3">inventory_2</span>
            <h2 className="text-lg font-bold text-on-surface mb-2">Product Not Found</h2>
            <p className="text-sm text-on-surface-variant mb-6">No product matches ID {params.id}.</p>
            <Link href="/products" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-on-primary font-bold text-sm hover:brightness-110 transition-all">
              <span className="material-symbols-outlined text-base">arrow_back</span> Back to Products
            </Link>
          </div>
        </div>
      </>
    );
  }

  const statusColor = product.status === "In Stock" ? "bg-emerald-500/10 text-emerald-400" : product.status === "Low Stock" ? "bg-tertiary/10 text-tertiary" : "bg-error/10 text-error";

  return (
    <>
      <TopBar subtitle="Product Detail" />
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-6">
          <Link href="/products" className="hover:text-primary transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">arrow_back</span> Products
          </Link>
          <span>/</span>
          <span className="text-on-surface font-medium">{product.name}</span>
        </div>

        {/* Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Image / Hero */}
          <div className="bg-surface-container rounded-2xl border border-outline-variant/5 shadow-xl overflow-hidden flex items-center justify-center aspect-square md:aspect-auto md:min-h-[280px]">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <div className="text-center text-on-surface-variant/40 p-8">
                <span className="material-symbols-outlined text-7xl block mb-2">inventory_2</span>
                <p className="text-xs uppercase tracking-widest font-bold">No image</p>
              </div>
            )}
          </div>

          {/* Title / KPIs */}
          <div className="md:col-span-2 bg-surface-container rounded-2xl border border-outline-variant/5 shadow-xl p-6 flex flex-col">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">{product.category}</p>
                <h1 className="text-3xl font-black tracking-tight text-on-surface">{product.name}</h1>
                <p className="text-sm font-mono text-on-surface-variant mt-1">{product.sku}</p>
              </div>
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>{product.status}</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 flex-1">
              <div className="bg-surface-container-low rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Price</p>
                <p className="text-lg font-black text-primary mt-1">{formatCurrency(product.price)}</p>
                <p className="text-[10px] text-on-surface-variant mt-1">per {product.uom || "pcs"}</p>
              </div>
              <div className="bg-surface-container-low rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">In Stock</p>
                <p className="text-lg font-black text-on-surface mt-1">{product.stock.toLocaleString()}</p>
                <p className="text-[10px] text-on-surface-variant mt-1">{product.uom || "pcs"}</p>
              </div>
              <div className="bg-surface-container-low rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Reorder At</p>
                <p className="text-lg font-black text-on-surface mt-1">{product.reorderQty ?? "—"}</p>
                <p className="text-[10px] text-on-surface-variant mt-1">threshold</p>
              </div>
              <div className="bg-surface-container-low rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Lead Time</p>
                <p className="text-lg font-black text-on-surface mt-1">{product.leadTimeDays ?? "—"}</p>
                <p className="text-[10px] text-on-surface-variant mt-1">days</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={() => router.push(`/products?edit=${product.id}`)} className="px-4 py-2 rounded-lg bg-surface-container-highest text-on-surface text-sm font-medium hover:bg-surface-bright transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-base">edit</span> Edit
              </button>
              <button onClick={handlePrintLabel} className="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-bold hover:brightness-110 transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-base">print</span> Print Label
              </button>
              <Link href={`/purchase-orders?restock=${product.id}`} className="px-4 py-2 rounded-lg bg-surface-container-highest text-tertiary text-sm font-medium hover:bg-surface-bright transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-base">add_shopping_cart</span> Restock
              </Link>
            </div>
          </div>
        </div>

        {/* Description + Barcode + Specs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="md:col-span-2 bg-surface-container rounded-2xl border border-outline-variant/5 shadow-xl p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-on-surface mb-2 flex items-center gap-2"><span className="material-symbols-outlined text-base">description</span> Description</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">{product.description || <span className="italic opacity-60">No description provided.</span>}</p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2"><span className="material-symbols-outlined text-base">straighten</span> Specifications</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-container-low rounded-lg p-3">
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Unit of Measure</p>
                  <p className="text-sm font-bold text-on-surface mt-1">{product.uom || "pcs"}</p>
                </div>
                <div className="bg-surface-container-low rounded-lg p-3">
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Weight</p>
                  <p className="text-sm font-bold text-on-surface mt-1">{product.weightKg !== undefined ? `${product.weightKg} kg` : "—"}</p>
                </div>
                <div className="bg-surface-container-low rounded-lg p-3 col-span-2">
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Dimensions (L × W × H)</p>
                  <p className="text-sm font-bold text-on-surface mt-1">{product.dimensions ? `${product.dimensions.length} × ${product.dimensions.width} × ${product.dimensions.height} mm` : "—"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Barcode card */}
          <div className="bg-surface-container rounded-2xl border border-outline-variant/5 shadow-xl p-6">
            <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-base">qr_code_scanner</span> SKU Barcode</h3>
            <div className="bg-white rounded-xl p-4 flex items-center justify-center mb-4 overflow-hidden">
              <Barcode value={product.sku} moduleWidth={2} height={70} />
            </div>
            <p className="text-[11px] text-on-surface-variant text-center">Code 128 · scannable with any standard 1D barcode scanner</p>
            <button onClick={handlePrintLabel} className="mt-4 w-full py-2.5 rounded-lg bg-surface-container-highest text-on-surface text-sm font-bold hover:bg-surface-bright transition-colors flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-base">print</span> Print Label
            </button>
          </div>
        </div>

        {/* Linked suppliers */}
        {linkedSuppliers.length > 0 && (
          <div className="bg-surface-container rounded-2xl border border-outline-variant/5 shadow-xl p-6 mb-6">
            <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2"><span className="material-symbols-outlined text-base">local_shipping</span> Linked Suppliers</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {linkedSuppliers.map((s) => (
                <div key={s.id} className="bg-surface-container-low rounded-xl p-3">
                  <p className="text-sm font-bold text-on-surface">{s.name}</p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">{s.contact} · {s.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 bg-surface-container-highest rounded-full h-1.5">
                      <div className="bg-primary h-1.5 rounded-full" style={{ width: `${s.reliability}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-on-surface-variant">{s.reliability}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stock movement audit trail */}
        <div className="bg-surface-container rounded-2xl border border-outline-variant/5 shadow-xl mb-6 overflow-hidden">
          <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2"><span className="material-symbols-outlined text-base">history</span> Stock Movement History</h3>
              <p className="text-xs text-on-surface-variant mt-1">Every change to this product&apos;s inventory level.</p>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">{movements.length} {movements.length === 1 ? "entry" : "entries"}</span>
          </div>
          {movements.length === 0 ? (
            <div className="p-12 text-center text-on-surface-variant text-sm">
              <span className="material-symbols-outlined text-4xl block opacity-30 mb-2">history_toggle_off</span>
              No stock movements recorded yet.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-surface-container-high/40 text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                <tr>
                  <th className="px-6 py-3 text-left">When</th>
                  <th className="px-6 py-3 text-left">Type</th>
                  <th className="px-6 py-3 text-right">Change</th>
                  <th className="px-6 py-3 text-right">Stock</th>
                  <th className="px-6 py-3 text-left">By / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-surface-container-high/30 transition-colors">
                    <td className="px-6 py-3">
                      <p className="text-sm text-on-surface">{relativeTime(m.timestamp)}</p>
                      <p className="text-[10px] text-on-surface-variant">{new Date(m.timestamp).toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant">{m.type}</span>
                    </td>
                    <td className={`px-6 py-3 text-right font-bold ${m.quantityChange >= 0 ? "text-emerald-400" : "text-error"}`}>
                      {m.quantityChange >= 0 ? "+" : ""}{m.quantityChange}
                    </td>
                    <td className="px-6 py-3 text-right text-sm text-on-surface-variant">{m.previousStock} → <span className="text-on-surface font-bold">{m.newStock}</span></td>
                    <td className="px-6 py-3">
                      <p className="text-sm text-on-surface">{m.byUser}</p>
                      {m.reason && <p className="text-[11px] text-on-surface-variant">{m.reason}</p>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Linked orders + POs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-surface-container rounded-2xl border border-outline-variant/5 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-outline-variant/10">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2"><span className="material-symbols-outlined text-base">shopping_cart</span> Sales Orders</h3>
              <p className="text-xs text-on-surface-variant mt-1">Orders containing this product</p>
            </div>
            {linkedOrders.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant text-sm">No orders yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-surface-container-high/40 text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                  <tr>
                    <th className="px-6 py-3 text-left">Order</th>
                    <th className="px-6 py-3 text-left">Customer</th>
                    <th className="px-6 py-3 text-center">Qty</th>
                    <th className="px-6 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {linkedOrders.map((o) => {
                    const item = o.items.find((it) => it.productId === id);
                    return (
                      <tr key={o.id} className="hover:bg-surface-container-high/30 transition-colors">
                        <td className="px-6 py-3 font-mono text-indigo-400 text-xs">{o.id}</td>
                        <td className="px-6 py-3 text-sm">{o.customer}</td>
                        <td className="px-6 py-3 text-sm text-center font-bold">{item?.quantity || 0}</td>
                        <td className="px-6 py-3 text-right">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${o.status === "Completed" ? "bg-emerald-500/10 text-emerald-400" : o.status === "Pending" ? "bg-tertiary/10 text-tertiary" : "bg-error/10 text-error"}`}>{o.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="bg-surface-container rounded-2xl border border-outline-variant/5 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-outline-variant/10">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2"><span className="material-symbols-outlined text-base">add_shopping_cart</span> Purchase Orders</h3>
              <p className="text-xs text-on-surface-variant mt-1">Restock orders raised for this product</p>
            </div>
            {linkedPOs.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant text-sm">
                <p className="mb-3">No purchase orders raised yet.</p>
                <Link href={`/purchase-orders?restock=${product.id}`} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors">
                  <span className="material-symbols-outlined text-sm">add_shopping_cart</span> Raise PO
                </Link>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-surface-container-high/40 text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                  <tr>
                    <th className="px-6 py-3 text-left">PO #</th>
                    <th className="px-6 py-3 text-left">Supplier</th>
                    <th className="px-6 py-3 text-center">Qty</th>
                    <th className="px-6 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {linkedPOs.map((po) => (
                    <tr key={po.id} className="hover:bg-surface-container-high/30 transition-colors">
                      <td className="px-6 py-3 font-mono text-indigo-400 text-xs">{po.id}</td>
                      <td className="px-6 py-3 text-sm">{po.supplierName}</td>
                      <td className="px-6 py-3 text-sm text-center font-bold">{po.quantity}</td>
                      <td className="px-6 py-3 text-right">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${po.status === "Received" ? "bg-emerald-500/10 text-emerald-400" : po.status === "Sent" ? "bg-primary/10 text-primary" : po.status === "Draft" ? "bg-tertiary/10 text-tertiary" : "bg-error/10 text-error"}`}>{po.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
