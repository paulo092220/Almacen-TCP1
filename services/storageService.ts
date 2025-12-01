import { AppState, Product, Transaction, Consignment, User } from '../types';

const DB_KEY = 'almacen_pro_db_v1';

const defaultUsers: User[] = [
  { 
    id: 'admin-default', 
    username: 'admin', 
    password: 'admin123', 
    name: 'Administrador Principal', 
    role: 'admin' 
  },
  { 
    id: 'seller-default', 
    username: 'vendedor', 
    password: 'vend123', 
    name: 'Vendedor Turno 1', 
    role: 'seller' 
  }
];

const initialData: AppState = {
  users: defaultUsers,
  products: [],
  transactions: [],
  consignments: [],
  customers: [],
  categories: [], // Removed 'General' default
  logs: [],
  settings: {
    useCustomSavePath: false
  }
};

export const loadData = (): AppState => {
  try {
    const serialized = localStorage.getItem(DB_KEY);
    if (!serialized) {
      return initialData;
    }
    const parsed = JSON.parse(serialized);
    
    // Merge with initialData to ensure new fields exist
    return {
      ...initialData,
      ...parsed,
      // Ensure users exist (migration for existing data)
      users: (parsed.users && parsed.users.length > 0) ? parsed.users : defaultUsers,
      customers: parsed.customers || [], 
      categories: parsed.categories || [],
      logs: parsed.logs || [],
      // Ensure consignments have the new paidAmount field
      consignments: (parsed.consignments || []).map((c: any) => ({
        ...c,
        paidAmount: c.paidAmount || 0
      })),
      settings: {
        ...initialData.settings,
        ...(parsed.settings || {})
      }
    };
  } catch (e) {
    console.error("Failed to load local data", e);
    return initialData;
  }
};

export const saveData = (data: AppState): void => {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save local data", e);
    alert("Error: No se pudo guardar los datos localmente. Verifica el espacio en disco.");
  }
};

export const clearData = (): AppState => {
  try {
    localStorage.removeItem(DB_KEY);
    return initialData;
  } catch (e) {
    console.error("Failed to clear data", e);
    return initialData;
  }
};

// Helper to generate IDs
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};