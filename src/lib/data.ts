export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  status: "In Stock" | "Low Stock" | "Out of Stock";
  updated: string;
  description?: string;
  uom?: string;
  imageUrl?: string;
  supplierIds?: number[];
  reorderQty?: number;
  weightKg?: number;
  dimensions?: ProductDimensions;
  leadTimeDays?: number;
}

export const UOMS = ["pcs", "set", "box", "m", "kg", "litre", "roll", "pair"];

export interface OrderItem {
  productId: number;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
}

export interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface OrderTracking {
  carrier: string;
  trackingNumber: string;
  eta: string;
  shipmentStatus: "Not Shipped" | "Picked Up" | "In Transit" | "Out for Delivery" | "Delivered";
}

export interface Order {
  id: string;
  customer: string;
  initials: string;
  date: string;
  status: "Completed" | "Pending" | "Cancelled";
  amount: number;
  color: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  tracking: OrderTracking;
  notes: string;
}

export const CATEGORIES = [
  "Transmitters",
  "Gauges",
  "Switches",
  "Temperature Sensors",
  "Indicators & Controllers",
  "Multimeters & Testers",
  "Wires & Cables",
];

const DEFAULT_PRODUCTS: Product[] = [
  // Transmitters
  { id: 1, name: "DPharp Pressure Transmitter", sku: "TX-PRS-1001", category: "Transmitters", price: 2450.00, stock: 120, status: "In Stock", updated: "2h ago" },
  { id: 2, name: "Mass Flow Transmitter", sku: "TX-FLW-1002", category: "Transmitters", price: 3800.00, stock: 45, status: "In Stock", updated: "4h ago" },
  { id: 3, name: "Orifice Assembly", sku: "TX-ORA-1003", category: "Transmitters", price: 890.00, stock: 18, status: "Low Stock", updated: "1h ago" },
  { id: 4, name: "Venturi Tube", sku: "TX-VNT-1004", category: "Transmitters", price: 1250.00, stock: 0, status: "Out of Stock", updated: "1d ago" },
  { id: 5, name: "Temperature Transmitter", sku: "TX-TMP-1005", category: "Transmitters", price: 1680.00, stock: 85, status: "In Stock", updated: "3h ago" },
  { id: 6, name: "Magnetic Flow Meter", sku: "TX-MFM-1006", category: "Transmitters", price: 4200.00, stock: 32, status: "In Stock", updated: "5h ago" },
  { id: 7, name: "Vortex Flow Meter", sku: "TX-VFM-1007", category: "Transmitters", price: 3500.00, stock: 22, status: "Low Stock", updated: "6h ago" },

  // Gauges
  { id: 8, name: "Differential Pressure Gauge", sku: "GG-DPG-2001", category: "Gauges", price: 560.00, stock: 200, status: "In Stock", updated: "1h ago" },
  { id: 9, name: "BMT Bimetal Temp Gauge 100mm", sku: "GG-BMT-2002", category: "Gauges", price: 185.00, stock: 450, status: "In Stock", updated: "30m ago" },
  { id: 10, name: "GTS Gas Filled Temp Gauge 150mm", sku: "GG-GTS-2003", category: "Gauges", price: 320.00, stock: 15, status: "Low Stock", updated: "2h ago" },
  { id: 11, name: "MTS Mercury Temp Gauge 100mm", sku: "GG-MTS-2004", category: "Gauges", price: 410.00, stock: 8, status: "Low Stock", updated: "4h ago" },
  { id: 12, name: "Gauge Cock & Needle Valve", sku: "GG-GCK-2005", category: "Gauges", price: 75.00, stock: 800, status: "In Stock", updated: "1d ago" },
  { id: 13, name: "Instrument Tube Fittings Set", sku: "GG-ITF-2006", category: "Gauges", price: 120.00, stock: 600, status: "In Stock", updated: "8h ago" },

  // Switches
  { id: 14, name: "RF Capacitance Level Switch 5716", sku: "SW-LVL-3001", category: "Switches", price: 980.00, stock: 65, status: "In Stock", updated: "3h ago" },
  { id: 15, name: "Paddle Flow Switch", sku: "SW-FLW-3002", category: "Switches", price: 420.00, stock: 0, status: "Out of Stock", updated: "2d ago" },
  { id: 16, name: "Bellows Pressure Switch", sku: "SW-PBL-3003", category: "Switches", price: 650.00, stock: 90, status: "In Stock", updated: "5h ago" },
  { id: 17, name: "Membrane Pressure Switch", sku: "SW-PMB-3004", category: "Switches", price: 580.00, stock: 12, status: "Low Stock", updated: "1h ago" },
  { id: 18, name: "Piston Pressure Switch", sku: "SW-PPS-3005", category: "Switches", price: 720.00, stock: 40, status: "In Stock", updated: "7h ago" },

  // Temperature Sensors
  { id: 19, name: "RTD Pt-100 Sensor", sku: "TS-RTD-4001", category: "Temperature Sensors", price: 145.00, stock: 500, status: "In Stock", updated: "2h ago" },
  { id: 20, name: "K-Type Thermocouple", sku: "TS-TCK-4002", category: "Temperature Sensors", price: 85.00, stock: 1200, status: "In Stock", updated: "1h ago" },
  { id: 21, name: "J-Type Thermocouple", sku: "TS-TCJ-4003", category: "Temperature Sensors", price: 90.00, stock: 350, status: "In Stock", updated: "3h ago" },
  { id: 22, name: "Thermowell SS316L", sku: "TS-TWL-4004", category: "Temperature Sensors", price: 210.00, stock: 180, status: "In Stock", updated: "6h ago" },
  { id: 23, name: "Mineral Insulated Cable (MI)", sku: "TS-MIC-4005", category: "Temperature Sensors", price: 38.00, stock: 5000, status: "In Stock", updated: "4h ago" },
  { id: 24, name: "Online Pyrometer 0-3200°C", sku: "TS-PYR-4006", category: "Temperature Sensors", price: 6500.00, stock: 5, status: "Low Stock", updated: "1d ago" },
  { id: 25, name: "K-Type Compensating Cable", sku: "TS-CCK-4007", category: "Temperature Sensors", price: 12.00, stock: 10000, status: "In Stock", updated: "8h ago" },
  { id: 26, name: "R-Type Compensating Cable", sku: "TS-CCR-4008", category: "Temperature Sensors", price: 45.00, stock: 3000, status: "In Stock", updated: "12h ago" },
  { id: 27, name: "Thermal Imager IR Camera", sku: "TS-TIM-4009", category: "Temperature Sensors", price: 8900.00, stock: 3, status: "Low Stock", updated: "2h ago" },

  // Digital Indicators & Controllers
  { id: 28, name: "PID Temperature Controller 96x96", sku: "IC-PID-5001", category: "Indicators & Controllers", price: 380.00, stock: 150, status: "In Stock", updated: "1h ago" },
  { id: 29, name: "Digital Temp Indicator 48x48", sku: "IC-DTI-5002", category: "Indicators & Controllers", price: 220.00, stock: 200, status: "In Stock", updated: "3h ago" },
  { id: 30, name: "Diff Pressure Indicator", sku: "IC-DPI-5003", category: "Indicators & Controllers", price: 450.00, stock: 75, status: "In Stock", updated: "5h ago" },
  { id: 31, name: "Jumbo Display Indicator 4\"", sku: "IC-JDI-5004", category: "Indicators & Controllers", price: 680.00, stock: 20, status: "Low Stock", updated: "2h ago" },
  { id: 32, name: "Loop Powered Indicator", sku: "IC-LPI-5005", category: "Indicators & Controllers", price: 290.00, stock: 0, status: "Out of Stock", updated: "3d ago" },

  // Multimeters & Testers
  { id: 33, name: "True-RMS Digital Multimeter Pro", sku: "MT-DMM-6001", category: "Multimeters & Testers", price: 520.00, stock: 85, status: "In Stock", updated: "4h ago" },
  { id: 34, name: "CAT IV 600V Multimeter", sku: "MT-C4M-6002", category: "Multimeters & Testers", price: 380.00, stock: 120, status: "In Stock", updated: "2h ago" },
  { id: 35, name: "Standard Digital Multimeter", sku: "MT-SDM-6003", category: "Multimeters & Testers", price: 150.00, stock: 250, status: "In Stock", updated: "1h ago" },
  { id: 36, name: "Clamp Meter AC/DC", sku: "MT-CLM-6004", category: "Multimeters & Testers", price: 290.00, stock: 10, status: "Low Stock", updated: "6h ago" },

  // Wires & Cables
  { id: 37, name: "Power Cable XLPE 3-Core", sku: "WC-PWR-7001", category: "Wires & Cables", price: 18.00, stock: 15000, status: "In Stock", updated: "1h ago" },
  { id: 38, name: "Control Cable 12-Core Shielded", sku: "WC-CTL-7002", category: "Wires & Cables", price: 24.00, stock: 8000, status: "In Stock", updated: "3h ago" },
  { id: 39, name: "Instrumentation Cable 4-Pair", sku: "WC-INS-7003", category: "Wires & Cables", price: 32.00, stock: 6000, status: "In Stock", updated: "5h ago" },
  { id: 40, name: "Solar Cable 6mm² DC", sku: "WC-SOL-7004", category: "Wires & Cables", price: 8.50, stock: 20000, status: "In Stock", updated: "2h ago" },
];

