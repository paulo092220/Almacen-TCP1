

export enum TransactionType {
  STOCK_IN = 'STOCK_IN',
  SALE = 'SALE',
  CONSIGNMENT_OUT = 'CONSIGNMENT_OUT',
  CONSIGNMENT_SETTLE = 'CONSIGNMENT_SETTLE',
  RETURN = 'RETURN'
}

export enum ConsignmentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED'
}

export type UserRole = 'admin' | 'seller';

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  action: string; // e.g., "CREAR_PRODUCTO", "VENTA", "EDITAR_PRECIO"
  details: string; // Readable description
  user?: string; // For future multi-user support
}

export interface Customer {
  id: string;
  name: string;
  ci?: string; // Cédula de Identidad / RUC
  phone?: string;
  email?: string;
  notes?: string;
  dateCreated: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
  basePrice: number; // The standard selling price
  cost: number; // Cost to acquire
  category: string;
  image?: string; // Base64 encoded image string
  // Add new properties for box/pack sales
  unitsPerBox?: number;
  boxPrice?: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  productId: string;
  quantity: number;
  pricePerUnit: number;
  total: number;
  date: string;
  note?: string;
  relatedConsignmentId?: string;
  customerId?: string; // Optional linkage to customer
  customerName?: string; // Snapshot for history
}

export interface Consignment {
  id: string;
  customerId: string; // Now required to link to a customer profile
  customerName: string;
  productId: string;
  productName: string; // Snapshot in case product is deleted
  quantity: number;
  agreedPricePerUnit: number; // Original agreed price
  totalExpected: number;
  paidAmount: number; // Track partial payments (Abonos)
  status: ConsignmentStatus;
  dateCreated: string;
  dateSettled?: string;
  settledAmount?: number; // Total amount received when settled (deprecated in favor of paidAmount logic, but kept for legacy)
  settledPricePerUnit?: number;
}

export interface AppSettings {
  useCustomSavePath: boolean; // If true, tries to use FileSystem API to ask for location
  lastSyncDate?: string;
}

export interface AppState {
  users: User[];
  products: Product[];
  transactions: Transaction[];
  consignments: Consignment[];
  customers: Customer[];
  categories: string[]; // List of saved categories
  logs: LogEntry[]; // Audit trail/History
  settings: AppSettings;
}