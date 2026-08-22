export type ProductCategory =
  | 'วัสดุการแพทย์'
  | 'วัสดุงานบ้าน-งานครัว'
  | 'วัสดุสำนักงาน'
  | 'วัสดุไฟฟ้า'
  | 'วัสดุก่อสร้าง-ประปา'
  | 'แบบฟอร์มถ่ายเอกสาร';

export const PRODUCT_CATEGORIES: {
  name: ProductCategory;
  codePrefix: string;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeBg: string;
  iconName: string;
  description: string;
}[] = [
  {
    name: 'วัสดุการแพทย์',
    codePrefix: 'MED',
    color: 'text-rose-700 dark:text-rose-300',
    bgColor: 'bg-rose-50 dark:bg-rose-950/40',
    borderColor: 'border-rose-200 dark:border-rose-800',
    badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
    iconName: 'HeartPulse',
    description: 'เวชภัณฑ์ ถุงมือ ผ้าก๊อซ แอลกอฮอล์ อุปกรณ์ปลอดเชื้อ CSSD',
  },
  {
    name: 'วัสดุงานบ้าน-งานครัว',
    codePrefix: 'HOU',
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-50 dark:bg-amber-950/40',
    borderColor: 'border-amber-200 dark:border-amber-800',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
    iconName: 'Sparkles',
    description: 'น้ำยาทำความสะอาด ถุงขยะ อุปกรณ์ซักฟอก เครื่องครัว',
  },
  {
    name: 'วัสดุสำนักงาน',
    codePrefix: 'OFF',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-50 dark:bg-blue-950/40',
    borderColor: 'border-blue-200 dark:border-blue-800',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
    iconName: 'Briefcase',
    description: 'ปากกา แฟ้ม กระดาษ คลิปหนวดกุ้ง ตลับหมึก',
  },
  {
    name: 'วัสดุไฟฟ้า',
    codePrefix: 'ELE',
    color: 'text-yellow-700 dark:text-yellow-300',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/40',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    badgeBg: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    iconName: 'Zap',
    description: 'หลอดไฟ ปลั๊กพ่วง สายไฟ ฟิวส์ เบรกเกอร์ สวิตช์',
  },
  {
    name: 'วัสดุก่อสร้าง-ประปา',
    codePrefix: 'CON',
    color: 'text-teal-700 dark:text-teal-300',
    bgColor: 'bg-teal-50 dark:bg-teal-950/40',
    borderColor: 'border-teal-200 dark:border-teal-800',
    badgeBg: 'bg-teal-100 text-teal-800 border-teal-200',
    iconName: 'Wrench',
    description: 'ท่อ PVC ก๊อกน้ำ ปูน เทปพันเกลียว น็อต สกรู',
  },
  {
    name: 'แบบฟอร์มถ่ายเอกสาร',
    codePrefix: 'DOC',
    color: 'text-purple-700 dark:text-purple-300',
    bgColor: 'bg-purple-50 dark:bg-purple-950/40',
    borderColor: 'border-purple-200 dark:border-purple-800',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
    iconName: 'FileSpreadsheet',
    description: 'ใบเบิก แบบบันทึกทางการพยาบาล ซองเอกสาร บิลใบเสร็จ',
  },
];

export interface Product {
  id: string;
  code: string;
  name: string;
  category: ProductCategory;
  unit: string;
  price: number;
  quantity: number;
  totalPrice: number;
  minStock: number;
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockOutTransaction {
  id: string;
  date: string;
  productId: string;
  productCode: string;
  productName: string;
  category: ProductCategory;
  unit: string;
  price: number;
  quantity: number;
  totalAmount: number;
  recipientName: string;
  department: string;
  purpose: string;
  notes?: string;
}

export interface StockInTransaction {
  id: string;
  date: string;
  productId: string;
  productCode: string;
  productName: string;
  category: ProductCategory;
  unit: string;
  unitCost: number;
  quantity: number;
  totalCost: number;
  receiverName: string;
  supplier: string;
  documentNo: string;
  notes?: string;
}

export interface GoogleSheetConfig {
  spreadsheetId: string;
  spreadsheetUrl: string;
  sheetTitle: string;
  lastSyncedAt: string | null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncError: string | null;
  autoSync: boolean;
  appsScriptUrl?: string;
}

export interface UserProfile {
  email: string;
  name: string;
  picture: string;
  accessToken: string | null;
  isAuthenticated: boolean;
}

export type ActiveTab =
  | 'products'
  | 'stock-out'
  | 'stock-in'
  | 'reports'
  | 'sheets-integration';
