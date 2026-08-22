import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowUpRight,
  QrCode,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  Building2,
  FileText,
  Calculator,
  RotateCcw,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Product, StockOutTransaction, ProductCategory, PRODUCT_CATEGORIES } from '../types';
import { DEPARTMENTS } from '../constants/departments';

interface StockOutViewProps {
  products: Product[];
  stockOutHistory: StockOutTransaction[];
  selectedProductForOut?: Product | null;
  onStockOutSubmit: (transaction: Omit<StockOutTransaction, 'id'>) => void;
  onCancelTransaction?: (transactionId: string) => void;
  onOpenScanner: () => void;
}

export const StockOutView: React.FC<StockOutViewProps> = ({
  products,
  stockOutHistory,
  selectedProductForOut,
  onStockOutSubmit,
  onCancelTransaction,
  onOpenScanner,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [recipientName, setRecipientName] = useState<string>('');
  const [department, setDepartment] = useState<string>(DEPARTMENTS[0]);
  const [customDepartment, setCustomDepartment] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>(() => {
    const now = new Date();
    // format as YYYY-MM-DDTHH:mm for datetime-local input
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 16);
  });
  const [productSearch, setProductSearch] = useState<string>('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSuccessFeedback, setIsSuccessFeedback] = useState(false);

  // Set selected product when passed from Quick Stock Out or QR scan
  useEffect(() => {
    if (selectedProductForOut) {
      setSelectedProductId(selectedProductForOut.id);
      setQuantity(1);
    }
  }, [selectedProductForOut]);

  // Current active product
  const activeProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  // Search filtered products for picker dropdown
  const filteredProductOptions = useMemo(() => {
    if (!productSearch.trim()) return products;
    const q = productSearch.toLowerCase();
    return products.filter(
      (p) =>
        p.code.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  // Real-time calculated total issue amount
  const totalAmount = useMemo(() => {
    if (!activeProduct) return 0;
    return Math.max(0, (activeProduct.price || 0) * (Number(quantity) || 0));
  }, [activeProduct, quantity]);

  // Validation
  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!activeProduct) {
      newErrors.product = 'กรุณาเลือกรายการสินค้าที่ต้องการเบิก';
    } else {
      if (activeProduct.quantity === 0) {
        newErrors.quantity = 'สินค้าหมดสต๊อก ไม่สามารถทำรายการเบิกได้';
      } else if (quantity > activeProduct.quantity) {
        newErrors.quantity = `จำนวนเบิกเกินสต๊อกคงเหลือ (คงเหลือเพียง ${activeProduct.quantity} ${activeProduct.unit})`;
      } else if (quantity <= 0) {
        newErrors.quantity = 'จำนวนที่เบิกต้องมากกว่า 0';
      }
    }

    if (!recipientName.trim()) {
      newErrors.recipient = 'กรุณาระบุชื่อผู้ขอเบิก';
    }

    if (!purpose.trim()) {
      newErrors.purpose = 'กรุณาระบุวัตถุประสงค์การใช้งาน / ใบงาน';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !activeProduct) return;

    const finalDepartment = department === 'อื่นๆ' && customDepartment.trim() ? customDepartment.trim() : department;

    onStockOutSubmit({
      date: new Date(dateStr).toISOString(),
      productId: activeProduct.id,
      productCode: activeProduct.code,
      productName: activeProduct.name,
      category: activeProduct.category,
      unit: activeProduct.unit,
      price: activeProduct.price,
      quantity: Number(quantity),
      totalAmount,
      recipientName: recipientName.trim(),
      department: finalDepartment,
      purpose: purpose.trim(),
      notes: notes.trim() || undefined,
    });

    // Fireworks confetti & feedback
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // ignore
    }

    setIsSuccessFeedback(true);
    setTimeout(() => setIsSuccessFeedback(false), 4000);

    // Reset form fields
    setQuantity(1);
    setPurpose('');
    setNotes('');
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-rose-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold tracking-wider uppercase font-mono">
              STOCK OUT / WITHDRAWAL
            </span>
            <span className="text-xs text-amber-200">ระบบตัดสต๊อกอัตโนมัติ</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading">
            หน้าระบบเบิกสินค้าและพัสดุ
          </h2>
          <p className="text-xs sm:text-sm text-amber-100/90 mt-1 max-w-xl font-body">
            ค้นหาหรือสแกนบาร์โค้ดสินค้า ระบบจะตรวจสอบจำนวนคงเหลือและคำนวณยอดเงินเบิกรวมให้ทันที
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenScanner}
          className="px-5 py-3 bg-white text-amber-900 hover:bg-amber-50 rounded-2xl font-semibold text-xs shadow-lg transition flex items-center gap-2 self-stretch md:self-auto justify-center"
        >
          <QrCode className="w-4 h-4 text-amber-700" />
          <span>สแกน QR Code เพื่อเบิก</span>
        </button>
      </div>

      {/* Main Grid: Form Left, Recent History Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2 font-heading">
            <ArrowUpRight className="w-5 h-5 text-amber-600" />
            บันทึกรายการเบิกสินค้า
          </h3>

          {isSuccessFeedback && (
            <div className="mb-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-3 animate-in fade-in">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold">บันทึกการเบิกสำเร็จและตัดสต๊อกเรียบร้อยแล้ว!</p>
                <p className="text-[11px] opacity-80">ยอดเงินและข้อมูลถูกบันทึกเตรียมพร้อมซิงค์ลง Google Sheet</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 font-body">
            {/* Step 1: Product Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  1. เลือกสินค้าที่ต้องการเบิก <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={onOpenScanner}
                  className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  สแกนกล้อง
                </button>
              </div>

              {/* Product Picker Dropdown */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="พิมพ์ค้นหารหัสหรือชื่อสินค้าในรายการ..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <select
                  id="select-stockout-product"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                >
                  <option value="">-- กรุณาเลือกสินค้าจากรายการ ({products.length} รายการ) --</option>
                  {filteredProductOptions.map((p) => (
                    <option
                      key={p.id}
                      value={p.id}
                      disabled={p.quantity === 0}
                      className={p.quantity === 0 ? 'text-slate-400 bg-slate-50' : ''}
                    >
                      [{p.code}] {p.name} — คงเหลือ: {p.quantity} {p.unit} (฿{p.price.toLocaleString()})
                      {p.quantity === 0 ? ' [หมดสต๊อก]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {errors.product && <p className="text-xs text-rose-500 mt-1">{errors.product}</p>}
            </div>

            {/* Product Info Card Preview */}
            {activeProduct && (
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-slate-800/80 border border-amber-200/80 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-amber-900 dark:text-amber-300 bg-amber-200/60 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                    {activeProduct.code}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                    {activeProduct.category}
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {activeProduct.name}
                </h4>

                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1 border-t border-amber-200/50 dark:border-slate-700/50">
                  <div>
                    <span className="text-slate-500 text-[10px] block">คงเหลือปัจจุบัน</span>
                    <span
                      className={`font-bold font-mono text-sm ${
                        activeProduct.quantity === 0
                          ? 'text-rose-600'
                          : activeProduct.quantity <= activeProduct.minStock
                          ? 'text-amber-600'
                          : 'text-emerald-700 dark:text-emerald-400'
                      }`}
                    >
                      {activeProduct.quantity} {activeProduct.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">ราคาต่อหน่วย</span>
                    <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">
                      ฿{activeProduct.price.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">ตำแหน่งจัดเก็บ</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate block">
                      {activeProduct.location || '-'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Quantity & Calculation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  2. จำนวนที่ต้องการเบิก <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="input-stockout-quantity"
                    type="number"
                    min="1"
                    max={activeProduct ? activeProduct.quantity : undefined}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500 font-mono font-bold"
                  />
                  <span className="text-xs font-medium text-slate-500 shrink-0">
                    {activeProduct ? activeProduct.unit : 'หน่วย'}
                  </span>
                </div>
                {errors.quantity && <p className="text-xs text-rose-500 mt-1">{errors.quantity}</p>}
              </div>

              {/* Auto Total Issue Price Box */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  ยอดเงินที่เบิกรวม (คำนวณอัตโนมัติ)
                </label>
                <div className="px-3.5 py-2 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between">
                  <span className="text-xs text-amber-800 dark:text-amber-300 flex items-center gap-1 font-medium">
                    <Calculator className="w-3.5 h-3.5" /> รวม:
                  </span>
                  <span className="text-base font-bold font-mono text-amber-900 dark:text-amber-300">
                    ฿{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Step 3: Recipient & Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  3. ชื่อผู้เบิก / ผู้รับพัสดุ <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-stockout-recipient"
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="เช่น พว. วิมลรัตน์ หรือ ช่างเก่ง"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                />
                {errors.recipient && <p className="text-xs text-rose-500 mt-1">{errors.recipient}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  แผนก / ฝ่ายที่เบิก <span className="text-rose-500">*</span>
                </label>
                <select
                  id="select-stockout-department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                {department === 'อื่นๆ' && (
                  <input
                    type="text"
                    value={customDepartment}
                    onChange={(e) => setCustomDepartment(e.target.value)}
                    placeholder="ระบุชื่อแผนก/หน่วยงาน..."
                    className="mt-2 w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                )}
              </div>
            </div>

            {/* Step 4: Purpose & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  4. วัตถุประสงค์การเบิก / งานที่ใช้ <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-stockout-purpose"
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="เช่น ใช้เคสผ่าตัดรอบเช้า / ซ่อมบำรุงไฟทางเดิน"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                />
                {errors.purpose && <p className="text-xs text-rose-500 mt-1">{errors.purpose}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  วันที่และเวลาที่ทำรายการ
                </label>
                <input
                  id="input-stockout-date"
                  type="datetime-local"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                id="btn-submit-stockout"
                type="submit"
                className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold text-sm rounded-2xl shadow-lg shadow-amber-200 dark:shadow-none transition flex items-center justify-center gap-2"
              >
                <ArrowUpRight className="w-5 h-5" />
                <span>ยืนยันการเบิกสินค้า (ตัดสต๊อกทันที)</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right History (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 font-heading">
                <Clock className="w-4 h-4 text-slate-500" />
                ประวัติการเบิกออกล่าสุด
              </h4>
              <span className="text-xs text-slate-500 font-mono">{stockOutHistory.length} รายการ</span>
            </div>

            {stockOutHistory.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 mb-2 opacity-60" />
                <p className="text-xs font-body">ยังไม่มีรายการเบิกออกในระบบ</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  เมื่อคุณทำรายการเบิก ข้อมูลจะแสดงบันทึกที่นี่
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
                {stockOutHistory.slice(0, 10).map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 space-y-1.5 text-xs font-body"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-amber-800 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-950/60 px-2 py-0.5 rounded text-[11px]">
                        {item.productCode}
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        ฿{item.totalAmount.toLocaleString()}
                      </span>
                    </div>

                    <p className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                      {item.productName}
                    </p>

                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span>เบิก: <strong className="text-slate-700 dark:text-slate-300 font-mono">{item.quantity}</strong> {item.unit}</span>
                      <span>ผู้เบิก: {item.recipientName}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-700/50 text-[10px] text-slate-400">
                      <span>{item.department}</span>
                      <span>{new Date(item.date).toLocaleDateString('th-TH')} {new Date(item.date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