const DEFAULT_ORDERS: Order[] = [
  {
    id: "ORD-9428-X", customer: "Reliance Industries", initials: "RI", date: "Mar 28, 2026", status: "Completed", amount: 24500.00, color: "indigo",
    items: [
      { productId: 1, name: "DPharp Pressure Transmitter", sku: "TX-PRS-1001", quantity: 8, unitPrice: 2450.00 },
      { productId: 19, name: "RTD Pt-100 Sensor", sku: "TS-RTD-4001", quantity: 35, unitPrice: 145.00 },
    ],
    shippingAddress: { line1: "RIL Complex, Jamnagar Refinery", line2: "Block A-12", city: "Jamnagar", state: "Gujarat", pincode: "361142", country: "India" },
    tracking: { carrier: "Blue Dart", trackingNumber: "BD-9428271X", eta: "Apr 02, 2026", shipmentStatus: "Delivered" },
    notes: "Calibration certificates required with each transmitter.",
  },
  {
    id: "ORD-8102-L", customer: "Tata Steel Plant", initials: "TS", date: "Mar 30, 2026", status: "Pending", amount: 8920.00, color: "tertiary",
    items: [
      { productId: 9, name: "BMT Bimetal Temp Gauge 100mm", sku: "GG-BMT-2002", quantity: 24, unitPrice: 185.00 },
      { productId: 28, name: "PID Temperature Controller 96x96", sku: "IC-PID-5001", quantity: 12, unitPrice: 380.00 },
    ],
    shippingAddress: { line1: "Tata Steel Works", line2: "Plant Gate 4", city: "Jamshedpur", state: "Jharkhand", pincode: "831001", country: "India" },
    tracking: { carrier: "Delhivery", trackingNumber: "DL-810283L", eta: "Apr 05, 2026", shipmentStatus: "In Transit" },
    notes: "Deliver to instrumentation stores. Contact Mr. Verma on arrival.",
  },
  {
    id: "ORD-7734-P", customer: "ONGC Offshore", initials: "OO", date: "Mar 25, 2026", status: "Cancelled", amount: 1240.00, color: "slate",
    items: [
      { productId: 16, name: "Bellows Pressure Switch", sku: "SW-PBL-3003", quantity: 2, unitPrice: 650.00 },
    ],
    shippingAddress: { line1: "ONGC Heliport", line2: "Bombay High Field", city: "Mumbai", state: "Maharashtra", pincode: "400069", country: "India" },
    tracking: { carrier: "—", trackingNumber: "—", eta: "—", shipmentStatus: "Not Shipped" },
    notes: "Cancelled by customer — duplicate PO.",
  },
  {
    id: "ORD-6129-M", customer: "Adani Power", initials: "AP", date: "Mar 22, 2026", status: "Completed", amount: 52300.00, color: "primary",
    items: [
      { productId: 6, name: "Magnetic Flow Meter", sku: "TX-MFM-1006", quantity: 8, unitPrice: 4200.00 },
      { productId: 22, name: "Thermowell SS316L", sku: "TS-TWL-4004", quantity: 90, unitPrice: 210.00 },
    ],
    shippingAddress: { line1: "Adani Power Plant Mundra", line2: "Stores Section", city: "Mundra", state: "Gujarat", pincode: "370421", country: "India" },
    tracking: { carrier: "Gati", trackingNumber: "GT-612991M", eta: "Mar 27, 2026", shipmentStatus: "Delivered" },
    notes: "Hazardous-area certified items only. ATEX docs required.",
  },
  {
    id: "ORD-5502-Q", customer: "BHEL Haridwar", initials: "BH", date: "Mar 20, 2026", status: "Completed", amount: 11050.00, color: "indigo",
    items: [
      { productId: 33, name: "True-RMS Digital Multimeter Pro", sku: "MT-DMM-6001", quantity: 15, unitPrice: 520.00 },
      { productId: 36, name: "Clamp Meter AC/DC", sku: "MT-CLM-6004", quantity: 11, unitPrice: 290.00 },
    ],
    shippingAddress: { line1: "BHEL Heavy Electricals", line2: "Block 3, Engineering Stores", city: "Haridwar", state: "Uttarakhand", pincode: "249403", country: "India" },
    tracking: { carrier: "Blue Dart", trackingNumber: "BD-550213Q", eta: "Mar 24, 2026", shipmentStatus: "Delivered" },
    notes: "",
  },
  {
    id: "ORD-4891-R", customer: "Indian Oil Refinery", initials: "IO", date: "Mar 18, 2026", status: "Completed", amount: 32000.00, color: "primary",
    items: [
      { productId: 2, name: "Mass Flow Transmitter", sku: "TX-FLW-1002", quantity: 6, unitPrice: 3800.00 },
      { productId: 5, name: "Temperature Transmitter", sku: "TX-TMP-1005", quantity: 5, unitPrice: 1680.00 },
    ],
    shippingAddress: { line1: "IOCL Panipat Refinery", line2: "Material Receiving Bay 2", city: "Panipat", state: "Haryana", pincode: "132140", country: "India" },
    tracking: { carrier: "DTDC", trackingNumber: "DT-489147R", eta: "Mar 22, 2026", shipmentStatus: "Delivered" },
    notes: "Hart-protocol calibration certificates included.",
  },
  {
    id: "ORD-4230-S", customer: "L&T Engineering", initials: "LT", date: "Mar 15, 2026", status: "Pending", amount: 17800.00, color: "tertiary",
    items: [
      { productId: 14, name: "RF Capacitance Level Switch 5716", sku: "SW-LVL-3001", quantity: 12, unitPrice: 980.00 },
      { productId: 30, name: "Diff Pressure Indicator", sku: "IC-DPI-5003", quantity: 13, unitPrice: 450.00 },
    ],
    shippingAddress: { line1: "L&T Construction Yard", line2: "Hazira Manufacturing Complex", city: "Surat", state: "Gujarat", pincode: "394270", country: "India" },
    tracking: { carrier: "Safexpress", trackingNumber: "SX-423015S", eta: "Apr 01, 2026", shipmentStatus: "Picked Up" },
    notes: "Ship in two batches if more than 5 days delay expected.",
  },
  {
    id: "ORD-3812-T", customer: "Siemens India", initials: "SI", date: "Mar 12, 2026", status: "Completed", amount: 41000.00, color: "indigo",
    items: [
      { productId: 7, name: "Vortex Flow Meter", sku: "TX-VFM-1007", quantity: 10, unitPrice: 3500.00 },
      { productId: 24, name: "Online Pyrometer 0-3200°C", sku: "TS-PYR-4006", quantity: 1, unitPrice: 6500.00 },
    ],
    shippingAddress: { line1: "Siemens Factory Kalwa", line2: "Gate 2, Stores", city: "Thane", state: "Maharashtra", pincode: "400708", country: "India" },
    tracking: { carrier: "Blue Dart", trackingNumber: "BD-381294T", eta: "Mar 16, 2026", shipmentStatus: "Delivered" },
    notes: "",
  },
  {
    id: "ORD-3201-U", customer: "NTPC Dadri", initials: "ND", date: "Mar 10, 2026", status: "Completed", amount: 9500.00, color: "primary",
    items: [
      { productId: 20, name: "K-Type Thermocouple", sku: "TS-TCK-4002", quantity: 50, unitPrice: 85.00 },
      { productId: 22, name: "Thermowell SS316L", sku: "TS-TWL-4004", quantity: 25, unitPrice: 210.00 },
    ],
    shippingAddress: { line1: "NTPC Dadri Power Plant", line2: "Boiler Section Stores", city: "Greater Noida", state: "Uttar Pradesh", pincode: "203207", country: "India" },
    tracking: { carrier: "Gati", trackingNumber: "GT-320118U", eta: "Mar 14, 2026", shipmentStatus: "Delivered" },
    notes: "",
  },
  {
    id: "ORD-2900-V", customer: "Thermax Limited", initials: "TL", date: "Mar 08, 2026", status: "Cancelled", amount: 5600.00, color: "slate",
    items: [
      { productId: 11, name: "MTS Mercury Temp Gauge 100mm", sku: "GG-MTS-2004", quantity: 14, unitPrice: 410.00 },
    ],
    shippingAddress: { line1: "Thermax Boiler Plant", line2: "Block C", city: "Pune", state: "Maharashtra", pincode: "411019", country: "India" },
    tracking: { carrier: "—", trackingNumber: "—", eta: "—", shipmentStatus: "Not Shipped" },
    notes: "Cancelled — vendor changed by customer.",
  },
];

