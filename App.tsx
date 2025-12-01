
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Package, 
  ShoppingCart, 
  ClipboardList, 
  TrendingUp, 
  Settings, 
  Plus, 
  Search, 
  DollarSign, 
  CheckCircle,
  XCircle,
  BrainCircuit,
  Menu,
  X,
  Users,
  Phone,
  UserPlus,
  RefreshCw,
  Tag,
  Printer,
  CalendarCheck,
  Pencil,
  LayoutGrid,
  List,
  Image as ImageIcon,
  Upload,
  History,
  Activity,
  FileText,
  Filter,
  ArrowRightLeft,
  Wallet,
  ShoppingBag,
  Trash2,
  Minus,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertCircle,
  Download,
  Save,
  AlertTriangle,
  FolderOpen,
  ShieldCheck,
  HardDrive,
  LogOut,
  Lock,
  User,
  Key,
  Power,
  MessageSquare,
  FileEdit,
  CreditCard as IdCardIcon,
  Wifi,
  WifiOff,
  Box, // Icon for Box
  Layers // Icon for Packs
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

import { AppState, Product, Transaction, Consignment, TransactionType, ConsignmentStatus, Customer, LogEntry, UserRole, User as AppUser } from './types';
import * as Storage from './services/storageService';
import { analyzeBusinessData } from './services/geminiService';

