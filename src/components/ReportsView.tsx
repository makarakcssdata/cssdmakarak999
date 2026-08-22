import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Layers,
  Building2,
  Package,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  PieChart,
  Table,
  Filter,
  CheckCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { Product, StockInTransaction, StockOutTransaction, ProductCategory, PRODUCT_CATEGORIES } from '../types';
import { exportToCsv } from '../utils/exportCsv';

interface ReportsViewProps {
  products: Product[];
  stockOutHistory: StockOutTransaction[];
  stockInHistory: StockInTransaction[];
}

type DateFilterMode = 'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM';
type ReportSubTab = 'MATRIX' | 'STOCK_GROUP' | 'WITHDRAWAL_LOG' | 'STOCKIN_LOG';

export const ReportsView: React.FC<ReportsViewProps> = ({
  products,
  stockOutHistory,
  stockInHistory,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<DateFilterMode>('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<ReportSubTab>('MATRIX');
  const [stockSearch, setStockSearch] = useState('');

  // Calculate Date bounds for filtering transactions
  const dateRangeBounds = useMemo(() => {
    const now = new Date();
    if (dateFilter === 'TODAY') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { start, end: now };
    }
    if (dateFilter === 'WEEK') {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { start, end: now };
    }
    if (dateFilter === 'MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start, end: now };
    }
    if (dateFilter === 'CUSTOM' && customStartDate && customEndDate) {
      return {
        start: new Date(customStartDate + 'T00:00:00'),
        end: new Date(customEndDate + 'T23:59:59'),
      };
    }
    return null; // ALL
  }, [dateFilter, customStartDate, customEndDate]);

  // Filtered transactions by Date Range & Category
  const filteredStockOut = useMemo(() => {
    return stockOutHistory.filter((item) => {
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
      if (dateRangeBounds) {
        const itemDate = new Date(item.date);
        if (itemDate < dateRangeBounds.start || itemDate > dateRangeBounds.end) return false;
      }
      return true;
    });
  }, [stockOutHistory, selectedCategory, dateRangeBounds]);

  const filteredStockIn = useMemo(() => {
    return stockInHistory.filter((item) => {
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
      if (dateRangeBounds) {
        const itemDate = new Date(item.date);
        if (itemDate < dateRangeBounds.start || itemDate > dateRangeBounds.end) return false;
      }
      return true;
    });
  }, [stockInHistory, selectedCategory, dateRangeBounds]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
      if (stockSearch.trim()) {
        const q = stockSearch.toLowerCase();
        return (
          p.code.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          (p.location && p.location.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [products, selectedCategory, stockSearch]);

  // Global KPIs
  const totalStockValue = useMemo(() => {
    return filteredProducts.reduce((sum, p) => sum + (p.totalPrice || p.quantity * p.price), 0);
  }, [filteredProducts]);

  const totalStockQuantity = useMemo(() => {
    return filteredProducts.reduce((sum, p) => sum + p.quantity, 0);
  }, [filteredProducts]);

  const totalWithdrawnAmount = useMemo(() => {
    return filteredStockOut.reduce((sum, item) => sum + item.totalAmount, 0);
  }, [filteredStockOut]);

  const totalPurchasedAmount = useMemo(() => {
    return filteredStockIn.reduce((sum, item) => sum + item.totalCost, 0);
  }, [filteredStockIn]);

  const urgentOrderCount = useMemo(() => {
    return filteredProducts.filter((p) => p.quantity <= p.minStock).length;
  }, [filteredProducts]);

  // Matrix Summary per 6 Categories
  const categoryMatrixData = useMemo(() => {
    return PRODUCT_CATEGORIES.map((cat) => {
      const catProducts = products.filter((p) => p.category === cat.name);
      const catStockOut = stockOutHistory.filter((o) => o.category === cat.name);
      const catStockIn = stockInHistory.filter((i) => i.category === cat.name);

      const skuCount = catProducts.length;
      const totalPieces = catProducts.reduce((s, p) => s + p.quantity, 0);
      const stockVal = catProducts.reduce((s, p) => s + (p.totalPrice || p.quantity * p.price), 0);
      const outAmount = catStockOut.reduce((s, o) => s + o.totalAmount, 0);
      const inAmount = catStockIn.reduce((s, i) => s + i.totalCost, 0);
      const lowCount = catProducts.filter((p) => p.quantity > 0 && p.quantity <= p.minStock).length;
      const zeroCount = catProducts.filter((p) => p.quantity === 0).length;

      const grandTotalVal = products.reduce((s, p) => s + (p.totalPrice || p.quantity * p.price), 0);
      const percentShare = grandTotalVal > 0 ? (stockVal / grandTotalVal) * 100 : 0;

      return {
        category: cat.name,
        codePrefix: cat.codePrefix,
        color: cat.color,
        bgColor: cat.bgColor,
        borderColor: cat.borderColor,
        skuCount,
        totalPieces,
        stockVal,
        percentShare,
        outAmount,
        outCount: catStockOut.length,
        inAmount,
        inCount: catStockIn.length,
        lowCount,
        zeroCount,
      };
    });
  }, [products, stockOutHistory, stockInHistory]);

  // Breakdown by Department
  const departmentBreakdown = useMemo(() => {
    const map: { [dept: string]: { totalAmount: number; count: number } } = {};
    filteredStockOut.forEach((item) => {
      const d = item.department || 'ไม่ระบุ';
      if (!map[d]) map[d] = { totalAmount: 0, count: 0 };
      map[d].totalAmount += item.totalAmount;
      map[d].count += 1;
    });

    const list = Object.entries(map).map(([dept, data]) => ({
      dept,
      totalAmount: data.totalAmount,
      count: data.count,
      percent: totalWithdrawnAmount > 0 ? (data.totalAmount / totalWithdrawnAmount) * 100 : 0,
    }));

    return list.sort((a, b) => b.totalAmount - a.totalAmount);
  }, [filteredStockOut, totalWithdrawnAmount]);

  // Export CSV handler
  const handleExportCsv = () => {
    const timestamp = new Date().toISOString().slice(0, 10);

    if (activeSubTab === 'MATRIX') {
      const headers = [
        'ประเภทสินค้า',
        'จำนวน SKU',
        'จำนวนชิ้นคงเหลือรวม',
        'มูลค่าสต๊อกคงเหลือ (บาท)',
        'สัดส่วนมูลค่า (%)',
        'ยอดเงินที่เบิกสะสม (บาท)',
        'จำนวนครั้งที่เบิก',
        'ยอดเงินรับเข้าสะสม (บาท)',
        'จำนวนครั้งที่รับเข้า',
        'สินค้าใกล้หมด (SKU)',
        'สินค้าหมดสต๊อก (SKU)',
      ];
      const rows = categoryMatrixData.map((d) => [
        d.category,
        d.skuCount,
        d.totalPieces,
        d.stockVal,
        d.percentShare.toFixed(2) + '%',
        d.outAmount,
        d.outCount,
        d.inAmount,
        d.inCount,
        d.lowCount,
        d.zeroCount,
      ]);
      exportToCsv(`Inventory_Matrix_Report_${timestamp}`, headers, rows);
    } else if (activeSubTab === 'STOCK_GROUP') {
      const headers = [
        'รหัสสินค้า',
        'ชื่อสินค้า',
        'หมวดหมู่',
        'หน่วยนับ',
        'ราคาต่อหน่วย (บาท)',
        'จำนวนคงเหลือ',
        'รวมมูลค่า (บาท)',
        'จุดสั่งซื้อขั้นต่ำ',
        'ตำแหน่งจัดเก็บ',
        'หมายเหตุ',
      ];
      const rows = filteredProducts.map((p) => [
        p.code,
        p.name,
        p.category,
        p.unit,
        p.price,
        p.quantity,
        p.totalPrice || p.quantity * p.price,
        p.minStock,
        p.location || '-',
        p.notes || '',
      ]);
      exportToCsv(`Stock_Balance_Report_${selectedCategory}_${timestamp}`, headers, rows);
    } else if (activeSubTab === 'WITHDRAWAL_LOG') {
      const headers = [
        'วันที่-เวลา',
        'รหัสสินค้า',
        'ชื่อสินค้า',
        'ประเภทสินค้า',
        'จำนวนที่เบิก',
        'หน่วย',
        'ราคาต่อหน่วย (บาท)',
        'ยอดเงินที่เบิกรวม (บาท)',
        'ผู้เบิก',
        'แผนก/ฝ่าย',
        'วัตถุประสงค์',
        'หมายเหตุ',
      ];
      const rows = filteredStockOut.map((o) => [
        new Date(o.date).toLocaleString('th-TH'),
        o.productCode,
        o.productName,
        o.category,
        o.quantity,
        o.unit,
        o.price,
        o.totalAmount,
        o.recipientName,
        o.department,
        o.purpose,
        o.notes || '',
      ]);
      exportToCsv(`Withdrawal_History_${selectedCategory}_${timestamp}`, headers, rows);
    } else {
      const headers = [
        'วันที่-เวลา',
        'รหัสสินค้า',
        'ชื่อสินค้า',
        'ประเภทสินค้า',
        'จำนวนรับเข้า',
        'หน่วย',
        'ราคาทุนต่อหน่วย (บาท)',
        'ยอดเงินซื้อรวม (บาท)',
        'ผู้รับเข้า',
        'Supplier',
        'เลขที่ PO',
        'หมายเหตุ',
      ];
      const rows = filteredStockIn.map((i) => [
        new Date(i.date).toLocaleString('th-TH'),
        i.productCode,
        i.productName,
        i.category,
        i.quantity,
        i.unit,
        i.unitCost,
        i.totalCost,
        i.receiverName,
        i.supplier,
        i.documentNo,
        i.notes || '',
      ]);
      exportToCsv(`StockIn_History_${selectedCategory}_${timestamp}`, headers, rows);
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Top Header & Export Action */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold font-mono">
              ANALYTICS & REPORTS
            </span>
            <span className="text-xs text-slate-400">สรุปยอดสต๊อกและข้อมูลการเบิกจ่าย</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-heading">
            รายงานสินค้าคงเหลือ & จำนวนเงินที่เบิก
          </h2>
          <p className="text-xs text-slate-500 font-body">
            วิเคราะห์จำแนกตาม 6 หมวดหมู่พัสดุ และจำแนกตามแผนกผู้เบิก
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto">
          <button
            id="btn-export-csv-reports"
            type="button"
            onClick={handleExportCsv}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs shadow-emerald-200 dark:shadow-none transition"
          >
            <Download className="w-4 h-4" />
            <span>ส่งออกข้อมูล CSV (Excel/Sheets)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Stock Value */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium font-body">มูลค่าสต๊อกคงเหลือรวม</span>
            <span className="p-1 rounded-lg bg-emerald-50 text-emerald-600"><Package className="w-4 h-4" /></span>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
            ฿{totalStockValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-body">
            คงเหลือรวม {totalStockQuantity.toLocaleString()} ชิ้น ({filteredProducts.length} SKU)
          </p>
        </div>

        {/* Total Withdrawn Amount */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium font-body">ยอดเงินที่เบิกสะสม</span>
            <span className="p-1 rounded-lg bg-amber-50 text-amber-600"><ArrowUpRight className="w-4 h-4" /></span>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-amber-700 dark:text-amber-400">
            ฿{totalWithdrawnAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-body">
            เบิกจ่ายไปแล้ว {filteredStockOut.length} ครั้ง
          </p>
        </div>

        {/* Total Purchased StockIn Amount */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium font-body">ยอดเงินรับเข้าพัสดุ</span>
            <span className="p-1 rounded-lg bg-blue-50 text-blue-600"><ArrowDownLeft className="w-4 h-4" /></span>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-blue-700 dark:text-blue-400">
            ฿{totalPurchasedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-body">
            รับเข้าคลัง {filteredStockIn.length} รายการ
          </p>
        </div>

        {/* Urgent Order Reorder Items */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium font-body">สินค้าที่ต้องสั่งซื้อด่วน</span>
            <span className="p-1 rounded-lg bg-rose-50 text-rose-600"><AlertTriangle className="w-4 h-4" /></span>
          </div>
          <p className={`text-xl sm:text-2xl font-bold font-mono ${urgentOrderCount > 0 ? 'text-rose-600' : 'text-slate-800 dark:text-slate-200'}`}>
            {urgentOrderCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-body">
            {urgentOrderCount > 0 ? 'ต่ำกว่าจุดสั่งซื้อขั้นต่ำ' : 'สต๊อกปลอดภัยทุกรายการ'}
          </p>
        </div>
      </div>

      {/* Category Quick Selector Pills (6 Categories) */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 font-heading">
            <Layers className="w-4 h-4 text-emerald-600" />
            เลือกดูข้อมูลเฉพาะหมวดหมู่พัสดุ (Category Filter):
          </span>
          <span className="text-[11px] text-slate-400 font-body">คลิกเพื่อสลับมุมมอง</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition flex items-center gap-2 ${
              selectedCategory === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <span>รวมทุกหมวดหมู่</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/20 font-mono">
              {products.length} SKU
            </span>
          </button>

          {PRODUCT_CATEGORIES.map((cat) => {
            const count = products.filter((p) => p.category === cat.name).length;
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition flex items-center gap-2 border ${
                  isSelected
                    ? `${cat.bgColor} ${cat.borderColor} ${cat.color} font-semibold shadow-xs`
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <span>{cat.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/5 dark:bg-white/10 font-mono">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Range & Sub-tab Navigation Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Sub Tabs */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-medium overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveSubTab('MATRIX')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
                activeSubTab === 'MATRIX'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              1. สรุปเปรียบเทียบแยกหมวดหมู่ (Matrix)
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('STOCK_GROUP')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
                activeSubTab === 'STOCK_GROUP'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              2. สต๊อกคงเหลือรายตัว (Stock by Category)
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('WITHDRAWAL_LOG')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
                activeSubTab === 'WITHDRAWAL_LOG'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              3. รายงานการเบิกสินค้า
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('STOCKIN_LOG')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
                activeSubTab === 'STOCKIN_LOG'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              4. รายงานการรับเข้า
            </button>
          </div>

          {/* Time Filter Buttons */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 mr-1 flex items-center gap-1 font-body">
              <Calendar className="w-3.5 h-3.5" /> ช่วงเวลา:
            </span>
            <button
              type="button"
              onClick={() => setDateFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg transition ${
                dateFilter === 'ALL'
                  ? 'bg-emerald-100 text-emerald-800 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('TODAY')}
              className={`px-2.5 py-1 rounded-lg transition ${
                dateFilter === 'TODAY'
                  ? 'bg-emerald-100 text-emerald-800 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400'
              }`}
            >
              วันนี้
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('WEEK')}
              className={`px-2.5 py-1 rounded-lg transition ${
                dateFilter === 'WEEK'
                  ? 'bg-emerald-100 text-emerald-800 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400'
              }`}
            >
              7 วันล่าสุด
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('MONTH')}
              className={`px-2.5 py-1 rounded-lg transition ${
                dateFilter === 'MONTH'
                  ? 'bg-emerald-100 text-emerald-800 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400'
              }`}
            >
              เดือนนี้
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Tab 1: Category Summary & Matrix Table */}
      {activeSubTab === 'MATRIX' && (
        <div className="space-y-6">
          {/* 6 Category Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryMatrixData.map((item) => (
              <div
                key={item.category}
                className={`p-5 rounded-2xl border ${item.borderColor} ${item.bgColor} shadow-xs space-y-3`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-black/10 dark:bg-white/20">
                      {item.codePrefix}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white font-heading">
                      {item.category}
                    </h4>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                    {item.percentShare.toFixed(1)}% ของคลัง
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(item.percentShare, 100)}%` }}
                  />
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1 font-body">
                  <div className="bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-xl border border-black/5">
                    <span className="text-[10px] text-slate-500 block">มูลค่าคงเหลือ</span>
                    <span className="font-bold font-mono text-emerald-800 dark:text-emerald-400">
                      ฿{item.stockVal.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{item.totalPieces} ชิ้น ({item.skuCount} SKU)</span>
                  </div>

                  <div className="bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-xl border border-black/5">
                    <span className="text-[10px] text-slate-500 block">ยอดเงินที่เบิก</span>
                    <span className="font-bold font-mono text-amber-800 dark:text-amber-400">
                      ฿{item.outAmount.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">เบิก {item.outCount} ครั้ง</span>
                  </div>
                </div>

                {/* Safety alerts */}
                <div className="flex items-center justify-between text-[11px] pt-1">
                  {item.zeroCount > 0 ? (
                    <span className="text-rose-600 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> หมดสต๊อก {item.zeroCount} รายการ
                    </span>
                  ) : item.lowCount > 0 ? (
                    <span className="text-amber-600 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> ใกล้หมด {item.lowCount} รายการ
                    </span>
                  ) : (
                    <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> สต๊อกพร้อมใช้งาน
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Matrix Table with Grand Total */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 font-heading">
                <Table className="w-4 h-4 text-emerald-600" />
                ตาราง Matrix สรุปเปรียบเทียบทุกประเภทสินค้า (Category Matrix Table)
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-body">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase text-[11px] font-semibold">
                  <tr>
                    <th className="py-3 px-4">ประเภทสินค้า</th>
                    <th className="py-3 px-4 text-center">SKU</th>
                    <th className="py-3 px-4 text-center">ชิ้นคงเหลือ</th>
                    <th className="py-3 px-4 text-right">มูลค่าคงเหลือ (บาท)</th>
                    <th className="py-3 px-4 text-center">สัดส่วน (%)</th>
                    <th className="py-3 px-4 text-right">ยอดเงินที่เบิก (บาท)</th>
                    <th className="py-3 px-4 text-center">จำนวนครั้งที่เบิก</th>
                    <th className="py-3 px-4 text-right">ยอดรับเข้า (บาท)</th>
                    <th className="py-3 px-4 text-center">สถานะความปลอดภัย</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {categoryMatrixData.map((row) => (
                    <tr key={row.category} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600">
                          {row.codePrefix}
                        </span>
                        <span>{row.category}</span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono">{row.skuCount}</td>
                      <td className="py-3 px-4 text-center font-mono">{row.totalPieces.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        ฿{row.stockVal.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">{row.percentShare.toFixed(1)}%</td>
                      <td className="py-3 px-4 text-right font-mono text-amber-700 dark:text-amber-400">
                        ฿{row.outAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">{row.outCount}</td>
                      <td className="py-3 px-4 text-right font-mono text-blue-700 dark:text-blue-400">
                        ฿{row.inAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {row.zeroCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700">
                            หมด {row.zeroCount} รายการ
                          </span>
                        ) : row.lowCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700">
                            ใกล้หมด {row.lowCount}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                            ปกติ
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {/* Grand Total Row */}
                  <tr className="bg-slate-100/80 dark:bg-slate-800/80 font-bold border-t-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
                    <td className="py-3.5 px-4 font-heading">รวมทั้งหมด (Grand Total)</td>
                    <td className="py-3.5 px-4 text-center font-mono">{products.length}</td>
                    <td className="py-3.5 px-4 text-center font-mono">{totalStockQuantity.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-800 dark:text-emerald-300">
                      ฿{totalStockValue.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono">100.0%</td>
                    <td className="py-3.5 px-4 text-right font-mono text-amber-800 dark:text-amber-300">
                      ฿{stockOutHistory.reduce((s, o) => s + o.totalAmount, 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono">{stockOutHistory.length}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-blue-800 dark:text-blue-300">
                      ฿{stockInHistory.reduce((s, i) => s + i.totalCost, 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Department Breakdown Section */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 font-heading">
              <Building2 className="w-4 h-4 text-amber-600" />
              สรุปยอดเงินที่เบิกจำแนกตามแผนก / ฝ่าย
            </h4>

            {departmentBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center font-body">
                ยังไม่มีข้อมูลการเบิกจ่ายในช่วงเวลานี้
              </p>
            ) : (
              <div className="space-y-3">
                {departmentBreakdown.map((item) => (
                  <div key={item.dept} className="space-y-1 text-xs font-body">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {item.dept} <span className="text-slate-400 font-normal">({item.count} ครั้ง)</span>
                      </span>
                      <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                        ฿{item.totalAmount.toLocaleString()} ({item.percent.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(item.percent, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Stock by Category Grouped */}
      {activeSubTab === 'STOCK_GROUP' && (
        <div className="space-y-6">
          {/* Subtotal grouped tables for each Category */}
          {PRODUCT_CATEGORIES.map((cat) => {
            if (selectedCategory !== 'ALL' && selectedCategory !== cat.name) return null;
            const items = products.filter((p) => p.category === cat.name);
            const subtotalQty = items.reduce((s, p) => s + p.quantity, 0);
            const subtotalValue = items.reduce((s, p) => s + (p.totalPrice || p.quantity * p.price), 0);

            return (
              <div
                key={cat.name}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden"
              >
                {/* Category Header Banner with Subtotal */}
                <div className={`p-4 border-b ${cat.borderColor} ${cat.bgColor} flex flex-wrap items-center justify-between gap-2`}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-black/10 dark:bg-white/20">
                      {cat.codePrefix}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white font-heading">
                      {cat.name}
                    </h4>
                    <span className="text-xs text-slate-500 font-mono">({items.length} SKU)</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-body">
                    <div>
                      <span className="text-slate-500">คงเหลือรวม: </span>
                      <strong className="font-mono text-slate-800 dark:text-slate-200">{subtotalQty.toLocaleString()}</strong> ชิ้น
                    </div>
                    <div>
                      <span className="text-slate-500">มูลค่าหมวด (Subtotal): </span>
                      <strong className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">฿{subtotalValue.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>

                {/* Table for this Category */}
                {items.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">ไม่มีสินค้าในหมวดหมู่นี้</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-body">
                      <thead className="bg-slate-50/50 text-slate-400 uppercase text-[10px]">
                        <tr>
                          <th className="py-2.5 px-4">รหัส</th>
                          <th className="py-2.5 px-4">ชื่อสินค้า</th>
                          <th className="py-2.5 px-4 text-right">ราคา/หน่วย</th>
                          <th className="py-2.5 px-4 text-center">คงเหลือ</th>
                          <th className="py-2.5 px-4 text-right">รวมมูลค่า (บาท)</th>
                          <th className="py-2.5 px-4">ตำแหน่ง</th>
                          <th className="py-2.5 px-4 text-center">สถานะ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {items.map((p) => {
                          const rowTotal = p.totalPrice || p.quantity * p.price;
                          return (
                            <tr key={p.id} className="hover:bg-slate-50/50">
                              <td className="py-2.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                                {p.code}
                              </td>
                              <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-white">
                                {p.name}
                              </td>
                              <td className="py-2.5 px-4 text-right font-mono">
                                ฿{p.price.toLocaleString()} / {p.unit}
                              </td>
                              <td className="py-2.5 px-4 text-center font-mono font-bold">
                                {p.quantity} {p.unit}
                              </td>
                              <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                ฿{rowTotal.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-4 text-slate-500">{p.location || '-'}</td>
                              <td className="py-2.5 px-4 text-center">
                                {p.quantity === 0 ? (
                                  <span className="text-[10px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded font-semibold">
                                    หมด
                                  </span>
                                ) : p.quantity <= p.minStock ? (
                                  <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-semibold">
                                    เตือน
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                    ปกติ
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Sub-Tab 3: Withdrawals by Category & Dept */}
      {activeSubTab === 'WITHDRAWAL_LOG' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 font-heading">
              <ArrowUpRight className="w-4 h-4 text-amber-600" />
              ประวัติและรายงานการเบิกสินค้า (รวม {filteredStockOut.length} รายการ)
            </h4>
            <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400">
              ยอดเบิกรวม: ฿{totalWithdrawnAmount.toLocaleString()}
            </span>
          </div>

          {filteredStockOut.length === 0 ? (
            <p className="text-xs text-slate-400 py-12 text-center">ไม่พบรายการเบิกตามเงื่อนไขที่เลือก</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-body">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase text-[11px] font-semibold">
                  <tr>
                    <th className="py-3 px-4">วันที่-เวลา</th>
                    <th className="py-3 px-4">รหัสสินค้า</th>
                    <th className="py-3 px-4">ชื่อสินค้า</th>
                    <th className="py-3 px-4">หมวดหมู่</th>
                    <th className="py-3 px-4 text-center">จำนวนเบิก</th>
                    <th className="py-3 px-4 text-right">ยอดเงินเบิกรวม</th>
                    <th className="py-3 px-4">ผู้เบิก</th>
                    <th className="py-3 px-4">แผนก/ฝ่าย</th>
                    <th className="py-3 px-4">วัตถุประสงค์</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredStockOut.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(o.date).toLocaleDateString('th-TH')} {new Date(o.date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-800 dark:text-amber-400">
                        {o.productCode}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                        {o.productName}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{o.category}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                        {o.quantity} {o.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-700 dark:text-amber-400">
                        ฿{o.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">{o.recipientName}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{o.department}</td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{o.purpose || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 4: Stock In History */}
      {activeSubTab === 'STOCKIN_LOG' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 font-heading">
              <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
              ประวัติและรายงานการรับเข้าพัสดุ (รวม {filteredStockIn.length} รายการ)
            </h4>
            <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
              ยอดรับเข้ารวม: ฿{totalPurchasedAmount.toLocaleString()}
            </span>
          </div>

          {filteredStockIn.length === 0 ? (
            <p className="text-xs text-slate-400 py-12 text-center">ไม่พบรายการรับเข้าตามเงื่อนไขที่เลือก</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-body">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase text-[11px] font-semibold">
                  <tr>
                    <th className="py-3 px-4">วันที่-เวลา</th>
                    <th className="py-3 px-4">รหัสสินค้า</th>
                    <th className="py-3 px-4">ชื่อสินค้า</th>
                    <th className="py-3 px-4">หมวดหมู่</th>
                    <th className="py-3 px-4 text-center">จำนวนรับ</th>
                    <th className="py-3 px-4 text-right">ทุน/หน่วย</th>
                    <th className="py-3 px-4 text-right">ยอดเงินรวม</th>
                    <th className="py-3 px-4">ผู้รับเข้า</th>
                    <th className="py-3 px-4">ผู้จำหน่าย / Supplier</th>
                    <th className="py-3 px-4">เลขที่ PO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredStockIn.map((i) => (
                    <tr key={i.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(i.date).toLocaleDateString('th-TH')} {new Date(i.date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-800 dark:text-emerald-400">
                        {i.productCode}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                        {i.productName}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{i.category}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                        {i.quantity} {i.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">฿{i.unitCost.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        ฿{i.totalCost.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">{i.receiverName}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{i.supplier || '-'}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{i.documentNo || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