const DATA_VERSION = "4";

const DB_KEYS = {
  PRODUCTS: "inventoryBox_products",
  ORDERS: "inventoryBox_orders",
  LOGGED_IN: "inventoryBox_loggedIn",
  USER: "inventoryBox_user",
  SUPPLIERS: "inventoryBox_suppliers",
  CUSTOMERS: "inventoryBox_customers",
  PURCHASE_ORDERS: "inventoryBox_purchaseOrders",
  TEAM: "inventoryBox_team",
  STOCK_MOVEMENTS: "inventoryBox_stockMovements",
  ORDER_EVENTS: "inventoryBox_orderEvents",
  SETTINGS: "inventoryBox_settings",
  VERSION: "inventoryBox_version",
};

function migrateIfNeeded() {
  if (typeof window === "undefined") return;
  const currentVersion = localStorage.getItem(DB_KEYS.VERSION);
  if (currentVersion !== DATA_VERSION) {
    localStorage.removeItem(DB_KEYS.PRODUCTS);
    localStorage.removeItem(DB_KEYS.ORDERS);
    localStorage.removeItem(DB_KEYS.SUPPLIERS);
    localStorage.removeItem(DB_KEYS.CUSTOMERS);
    localStorage.removeItem(DB_KEYS.PURCHASE_ORDERS);
    localStorage.removeItem(DB_KEYS.SETTINGS);
    localStorage.setItem(DB_KEYS.VERSION, DATA_VERSION);
  }
}

function getStorage(key: string) {
  if (typeof window === "undefined") return null;
  migrateIfNeeded();
  return localStorage.getItem(key);
}

function setStorage(key: string, value: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, value);
}

function removeStorage(key: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
}

export function getProducts(): Product[] {
  const raw = getStorage(DB_KEYS.PRODUCTS);
  if (!raw) {
    setStorage(DB_KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
    return [...DEFAULT_PRODUCTS];
  }
  return JSON.parse(raw);
}

export function saveProducts(products: Product[]) {
  setStorage(DB_KEYS.PRODUCTS, JSON.stringify(products));
}

function autoStatus(stock: number): Product["status"] {
  if (stock === 0) return "Out of Stock";
  if (stock <= 25) return "Low Stock";
  return "In Stock";
}

export function addProduct(product: Omit<Product, "id" | "updated" | "status">) {
  const products = getProducts();
  const id = products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1;
  const newProduct: Product = {
    ...product,
    id,
    updated: "Just now",
    status: autoStatus(product.stock),
  };
  products.push(newProduct);
  saveProducts(products);
  if (newProduct.stock > 0) {
    logStockMovement({
      productId: newProduct.id,
      productName: newProduct.name,
      sku: newProduct.sku,
      type: "Initial Stock",
      quantityChange: newProduct.stock,
      previousStock: 0,
      newStock: newProduct.stock,
      reason: "Product created",
    });
  }
  return newProduct;
}

export function updateProduct(id: number, updates: Partial<Product>) {
  const products = getProducts();
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  const before = products[idx];
  const previousStock = before.stock;
  Object.assign(products[idx], updates);
  products[idx].updated = "Just now";
  products[idx].status = autoStatus(products[idx].stock);
  saveProducts(products);
  const after = products[idx];
  if (updates.stock !== undefined && previousStock !== after.stock) {
    logStockMovement({
      productId: after.id,
      productName: after.name,
      sku: after.sku,
      type: "Manual Adjustment",
      quantityChange: after.stock - previousStock,
      previousStock,
      newStock: after.stock,
      reason: updates.stock !== undefined ? "Edited via Products form" : undefined,
    });
  }
  return after;
}

export function deleteProduct(id: number) {
  const products = getProducts().filter((p) => p.id !== id);
  saveProducts(products);
}

export function getOrders(): Order[] {
  const raw = getStorage(DB_KEYS.ORDERS);
  if (!raw) {
    setStorage(DB_KEYS.ORDERS, JSON.stringify(DEFAULT_ORDERS));
    return [...DEFAULT_ORDERS];
  }
  return JSON.parse(raw);
}

export function saveOrders(orders: Order[]) {
  setStorage(DB_KEYS.ORDERS, JSON.stringify(orders));
}

export function addOrder(order: {
  customer: string;
  date: string;
  status: Order["status"];
  amount: number;
  items?: OrderItem[];
  shippingAddress?: ShippingAddress;
  tracking?: OrderTracking;
  notes?: string;
}) {
  const orders = getOrders();
  const num = Math.floor(Math.random() * 9000) + 1000;
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const newOrder: Order = {
    id: `ORD-${num}-${letter}`,
    customer: order.customer,
    initials: order.customer.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2),
    date: order.date,
    status: order.status,
    amount: order.amount,
    color: ["indigo", "primary", "tertiary", "slate"][Math.floor(Math.random() * 4)],
    items: order.items ?? [],
    shippingAddress: order.shippingAddress ?? { line1: "", city: "", state: "", pincode: "", country: "India" },
    tracking: order.tracking ?? { carrier: "—", trackingNumber: "—", eta: "—", shipmentStatus: "Not Shipped" },
    notes: order.notes ?? "",
  };
  orders.unshift(newOrder);
  saveOrders(orders);
  logOrderEvent({
    orderId: newOrder.id,
    type: "Created",
    message: `Order created for ${newOrder.customer} · ${newOrder.items.length} item${newOrder.items.length === 1 ? "" : "s"} · ${formatCurrency(newOrder.amount)}`,
  });
  return newOrder;
}