// --- Components ---

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'success' }> = ({ 
  children, variant = 'primary', className = '', ...props 
}) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-300",
    danger: "bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500"
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className = '', ...props }) => (
  <div className="flex flex-col gap-1 w-full">
    {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
    <input 
      className={`border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none ${className}`} 
      {...props} 
    />
  </div>
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }> = ({ label, children, className = '', ...props }) => (
  <div className="flex flex-col gap-1 w-full">
    {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
    <select 
      className={`border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white ${className}`} 
      {...props} 
    >
      {children}
    </select>
  </div>
);

const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string }> = ({ children, className = '', title }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
    {title && (
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <h3 className="font-semibold text-gray-800">{title}</h3>
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; maxWidth?: string }> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className={`bg-white rounded-xl shadow-2xl w-full ${maxWidth} overflow-hidden animate-in fade-in zoom-in duration-200`}>
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[85vh]">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- Receipt/Ticket Logic ---

interface ReceiptData {
  type: 'SALE' | 'CONSIGNMENT' | 'SETTLEMENT' | 'DAILY_REPORT';
  title: string;
  date: string;
  id: string;
  customerName: string;
  customerCI?: string; 
  items: {
    name: string;
    qty: number;
    price: number;
    total: number;
  }[];
  totalAmount: number;
  notes?: string;
  dailyStats?: {
    cashSales: number;
    settlements: number;
    totalCash: number;
  };
}

const ReceiptTemplate: React.FC<{ data: ReceiptData; settings?: any }> = ({ data, settings }) => {
  return (
    <div className="font-mono text-[11px] w-[58mm] mx-auto p-1 border-2 border-dashed border-gray-300 print:border-none print:w-full bg-white leading-tight">
      <div className="text-center mb-2">
        {settings?.ticketHeader ? (
           <div className="whitespace-pre-wrap font-bold mb-1">{settings.ticketHeader}</div>
        ) : (
          <>
            <h1 className="text-sm font-bold uppercase">The Brothers</h1>
            <p className="text-[9px]">Control de Inventario</p>
          </>
        )}
        <div className="border-b border-black my-1"></div>
        <h2 className="font-bold text-xs">{data.title}</h2>
        <p className="text-[9px]">Fecha: {new Date(data.date).toLocaleString()}</p>
        <p className="text-[9px]">Folio: {data.id.slice(-6).toUpperCase()}</p>
      </div>

      <div className="mb-2">
        <p className="font-bold">Cliente:</p>
        <p>{data.customerName}</p>
        {data.customerCI && <p className="text-[9px]">CI/RUC: {data.customerCI}</p>}
      </div>

      <table className="w-full mb-2 text-[10px]">
        <thead>
          <tr className="border-b border-black text-left">
            <th className="py-0.5">Cant</th>
            <th className="py-0.5">Desc</th>
            <th className="py-0.5 text-right">$$</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, idx) => (
            <tr key={idx}>
              <td className="py-0.5 align-top">{item.qty}</td>
              <td className="py-0.5 align-top">{item.name}</td>
              <td className="py-0.5 text-right align-top">${item.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-black pt-1 mb-2">
        <div className="flex justify-between font-bold text-xs">
          <span>TOTAL:</span>
          <span>${data.totalAmount.toFixed(2)}</span>
        </div>
        {data.dailyStats && (
           <div className="mt-1 text-[9px] space-y-0.5 pt-1 border-t border-dashed border-gray-400">
             <div className="flex justify-between"><span>Ventas Efec:</span> <span>${data.dailyStats.cashSales.toFixed(2)}</span></div>
             <div className="flex justify-between"><span>Cobros:</span> <span>${data.dailyStats.settlements.toFixed(2)}</span></div>
             <div className="flex justify-between font-bold"><span>Total:</span> <span>${data.dailyStats.totalCash.toFixed(2)}</span></div>
           </div>
        )}
      </div>

      {data.notes && (
        <div className="text-[9px] mb-2 italic border p-1 border-gray-400 whitespace-pre-wrap">
          Nota: {data.notes}
        </div>
      )}

      {data.type === 'CONSIGNMENT' && (
        <div className="mt-8 text-center">
          <div className="border-b border-black w-3/4 mx-auto mb-1"></div>
          <p className="text-[9px] font-bold">FIRMA DE ACEPTACIÓN</p>
        </div>
      )}

      <div className="text-center text-[9px] mt-4">
        {settings?.ticketFooter ? (
           <div className="whitespace-pre-wrap">{settings.ticketFooter}</div>
        ) : (
          <>
            <p>¡Gracias por su preferencia!</p>
            <p className="mt-1">Sistema The Brothers</p>
          </>
        )}
      </div>
    </div>
  );
};

// --- Login Component ---

const LoginScreen: React.FC<{ onLogin: (role: UserRole, userName: string) => void, users: AppUser[], isElectron: boolean, onQuit: () => void }> = ({ onLogin, users, isElectron, onQuit }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    
    if (user) {
      onLogin(user.role, user.username);
    } else {
      setError('Credenciales incorrectas');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative">
        {isElectron && (
           <button 
             onClick={onQuit}
             className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors z-10"
             title="Salir de la Aplicación"
           >
             <Power size={20} />
           </button>
        )}
        <div className="bg-indigo-600 p-8 text-center">
           <h1 className="text-3xl font-bold text-white mb-2">The Brothers</h1>
           <p className="text-indigo-100">Sistema de Control</p>
        </div>
        <div className="p-8">
           <form onSubmit={handleLogin} className="space-y-6">
             <div className="space-y-2">
               <label className="text-sm font-medium text-gray-700">Usuario</label>
               <div className="relative">
                 <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                 <input 
                   type="text" 
                   value={username}
                   onChange={(e) => setUsername(e.target.value)}
                   className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                   placeholder="Nombre de usuario"
                   autoFocus
                 />
               </div>
             </div>
             <div className="space-y-2">
               <label className="text-sm font-medium text-gray-700">Contraseña</label>
               <div className="relative">
                 <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                 <input 
                   type="password" 
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                   placeholder="Contraseña"
                 />
               </div>
             </div>
             {error && (
               <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                 <AlertCircle size={16} /> {error}
               </div>
             )}
             <Button type="submit" className="w-full py-3 text-lg">
               Iniciar Sesión
             </Button>
           </form>
           <div className="mt-6 text-center text-xs text-gray-400">
             <p>Usuarios por defecto:</p>
             <p>Admin: admin / admin123</p>
             <p>Vendedor: vendedor / vend123</p>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- Helpers ---
const generateSKU = () => {
  const prefix = "PROD";
  const random = Math.floor(100000 + Math.random() * 900000); 
  return `${prefix}-${random}`;
};

const getLocalDateStr = (dateInput: Date | string) => {
  const date = new Date(dateInput);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getLocalISOTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const offset = date.getTimezoneOffset() * 60000;
  return (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
};

const translateType = (type: TransactionType) => {
  switch(type) {
    case TransactionType.SALE: return 'VENTA';
    case TransactionType.STOCK_IN: return 'ENTRADA STOCK';
    case TransactionType.CONSIGNMENT_OUT: return 'CRÉDITO / SALIDA';
    case TransactionType.CONSIGNMENT_SETTLE: return 'COBRO DEUDA';
    case TransactionType.RETURN: return 'DEVOLUCIÓN';
    default: return type;
  }
};

interface CartItem {
  product: Product;
  quantity: number;
  price: number;
  type: 'unit' | 'box'; // Distinguish between unit and box sales
  unitsInPack: number;  // How many actual units this item represents
}

// --- Main App ---

export default function App() {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'inventory' | 'sales' | 'consignments' | 'finances' | 'customers' | 'ai' | 'history' | 'settings'>('inventory');
  
  // Connection Status State
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Initialize state directly from storage
  const [data, setData] = useState<AppState>(() => Storage.loadData());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isElectron, setIsElectron] = useState(false);
  
  // View State
  const [inventoryView, setInventoryView] = useState<'grid' | 'list'>('grid');
  const [reportDate, setReportDate] = useState(getLocalDateStr(new Date()));
  const [historyFilter, setHistoryFilter] = useState<'all' | 'money' | 'stock' | 'customers'>('all');
  const [viewDetailsCustomerId, setViewDetailsCustomerId] = useState<string | null>(null);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartCustomer, setCartCustomer] = useState<string>("");
  const [cartNote, setCartNote] = useState<string>(""); 

  // Modals State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isCustomerPaymentModalOpen, setIsCustomerPaymentModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isReceiptEditModalOpen, setIsReceiptEditModalOpen] = useState(false);
  const [isEditConsignmentModalOpen, setIsEditConsignmentModalOpen] = useState(false);
  
  // Selection State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedConsignment, setSelectedConsignment] = useState<Consignment | null>(null);
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<Customer | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);

  // Form State
  const [formData, setFormData] = useState<any>({});
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Print & Pending Transaction State
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [editableReceiptData, setEditableReceiptData] = useState<ReceiptData | null>(null);
  const [pendingDataUpdate, setPendingDataUpdate] = useState<{ 
    newState: Partial<AppState>, 
    callback?: () => void 
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const directoryInputRef = useRef<HTMLInputElement>(null);

  // --- Effects ---

  // Detect Electron environment
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.indexOf(' electron/') > -1) {
      setIsElectron(true);
    }
  }, []);

  // Monitor Connectivity
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Persist data whenever it changes
  useEffect(() => {
    Storage.saveData(data);
  }, [data]);

  // Sync receiptData to editableReceiptData when modal opens
  useEffect(() => {
    if (isReceiptEditModalOpen && receiptData) {
      setEditableReceiptData(receiptData);
    }
  }, [isReceiptEditModalOpen, receiptData]);

  const handleQuitApp = () => {
    if (window.confirm("¿Deseas cerrar la aplicación completamente?")) {
        if ((window as any).ipcRenderer) {
          (window as any).ipcRenderer.invoke('quit-app');
        } else {
          window.close();
          setTimeout(() => {
            const electron = (window as any).require ? (window as any).require('electron') : null;
            if (electron) electron.ipcRenderer.invoke('quit-app');
          }, 100);
        }
    }
  };

  const handleConfirmAndPrint = () => {
    if (pendingDataUpdate) {
        // Commit the transaction only when confirmed
        setData(prev => ({
            ...prev,
            ...pendingDataUpdate.newState
        }));
        if (pendingDataUpdate.callback) pendingDataUpdate.callback();
        setPendingDataUpdate(null);
    }
    
    setTimeout(() => {
        window.print();
        setIsReceiptEditModalOpen(false);
    }, 50);
  };

  const handleCancelPrint = () => {
    setPendingDataUpdate(null);
    setIsReceiptEditModalOpen(false);
  };

  const handleDeleteTransaction = (transactionId: string) => {
    if (!window.confirm("¿Estás seguro de eliminar este movimiento? Esta acción revertirá el stock y los saldos.")) return;

    const tx = data.transactions.find(t => t.id === transactionId);
    if (!tx) return;

    let updatedProducts = [...data.products];
    let updatedConsignments = [...data.consignments];
    
    if (tx.type === TransactionType.SALE) {
      updatedProducts = updatedProducts.map(p => 
        p.id === tx.productId ? { ...p, stock: p.stock + tx.quantity } : p
      );
    } else if (tx.type === TransactionType.STOCK_IN) {
      updatedProducts = updatedProducts.map(p => 
        p.id === tx.productId ? { ...p, stock: Math.max(0, p.stock - tx.quantity) } : p
      );
    } else if (tx.type === TransactionType.CONSIGNMENT_OUT) {
      if (tx.relatedConsignmentId) {
         updatedConsignments = updatedConsignments.filter(c => c.id !== tx.relatedConsignmentId);
      }
      updatedProducts = updatedProducts.map(p => 
        p.id === tx.productId ? { ...p, stock: p.stock + tx.quantity } : p
      );
    } else if (tx.type === TransactionType.CONSIGNMENT_SETTLE) {
      if (tx.relatedConsignmentId) {
        updatedConsignments = updatedConsignments.map(c => {
           if (c.id === tx.relatedConsignmentId) {
             const newPaid = Math.max(0, (c.paidAmount || 0) - tx.total);
             return {
               ...c,
               paidAmount: newPaid,
               status: ConsignmentStatus.PENDING,
               dateSettled: undefined
             };
           }
           return c;
        });
      }
    }

    const log: LogEntry = {
      id: Storage.generateId(),
      timestamp: new Date().toISOString(),
      action: 'ELIMINAR TRANSACCIÓN',
      details: `Se eliminó: ${tx.type} - $${tx.total} (Usuario: ${currentUsername})`
    };

    setData(prev => ({
      ...prev,
      products: updatedProducts,
      consignments: updatedConsignments,
      transactions: prev.transactions.filter(t => t.id !== transactionId),
      logs: [log, ...prev.logs]
    }));
  };

  // --- Cart Actions ---

  const handleAddToCart = (product: Product, type: 'unit' | 'box' = 'unit') => {
    // Determine quantity to deduct based on type
    const unitsToAdd = type === 'box' ? (product.unitsPerBox || 1) : 1;
    const priceToAdd = type === 'box' ? (product.boxPrice || product.basePrice * unitsToAdd) : product.basePrice;

    if (product.stock < unitsToAdd) {
      alert(`Stock insuficiente. Tienes ${product.stock} unidades y necesitas ${unitsToAdd}.`);
      return;
    }

    setCart(prev => {
      // Check if same product AND same type (unit/box) exists
      const existing = prev.find(item => item.product.id === product.id && item.type === type);
      
      if (existing) {
        // Check total stock requirement for existing items + new addition
        // NOTE: This check is simple and might not cover mixed unit/box scenarios perfectly for stock limit in cart, but works for basic flow.
        if ((existing.quantity * existing.unitsInPack) + unitsToAdd > product.stock) {
           alert("No puedes agregar más de la cantidad en stock.");
           return prev;
        }

        return prev.map(item => 
          (item.product.id === product.id && item.type === type)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { 
          product, 
          quantity: 1, 
          price: priceToAdd, 
          type, 
          unitsInPack: unitsToAdd 
        }];
      }
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const updateCartItem = (index: number, field: 'quantity' | 'price', value: number) => {
    setCart(prev => prev.map((item, i) => {
      if (i === index) {
        if (field === 'quantity') {
          const totalUnitsNeeded = value * item.unitsInPack;
          if (totalUnitsNeeded > item.product.stock) {
            alert("Cantidad excede el stock disponible.");
            return item;
          }
          if (value < 1) return item;
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  }, [cart]);

  const handleCartCheckout = (type: 'SALE' | 'CONSIGNMENT') => {
    if (cart.length === 0) return;

    if (type === 'CONSIGNMENT' && !cartCustomer) {
      alert("Debes seleccionar un cliente para realizar un crédito/consignación.");
      return;
    }

    const timestamp = new Date().toISOString();
    const customer = data.customers.find(c => c.id === cartCustomer);
    const customerName = customer ? customer.name : (type === 'SALE' ? 'Público General' : 'Desconocido');
    const customNote = cartNote.trim() ? ` | Nota: ${cartNote.trim()}` : '';

    let newTransactions: Transaction[] = [];
    let newConsignments: Consignment[] = [];
    let updatedProducts = [...data.products];
    let newLogs: LogEntry[] = [];
    
    const receiptItems: {name: string, qty: number, price: number, total: number}[] = [];

    cart.forEach(item => {
      const total = item.quantity * item.price;
      const transactionId = Storage.generateId();
      
      // Calculate total units to remove from stock
      const unitsToRemove = item.quantity * item.unitsInPack;

      const productIndex = updatedProducts.findIndex(p => p.id === item.product.id);
      if (productIndex !== -1) {
        updatedProducts[productIndex] = {
          ...updatedProducts[productIndex],
          stock: updatedProducts[productIndex].stock - unitsToRemove
        };
      }

      const itemName = item.type === 'box' 
        ? `${item.product.name} (Caja/Paca x${item.unitsInPack})` 
        : item.product.name;

      receiptItems.push({
        name: itemName,
        qty: item.quantity,
        price: item.price,
        total: total
      });

      if (type === 'SALE') {
        newTransactions.push({
          id: transactionId,
          type: TransactionType.SALE,
          productId: item.product.id,
          quantity: unitsToRemove, // Track total units moved in inventory
          pricePerUnit: item.price / item.unitsInPack, // Effective unit price
          total: total,
          date: timestamp,
          customerId: customer?.id,
          customerName: customerName,
          note: `Venta (${currentUsername}): ${item.quantity} ${item.type === 'box' ? 'Cajas' : 'Unidades'} de ${item.product.name}${customNote}`
        });
      } else {
        const consignmentId = Storage.generateId();
        const consignment: Consignment = {
          id: consignmentId,
          customerId: customer!.id,
          customerName: customer!.name,
          productId: item.product.id,
          productName: itemName,
          quantity: item.quantity, // Quantity of items (boxes or units)
          agreedPricePerUnit: item.price,
          totalExpected: total,
          paidAmount: 0,
          status: ConsignmentStatus.PENDING,
          dateCreated: timestamp
        };
        newConsignments.push(consignment);

        newTransactions.push({
          id: transactionId,
          type: TransactionType.CONSIGNMENT_OUT,
          productId: item.product.id,
          quantity: unitsToRemove,
          pricePerUnit: item.price / item.unitsInPack,
          total: 0, 
          date: timestamp,
          customerId: customer!.id,
          customerName: customer!.name,
          note: `Crédito (${currentUsername}) - ${item.quantity} ${item.type} ${item.product.name}${customNote}`,
          relatedConsignmentId: consignmentId
        });
      }
    });

    newLogs.push({
      id: Storage.generateId(),
      timestamp,
      action: type === 'SALE' ? 'VENTA MÚLTIPLE' : 'CRÉDITO ASIGNADO',
      details: `${type === 'SALE' ? 'Venta' : 'Crédito'} de ${cart.length} items a ${customerName} por usuario ${currentUsername}.${customNote}`
    });

    const newState = {
      products: updatedProducts,
      transactions: [...data.transactions, ...newTransactions],
      consignments: [...data.consignments, ...newConsignments],
      logs: [...newLogs, ...data.logs]
    };

    const callback = () => {
      setCart([]);
      setCartNote("");
      setIsCartOpen(false);
      setCartCustomer("");
    };

    setPendingDataUpdate({ newState, callback });

    setReceiptData({
      type: type,
      title: type === 'SALE' ? 'TICKET DE VENTA' : 'NOTA DE CRÉDITO / REMISIÓN',
      date: timestamp,
      id: Storage.generateId(),
      customerName: customerName,
      customerCI: customer?.ci || '',
      items: receiptItems,
      totalAmount: cartTotal,
      notes: (type === 'SALE' 
        ? 'No se aceptan devoluciones después de 3 días.' 
        : 'Mercancía a crédito. El cliente reconoce la deuda total descrita.') + (cartNote ? `\n\nNOTA: ${cartNote}` : '')
    });
    setIsReceiptEditModalOpen(true);
  };

  // --- Other Actions ---

  const handleOpenAddProductModal = () => {
    setIsEditMode(false);
    setSelectedProduct(null);
    setFormData({
      sku: generateSKU(),
      category: '', 
      stock: 0,
      basePrice: 0,
      image: null,
      unitsPerBox: 0,
      boxPrice: 0
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProductModal = (product: Product) => {
    if (userRole === 'seller') return;
    setIsEditMode(true);
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category,
      basePrice: product.basePrice,
      image: product.image,
      unitsPerBox: product.unitsPerBox || 0,
      boxPrice: product.boxPrice || 0
    });
    setIsProductModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const categoryName = formData.category?.trim();
    if (!categoryName) {
      alert("Por favor, ingresa o selecciona una categoría.");
      return;
    }
    let updatedCategories = [...data.categories];
    if (!updatedCategories.includes(categoryName)) {
      updatedCategories.push(categoryName);
      updatedCategories.sort();
    }
    const timestamp = new Date().toISOString();

    const unitsPerBox = Number(formData.unitsPerBox) || 0;
    const boxPrice = Number(formData.boxPrice) || 0;

    if (isEditMode && selectedProduct) {
      const updatedProduct: Product = {
        ...selectedProduct,
        name: formData.name,
        sku: formData.sku,
        basePrice: Number(formData.basePrice),
        category: categoryName,
        image: formData.image,
        unitsPerBox: unitsPerBox,
        boxPrice: boxPrice
      };
      const log: LogEntry = {
        id: Storage.generateId(),
        timestamp,
        action: 'EDITAR PRODUCTO',
        details: `Se editó el producto "${updatedProduct.name}". Usuario: ${currentUsername}`
      };
      setData(prev => ({
        ...prev,
        products: prev.products.map(p => p.id === selectedProduct.id ? updatedProduct : p),
        categories: updatedCategories,
        logs: [log, ...prev.logs]
      }));
    } else {
      const newProduct: Product = {
        id: Storage.generateId(),
        name: formData.name,
        sku: formData.sku,
        stock: Number(formData.stock),
        basePrice: Number(formData.basePrice),
        cost: 0,
        category: categoryName,
        image: formData.image,
        unitsPerBox: unitsPerBox,
        boxPrice: boxPrice
      };
      const transaction: Transaction = {
        id: Storage.generateId(),
        type: TransactionType.STOCK_IN,
        productId: newProduct.id,
        quantity: newProduct.stock,
        pricePerUnit: 0,
        total: 0,
        date: timestamp,
        note: 'Inventario Inicial'
      };
      const log: LogEntry = {
        id: Storage.generateId(),
        timestamp,
        action: 'CREAR PRODUCTO',
        details: `Se creó el producto "${newProduct.name}" con stock inicial de ${newProduct.stock}. Usuario: ${currentUsername}`
      };
      setData(prev => ({
        ...prev,
        products: [...prev.products, newProduct],
        transactions: [...prev.transactions, transaction],
        categories: updatedCategories,
        logs: [log, ...prev.logs]
      }));
    }
    setIsProductModalOpen(false);
    setFormData({});
  };

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const timestamp = new Date().toISOString();
    const newCustomer: Customer = {
      id: Storage.generateId(),
      name: formData.name,
      ci: formData.ci,
      phone: formData.phone,
      email: formData.email,
      notes: formData.notes,
      dateCreated: timestamp
    };
    const log: LogEntry = {
      id: Storage.generateId(),
      timestamp,
      action: 'NUEVO CLIENTE',
      details: `Se registró al cliente "${newCustomer.name}". Usuario: ${currentUsername}`
    };
    setData(prev => ({
      ...prev,
      customers: [...prev.customers, newCustomer],
      logs: [log, ...prev.logs]
    }));
    setIsCustomerModalOpen(false);
    setFormData({});
  };

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const qty = Number(formData.quantity);
    const cost = 0; 
    const timestamp = new Date().toISOString();
    const log: LogEntry = {
      id: Storage.generateId(),
      timestamp,
      action: 'AGREGAR STOCK',
      details: `Entrada de ${qty} unidades para "${selectedProduct.name}". Usuario: ${currentUsername}`
    };
    setData(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === selectedProduct.id ? { ...p, stock: p.stock + qty } : p),
      transactions: [...prev.transactions, {
        id: Storage.generateId(),
        type: TransactionType.STOCK_IN,
        productId: selectedProduct.id,
        quantity: qty,
        pricePerUnit: cost,
        total: 0,
        date: timestamp,
        note: 'Reabastecimiento'
      }],
      logs: [log, ...prev.logs]
    }));
    setIsStockModalOpen(false);
    setFormData({});
  };

  const handleSettleCustomerDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForPayment) return;

    const paymentAmount = Number(formData.settledAmount);
    
    // Calculate total debt
    const pendingItems = data.consignments
      .filter(c => c.customerId === selectedCustomerForPayment.id && c.status === ConsignmentStatus.PENDING);
    
    pendingItems.sort((a, b) => new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime());

    const totalDebt = pendingItems.reduce((sum, c) => sum + (c.totalExpected - (c.paidAmount || 0)), 0);

    if (paymentAmount <= 0) {
      alert("El monto debe ser mayor a 0.");
      return;
    }

    if (paymentAmount > totalDebt + 0.1) {
       alert(`El monto excede la deuda total del cliente ($${totalDebt.toFixed(2)}).`);
       return;
    }

    const date = new Date().toISOString();
    let moneyToDistribute = paymentAmount;
    let updatedConsignments = [...data.consignments];
    let newTransactions: Transaction[] = [];
    let receiptItems: {name: string, qty: number, price: number, total: number}[] = [];

    // Distribute payment
    for (const item of pendingItems) {
      if (moneyToDistribute <= 0.01) break;

      const debt = item.totalExpected - (item.paidAmount || 0);
      const paymentForThisItem = Math.min(debt, moneyToDistribute);

      const index = updatedConsignments.findIndex(c => c.id === item.id);
      if (index !== -1) {
        const currentPaid = updatedConsignments[index].paidAmount || 0;
        const newPaid = currentPaid + paymentForThisItem;
        const isFullyPaid = (updatedConsignments[index].totalExpected - newPaid) < 0.1;

        updatedConsignments[index] = {
          ...updatedConsignments[index],
          paidAmount: newPaid,
          status: isFullyPaid ? ConsignmentStatus.PAID : ConsignmentStatus.PENDING,
          dateSettled: isFullyPaid ? date : undefined
        };

        newTransactions.push({
          id: Storage.generateId(),
          type: TransactionType.CONSIGNMENT_SETTLE,
          productId: item.productId,
          quantity: 0,
          pricePerUnit: 0,
          total: paymentForThisItem,
          date: date,
          customerId: item.customerId,
          customerName: item.customerName,
          note: isFullyPaid ? `Liq. Deuda Global (${item.productName})` : `Abono Deuda Global (${item.productName})`,
          relatedConsignmentId: item.id
        });

        receiptItems.push({
           name: `${item.productName} (${isFullyPaid ? 'Pagado' : 'Abono'})`,
           qty: 1,
           price: paymentForThisItem,
           total: paymentForThisItem
        });

        moneyToDistribute -= paymentForThisItem;
      }
    }

    const log: LogEntry = {
      id: Storage.generateId(),
      timestamp: date,
      action: 'ABONO CLIENTE',
      details: `Abono general de $${paymentAmount.toFixed(2)} por usuario ${currentUsername}`
    };

    // Prepare Pending Data
    const finalConsignments = updatedConsignments;
    const finalTransactions = [...data.transactions, ...newTransactions];
    const finalLogs = [log, ...data.logs];

    setPendingDataUpdate({
        newState: {
            consignments: finalConsignments,
            transactions: finalTransactions,
            logs: finalLogs
        },
        callback: () => {
             setIsCustomerPaymentModalOpen(false);
             setFormData({});
        }
    });

    // Generate Single Ticket
    setReceiptData({
      type: 'SETTLEMENT',
      title: 'RECIBO DE PAGO A CUENTA',
      date: date,
      id: Storage.generateId(),
      customerName: selectedCustomerForPayment.name,
      customerCI: selectedCustomerForPayment.ci || '',
      items: receiptItems,
      totalAmount: paymentAmount,
      notes: `Nuevo saldo deudor: $${(totalDebt - paymentAmount).toFixed(2)}`
    });
    setIsReceiptEditModalOpen(true);
  };

  const handleSettleConsignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConsignment) return;

    const paymentAmount = Number(formData.settledAmount);
    const currentPaid = selectedConsignment.paidAmount || 0;
    const remainingBeforePayment = selectedConsignment.totalExpected - currentPaid;
    
    if (paymentAmount <= 0) {
      alert("El monto debe ser mayor a 0.");
      return;
    }

    if (paymentAmount > remainingBeforePayment + 0.1) {
       alert(`El monto excede la deuda restante ($${remainingBeforePayment.toFixed(2)}).`);
       return;
    }

    const date = new Date().toISOString();
    const transactionId = Storage.generateId();
    
    const newTotalPaid = currentPaid + paymentAmount;
    const newRemaining = selectedConsignment.totalExpected - newTotalPaid;
    
    const isFullyPaid = newRemaining < 0.5;
    const newStatus = isFullyPaid ? ConsignmentStatus.PAID : ConsignmentStatus.PENDING;

    const log: LogEntry = {
      id: Storage.generateId(),
      timestamp: date,
      action: isFullyPaid ? 'LIQUIDACIÓN TOTAL' : 'ABONO',
      details: `${isFullyPaid ? 'Liquidación completa' : 'Abono'} de $${paymentAmount.toFixed(2)} por usuario ${currentUsername}`
    };

    const customer = data.customers.find(c => c.id === selectedConsignment.customerId);

    const finalConsignments = data.consignments.map(c => c.id === selectedConsignment.id ? {
        ...c,
        status: newStatus,
        dateSettled: isFullyPaid ? date : undefined,
        paidAmount: newTotalPaid,
        settledAmount: newTotalPaid
      } : c);

    const newTransaction = {
        id: transactionId,
        type: TransactionType.CONSIGNMENT_SETTLE,
        productId: selectedConsignment.productId,
        quantity: 0,
        pricePerUnit: 0, 
        total: paymentAmount,
        date: date,
        customerId: selectedConsignment.customerId,
        customerName: selectedConsignment.customerName,
        note: isFullyPaid ? `Liquidación Final (${selectedConsignment.productName})` : `Abono a Cuenta (${selectedConsignment.productName})`,
        relatedConsignmentId: selectedConsignment.id
    };
    const finalTransactions = [...data.transactions, newTransaction];
    const finalLogs = [log, ...data.logs];

    setPendingDataUpdate({
        newState: { consignments: finalConsignments, transactions: finalTransactions, logs: finalLogs },
        callback: () => {
             setIsSettleModalOpen(false);
             setFormData({});
        }
    });

    // Trigger Ticket Print
    setReceiptData({
      type: 'SETTLEMENT',
      title: isFullyPaid ? 'RECIBO DE LIQUIDACIÓN' : 'RECIBO DE ABONO',
      date: date,
      id: transactionId,
      customerName: selectedConsignment.customerName,
      customerCI: customer?.ci || '',
      items: [{
        name: `${selectedConsignment.productName} (${isFullyPaid ? 'Saldo Final' : 'Abono Parcial'})`,
        qty: 1,
        price: paymentAmount,
        total: paymentAmount
      }],
      totalAmount: paymentAmount,
      notes: isFullyPaid 
        ? 'La deuda ha sido pagada en su totalidad.' 
        : `Resta por pagar: $${newRemaining.toFixed(2)}`
    });
    setIsReceiptEditModalOpen(true);
  };

  const handleOpenEditConsignment = (consignment: Consignment) => {
    setSelectedConsignment(consignment);
    setFormData({
      productName: consignment.productName,
      totalExpected: consignment.totalExpected,
      paidAmount: consignment.paidAmount || 0
    });
    setIsEditConsignmentModalOpen(true);
  };

  const handleSaveConsignmentEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConsignment) return;

    const newName = formData.productName;
    const newTotal = Number(formData.totalExpected);
    const newPaid = Number(formData.paidAmount);

    if (newTotal < 0 || newPaid < 0) {
      alert("Los montos no pueden ser negativos.");
      return;
    }

    const updatedConsignments = data.consignments.map(c => {
      if (c.id === selectedConsignment.id) {
        const isPaid = (newTotal - newPaid) < 0.1;
        return {
          ...c,
          productName: newName,
          totalExpected: newTotal,
          paidAmount: newPaid,
          status: isPaid ? ConsignmentStatus.PAID : ConsignmentStatus.PENDING,
          dateSettled: isPaid ? (c.dateSettled || new Date().toISOString()) : undefined
        };
      }
      return c;
    });

    // Also update the creation transaction to match history reports
    const updatedTransactions = data.transactions.map(t => {
      if (t.relatedConsignmentId === selectedConsignment.id && t.type === TransactionType.CONSIGNMENT_OUT) {
         // Assuming unit price changes if total changes, keeping qty same for simplicity in this edit mode
         return {
           ...t,
           total: 0, // Out transaction usually 0 cash, but we track pricePerUnit
           pricePerUnit: newTotal / t.quantity
         }
      }
      return t;
    });

    const log: LogEntry = {
        id: Storage.generateId(),
        timestamp: new Date().toISOString(),
        action: 'EDITAR DEUDA',
        details: `Edición manual deuda ${selectedConsignment.id}: ${newName} - $${newTotal} (Usuario: ${currentUsername})`
    };

    setData(prev => ({
       ...prev,
       consignments: updatedConsignments,
       transactions: updatedTransactions,
       logs: [log, ...prev.logs]
    }));

    setIsEditConsignmentModalOpen(false);
    setFormData({});
  };

  // --- User Management Actions ---

  const handleOpenUserModal = (user: AppUser | null) => {
    setSelectedUser(user);
    if (user) {
      setFormData({
        username: user.username,
        name: user.name,
        password: user.password,
        role: user.role
      });
      setIsEditMode(true);
    } else {
      setFormData({
        username: '',
        name: '',
        password: '',
        role: 'seller'
      });
      setIsEditMode(false);
    }
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditMode && selectedUser) {
      const updatedUsers = data.users.map(u => 
        u.id === selectedUser.id 
          ? { ...u, name: formData.name, password: formData.password, role: formData.role as UserRole } 
          : u
      );
      setData(prev => ({ ...prev, users: updatedUsers }));
      alert("Usuario actualizado");
    } else {
      if (data.users.some(u => u.username.toLowerCase() === formData.username.toLowerCase())) {
        alert("El nombre de usuario ya existe.");
        return;
      }
      const newUser: AppUser = {
        id: Storage.generateId(),
        username: formData.username,
        name: formData.name,
        password: formData.password,
        role: formData.role as UserRole
      };
      setData(prev => ({ ...prev, users: [...prev.users, newUser] }));
      alert("Usuario creado exitosamente");
    }
    setIsUserModalOpen(false);
    setFormData({});
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === 'admin-default') {
      alert("No puedes eliminar al administrador principal por defecto.");
      return;
    }
    if (window.confirm("¿Estás seguro de eliminar este usuario?")) {
      setData(prev => ({ ...prev, users: prev.users.filter(u => u.id !== userId) }));
    }
  };

  // --- Settings Actions ---

  const handleExportData = async () => {
    const dataStr = JSON.stringify(data, null, 2);
    const exportFileName = `almacen-pro-backup-${new Date().toISOString().slice(0, 10)}.json`;

    if (data.settings?.useCustomSavePath && 'showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: exportFileName,
          types: [{
            description: 'JSON Backup',
            accept: { 'application/json': ['.json'] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(dataStr);
        await writable.close();
        alert("Copia de seguridad guardada exitosamente.");
      } catch (err) {
        console.log("Export cancelled or failed", err);
      }
    } else {
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileName);
      linkElement.click();
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (!parsed.products || !parsed.transactions) {
          throw new Error("Formato de archivo inválido");
        }
        if (window.confirm("Esta acción reemplazará TODOS los datos actuales con los del archivo de respaldo. ¿Estás seguro?")) {
           setData(parsed);
           alert("Datos restaurados correctamente.");
        }
      } catch (err) {
        alert("Error al leer el archivo. Asegúrate de que es un archivo JSON válido de Almacén Pro.");
        console.error(err);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const handleFolderSync = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    let newestFile: File | null = null;
    let newestDate = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.name.endsWith('.json') && file.name.includes('almacen-pro-backup')) {
        const dateMatch = file.name.match(/(\d{4}-\d{2}-\d{2})/);
        let fileDate = file.lastModified;
        if (dateMatch) {
          const parsed = new Date(dateMatch[1]).getTime();
          if (!isNaN(parsed)) fileDate = parsed;
        }
        if (fileDate > newestDate) {
          newestDate = fileDate;
          newestFile = file;
        }
      }
    }

    if (newestFile) {
      if (window.confirm(`Se encontró una copia de seguridad reciente: "${newestFile.name}". ¿Deseas sincronizar y restaurar estos datos?`)) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
             const content = e.target?.result as string;
             const parsed = JSON.parse(content);
             setData(parsed);
             alert("Sincronización completada con éxito.");
          } catch(err) {
             alert("Error al leer el archivo de seguridad.");
          }
        };
        reader.readAsText(newestFile);
      }
    } else {
      alert("No se encontraron archivos de respaldo válidos en la carpeta seleccionada.");
    }
    
    if (directoryInputRef.current) directoryInputRef.current.value = "";
  };

  const handleFactoryReset = () => {
    const confirm1 = window.confirm("¿Estás seguro de que quieres BORRAR TODOS LOS DATOS?");
    if (confirm1) {
      const confirm2 = window.confirm("¡ADVERTENCIA FINAL! Esta acción no se puede deshacer. Se eliminarán productos, clientes y ventas. ¿Continuar?");
      if (confirm2) {
        const emptyState = Storage.clearData();
        setData(emptyState);
        alert("La aplicación ha sido restablecida a su estado original.");
      }
    }
  };

  const handleAskAI = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiResponse(null);
    const response = await analyzeBusinessData(data, aiQuery, data.settings?.apiKey);
    setAiResponse(response);
    setAiLoading(false);
  };

  const handleLogin = (role: UserRole, userName: string) => {
    setUserRole(role);
    setCurrentUsername(userName);
    setActiveTab('inventory');
  };

  const handleLogout = () => {
    setUserRole(null);
    setCurrentUsername('');
    setCart([]);
    setCartNote("");
    setIsCartOpen(false);
  };

  // --- Daily Stats Calculation ---
  const dailyStats = useMemo(() => {
    const todaysTransactions = data.transactions.filter(t => 
      getLocalDateStr(t.date) === reportDate
    );

    const cashSales = todaysTransactions
      .filter(t => t.type === TransactionType.SALE)
      .reduce((sum, t) => sum + t.total, 0);

    const settlements = todaysTransactions
      .filter(t => t.type === TransactionType.CONSIGNMENT_SETTLE)
      .reduce((sum, t) => sum + t.total, 0);

    const totalCash = cashSales + settlements;

    return { 
      dateLabel: new Date(reportDate + "T12:00:00").toLocaleDateString(),
      cashSales, 
      settlements, 
      totalCash, 
      count: todaysTransactions.length 
    };
  }, [data.transactions, reportDate]);

  const handlePrintDailyReport = () => {
    setReceiptData({
      type: 'DAILY_REPORT',
      title: 'CORTE DE CAJA DEL DÍA',
      date: new Date().toISOString(),
      id: `CORTE-${reportDate.replace(/-/g, '')}`,
      customerName: `ADMINISTRACIÓN (${currentUsername})`,
      items: [
        { name: 'Total Ventas Directas', qty: 1, price: dailyStats.cashSales, total: dailyStats.cashSales },
        { name: 'Total Cobros Deuda', qty: 1, price: dailyStats.settlements, total: dailyStats.settlements }
      ],
      totalAmount: dailyStats.totalCash,
      dailyStats: {
        cashSales: dailyStats.cashSales,
        settlements: dailyStats.settlements,
        totalCash: dailyStats.totalCash
      },
      notes: `Fecha Reportada: ${dailyStats.dateLabel}. Dinero total recaudado: $${dailyStats.totalCash.toFixed(2)}`
    });
    setIsReceiptEditModalOpen(true);
  };

  // --- Derived Data for Dashboard ---
  const stats = useMemo(() => {
    const totalSales = data.transactions
      .filter(t => t.type === TransactionType.SALE || t.type === TransactionType.CONSIGNMENT_SETTLE)
      .reduce((sum, t) => sum + t.total, 0);

    const pendingConsignments = data.consignments
      .filter(c => c.status === ConsignmentStatus.PENDING)
      .reduce((sum, c) => sum + (c.totalExpected - (c.paidAmount || 0)), 0);

    const inventoryValue = data.products.reduce((sum, p) => sum + (p.stock * p.basePrice), 0);

    return { totalSales, pendingConsignments, inventoryValue };
  }, [data]);

  const filteredProducts = useMemo(() => {
    if (selectedCategoryFilter === 'all') return data.products;
    return data.products.filter(p => p.category === selectedCategoryFilter);
  }, [data.products, selectedCategoryFilter]);

  const chartData = useMemo(() => {
    const grouped = data.transactions
      .filter(t => (t.type === TransactionType.SALE || t.type === TransactionType.CONSIGNMENT_SETTLE))
      .reduce((acc: any, t) => {
        const date = new Date(t.date).toLocaleDateString();
        acc[date] = (acc[date] || 0) + t.total;
        return acc;
      }, {});
    return Object.keys(grouped).map(date => ({ date, amount: grouped[date] }));
  }, [data]);

  // Group consignments by customer
  const consignmentsByCustomer = useMemo(() => {
    const groups: Record<string, { 
      id: string, 
      name: string, 
      totalDebt: number, 
      totalExpected: number,
      totalPaid: number,
      items: Consignment[],
      lastDate: string 
    }> = {};

    data.consignments.forEach(c => {
       if (!groups[c.customerId]) {
         groups[c.customerId] = { 
           id: c.customerId, 
           name: c.customerName, 
           totalDebt: 0, 
           totalExpected: 0,
           totalPaid: 0,
           items: [],
           lastDate: c.dateCreated
         };
       }
       groups[c.customerId].items.push(c);
       if (c.dateCreated > groups[c.customerId].lastDate) {
         groups[c.customerId].lastDate = c.dateCreated;
       }
       
       const debt = c.totalExpected - (c.paidAmount || 0);
       if (c.status === 'PENDING') {
         groups[c.customerId].totalDebt += debt;
       }
       groups[c.customerId].totalExpected += c.totalExpected;
       groups[c.customerId].totalPaid += (c.paidAmount || 0);
    });

    return Object.values(groups).sort((a, b) => b.totalDebt - a.totalDebt);
  }, [data.consignments]);

  // Navigation Items
  const navItems = [
    { id: 'inventory', label: 'Inventario', icon: Package, roles: ['admin', 'seller'] },
    { id: 'sales', label: 'Transacciones', icon: ArrowRightLeft, roles: ['admin', 'seller'] },
    { id: 'consignments', label: 'Cuentas x Cobrar', icon: ClipboardList, roles: ['admin', 'seller'] },
    { id: 'customers', label: 'Clientes', icon: Users, roles: ['admin', 'seller'] },
    { id: 'finances', label: 'Finanzas', icon: TrendingUp, roles: ['admin'] },
    { id: 'history', label: 'Historial', icon: History, roles: ['admin', 'seller'] },
    { id: 'settings', label: 'Configuración', icon: Settings, roles: ['admin'] },
    { id: 'ai', label: 'Asistente IA', icon: BrainCircuit, roles: ['admin'] },
  ];

  // --- Views ---

  if (!userRole) {
    return <LoginScreen onLogin={handleLogin} users={data.users} isElectron={isElectron} onQuit={handleQuitApp} />;
  }

  const renderInventoryGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredProducts.map(product => (
        <Card key={product.id} className="hover:shadow-md transition-shadow relative group">
          {userRole === 'admin' && (
            <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleOpenEditProductModal(product)} 
                  className="p-1.5 bg-white shadow-md text-gray-500 hover:text-indigo-600 rounded-full transition-colors border border-gray-100"
                  title="Editar Producto"
                >
                  <Pencil size={16} />
                </button>
            </div>
          )}
          
          <div className="h-40 bg-gray-100 -mx-6 -mt-6 mb-4 flex items-center justify-center overflow-hidden relative">
            {product.image ? (
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <Package size={48} className="text-gray-300" />
            )}
             <span className={`absolute bottom-2 right-2 px-2 py-1 rounded-full text-xs font-bold shadow-sm ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {product.stock} un.
              </span>
          </div>

          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-bold text-lg text-gray-800 line-clamp-1">{product.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-mono">{product.sku}</span>
                  <span className="text-xs bg-indigo-50 px-2 py-0.5 rounded text-indigo-600">{product.category}</span>
              </div>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600 space-y-1">
            <div className="flex justify-between items-center">
              <span>Unidad:</span>
              <span className="font-bold text-lg text-indigo-600">${product.basePrice.toFixed(2)}</span>
            </div>
            {product.unitsPerBox && product.unitsPerBox > 0 && (
              <div className="flex justify-between items-center text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                <span className="flex items-center gap-1"><Box size={12}/> Caja ({product.unitsPerBox}u):</span>
                <span className="font-bold">${product.boxPrice?.toFixed(2)}</span>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex flex-col gap-2">
             <div className="flex gap-2">
               <Button 
                  variant="primary" 
                  className="flex-1 text-xs" 
                  onClick={() => handleAddToCart(product, 'unit')}
                  disabled={product.stock <= 0}
                >
                 <Plus size={14} /> Unidad
               </Button>
               {product.unitsPerBox && product.unitsPerBox > 0 && (
                 <Button 
                    variant="secondary" 
                    className="flex-1 text-xs bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" 
                    onClick={() => handleAddToCart(product, 'box')}
                    disabled={product.stock < product.unitsPerBox}
                  >
                   <Layers size={14} /> Caja
                 </Button>
               )}
             </div>
             {userRole === 'admin' && (
               <Button variant="secondary" className="w-full text-xs py-1 h-8" onClick={() => { setSelectedProduct(product); setIsStockModalOpen(true); }} title="Agregar Stock">
                 Agregar Stock
               </Button>
             )}
          </div>
        </Card>
      ))}
      {filteredProducts.length === 0 && (
        <div className="col-span-full text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
          <Package size={48} className="mx-auto mb-4 opacity-50"/>
          <p>No hay productos que coincidan con el filtro.</p>
        </div>
      )}
    </div>
  );

  const renderInventoryList = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
          <tr>
            <th className="px-6 py-4">Producto</th>
            <th className="px-6 py-4">Categoría</th>
            <th className="px-6 py-4">Stock Total</th>
            <th className="px-6 py-4">Precio Unidad</th>
            <th className="px-6 py-4">Precio Caja</th>
            <th className="px-6 py-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {filteredProducts.map(product => (
            <tr key={product.id} className="hover:bg-gray-50/50">
              <td className="px-6 py-3">
                <div className="font-bold text-gray-800">{product.name}</div>
                <div className="text-xs text-gray-500 font-mono">{product.sku}</div>
              </td>
              <td className="px-6 py-3">
                <span className="text-xs bg-indigo-50 px-2 py-0.5 rounded text-indigo-600">{product.category}</span>
              </td>
              <td className="px-6 py-3">
                <span className={`font-bold ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {product.stock}
                </span>
              </td>
              <td className="px-6 py-3 font-medium">
                ${product.basePrice.toFixed(2)}
              </td>
              <td className="px-6 py-3 font-medium">
                {product.unitsPerBox ? (
                  <span className="text-emerald-700 text-xs">${product.boxPrice?.toFixed(2)} ({product.unitsPerBox}u)</span>
                ) : <span className="text-gray-400">-</span>}
              </td>
              <td className="px-6 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <button onClick={() => handleAddToCart(product, 'unit')} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded" title="Agregar Unidad"><Plus size={16}/></button>
                  {product.unitsPerBox && product.unitsPerBox > 0 && (
                    <button onClick={() => handleAddToCart(product, 'box')} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded" title="Agregar Caja" disabled={product.stock < product.unitsPerBox}><Layers size={16}/></button>
                  )}
                  {userRole === 'admin' && (
                    <button onClick={() => handleOpenEditProductModal(product)} className="p-1.5 text-gray-500 hover:bg-gray-50 rounded"><Pencil size={16}/></button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">Inventario</h2>
           <p className="text-sm text-gray-500">{filteredProducts.length} productos registrados</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto items-center">
          <div className="flex bg-white border border-gray-300 rounded-lg p-1">
             <button 
               onClick={() => setInventoryView('grid')}
               className={`p-1.5 rounded-md transition-all ${inventoryView === 'grid' ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
               title="Vista Cuadrícula"
             >
               <LayoutGrid size={18} />
             </button>
             <button 
               onClick={() => setInventoryView('list')}
               className={`p-1.5 rounded-md transition-all ${inventoryView === 'list' ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
               title="Vista Lista"
             >
               <List size={18} />
             </button>
          </div>
          
          <div className="h-8 w-px bg-gray-300 mx-1 hidden sm:block"></div>

          <select 
            className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
          >
            <option value="all">Todas las Categorías</option>
            {data.categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {userRole === 'admin' && (
            <Button onClick={handleOpenAddProductModal}><Plus size={18} /> Nuevo</Button>
          )}
        </div>
      </div>

      {inventoryView === 'grid' ? renderInventoryGrid() : renderInventoryList()}
    </div>
  );

  const renderCart = () => {
    return (
      <div className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-40 ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
              <ShoppingBag className="text-indigo-600" /> Carrito
            </h2>
            <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <ShoppingBag size={48} className="mx-auto mb-4 opacity-30" />
                <p>Tu carrito está vacío</p>
                <p className="text-sm">Agrega productos desde el inventario</p>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div key={idx} className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                       <h4 className="font-semibold text-gray-800 line-clamp-1">{item.product.name}</h4>
                       <div className="flex items-center gap-2 text-xs text-gray-500">
                         {item.type === 'box' ? (
                           <span className="bg-emerald-50 text-emerald-700 px-1.5 rounded flex items-center gap-1"><Box size={10}/> Caja x{item.unitsInPack}</span>
                         ) : (
                           <span className="bg-gray-100 px-1.5 rounded">Unidad</span>
                         )}
                       </div>
                    </div>
                    <button 
                      onClick={() => removeFromCart(idx)}
                      className="text-red-400 hover:text-red-600 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="flex items-end justify-between gap-2">
                     <div className="flex items-center gap-2">
                        <div className="flex items-center border border-gray-200 rounded-lg">
                           <button 
                            className="p-1 hover:bg-gray-100"
                            onClick={() => updateCartItem(idx, 'quantity', item.quantity - 1)}
                           >
                             <Minus size={14} />
                           </button>
                           <input 
                             type="number" 
                             className="w-10 text-center text-sm outline-none border-none py-1"
                             value={item.quantity}
                             onChange={(e) => updateCartItem(idx, 'quantity', Number(e.target.value))}
                           />
                           <button 
                             className="p-1 hover:bg-gray-100"
                             onClick={() => updateCartItem(idx, 'quantity', item.quantity + 1)}
                           >
                             <Plus size={14} />
                           </button>
                        </div>
                     </div>
                     <div className="flex flex-col items-end">
                       <span className="text-xs text-gray-400">Precio {item.type === 'box' ? 'Caja' : 'Unit.'}</span>
                       <div className="flex items-center text-sm font-bold text-indigo-600">
                         $
                         <input 
                           type="number"
                           className="w-16 text-right outline-none bg-transparent border-b border-indigo-100 focus:border-indigo-500"
                           value={item.price}
                           onChange={(e) => updateCartItem(idx, 'price', Number(e.target.value))}
                         />
                       </div>
                     </div>
                  </div>
                  <div className="text-right text-xs text-gray-500 pt-2 border-t border-dashed mt-1">
                    Subtotal: <span className="font-semibold text-gray-800">${(item.quantity * item.price).toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50">
             <div className="mb-4">
                <label className="text-xs font-semibold text-gray-600 uppercase mb-1 block">Cliente (Opcional para venta)</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                  value={cartCustomer}
                  onChange={(e) => setCartCustomer(e.target.value)}
                >
                  <option value="">Público General / Seleccionar...</option>
                  {data.customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
             </div>

             <div className="mb-4">
                <label className="text-xs font-semibold text-gray-600 uppercase mb-1 block flex items-center gap-1">
                  <MessageSquare size={12} /> Nota (Opcional)
                </label>
                <textarea 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white resize-none focus:ring-2 focus:ring-indigo-200 outline-none"
                  rows={2}
                  placeholder="Instrucciones, recordatorios, etc."
                  value={cartNote}
                  onChange={(e) => setCartNote(e.target.value)}
                />
             </div>
             
             <div className="flex justify-between items-center mb-4">
               <span className="text-gray-600 font-medium">Total Estimado</span>
               <span className="text-2xl font-bold text-gray-900">${cartTotal.toFixed(2)}</span>
             </div>

             <div className="grid grid-cols-2 gap-3">
               <Button 
                  variant="primary" 
                  disabled={cart.length === 0}
                  onClick={() => handleCartCheckout('SALE')}
                  className="text-sm"
               >
                 <DollarSign size={16} /> Vender
               </Button>
               <Button 
                  variant="secondary" 
                  disabled={cart.length === 0}
                  onClick={() => handleCartCheckout('CONSIGNMENT')}
                  className="text-sm bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
               >
                 <ClipboardList size={16} /> Crédito / Fiado
               </Button>
             </div>
          </div>
        </div>
      </div>
    );
  }

  const renderConsignments = () => {
    // View Details Logic
    if (viewDetailsCustomerId) {
      const customerData = consignmentsByCustomer.find(g => g.id === viewDetailsCustomerId);
      if (!customerData) return <div className="p-4 text-center">Cliente no encontrado</div>;

      const sortedItems = [...customerData.items].sort((a, b) => {
        if (a.status !== b.status) return a.status === 'PENDING' ? -1 : 1;
        return new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime();
      });

      return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-4">
             <button onClick={() => setViewDetailsCustomerId(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <ChevronLeft size={24} className="text-gray-600"/>
             </button>
             <div>
               <h2 className="text-2xl font-bold text-gray-800">{customerData.name}</h2>
               <p className="text-sm text-gray-500">Detalle de deudas y pagos</p>
             </div>
             <div className="ml-auto flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Deuda Total</p>
                  <p className="text-xl font-bold text-orange-600">${customerData.totalDebt.toFixed(2)}</p>
                </div>
                {customerData.totalDebt > 0 && (
                  <Button 
                    variant="success" 
                    onClick={() => {
                        const cust = data.customers.find(c => c.id === customerData.id);
                        if (cust) {
                          setSelectedCustomerForPayment(cust);
                          setFormData({ settledAmount: customerData.totalDebt });
                          setIsCustomerPaymentModalOpen(true);
                        }
                    }}
                  >
                    <DollarSign size={18} /> Abonar a Cuenta
                  </Button>
                )}
             </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <table className="w-full text-sm text-left">
               <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                 <tr>
                   <th className="px-6 py-4">Fecha</th>
                   <th className="px-6 py-4">Producto / Concepto</th>
                   <th className="px-6 py-4">Cant.</th>
                   <th className="px-6 py-4">Total Orig.</th>
                   <th className="px-6 py-4 text-emerald-600">Abonado</th>
                   <th className="px-6 py-4 text-orange-600">Pendiente</th>
                   <th className="px-6 py-4">Estado</th>
                   <th className="px-6 py-4">Acciones</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {sortedItems.map(c => {
                   const paid = c.paidAmount || 0;
                   const remaining = c.totalExpected - paid;
                   return (
                     <tr key={c.id} className="hover:bg-gray-50/50">
                       <td className="px-6 py-4 text-gray-500">{new Date(c.dateCreated).toLocaleDateString()}</td>
                       <td className="px-6 py-4 font-medium">{c.productName}</td>
                       <td className="px-6 py-4">{c.quantity}</td>
                       <td className="px-6 py-4">${c.totalExpected.toFixed(2)}</td>
                       <td className="px-6 py-4 font-medium text-emerald-700">${paid.toFixed(2)}</td>
                       <td className="px-6 py-4 font-bold text-orange-600">${remaining.toFixed(2)}</td>
                       <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            c.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {c.status === 'PENDING' ? 'Pendiente' : 'Pagado'}
                          </span>
                       </td>
                       <td className="px-6 py-4">
                         <div className="flex gap-2">
                           {c.status === 'PENDING' && (
                             <button 
                               onClick={() => { setSelectedConsignment(c); setFormData({settledAmount: remaining}); setIsSettleModalOpen(true); }}
                               className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1 rounded-full border border-indigo-200 transition-colors"
                             >
                               Abonar Individual
                             </button>
                           )}
                           <button 
                              onClick={() => handleOpenEditConsignment(c)}
                              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                              title="Editar Monto / Nombre"
                           >
                             <Pencil size={16} />
                           </button>
                           <button 
                             onClick={() => {
                               // Find the creation transaction to delete it
                               const tx = data.transactions.find(t => t.relatedConsignmentId === c.id && t.type === TransactionType.CONSIGNMENT_OUT);
                               if (tx) handleDeleteTransaction(tx.id);
                             }}
                             className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                             title="Devolver / Cancelar Deuda"
                           >
                              <Trash2 size={16} />
                           </button>
                         </div>
                       </td>
                     </tr>
                   )
                 })}
               </tbody>
             </table>
          </div>
        </div>
      );
    }

    // Default View: Customer List
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Cuentas por Cobrar</h2>
            <p className="text-sm text-gray-500">Gestión de créditos y consignaciones</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
           {consignmentsByCustomer.map(group => (
             <Card key={group.id} className="relative hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                        {group.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">{group.name}</h3>
                        <p className="text-xs text-gray-500">Última actividad: {new Date(group.lastDate).toLocaleDateString()}</p>
                      </div>
                   </div>
                   <div className="text-right">
                     {group.totalDebt > 0 ? (
                       <span className="text-red-600 font-bold bg-red-50 px-2 py-1 rounded text-sm">
                         Debe: ${group.totalDebt.toFixed(2)}
                       </span>
                     ) : (
                       <span className="text-green-600 font-bold bg-green-50 px-2 py-1 rounded text-sm">
                         Al día
                       </span>
                     )}
                   </div>
                </div>

                <div className="space-y-3 mb-6">
                    {group.items.filter(i => i.status === 'PENDING').length > 0 ? (
                      <div className="bg-gray-50 rounded-lg p-3 text-sm">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Pendientes de Pago:</p>
                        <ul className="space-y-1">
                          {group.items.filter(i => i.status === 'PENDING').map(item => {
                            const remaining = item.totalExpected - (item.paidAmount || 0);
                            return (
                              <li key={item.id} className="flex justify-between items-center text-gray-700">
                                <span className="truncate pr-2">• {item.productName} ({item.quantity} un.)</span>
                                <span className="font-medium whitespace-nowrap text-orange-600">${remaining.toFixed(2)}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ) : (
                       <div className="py-4 text-center text-sm text-gray-400 italic">
                         No hay deudas pendientes.
                       </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                   <Button variant="secondary" onClick={() => setViewDetailsCustomerId(group.id)} className="text-sm">
                     <Eye size={16} /> Ver Historial
                   </Button>
                   <Button 
                      variant="primary" 
                      disabled={group.totalDebt <= 0}
                      onClick={() => {
                        const cust = data.customers.find(c => c.id === group.id);
                        if (cust) {
                          setSelectedCustomerForPayment(cust);
                          setFormData({ settledAmount: group.totalDebt });
                          setIsCustomerPaymentModalOpen(true);
                        }
                      }}
                      className="text-sm"
                   >
                     <DollarSign size={16} /> Abonar
                   </Button>
                </div>
             </Card>
           ))}
           {consignmentsByCustomer.length === 0 && (
             <div className="col-span-full text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
               <ClipboardList size={48} className="mx-auto mb-4 opacity-50"/>
               <p>No hay registros de cuentas por cobrar.</p>
             </div>
           )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'inventory': return renderInventory();
      case 'sales': return (
        <div className="space-y-6">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl font-bold text-gray-800">Transacciones</h2>
              <div className="flex gap-2">
                 {userRole === 'admin' && (
                  <>
                   <input 
                      type="date" 
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      value={reportDate} 
                      onChange={(e) => setReportDate(e.target.value)} 
                   />
                   <Button onClick={handlePrintDailyReport} variant="secondary">
                     <Printer size={16} /> Corte del Día
                   </Button>
                  </>
                 )}
              </div>
           </div>
           
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
               <p className="text-xs text-gray-500 uppercase">Ventas (Efectivo)</p>
               <p className="text-xl font-bold text-gray-800">${dailyStats.cashSales.toFixed(2)}</p>
             </div>
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
               <p className="text-xs text-gray-500 uppercase">Cobros Deuda</p>
               <p className="text-xl font-bold text-emerald-600">${dailyStats.settlements.toFixed(2)}</p>
             </div>
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 col-span-2">
               <p className="text-xs text-gray-500 uppercase">Total Recaudado Hoy</p>
               <p className="text-2xl font-bold text-indigo-600">${dailyStats.totalCash.toFixed(2)}</p>
             </div>
           </div>

           <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <table className="w-full text-sm text-left">
               <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                 <tr>
                   <th className="px-6 py-4">Hora</th>
                   <th className="px-6 py-4">Tipo</th>
                   <th className="px-6 py-4">Descripción</th>
                   <th className="px-6 py-4">Cliente</th>
                   <th className="px-6 py-4 text-right">Monto</th>
                   <th className="px-6 py-4 text-center">Acciones</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {data.transactions
                   .filter(t => getLocalDateStr(t.date) === reportDate)
                   .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                   .map(t => (
                     <tr key={t.id} className="hover:bg-gray-50/50">
                       <td className="px-6 py-3 text-gray-500 font-mono text-xs">{getLocalISOTime(t.date).split('T')[1]}</td>
                       <td className="px-6 py-3">
                         <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                           t.type === TransactionType.SALE ? 'bg-green-100 text-green-800' :
                           t.type === TransactionType.STOCK_IN ? 'bg-blue-100 text-blue-800' :
                           t.type === TransactionType.CONSIGNMENT_OUT ? 'bg-yellow-100 text-yellow-800' :
                           'bg-gray-100 text-gray-800'
                         }`}>
                           {translateType(t.type)}
                         </span>
                       </td>
                       <td className="px-6 py-3 text-gray-700">{t.note || '-'}</td>
                       <td className="px-6 py-3">{t.customerName || '-'}</td>
                       <td className={`px-6 py-3 font-bold text-right ${t.type === TransactionType.STOCK_IN ? 'text-gray-400' : 'text-gray-900'}`}>
                         ${t.total.toFixed(2)}
                       </td>
                       <td className="px-6 py-3 text-center">
                         <button 
                           onClick={() => handleDeleteTransaction(t.id)}
                           className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                           title="Eliminar movimiento / Devolución"
                         >
                            <Trash2 size={16} />
                         </button>
                       </td>
                     </tr>
                 ))}
                 {data.transactions.filter(t => getLocalDateStr(t.date) === reportDate).length === 0 && (
                   <tr><td colSpan={6} className="text-center py-8 text-gray-400">No hay movimientos en esta fecha.</td></tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>
      );
      case 'consignments': return renderConsignments();
      case 'customers': return (
        <div className="space-y-6">
           <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Directorio de Clientes</h2>
              <Button onClick={() => setIsCustomerModalOpen(true)}><UserPlus size={18} /> Nuevo Cliente</Button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {data.customers.map(c => (
               <Card key={c.id} className="hover:shadow-md transition-shadow">
                 <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                       <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                         <User size={24} />
                       </div>
                       <div>
                         <h3 className="font-bold text-gray-800">{c.name}</h3>
                         <p className="text-xs text-gray-400">Reg: {new Date(c.dateCreated).toLocaleDateString()}</p>
                       </div>
                    </div>
                 </div>
                 <div className="mt-4 space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                       <IdCardIcon size={14} className="text-gray-400" />
                       <span>{c.ci || 'Sin C.I./RUC'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <Phone size={14} className="text-gray-400" />
                       <span>{c.phone || 'Sin teléfono'}</span>
                    </div>
                    {c.notes && (
                      <div className="bg-yellow-50 p-2 rounded text-xs text-yellow-800 mt-2 border border-yellow-100">
                        {c.notes}
                      </div>
                    )}
                 </div>
               </Card>
             ))}
             {data.customers.length === 0 && (
               <div className="col-span-full text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
                 <Users size={48} className="mx-auto mb-4 opacity-50"/>
                 <p>No hay clientes registrados.</p>
               </div>
             )}
           </div>
        </div>
      );
      case 'finances': return (
        <div className="space-y-6">
           <h2 className="text-2xl font-bold text-gray-800">Finanzas</h2>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <Card title="Valor del Inventario">
                <div className="text-3xl font-bold text-indigo-600">${stats.inventoryValue.toFixed(2)}</div>
                <p className="text-sm text-gray-500 mt-1">Costo base total</p>
             </Card>
             <Card title="Ventas Totales">
                <div className="text-3xl font-bold text-green-600">${stats.totalSales.toFixed(2)}</div>
                <p className="text-sm text-gray-500 mt-1">Histórico acumulado</p>
             </Card>
             <Card title="Cuentas por Cobrar">
                <div className="text-3xl font-bold text-orange-600">${stats.pendingConsignments.toFixed(2)}</div>
                <p className="text-sm text-gray-500 mt-1">Dinero pendiente de cobro</p>
             </Card>
           </div>

           <Card title="Tendencia de Ventas (Últimos días)" className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="amount" stroke="#4f46e5" strokeWidth={3} dot={{r: 4, fill: '#4f46e5'}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
           </Card>
        </div>
      );
      case 'history': return (
        <div className="space-y-6">
           <h2 className="text-2xl font-bold text-gray-800">Historial de Movimientos</h2>
           <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <table className="w-full text-sm text-left">
               <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                 <tr>
                   <th className="px-6 py-4">Fecha/Hora</th>
                   <th className="px-6 py-4">Acción</th>
                   <th className="px-6 py-4">Detalle</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {data.logs.slice(0, 100).map(log => (
                   <tr key={log.id} className="hover:bg-gray-50/50">
                     <td className="px-6 py-3 text-gray-500 w-48">{new Date(log.timestamp).toLocaleString()}</td>
                     <td className="px-6 py-3 font-medium w-48 text-indigo-700">{log.action}</td>
                     <td className="px-6 py-3 text-gray-700">{log.details}</td>
                   </tr>
                 ))}
                 {data.logs.length === 0 && (
                   <tr><td colSpan={3} className="text-center py-8 text-gray-400">Historial vacío.</td></tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>
      );
      case 'settings': return (
        <div className="space-y-8 max-w-4xl mx-auto">
           <div>
             <h2 className="text-2xl font-bold text-gray-800 mb-2">Configuración</h2>
             <p className="text-gray-500">Gestión de datos y seguridad</p>
           </div>
           
           <Card title="Configuración de Inteligencia Artificial (IA)">
             <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Para activar el asistente de negocios, ingresa tu API Key de Google Gemini. 
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline ml-1">
                    Conseguir API Key gratis
                  </a>
                </p>
                <div>
                   <label className="text-sm font-medium text-gray-700">Gemini API Key</label>
                   <div className="relative mt-1">
                     <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                     <input 
                       type="password" 
                       className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                       value={data.settings?.apiKey || ''}
                       onChange={(e) => {
                          setData(prev => ({
                            ...prev,
                            settings: { ...prev.settings, apiKey: e.target.value }
                          }));
                       }}
                       placeholder="AIzaSy..."
                     />
                   </div>
                   <p className="text-xs text-gray-500 mt-1">La clave se guarda localmente en tu dispositivo.</p>
                </div>
             </div>
           </Card>

           <Card title="Personalización del Ticket">
             <div className="space-y-4">
                <p className="text-sm text-gray-600">Configura los textos que aparecen en la impresión.</p>
                <div>
                   <label className="text-sm font-medium text-gray-700">Encabezado (Nombre, Dirección, Teléfono)</label>
                   <textarea 
                     className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 outline-none focus:ring-2 focus:ring-indigo-500"
                     rows={3}
                     value={data.settings?.ticketHeader || ''}
                     onChange={(e) => {
                        setData(prev => ({
                          ...prev,
                          settings: { ...prev.settings, ticketHeader: e.target.value }
                        }));
                     }}
                     placeholder="Ej: The Brothers&#10;Calle Principal #123&#10;Tel: 555-0101"
                   />
                </div>
                <div>
                   <label className="text-sm font-medium text-gray-700">Pie de Página (Despedida, Web, etc.)</label>
                   <textarea 
                     className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 outline-none focus:ring-2 focus:ring-indigo-500"
                     rows={2}
                     value={data.settings?.ticketFooter || ''}
                     onChange={(e) => {
                        setData(prev => ({
                          ...prev,
                          settings: { ...prev.settings, ticketFooter: e.target.value }
                        }));
                     }}
                     placeholder="Ej: ¡Gracias por su compra!&#10;Vuelva pronto."
                   />
                </div>
             </div>
           </Card>

           <Card title="Gestión de Usuarios">
             <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">Usuarios con acceso al sistema</p>
                  <Button onClick={() => handleOpenUserModal(null)} className="text-xs">
                    <UserPlus size={16} /> Crear Usuario
                  </Button>
                </div>
                <div className="divide-y divide-gray-100">
                  {data.users.map(u => (
                    <div key={u.id} className="flex justify-between items-center py-3">
                       <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${u.role === 'admin' ? 'bg-purple-600' : 'bg-blue-500'}`}>
                            {u.role === 'admin' ? 'A' : 'V'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">{u.username}</p>
                            <p className="text-xs text-gray-500">{u.name}</p>
                          </div>
                       </div>
                       <div className="flex gap-2">
                         <button onClick={() => handleOpenUserModal(u)} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
                           <Pencil size={16} />
                         </button>
                         <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                           <Trash2 size={16} />
                         </button>
                       </div>
                    </div>
                  ))}
                </div>
             </div>
           </Card>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card title="Copia de Seguridad (Backup)">
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Descarga un archivo con todos tus productos, clientes y ventas.
                  </p>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <input 
                      type="checkbox" 
                      id="useCustomPath"
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                      checked={data.settings?.useCustomSavePath || false}
                      onChange={(e) => {
                         setData(prev => ({
                           ...prev,
                           settings: { ...prev.settings, useCustomSavePath: e.target.checked }
                         }));
                      }}
                    />
                    <label htmlFor="useCustomPath" className="text-xs text-gray-700 select-none cursor-pointer">
                       Selección Manual de Ruta al Exportar (Experimental)
                    </label>
                  </div>

                  <Button onClick={handleExportData} className="w-full">
                    <Download size={18} /> Exportar Datos
                  </Button>
                </div>
              </Card>

              <Card title="Restaurar Datos">
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Sube un archivo de respaldo previo para recuperar tu información.
                  </p>
                  <div>
                    <input 
                      type="file" 
                      accept=".json" 
                      ref={fileInputRef}
                      className="hidden" 
                      onChange={handleImportData}
                    />
                    <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="w-full">
                      <Upload size={18} /> Cargar Archivo
                    </Button>
                  </div>
                </div>
              </Card>
           </div>
           
           <Card title="Seguridad y Rutas de Archivos">
              <div className="space-y-4">
                 <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <h4 className="font-semibold text-blue-900 flex items-center gap-2 mb-2">
                      <FolderOpen size={18} /> Sincronización Local
                    </h4>
                    <p className="text-sm text-blue-800 mb-4">
                      Selecciona una carpeta donde guardas tus copias de seguridad. El sistema buscará el archivo más reciente y te permitirá restaurarlo.
                    </p>
                    <input 
                      type="file" 
                      // @ts-ignore
                      webkitdirectory="" 
                      directory="" 
                      ref={directoryInputRef}
                      className="hidden" 
                      onChange={handleFolderSync}
                    />
                    <Button onClick={() => directoryInputRef.current?.click()} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      <ShieldCheck size={18} /> Sincronizar desde Carpeta
                    </Button>
                 </div>
              </div>
           </Card>

           <div className="pt-8 border-t border-gray-200">
              <h3 className="text-red-600 font-bold mb-4 flex items-center gap-2">
                <AlertTriangle size={20} /> Zona de Peligro
              </h3>
              <Button variant="danger" onClick={handleFactoryReset} className="w-full md:w-auto">
                 <Trash2 size={18} /> Restablecer de Fábrica (Borrar Todo)
              </Button>
           </div>
        </div>
      );
      case 'ai': return (
        <div className="max-w-2xl mx-auto space-y-6">
           <div className="text-center mb-8">
             <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl mx-auto flex items-center justify-center text-white mb-4 shadow-lg">
               <BrainCircuit size={32} />
             </div>
             <h2 className="text-3xl font-bold text-gray-900">Asistente Inteligente</h2>
             <p className="text-gray-500 mt-2">Analiza tu negocio con el poder de Google Gemini</p>
             
             <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${isOnline ? (data.settings?.apiKey ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200') : 'bg-red-50 text-red-700 border-red-200'}`}>
                {isOnline ? (data.settings?.apiKey ? <Wifi size={14} /> : <AlertTriangle size={14} />) : <WifiOff size={14} />}
                {isOnline ? (data.settings?.apiKey ? 'Online: Asistente Disponible' : 'Falta API Key (Configuración)') : 'Offline: Asistente No Disponible'}
             </div>
           </div>

           <Card className="shadow-lg border-0 ring-1 ring-gray-100 relative">
              {(!isOnline || !data.settings?.apiKey) && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl">
                   <div className="bg-white p-4 rounded-lg shadow-xl border border-red-100 text-center max-w-xs">
                      <AlertCircle className={`mx-auto mb-2 ${!isOnline ? 'text-red-400' : 'text-yellow-500'}`} size={32} />
                      <p className="font-bold text-gray-800">{!isOnline ? 'Sin Conexión' : 'Falta Configuración'}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {!isOnline ? 'Conecta tu PC a internet.' : 'Agrega tu API Key de Gemini en Configuración.'}
                      </p>
                   </div>
                </div>
              )}
              <textarea 
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-lg min-h-[120px]"
                placeholder="Ej: ¿Qué productos debería reponer pronto? ¿Quién es mi mejor cliente? Dame un consejo para aumentar ventas..."
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                disabled={!isOnline || aiLoading}
              />
              <div className="mt-4 flex justify-end">
                <Button 
                   onClick={handleAskAI} 
                   disabled={aiLoading || !aiQuery.trim() || !isOnline || !data.settings?.apiKey}
                   className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md transform transition hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {aiLoading ? <RefreshCw className="animate-spin" /> : <BrainCircuit size={18} />}
                  {aiLoading ? 'Analizando...' : 'Analizar Negocio'}
                </Button>
              </div>
           </Card>

           {aiResponse && (
             <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 animate-in slide-in-from-bottom-4">
               <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                 <div className="w-2 h-2 bg-green-500 rounded-full"></div> 
                 Respuesta del Asistente
               </h3>
               <div className="prose prose-indigo text-gray-700 leading-relaxed whitespace-pre-line">
                 {aiResponse}
               </div>
             </div>
           )}
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
      
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-gray-100">
            <Package className="text-indigo-600 mr-2" size={24} />
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              The Brothers
            </h1>
          </div>

          <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
            {navItems.filter(item => item.roles.includes(userRole)).map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id as any); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-colors font-medium ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-700' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon size={20} className={`mr-3 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3 mb-3">
               <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                 {currentUsername.charAt(0).toUpperCase()}
               </div>
               <div className="overflow-hidden">
                 <p className="text-sm font-medium text-gray-900 truncate">{currentUsername}</p>
                 <p className="text-xs text-gray-500 capitalize">{userRole === 'admin' ? 'Administrador' : 'Vendedor'}</p>
               </div>
            </div>
            <button 
               onClick={handleLogout}
               className="w-full flex items-center justify-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={16} className="mr-2" /> Cerrar Sesión
            </button>
            {isElectron && (
              <button 
                 onClick={handleQuitApp}
                 className="w-full flex items-center justify-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors mt-2"
              >
                <Power size={16} className="mr-2" /> Salir del Sistema
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 flex-shrink-0">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
          >
            <Menu size={24} />
          </button>

          <div className="flex-1 px-4 lg:px-0">
             {/* Breadcrumb or Title placeholder */}
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
             {activeTab === 'inventory' && (
                <div className="relative hidden sm:block">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Buscar productos..." 
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:ring-2 focus:ring-indigo-500 outline-none"
                    // Add search logic if needed
                  />
                </div>
             )}
             
             <button 
               className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
               onClick={() => setIsCartOpen(true)}
             >
               <ShoppingCart size={24} />
               {cart.length > 0 && (
                 <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
               )}
             </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
           <div className="max-w-7xl mx-auto">
             {renderContent()}
           </div>
        </div>
      </main>
      
      {/* --- Modals --- */}
      
      {/* Product Modal (Create/Edit) */}
      <Modal 
        isOpen={isProductModalOpen} 
        onClose={() => setIsProductModalOpen(false)} 
        title={isEditMode ? 'Editar Producto' : 'Nuevo Producto'}
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div className="flex justify-center mb-4">
             <div className="relative w-32 h-32 bg-gray-100 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center group cursor-pointer hover:border-indigo-500 transition-colors">
               {formData.image ? (
                 <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
               ) : (
                 <div className="text-center p-2">
                   <Upload className="mx-auto text-gray-400 mb-1" size={24} />
                   <span className="text-xs text-gray-500">Subir Imagen</span>
                 </div>
               )}
               <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} />
             </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <Input label="Código SKU" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} required />
             <div>
               <label className="text-sm font-medium text-gray-700 mb-1 block">Categoría</label>
               <input 
                 list="categories" 
                 className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                 value={formData.category} 
                 onChange={e => setFormData({...formData, category: e.target.value})}
                 placeholder="Ej. Bebidas"
                 required
               />
               <datalist id="categories">
                 {data.categories.map(c => <option key={c} value={c} />)}
               </datalist>
             </div>
          </div>

          <Input label="Nombre del Producto" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required autoFocus />
          
          <div className="grid grid-cols-2 gap-4">
             <Input label="Precio Venta Unidad ($)" type="number" step="0.01" value={formData.basePrice} onChange={e => setFormData({...formData, basePrice: e.target.value})} required/>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <Input label="Stock Total (Unidades)" type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} required/>
             <Input label="Categoría" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} list="cats" />
             <datalist id="cats">{data.categories.map(c => <option key={c} value={c}/>)}</datalist>
          </div>
          
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg space-y-3">
             <h4 className="text-sm font-bold text-indigo-800 flex items-center gap-2"><Layers size={14} /> Configuración de Venta por Caja/Paca</h4>
             <div className="grid grid-cols-2 gap-4">
               <Input 
                 label="Unidades por Caja" 
                 type="number" 
                 min="0"
                 placeholder="Ej. 24"
                 value={formData.unitsPerBox || ''} 
                 onChange={e => setFormData({...formData, unitsPerBox: e.target.value})} 
               />
               <Input 
                 label="Precio de Venta Caja ($)" 
                 type="number" 
                 step="0.01"
                 placeholder="Opcional"
                 value={formData.boxPrice || ''} 
                 onChange={e => setFormData({...formData, boxPrice: e.target.value})} 
               />
             </div>
             <p className="text-xs text-indigo-600">Deja en 0 si no vendes este producto por caja.</p>
          </div>

          <div className="pt-4 flex gap-3"><Button type="button" variant="secondary" onClick={() => setIsProductModalOpen(false)} className="flex-1">Cancelar</Button><Button type="submit" className="flex-1">Guardar</Button></div>
        </form>
      </Modal>

      {/* Stock Modal */}
      <Modal isOpen={isStockModalOpen} onClose={() => setIsStockModalOpen(false)} title={`Agregar Stock: ${selectedProduct?.name}`}>
        <form onSubmit={handleAddStock} className="space-y-4">
           <Input label="Cantidad a Agregar" type="number" min="1" autoFocus value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} required />
           <div className="pt-4 flex gap-3">
             <Button type="button" variant="secondary" onClick={() => setIsStockModalOpen(false)} className="flex-1">Cancelar</Button>
             <Button type="submit" className="flex-1">Confirmar Entrada</Button>
           </div>
        </form>
      </Modal>

      {/* Customer Modal */}
      <Modal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} title="Registrar Cliente">
        <form onSubmit={handleAddCustomer} className="space-y-4">
           <Input label="Nombre Completo" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required autoFocus />
           <div className="grid grid-cols-2 gap-4">
             <Input label="C.I. / RUC" value={formData.ci} onChange={e => setFormData({...formData, ci: e.target.value})} placeholder="Identificación" />
             <Input label="Teléfono" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
           </div>
           <Input label="Email (Opcional)" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
           <div>
             <label className="text-sm font-medium text-gray-700">Notas</label>
             <textarea 
               className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none"
               rows={3}
               value={formData.notes}
               onChange={e => setFormData({...formData, notes: e.target.value})}
             />
           </div>
           <div className="pt-4 flex gap-3">
             <Button type="button" variant="secondary" onClick={() => setIsCustomerModalOpen(false)} className="flex-1">Cancelar</Button>
             <Button type="submit" className="flex-1">Guardar Cliente</Button>
           </div>
        </form>
      </Modal>

      {/* Settle Single Consignment Modal */}
      <Modal isOpen={isSettleModalOpen} onClose={() => setIsSettleModalOpen(false)} title="Abonar Deuda Específica">
         <form onSubmit={handleSettleConsignment} className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
               <p className="text-sm text-gray-600">Producto: <strong>{selectedConsignment?.productName}</strong></p>
               <p className="text-sm text-gray-600">Total Original: ${selectedConsignment?.totalExpected.toFixed(2)}</p>
               <p className="text-sm text-gray-600">Pagado: ${selectedConsignment?.paidAmount?.toFixed(2)}</p>
               <div className="mt-2 text-lg font-bold text-indigo-600">
                  Restante: ${(selectedConsignment?.totalExpected! - (selectedConsignment?.paidAmount || 0)).toFixed(2)}
               </div>
            </div>
            
            <Input 
              label="Monto a Abonar" 
              type="number" 
              step="0.01" 
              autoFocus 
              value={formData.settledAmount} 
              onChange={e => setFormData({...formData, settledAmount: e.target.value})} 
              required 
            />

            <div className="pt-4 flex gap-3">
             <Button type="button" variant="secondary" onClick={() => setIsSettleModalOpen(false)} className="flex-1">Cancelar</Button>
             <Button type="submit" variant="success" className="flex-1">Confirmar Pago</Button>
           </div>
         </form>
      </Modal>

      {/* Customer Payment Modal (Bulk) */}
      <Modal isOpen={isCustomerPaymentModalOpen} onClose={() => setIsCustomerPaymentModalOpen(false)} title={`Abonar a Cuenta: ${selectedCustomerForPayment?.name}`}>
         <form onSubmit={handleSettleCustomerDebt} className="space-y-4">
            <div className="p-3 bg-blue-50 text-blue-800 rounded-lg text-sm mb-4">
              Este pago se distribuirá automáticamente entre las deudas más antiguas del cliente.
            </div>
            <Input 
              label="Monto a Abonar ($)" 
              type="number" 
              step="0.01" 
              autoFocus 
              value={formData.settledAmount} 
              onChange={e => setFormData({...formData, settledAmount: e.target.value})} 
              required 
            />
            <div className="pt-4 flex gap-3">
             <Button type="button" variant="secondary" onClick={() => setIsCustomerPaymentModalOpen(false)} className="flex-1">Cancelar</Button>
             <Button type="submit" variant="success" className="flex-1">Registrar Abono</Button>
           </div>
         </form>
      </Modal>

      {/* User Modal */}
      <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title={isEditMode ? 'Editar Usuario' : 'Nuevo Usuario'}>
         <form onSubmit={handleSaveUser} className="space-y-4">
            <Input label="Nombre de Usuario (Login)" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required disabled={isEditMode} />
            <Input label="Nombre Completo" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            <Input label="Contraseña" type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
            <Select label="Rol" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
               <option value="seller">Vendedor</option>
               <option value="admin">Administrador</option>
            </Select>
            <div className="pt-4 flex gap-3">
               <Button type="button" variant="secondary" onClick={() => setIsUserModalOpen(false)} className="flex-1">Cancelar</Button>
               <Button type="submit" className="flex-1">Guardar</Button>
            </div>
         </form>
      </Modal>

      {/* Receipt Edit Modal - New Feature */}
      <Modal 
         isOpen={isReceiptEditModalOpen} 
         onClose={handleCancelPrint} // Important: Cancels pending transaction on close
         title="Editar Ticket de Impresión"
         maxWidth="max-w-4xl"
      >
        <div className="flex flex-col lg:flex-row gap-6">
           {/* Edit Form */}
           <div className="flex-1 space-y-4">
              {pendingDataUpdate ? (
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-200 text-sm text-orange-900 mb-2 font-medium flex items-center gap-2">
                   <AlertTriangle size={18} />
                   <span>Operación pendiente. Confirma para guardar los cambios.</span>
                </div>
              ) : (
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm text-gray-700 mb-2">
                   Modo reimpresión / reporte.
                </div>
              )}
              
              <Input 
                label="Título del Ticket"
                value={editableReceiptData?.title || ''}
                onChange={e => setEditableReceiptData(prev => prev ? ({...prev, title: e.target.value}) : null)}
              />

              <div className="grid grid-cols-2 gap-4">
                 <Input 
                    label="Nombre Cliente"
                    value={editableReceiptData?.customerName || ''}
                    onChange={e => setEditableReceiptData(prev => prev ? ({...prev, customerName: e.target.value}) : null)}
                 />
                 <Input 
                    label="C.I. / RUC Cliente"
                    value={editableReceiptData?.customerCI || ''}
                    onChange={e => setEditableReceiptData(prev => prev ? ({...prev, customerCI: e.target.value}) : null)}
                    placeholder="Opcional"
                 />
              </div>

              <Input 
                 label="Fecha Impresión"
                 type="datetime-local"
                 value={editableReceiptData?.date ? getLocalISOTime(editableReceiptData.date) : ''}
                 onChange={e => setEditableReceiptData(prev => prev ? ({...prev, date: e.target.value}) : null)}
              />

              <div>
                <label className="text-sm font-medium text-gray-700">Notas / Pie de Página</label>
                <textarea 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none"
                  rows={4}
                  value={editableReceiptData?.notes || ''}
                  onChange={e => setEditableReceiptData(prev => prev ? ({...prev, notes: e.target.value}) : null)}
                />
              </div>

              <div className="pt-4 flex gap-3">
                 <Button variant="danger" onClick={handleCancelPrint} className="flex-1">
                   <XCircle size={18} /> {pendingDataUpdate ? 'Cancelar Operación' : 'Cerrar'}
                 </Button>
                 <Button 
                   onClick={handleConfirmAndPrint}
                   className="flex-1"
                   variant="success"
                 >
                   <Printer size={18} /> {pendingDataUpdate ? 'Confirmar e Imprimir' : 'Imprimir'}
                 </Button>
              </div>
           </div>

           {/* Preview Area */}
           <div className="flex-1 bg-gray-100 p-4 rounded-xl flex items-center justify-center border border-gray-200">
               {editableReceiptData && <ReceiptTemplate data={editableReceiptData} settings={data.settings} />}
           </div>
        </div>
      </Modal>

      {/* Hidden Print Area - Only rendered via Portal when needed */}
      {editableReceiptData && createPortal(
        <div id="print-content">
          <ReceiptTemplate data={editableReceiptData} settings={data.settings} />
        </div>,
        document.getElementById('receipt-area')!
      )}
      
      {/* Cart Drawer is rendered in function renderCart() */}
      {renderCart()}

    </div>
  );
}