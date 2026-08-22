import { Product, StockInTransaction, StockOutTransaction, GoogleSheetConfig, UserProfile } from '../types';

const STORAGE_KEYS = {
  PRODUCTS: 'inventory_cssd_makarak_products_v2',
  STOCK_OUT: 'inventory_cssd_makarak_stock_out_v2',
  STOCK_IN: 'inventory_cssd_makarak_stock_in_v2',
  SHEET_CONFIG: 'inventory_cssd_makarak_sheet_config_v2',
  USER_PROFILE: 'inventory_cssd_makarak_user_profile_v2',
  VERSION_CHECK: 'inventory_cssd_makarak_initialized_v2',
};

// Initial state is strictly empty [] per request
const INITIAL_PRODUCTS: Product[] = [];
const INITIAL_STOCK_OUT: StockOutTransaction[] = [];
const INITIAL_STOCK_IN: StockInTransaction[] = [];

// Sample data for users who want to click "ทดลองโหลดข้อมูลตัวอย่าง" for testing
export const SAMPLE_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    code: 'MED-001',
    name: 'ถุงมือตรวจโรคปลอดเชื้อ (Surgical Gloves) เบอร์ 7.0',
    category: 'วัสดุการแพทย์',
    unit: 'กล่อง',
    price: 380,
    quantity: 45,
    totalPrice: 17100,
    minStock: 10,
    location: 'ตู้ A1 - เวชภัณฑ์ปลอดเชื้อ',
    notes: 'สำหรับงานหัตถการ CSSD และห้องผ่าตัด',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_2',
    code: 'MED-002',
    name: 'แอลกอฮอล์สำหรับฆ่าเชื้อ 70% ชนิดแกลลอน 5 ลิตร',
    category: 'วัสดุการแพทย์',
    unit: 'แกลลอน',
    price: 450,
    quantity: 4,
    totalPrice: 1800,
    minStock: 6,
    location: 'ตู้ A1 - เวชภัณฑ์ปลอดเชื้อ',
    notes: 'สำหรับล้างเครื่องมือและฆ่าเชื้อจุดสัมผัส',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_3',
    code: 'HOU-001',
    name: 'น้ำยาทำความสะอาดฆ่าเชื้ออเนกประสงค์ 3.8 ลิตร',
    category: 'วัสดุงานบ้าน-งานครัว',
    unit: 'แกลลอน',
    price: 260,
    quantity: 12,
    totalPrice: 3120,
    minStock: 5,
    location: 'ตู้ B1 - อุปกรณ์ทำความสะอาด',
    notes: 'ผสมน้ำเช็ดทำความสะอาดพื้นผิว',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_4',
    code: 'OFF-001',
    name: 'กระดาษถ่ายเอกสาร A4 80 แกรม (500 แผ่น/รีม)',
    category: 'วัสดุสำนักงาน',
    unit: 'รีม',
    price: 135,
    quantity: 28,
    totalPrice: 3780,
    minStock: 8,
    location: 'ตู้ C1 - อุปกรณ์สำนักงาน',
    notes: 'สำหรับพิมพ์เอกสารรายงานและแบบฟอร์ม',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_5',
    code: 'ELE-001',
    name: 'หลอดไฟ LED Tube T8 18W แสงขาว (Daylight)',
    category: 'วัสดุไฟฟ้า',
    unit: 'หลอด',
    price: 95,
    quantity: 0,
    totalPrice: 0,
    minStock: 5,
    location: 'ชั้น D1 - อะไหล่ไฟฟ้า/หลอดไฟ',
    notes: 'สต๊อกหมด รอเบิกทดแทน',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_6',
    code: 'DOC-001',
    name: 'แบบฟอร์มใบเบิกพัสดุและเวชภัณฑ์ CSSD (100 แผ่น/เล่ม)',
    category: 'แบบฟอร์มถ่ายเอกสาร',
    unit: 'เล่ม',
    price: 45,
    quantity: 18,
    totalPrice: 810,
    minStock: 5,
    location: 'ตู้ C2 - แบบฟอร์ม/กระดาษ',
    notes: 'แบบฟอร์มเบิกพัสดุประจำหอผู้ป่วย',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const storageService = {
  getProducts(): Product[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (!data) return INITIAL_PRODUCTS;
      return JSON.parse(data);
    } catch {
      return INITIAL_PRODUCTS;
    }
  },

  saveProducts(products: Product[]): void {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  },

  getStockOut(): StockOutTransaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STOCK_OUT);
      if (!data) return INITIAL_STOCK_OUT;
      return JSON.parse(data);
    } catch {
      return INITIAL_STOCK_OUT;
    }
  },

  saveStockOut(transactions: StockOutTransaction[]): void {
    localStorage.setItem(STORAGE_KEYS.STOCK_OUT, JSON.stringify(transactions));
  },

  getStockIn(): StockInTransaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STOCK_IN);
      if (!data) return INITIAL_STOCK_IN;
      return JSON.parse(data);
    } catch {
      return INITIAL_STOCK_IN;
    }
  },

  saveStockIn(transactions: StockInTransaction[]): void {
    localStorage.setItem(STORAGE_KEYS.STOCK_IN, JSON.stringify(transactions));
  },

  getSheetConfig(): GoogleSheetConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SHEET_CONFIG);
      if (data) return JSON.parse(data);
    } catch {
      // ignore
    }
    return {
      spreadsheetId: '',
      spreadsheetUrl: '',
      sheetTitle: 'Inventory CSSD Makarak',
      lastSyncedAt: null,
      syncStatus: 'idle',
      syncError: null,
      autoSync: true,
      appsScriptUrl: '',
    };
  },

  saveSheetConfig(config: GoogleSheetConfig): void {
    localStorage.setItem(STORAGE_KEYS.SHEET_CONFIG, JSON.stringify(config));
  },

  getUserProfile(): UserProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (data) return JSON.parse(data);
    } catch {
      // ignore
    }
    return {
      email: '',
      name: '',
      picture: '',
      accessToken: null,
      isAuthenticated: false,
    };
  },

  saveUserProfile(profile: UserProfile): void {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  },

  clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.STOCK_OUT);
    localStorage.removeItem(STORAGE_KEYS.STOCK_IN);
    localStorage.removeItem(STORAGE_KEYS.SHEET_CONFIG);
  },

  seedSampleData(): {
    products: Product[];
    stockIn: StockInTransaction[];
    stockOut: StockOutTransaction[];
  } {
    const products = [...SAMPLE_PRODUCTS];
    const now = new Date();
    const stockIn: StockInTransaction[] = [
      {
        id: 'in_1',
        date: new Date(now.getTime() - 86400000 * 2).toISOString(),
        productId: 'prod_1',
        productCode: 'MED-001',
        productName: 'ถุงมือตรวจโรคปลอดเชื้อ (Surgical Gloves) เบอร์ 7.0',
        category: 'วัสดุการแพทย์',
        unit: 'กล่อง',
        unitCost: 380,
        quantity: 50,
        totalCost: 19000,
        receiverName: 'สมศรี มีทรัพย์ (จนท.พัสดุ)',
        supplier: 'บจก. สยามเมดิคอล ซัพพลาย',
        documentNo: 'PO-690801',
        notes: 'รับเข้าสต๊อกประจำงวด',
      },
      {
        id: 'in_2',
        date: new Date(now.getTime() - 86400000).toISOString(),
        productId: 'prod_4',
        productCode: 'OFF-001',
        productName: 'กระดาษถ่ายเอกสาร A4 80 แกรม (500 แผ่น/รีม)',
        category: 'วัสดุสำนักงาน',
        unit: 'รีม',
        unitCost: 135,
        quantity: 30,
        totalCost: 4050,
        receiverName: 'สมศรี มีทรัพย์ (จนท.พัสดุ)',
        supplier: 'บจก. ออฟฟิศ ดีโป้ กรุ๊ป',
        documentNo: 'PO-690802',
        notes: 'รับเข้ากระดาษสำนักงาน',
      },
    ];

    const stockOut: StockOutTransaction[] = [
      {
        id: 'out_1',
        date: new Date(now.getTime() - 3600000 * 5).toISOString(),
        productId: 'prod_1',
        productCode: 'MED-001',
        productName: 'ถุงมือตรวจโรคปลอดเชื้อ (Surgical Gloves) เบอร์ 7.0',
        category: 'วัสดุการแพทย์',
        unit: 'กล่อง',
        price: 380,
        quantity: 5,
        totalAmount: 1900,
        recipientName: 'พว. กนกวรรณ สุขสม',
        department: 'ห้องผ่าตัด (OR)',
        purpose: 'ใช้สำหรับเคสผ่าตัดรอบบ่าย',
      },
      {
        id: 'out_2',
        date: new Date(now.getTime() - 3600000 * 2).toISOString(),
        productId: 'prod_4',
        productCode: 'OFF-001',
        productName: 'กระดาษถ่ายเอกสาร A4 80 แกรม (500 แผ่น/รีม)',
        category: 'วัสดุสำนักงาน',
        unit: 'รีม',
        price: 135,
        quantity: 2,
        totalAmount: 270,
        recipientName: 'วิเชียร ช่างทอง',
        department: 'ฝ่ายสำนักงาน / ธุรการ',
        purpose: 'พิมพ์รายงานการประชุมประจำเดือน',
      },
    ];

    this.saveProducts(products);
    this.saveStockIn(stockIn);
    this.saveStockOut(stockOut);

    return { products, stockIn, stockOut };
  },
};