export function updateOrder(id: string, updates: Partial<Order>) {
  const orders = getOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  const before = orders[idx];
  Object.assign(orders[idx], updates);
  saveOrders(orders);
  const after = orders[idx];
  if (updates.status && updates.status !== before.status) {
    logOrderEvent({
      orderId: id,
      type: "Status Changed",
      message: `Status changed from ${before.status} to ${after.status}`,
      fromValue: before.status,
      toValue: after.status,
    });
  }
  if (updates.tracking) {
    const t1 = before.tracking;
    const t2 = after.tracking;
    if (t1.shipmentStatus !== t2.shipmentStatus || t1.trackingNumber !== t2.trackingNumber || t1.carrier !== t2.carrier) {
      logOrderEvent({
        orderId: id,
        type: "Tracking Updated",
        message: `Tracking updated · ${t2.carrier || "—"} · ${t2.trackingNumber || "—"} · ${t2.shipmentStatus}`,
        fromValue: t1.shipmentStatus,
        toValue: t2.shipmentStatus,
      });
    }
  }
  if (updates.notes !== undefined && updates.notes !== before.notes) {
    logOrderEvent({
      orderId: id,
      type: "Note Updated",
      message: updates.notes ? `Notes updated: "${updates.notes.slice(0, 80)}${updates.notes.length > 80 ? "…" : ""}"` : "Notes cleared",
    });
  }
  return after;
}

export function deleteOrder(id: string) {
  const orders = getOrders().filter((o) => o.id !== id);
  saveOrders(orders);
  // Cascade-clean events for this order to keep storage tidy.
  const events = getOrderEvents().filter((e) => e.orderId !== id);
  saveOrderEvents(events);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export interface User {
  name: string;
  email: string;
  role: string;
  department?: string;
}

export function login(email: string, password: string): boolean {
  if (!isValidEmail(email) || !password) return false;
  setStorage(DB_KEYS.LOGGED_IN, "true");
  const existing = getStorage(DB_KEYS.USER);
  const prev = existing ? JSON.parse(existing) : {};
  setStorage(DB_KEYS.USER, JSON.stringify({ name: prev.name || "Julian Thorne", role: prev.role || "Admin", department: prev.department || "Instrumentation & Control", ...prev, email }));
  return true;
}

export function logout() {
  removeStorage(DB_KEYS.LOGGED_IN);
}

export function isLoggedIn(): boolean {
  return getStorage(DB_KEYS.LOGGED_IN) === "true";
}

export function getUser(): User {
  const u = getStorage(DB_KEYS.USER);
  if (u) return JSON.parse(u);
  return { name: "Julian Thorne", email: "admin@inventorybox.io", role: "Admin", department: "Instrumentation & Control" };
}

export function saveUser(updates: Partial<User>) {
  const current = getUser();
  const sanitized: Partial<User> = { ...updates };
  // Reject malformed emails outright; allow empty string as an explicit clear.
  if (sanitized.email !== undefined && sanitized.email !== "" && !isValidEmail(sanitized.email)) {
    delete sanitized.email;
  }
  const merged = { ...current, ...sanitized };
  setStorage(DB_KEYS.USER, JSON.stringify(merged));
  return merged;
}

export function getDashboardStats() {
  const products = getProducts();
  const orders = getOrders();
  return {
    totalProducts: products.length,
    lowStock: products.filter((p) => p.status === "Low Stock").length,
    outOfStock: products.filter((p) => p.status === "Out of Stock").length,
    ordersToday: orders.filter((o) => {
      const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      return o.date === today && o.status !== "Cancelled";
    }).length,
    totalRevenue: orders.reduce((sum, o) => sum + o.amount, 0),
    completedOrders: orders.filter((o) => o.status === "Completed").length,
    pendingOrders: orders.filter((o) => o.status === "Pending").length,
  };
}

interface CurrencyConfig {
  symbol: string;
  locale: string;
  decimals: number;
}

const CURRENCY_MAP: Record<string, CurrencyConfig> = {
  INR: { symbol: "₹", locale: "en-IN", decimals: 2 },
  USD: { symbol: "$", locale: "en-US", decimals: 2 },
  EUR: { symbol: "€", locale: "de-DE", decimals: 2 },
  GBP: { symbol: "£", locale: "en-GB", decimals: 2 },
  JPY: { symbol: "¥", locale: "ja-JP", decimals: 0 },
};

let cachedCurrency: string | null = null;

function getActiveCurrency(): string {
  if (typeof window === "undefined") return "INR";
  if (cachedCurrency !== null) return cachedCurrency;
  const raw = localStorage.getItem(DB_KEYS.SETTINGS);
  cachedCurrency = raw ? (JSON.parse(raw).currency || "INR") : "INR";
  return cachedCurrency;
}

export function formatCurrency(n: number) {
  const code = getActiveCurrency();
  const c = CURRENCY_MAP[code] || CURRENCY_MAP.INR;
  return c.symbol + n.toLocaleString(c.locale, { minimumFractionDigits: c.decimals, maximumFractionDigits: c.decimals });
}

// ---- Suppliers ----

export interface Supplier {
  id: number;
  name: string;
  contact: string;
  email: string;
  phone: string;
  category: string;
  rating: number;
  reliability: number;
  status: "Active" | "Inactive" | "On Hold";
  totalOrders: number;
  lastDelivery: string;
}

const DEFAULT_SUPPLIERS: Supplier[] = [
  { id: 1, name: "Yokogawa India", contact: "Rajesh Kumar", email: "rajesh@yokogawa.in", phone: "+91 22 2856 1234", category: "Transmitters", rating: 4.9, reliability: 97, status: "Active", totalOrders: 420, lastDelivery: "Mar 28, 2026" },
  { id: 2, name: "Wika Instruments", contact: "Hans Mueller", email: "hans@wika.com", phone: "+49 9372 132 0", category: "Gauges", rating: 4.7, reliability: 94, status: "Active", totalOrders: 310, lastDelivery: "Mar 25, 2026" },
  { id: 3, name: "Emerson Process", contact: "Sarah Mitchell", email: "sarah@emerson.com", phone: "+1 (314) 553-2000", category: "Transmitters", rating: 4.8, reliability: 96, status: "Active", totalOrders: 380, lastDelivery: "Mar 30, 2026" },
  { id: 4, name: "Fluke Corporation", contact: "David Chen", email: "david@fluke.com", phone: "+1 (425) 347-6100", category: "Multimeters & Testers", rating: 4.6, reliability: 91, status: "Active", totalOrders: 245, lastDelivery: "Mar 20, 2026" },
  { id: 5, name: "Pyrocontrol Sensors", contact: "Marco Rossi", email: "marco@pyrocontrol.it", phone: "+39 011 9577 111", category: "Temperature Sensors", rating: 4.5, reliability: 88, status: "Active", totalOrders: 198, lastDelivery: "Mar 22, 2026" },
  { id: 6, name: "Honeywell India", contact: "Priya Sharma", email: "priya@honeywell.com", phone: "+91 80 2658 4400", category: "Switches", rating: 4.4, reliability: 85, status: "Active", totalOrders: 275, lastDelivery: "Mar 26, 2026" },
  { id: 7, name: "Havells Cables", contact: "Amit Patel", email: "amit@havells.com", phone: "+91 120 467 8900", category: "Wires & Cables", rating: 4.3, reliability: 82, status: "On Hold", totalOrders: 156, lastDelivery: "Feb 28, 2026" },
  { id: 8, name: "Masibus Electronics", contact: "Kiran Desai", email: "kiran@masibus.com", phone: "+91 79 2328 7641", category: "Indicators & Controllers", rating: 4.2, reliability: 79, status: "Active", totalOrders: 189, lastDelivery: "Mar 18, 2026" },
  { id: 9, name: "Endress+Hauser", contact: "Thomas Braun", email: "thomas@endress.com", phone: "+41 61 715 7575", category: "Transmitters", rating: 4.8, reliability: 95, status: "Active", totalOrders: 350, lastDelivery: "Mar 29, 2026" },
  { id: 10, name: "ABB Instrumentation", contact: "Erik Lindström", email: "erik@abb.com", phone: "+46 21 32 50 00", category: "Switches", rating: 3.9, reliability: 72, status: "Inactive", totalOrders: 65, lastDelivery: "Dec 15, 2025" },
];

export function getSuppliers(): Supplier[] {
  const raw = getStorage(DB_KEYS.SUPPLIERS);
  if (!raw) {
    setStorage(DB_KEYS.SUPPLIERS, JSON.stringify(DEFAULT_SUPPLIERS));
    return [...DEFAULT_SUPPLIERS];
  }
  return JSON.parse(raw);
}

export function saveSuppliers(suppliers: Supplier[]) {
  setStorage(DB_KEYS.SUPPLIERS, JSON.stringify(suppliers));
}

export function addSupplier(supplier: Omit<Supplier, "id">) {
  const suppliers = getSuppliers();
  const id = suppliers.length > 0 ? Math.max(...suppliers.map((s) => s.id)) + 1 : 1;
  const newSupplier = { ...supplier, id };
  suppliers.push(newSupplier);
  saveSuppliers(suppliers);
  return newSupplier;
}

export function updateSupplier(id: number, updates: Partial<Supplier>) {
  const suppliers = getSuppliers();
  const idx = suppliers.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  Object.assign(suppliers[idx], updates);
  saveSuppliers(suppliers);
  return suppliers[idx];
}

export function deleteSupplier(id: number) {
  const suppliers = getSuppliers().filter((s) => s.id !== id);
  saveSuppliers(suppliers);
}

// ---- Settings ----

export interface AppSettings {
  companyName: string;
  currency: string;
  lowStockThreshold: number;
  emailNotifications: boolean;
  darkMode: boolean;
  language: string;
  timezone: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  companyName: "Inventory Box Systems",
  currency: "INR",
  lowStockThreshold: 25,
  emailNotifications: true,
  darkMode: true,
  language: "English",
  timezone: "UTC+5:30 (IST - India)",
};

export function getSettings(): AppSettings {
  const raw = getStorage(DB_KEYS.SETTINGS);
  if (!raw) {
    setStorage(DB_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    return { ...DEFAULT_SETTINGS };
  }
  return JSON.parse(raw);
}

export function saveSettings(settings: AppSettings) {
  setStorage(DB_KEYS.SETTINGS, JSON.stringify(settings));
  cachedCurrency = settings.currency;
}

// ---- Customers ----

export interface Customer {
  id: number;
  name: string;
  initials: string;
  contact: string;
  email: string;
  phone: string;
  industry: string;
  gstin: string;
  address: ShippingAddress;
  status: "Active" | "Inactive" | "On Hold";
  since: string;
  color: string;
}

const DEFAULT_CUSTOMERS: Customer[] = [
  { id: 1, name: "Reliance Industries", initials: "RI", contact: "Suresh Iyer", email: "suresh.iyer@ril.com", phone: "+91 22 3555 5000", industry: "Petrochemicals", gstin: "24AAACR5055K1Z5", address: { line1: "RIL Complex, Jamnagar Refinery", line2: "Block A-12", city: "Jamnagar", state: "Gujarat", pincode: "361142", country: "India" }, status: "Active", since: "Jan 2022", color: "indigo" },
  { id: 2, name: "Tata Steel Plant", initials: "TS", contact: "Anand Verma", email: "anand.verma@tatasteel.com", phone: "+91 657 664 5000", industry: "Steel", gstin: "20AAACT2727Q1ZX", address: { line1: "Tata Steel Works", line2: "Plant Gate 4", city: "Jamshedpur", state: "Jharkhand", pincode: "831001", country: "India" }, status: "Active", since: "Jul 2021", color: "tertiary" },
  { id: 3, name: "ONGC Offshore", initials: "OO", contact: "Captain R. Singh", email: "rsingh@ongc.co.in", phone: "+91 22 2671 1111", industry: "Oil & Gas", gstin: "27AAACO1598A1Z2", address: { line1: "ONGC Heliport", line2: "Bombay High Field", city: "Mumbai", state: "Maharashtra", pincode: "400069", country: "India" }, status: "On Hold", since: "Mar 2023", color: "slate" },
  { id: 4, name: "Adani Power", initials: "AP", contact: "Rakesh Pandey", email: "rakesh.p@adani.com", phone: "+91 79 2555 5555", industry: "Power Generation", gstin: "24AAACA9521R1ZK", address: { line1: "Adani Power Plant Mundra", line2: "Stores Section", city: "Mundra", state: "Gujarat", pincode: "370421", country: "India" }, status: "Active", since: "Sep 2020", color: "primary" },
  { id: 5, name: "BHEL Haridwar", initials: "BH", contact: "Manju Rawat", email: "manju.r@bhel.in", phone: "+91 1334 285 100", industry: "Heavy Engineering", gstin: "05AAACB4146P1ZW", address: { line1: "BHEL Heavy Electricals", line2: "Block 3, Engineering Stores", city: "Haridwar", state: "Uttarakhand", pincode: "249403", country: "India" }, status: "Active", since: "Apr 2019", color: "indigo" },
  { id: 6, name: "Indian Oil Refinery", initials: "IO", contact: "Vikas Sharma", email: "vikas.sharma@iocl.in", phone: "+91 180 264 7000", industry: "Oil & Gas", gstin: "06AAACI1681G1ZL", address: { line1: "IOCL Panipat Refinery", line2: "Material Receiving Bay 2", city: "Panipat", state: "Haryana", pincode: "132140", country: "India" }, status: "Active", since: "Feb 2020", color: "primary" },
  { id: 7, name: "L&T Engineering", initials: "LT", contact: "Deepak Joshi", email: "d.joshi@larsentoubro.com", phone: "+91 22 6752 5656", industry: "Engineering & Construction", gstin: "27AAACL0140P1ZD", address: { line1: "L&T Construction Yard", line2: "Hazira Manufacturing Complex", city: "Surat", state: "Gujarat", pincode: "394270", country: "India" }, status: "Active", since: "Aug 2021", color: "tertiary" },
  { id: 8, name: "Siemens India", initials: "SI", contact: "Karan Mehta", email: "karan.mehta@siemens.com", phone: "+91 22 3967 7000", industry: "Industrial Automation", gstin: "27AAACS0764L1ZP", address: { line1: "Siemens Factory Kalwa", line2: "Gate 2, Stores", city: "Thane", state: "Maharashtra", pincode: "400708", country: "India" }, status: "Active", since: "Nov 2020", color: "indigo" },
  { id: 9, name: "NTPC Dadri", initials: "ND", contact: "Pooja Sinha", email: "pooja.s@ntpc.co.in", phone: "+91 120 235 8000", industry: "Power Generation", gstin: "09AAACN0255D1ZJ", address: { line1: "NTPC Dadri Power Plant", line2: "Boiler Section Stores", city: "Greater Noida", state: "Uttar Pradesh", pincode: "203207", country: "India" }, status: "Active", since: "Jun 2022", color: "primary" },
  { id: 10, name: "Thermax Limited", initials: "TL", contact: "Nikhil Kulkarni", email: "nikhil.k@thermaxglobal.com", phone: "+91 20 6612 3000", industry: "Boiler Systems", gstin: "27AAACT3478F1ZK", address: { line1: "Thermax Boiler Plant", line2: "Block C", city: "Pune", state: "Maharashtra", pincode: "411019", country: "India" }, status: "Inactive", since: "Mar 2021", color: "slate" },
];

export function getCustomers(): Customer[] {
  const raw = getStorage(DB_KEYS.CUSTOMERS);
  if (!raw) {
    setStorage(DB_KEYS.CUSTOMERS, JSON.stringify(DEFAULT_CUSTOMERS));
    return [...DEFAULT_CUSTOMERS];
  }
  return JSON.parse(raw);
}

export function saveCustomers(customers: Customer[]) {
  setStorage(DB_KEYS.CUSTOMERS, JSON.stringify(customers));
}

export function addCustomer(customer: Omit<Customer, "id" | "initials">) {
  const customers = getCustomers();
  const id = customers.length > 0 ? Math.max(...customers.map((c) => c.id)) + 1 : 1;
  const initials = customer.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const newCustomer: Customer = { ...customer, id, initials };
  customers.push(newCustomer);
  saveCustomers(customers);
  return newCustomer;
}

export function updateCustomer(id: number, updates: Partial<Customer>) {
  const customers = getCustomers();
  const idx = customers.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  Object.assign(customers[idx], updates);
  saveCustomers(customers);
  return customers[idx];
}

export function deleteCustomer(id: number) {
  const customers = getCustomers().filter((c) => c.id !== id);
  saveCustomers(customers);
}

export function getCustomerStats(customerName: string) {
  const orders = getOrders().filter((o) => o.customer === customerName);
  const lifetimeValue = orders.filter((o) => o.status !== "Cancelled").reduce((s, o) => s + o.amount, 0);
  const lastOrder = orders.length > 0 ? orders[0] : null;
  return {
    totalOrders: orders.length,
    completedOrders: orders.filter((o) => o.status === "Completed").length,
    pendingOrders: orders.filter((o) => o.status === "Pending").length,
    cancelledOrders: orders.filter((o) => o.status === "Cancelled").length,
    lifetimeValue,
    lastOrder,
    orders,
  };
}

// ---- Purchase Orders / Restock ----

export interface PurchaseOrder {
  id: string;
  productId: number;
  productName: string;
  sku: string;
  supplierId: number;
  supplierName: string;
  quantity: number;
  unitCost: number;
  total: number;
  status: "Draft" | "Sent" | "Received" | "Cancelled";
  createdDate: string;
  expectedDate: string;
  notes: string;
}

export function getPurchaseOrders(): PurchaseOrder[] {
  const raw = getStorage(DB_KEYS.PURCHASE_ORDERS);
  if (!raw) {
    setStorage(DB_KEYS.PURCHASE_ORDERS, JSON.stringify([]));
    return [];
  }
  return JSON.parse(raw);
}

export function savePurchaseOrders(pos: PurchaseOrder[]) {
  setStorage(DB_KEYS.PURCHASE_ORDERS, JSON.stringify(pos));
}

export function addPurchaseOrder(po: Omit<PurchaseOrder, "id" | "total">) {
  const pos = getPurchaseOrders();
  const num = Math.floor(Math.random() * 9000) + 1000;
  const newPO: PurchaseOrder = {
    ...po,
    id: `PO-${num}`,
    total: po.quantity * po.unitCost,
  };
  pos.unshift(newPO);
  savePurchaseOrders(pos);
  return newPO;
}

export function updatePurchaseOrder(id: string, updates: Partial<PurchaseOrder>) {
  const pos = getPurchaseOrders();
  const idx = pos.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  Object.assign(pos[idx], updates);
  savePurchaseOrders(pos);
  return pos[idx];
}

export function receivePurchaseOrder(id: string) {
  const po = updatePurchaseOrder(id, { status: "Received" });
  if (po) {
    const products = getProducts();
    const idx = products.findIndex((p) => p.id === po.productId);
    if (idx !== -1) {
      const previousStock = products[idx].stock;
      products[idx].stock = previousStock + po.quantity;
      products[idx].updated = "Just now";
      products[idx].status = autoStatus(products[idx].stock);
      saveProducts(products);
      logStockMovement({
        productId: products[idx].id,
        productName: products[idx].name,
        sku: products[idx].sku,
        type: "Restock Receipt",
        quantityChange: po.quantity,
        previousStock,
        newStock: products[idx].stock,
        reason: `Received from ${po.supplierName}`,
        relatedId: po.id,
      });
    }
  }
  return po;
}

// ---- Team & Roles ----

export type TeamRole = "Admin" | "Manager" | "Warehouse Staff" | "Viewer";
export type TeamStatus = "Active" | "Pending" | "Disabled";

export interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: TeamRole;
  status: TeamStatus;
  department?: string;
  invitedOn: string;
  lastActive?: string;
}

const DEFAULT_TEAM: TeamMember[] = [
  { id: 1, name: "Julian Thorne", email: "admin@inventorybox.io", role: "Admin", status: "Active", department: "Instrumentation & Control", invitedOn: "Jan 12, 2024", lastActive: "Just now" },
  { id: 2, name: "Priya Sharma", email: "priya.sharma@inventorybox.io", role: "Manager", status: "Active", department: "Operations", invitedOn: "Mar 04, 2024", lastActive: "2 hours ago" },
  { id: 3, name: "Arun Mehta", email: "arun.mehta@inventorybox.io", role: "Warehouse Staff", status: "Active", department: "Warehouse", invitedOn: "Jun 18, 2024", lastActive: "Yesterday" },
  { id: 4, name: "Sandra Lee", email: "sandra.lee@inventorybox.io", role: "Viewer", status: "Active", department: "Finance", invitedOn: "Sep 02, 2024", lastActive: "5 days ago" },
];

export function getTeam(): TeamMember[] {
  const raw = getStorage(DB_KEYS.TEAM);
  if (!raw) {
    setStorage(DB_KEYS.TEAM, JSON.stringify(DEFAULT_TEAM));
    return [...DEFAULT_TEAM];
  }
  return JSON.parse(raw);
}

export function saveTeam(team: TeamMember[]) {
  setStorage(DB_KEYS.TEAM, JSON.stringify(team));
}

export function inviteTeamMember(payload: { name: string; email: string; role: TeamRole; department?: string }) {
  const team = getTeam();
  const id = team.length > 0 ? Math.max(...team.map((t) => t.id)) + 1 : 1;
  const member: TeamMember = {
    id,
    name: payload.name,
    email: payload.email,
    role: payload.role,
    status: "Pending",
    department: payload.department,
    invitedOn: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
  };
  team.push(member);
  saveTeam(team);
  return member;
}

export function updateTeamMember(id: number, updates: Partial<TeamMember>) {
  const team = getTeam();
  const idx = team.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  Object.assign(team[idx], updates);
  saveTeam(team);
  return team[idx];
}

export function deleteTeamMember(id: number) {
  const team = getTeam().filter((t) => t.id !== id);
  saveTeam(team);
}

// ---- Activity Log ----

export interface ActivityItem {
  id: string;
  type: "alert" | "order" | "stock" | "customer" | "purchase" | "system";
  icon: string;
  iconColor: string;
  title: string;
  message: string;
  time: string;
  link: string;
  timestamp: number;
}

function timestampForOrderDate(d: string): number {
  const t = new Date(d).getTime();
  return isNaN(t) ? 0 : t;
}

export function getActivityLog(): ActivityItem[] {
  const products = getProducts();
  const orders = getOrders();
  const customers = getCustomers();
  const pos = getPurchaseOrders();
  const items: ActivityItem[] = [];
  const now = Date.now();

  products.filter((p) => p.status === "Out of Stock").forEach((p) => {
    items.push({ id: `oos-${p.id}`, type: "alert", icon: "error", iconColor: "text-rose-500 bg-rose-500/10", title: "Out of Stock", message: `${p.name} (${p.sku}) is completely out of stock.`, time: p.updated, link: `/purchase-orders?restock=${p.id}`, timestamp: now });
  });
  products.filter((p) => p.status === "Low Stock").forEach((p) => {
    items.push({ id: `low-${p.id}`, type: "alert", icon: "warning", iconColor: "text-amber-400 bg-amber-400/10", title: "Low Stock Alert", message: `${p.name} has only ${p.stock} units remaining.`, time: p.updated, link: `/purchase-orders?restock=${p.id}`, timestamp: now - 1000 });
  });

  orders.forEach((o) => {
    const ts = timestampForOrderDate(o.date);
    items.push({ id: `ord-${o.id}`, type: "order", icon: o.status === "Completed" ? "check_circle" : o.status === "Pending" ? "shopping_cart" : "cancel", iconColor: o.status === "Completed" ? "text-emerald-400 bg-emerald-400/10" : o.status === "Pending" ? "text-tertiary bg-tertiary/10" : "text-error bg-error/10", title: `Order ${o.status}`, message: `${o.id} from ${o.customer} · ${formatCurrency(o.amount)}`, time: o.date, link: "/orders", timestamp: ts });
  });

  pos.forEach((po) => {
    items.push({ id: `po-${po.id}`, type: "purchase", icon: po.status === "Received" ? "inventory_2" : "send", iconColor: po.status === "Received" ? "text-emerald-400 bg-emerald-400/10" : "text-primary bg-primary/10", title: `Purchase Order ${po.status}`, message: `${po.id}: ${po.quantity} × ${po.productName} from ${po.supplierName}`, time: po.createdDate, link: "/purchase-orders", timestamp: timestampForOrderDate(po.createdDate) });
  });

  customers.slice(0, 6).forEach((c, i) => {
    items.push({ id: `cust-${c.id}`, type: "customer", icon: "person_add", iconColor: "text-indigo-400 bg-indigo-400/10", title: "Customer Activity", message: `${c.name} · Status: ${c.status}`, time: c.since, link: "/customers", timestamp: now - 100000 - i * 1000 });
  });

  items.push({ id: "sys-1", type: "system", icon: "system_update", iconColor: "text-primary bg-primary/10", title: "System Update", message: "Inventory Management v2.4.0 is now live with new features.", time: "Today", link: "/settings", timestamp: now - 50000 });

  return items.sort((a, b) => b.timestamp - a.timestamp);
}

// ---- Storage breakdown ----

export interface StorageBreakdown {
  totalBytes: number;
  capacityBytes: number;
  pctUsed: number;
  byKey: { label: string; key: string; bytes: number; count: number }[];
  productsByCategory: { category: string; count: number; bytes: number }[];
}

export function getStorageBreakdown(): StorageBreakdown {
  if (typeof window === "undefined") {
    return { totalBytes: 0, capacityBytes: 5_000_000, pctUsed: 0, byKey: [], productsByCategory: [] };
  }
  const sizeOf = (raw: string | null) => (raw ? new Blob([raw]).size : 0);
  const labels: Record<string, string> = {
    [DB_KEYS.PRODUCTS]: "Products Catalog",
    [DB_KEYS.ORDERS]: "Orders",
    [DB_KEYS.CUSTOMERS]: "Customers",
    [DB_KEYS.SUPPLIERS]: "Suppliers",
    [DB_KEYS.PURCHASE_ORDERS]: "Purchase Orders",
    [DB_KEYS.TEAM]: "Team Members",
    [DB_KEYS.SETTINGS]: "App Settings",
    [DB_KEYS.USER]: "User Profile",
  };
  const byKey = Object.entries(labels).map(([key, label]) => {
    const raw = localStorage.getItem(key);
    let count = 0;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) count = parsed.length;
        else if (typeof parsed === "object") count = 1;
      } catch { /* ignore */ }
    }
    return { label, key, bytes: sizeOf(raw), count };
  });
  const totalBytes = byKey.reduce((s, b) => s + b.bytes, 0);
  const capacityBytes = 5_000_000; // soft cap (5MB localStorage typical)

  const products = getProducts();
  const grouped: Record<string, { count: number; bytes: number }> = {};
  products.forEach((p) => {
    const bytes = new Blob([JSON.stringify(p)]).size;
    grouped[p.category] = grouped[p.category] || { count: 0, bytes: 0 };
    grouped[p.category].count += 1;
    grouped[p.category].bytes += bytes;
  });
  const productsByCategory = Object.entries(grouped).map(([category, g]) => ({ category, ...g })).sort((a, b) => b.bytes - a.bytes);

  return { totalBytes, capacityBytes, pctUsed: Math.min(100, Math.round((totalBytes / capacityBytes) * 100)), byKey, productsByCategory };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ---- Search index for global search ----

export interface SearchHit {
  type: "product" | "order" | "customer" | "supplier" | "purchase";
  id: string | number;
  title: string;
  subtitle: string;
  link: string;
  icon: string;
  iconColor: string;
}

export function searchAll(query: string, limit = 5): { products: SearchHit[]; orders: SearchHit[]; customers: SearchHit[]; suppliers: SearchHit[]; purchaseOrders: SearchHit[]; total: number } {
  const q = query.trim().toLowerCase();
  if (!q) return { products: [], orders: [], customers: [], suppliers: [], purchaseOrders: [], total: 0 };
  const products = getProducts().filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)).slice(0, limit).map<SearchHit>((p) => ({ type: "product", id: p.id, title: p.name, subtitle: `${p.sku} · ${p.category} · Stock ${p.stock}`, link: "/products", icon: "inventory_2", iconColor: "text-primary bg-primary/10" }));
  const orders = getOrders().filter((o) => o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q)).slice(0, limit).map<SearchHit>((o) => ({ type: "order", id: o.id, title: o.id, subtitle: `${o.customer} · ${o.status} · ${formatCurrency(o.amount)}`, link: "/orders", icon: "shopping_cart", iconColor: "text-tertiary bg-tertiary/10" }));
  const customers = getCustomers().filter((c) => c.name.toLowerCase().includes(q) || c.contact.toLowerCase().includes(q) || c.industry.toLowerCase().includes(q)).slice(0, limit).map<SearchHit>((c) => ({ type: "customer", id: c.id, title: c.name, subtitle: `${c.contact} · ${c.industry}`, link: "/customers", icon: "groups", iconColor: "text-indigo-400 bg-indigo-400/10" }));
  const suppliers = getSuppliers().filter((s) => s.name.toLowerCase().includes(q) || s.contact.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)).slice(0, limit).map<SearchHit>((s) => ({ type: "supplier", id: s.id, title: s.name, subtitle: `${s.contact} · ${s.category}`, link: "/suppliers", icon: "local_shipping", iconColor: "text-emerald-400 bg-emerald-400/10" }));
  const purchaseOrders = getPurchaseOrders().filter((p) => p.id.toLowerCase().includes(q) || p.productName.toLowerCase().includes(q) || p.supplierName.toLowerCase().includes(q)).slice(0, limit).map<SearchHit>((p) => ({ type: "purchase", id: p.id, title: p.id, subtitle: `${p.productName} · ${p.supplierName} · ${p.status}`, link: "/purchase-orders", icon: "add_shopping_cart", iconColor: "text-primary bg-primary/10" }));
  const total = products.length + orders.length + customers.length + suppliers.length + purchaseOrders.length;
  return { products, orders, customers, suppliers, purchaseOrders, total };
}

// ---- Stock Movements (audit trail) ----

export type StockMovementType = "Initial Stock" | "Manual Adjustment" | "Restock Receipt" | "Order Fulfillment" | "Inventory Correction";

export interface StockMovement {
  id: string;
  productId: number;
  productName: string;
  sku: string;
  type: StockMovementType;
  quantityChange: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  byUser: string;
  timestamp: number;
  relatedId?: string;
}

export function getStockMovements(): StockMovement[] {
  const raw = getStorage(DB_KEYS.STOCK_MOVEMENTS);
  return raw ? JSON.parse(raw) : [];
}

export function saveStockMovements(movements: StockMovement[]) {
  setStorage(DB_KEYS.STOCK_MOVEMENTS, JSON.stringify(movements));
}

export function logStockMovement(movement: Omit<StockMovement, "id" | "timestamp" | "byUser"> & Partial<Pick<StockMovement, "byUser" | "timestamp">>) {
  if (movement.quantityChange === 0) return null;
  const list = getStockMovements();
  const user = movement.byUser ?? (typeof window !== "undefined" ? getUser().name : "System");
  const entry: StockMovement = {
    id: `SM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    productId: movement.productId,
    productName: movement.productName,
    sku: movement.sku,
    type: movement.type,
    quantityChange: movement.quantityChange,
    previousStock: movement.previousStock,
    newStock: movement.newStock,
    reason: movement.reason,
    byUser: user,
    timestamp: movement.timestamp ?? Date.now(),
    relatedId: movement.relatedId,
  };
  list.unshift(entry);
  // Cap at 500 entries to keep storage bounded.
  saveStockMovements(list.slice(0, 500));
  return entry;
}

export function getMovementsForProduct(productId: number): StockMovement[] {
  return getStockMovements().filter((m) => m.productId === productId);
}

// ---- Order Events (status timeline) ----

export type OrderEventType = "Created" | "Status Changed" | "Tracking Updated" | "Note Updated" | "Item Added" | "Item Removed";

export interface OrderEvent {
  id: string;
  orderId: string;
  type: OrderEventType;
  message: string;
  byUser: string;
  timestamp: number;
  fromValue?: string;
  toValue?: string;
}

export function getOrderEvents(): OrderEvent[] {
  const raw = getStorage(DB_KEYS.ORDER_EVENTS);
  return raw ? JSON.parse(raw) : [];
}

export function saveOrderEvents(events: OrderEvent[]) {
  setStorage(DB_KEYS.ORDER_EVENTS, JSON.stringify(events));
}

export function logOrderEvent(event: Omit<OrderEvent, "id" | "timestamp" | "byUser"> & Partial<Pick<OrderEvent, "byUser" | "timestamp">>) {
  const list = getOrderEvents();
  const user = event.byUser ?? (typeof window !== "undefined" ? getUser().name : "System");
  const entry: OrderEvent = {
    id: `OE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    orderId: event.orderId,
    type: event.type,
    message: event.message,
    byUser: user,
    timestamp: event.timestamp ?? Date.now(),
    fromValue: event.fromValue,
    toValue: event.toValue,
  };
  list.unshift(entry);
  saveOrderEvents(list.slice(0, 1000));
  return entry;
}

export function getEventsForOrder(orderId: string): OrderEvent[] {
  return getOrderEvents().filter((e) => e.orderId === orderId).sort((a, b) => a.timestamp - b.timestamp);
}
