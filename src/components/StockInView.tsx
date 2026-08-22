import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowDownLeft,
  QrCode,
  Search,
  CheckCircle,
  Plus,
  Truck,
  FileCheck,
  Calculator,
  Layers,
  Clock,
  Sparkles,
  Package,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Product, StockInTransaction, ProductCategory, PRODUCT_CATEGORIES } from '../types';
import { STANDARD_UNITS, STORAGE_LOCATIONS } from '../constants/departments';

interface StockInViewProps {
  products: Product[];
  stockInHistory: StockInTransaction[];
  selectedProductForIn?: Product | null;
  scannedCodeForIn?: string | null;
  onStockInSubmit: (
    transaction: Omit<StockInTransaction, 'id'>,
    isNewProduct?: boolean,
    newProductData?: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
  ) => void;
  onOpenScanner: () => void;
}

export const StockInView: React.FC<StockInViewProps> = ({
  products,
  stockInHistory,
  selectedProductForIn,
  scannedCodeForIn,
  onStockInSubmit,
  onOpenScanner,
}) => {
  const [mode, setMode] = useState<'EXISTING' | 'NEW'>('EXISTING');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [productSearch, setProductSearch] = useState<string>('');

  // Fields for existing or new
  const [quantity, setQuantity] = useState<number>(1);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [receiverName, setReceiverName] = useState<string>('เจ้าหน้าที่พัสดุ CSSD');
  const [supplier, setSupplier] = useState<string>('');
  const [documentNo, setDocumentNo] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 16);
  });

  // Fields for new product
  const [newCode, setNewCode] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newCategory, setNewCategory] = useState<ProductCategory>('วัสดุการแพทย์');
  const [newUnit, setNewUnit] = useState<string>('ชิ้น');
  const [newLocation, setNewLocation] = useState<string>(STORAGE_LOCATIONS[0]);
  const [newMinStock, setNewMinStock] = useState<number>(5);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSuccessFeedback, setIsSuccessFeedback] = useState(false);

  // When selectedProductForIn changes (from quick button or scanner)
  useEffect(() => {
    if (selectedProductForIn) {
      setMode('EXISTING');
      setSelectedProductId(selectedProductForIn.id);
      setUnitCost(selectedProductForIn.price || 0);
      setQuantity(1);
    }
  }, [selectedProductForIn]);

  // When scannedCodeForIn changes
  useEffect(() => {
    if (scannedCodeForIn) {
      const match = products.find((p) => p.code.toUpperCase() === scannedCodeForIn.toUpperCase());
      if (match) {
        setMode('EXISTING');
        setSelectedProductId(match.id);
        setUnitCost(match.price || 0);
        setQuantity(1);
      } else {
        // Switch to New product mode and populate code
        setMode('NEW');
        setNewCode(scannedCodeForIn.toUpperCase());
      }
    }
  }, [scannedCodeForIn, products]);

  // Active product
  const activeProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  // Filtered product options for picker
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

  // Auto calculate total cost
  const totalCost = useMemo(() => {
    return Math.max(0, (Number(unitCost) || 0) * (Number(quantity) || 0));
  }, [unitCost, quantity]);

  // Auto set unit price when selecting product
  const handleProductSelect = (id: string) => {
    setSelectedProductId(id);
    const prod = products.find((p) => p.id === id);
    if (prod) {
      setUnitCost(prod.price);
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (mode === 'EXISTING') {
      if (!activeProduct) newErrors.product = 'กรุณาเลือกสินค้าที่ต้องการรับเข้า';
    } else {
      if (!newCode.trim()) newErrors.newCode = 'กรุณาระบุรหัสสินค้าใหม่';
      if (!newName.trim()) newErrors.newName = 'กรุณาระบุชื่อสินค้าใหม่';
      const isDuplicate = products.some((p) => p.code.trim().toUpperCase() === newCode.trim().toUpperCase());
      if (isDuplicate) newErrors.newCode = 'รหัสสินค้านี้มีอยู่ในระบบแล้ว กรุณาใช้โหมดรับเข้าสินค้าเดิม';
    }

    if (quantity <= 0) newErrors.quantity = 'จำนวนรับเข้าต้องมากกว่า 0';
    if (unitCost < 0) newErrors.unitCost = 'ราคาทุนต้องไม่ติดลบ';
    if (!receiverName.trim()) newErrors.receiver = 'กรุณาระบุชื่อผู้รับเข้าพัสดุ';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (mode === 'EXISTING' && activeProduct) {
      onStockInSubmit({
        date: new Date(dateStr).toISOString(),
        productId: activeProduct.id,
        productCode: activeProduct.code,
        productName: activeProduct.name,
        category: activeProduct.category,
        unit: activeProduct.unit,
        unitCost: Number(unitCost) || 0,
        quantity: Number(quantity) || 0,
        totalCost,
        receiverName: receiverName.trim(),
        supplier: supplier.trim() || '-',
        documentNo: documentNo.trim() || '-',
        notes: notes.trim() || undefined,
      });
    } else {
      // New product
      const newProductData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
        code: newCode.trim().toUpperCase(),
        name: newName.trim(),
        category: newCategory,
        unit: newUnit,
        price: Number(unitCost) || 0,
        quantity: Number(quantity) || 0,
        totalPrice: (Number(unitCost) || 0) * (Number(quantity) || 0),
        minStock: Number(newMinStock) || 5,
        location: newLocation,
        notes: notes.trim() || undefined,
      };

      onStockInSubmit(
        {
          date: new Date(dateStr).toISOString(),
          productId: '', // assigned in handler
          productCode: newCode.trim().toUpperCase(),
          productName: newName.trim(),
          category: newCategory,
          unit: newUnit,
          unitCost: Number(unitCost) || 0,
          quantity: Number(quantity) || 0,
          totalCost,
          receiverName: receiverName.trim(),
          supplier: supplier.trim() || '-',
          documentNo: documentNo.trim() || '-',
          notes: notes.trim() || undefined,
        },
        true,
        newProductData
      );
    }

    // Feedback & Reset
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

    setQuantity(1);
    setSupplier('');
    setDocumentNo('');
    setNotes('');
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold tracking-wider uppercase font-mono">
              STOCK IN / RECEIVE GOODS
            </span>
            <span className="text-xs text-emerald-200">บันทึกรับเข้าและเพิ่มสต๊อก</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading">
            หน้าระบบรับเข้าสินค้าและพัสดุ
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-xl font-body">
            รองรับทั้งการรับเข้าสินค้าเดิม หรือบันทึกสินค้าใหม่พร้อมสแกนคิวอาร์โค้ด คำนวณมูลค่าซื้อรวมอัตโนมัติ
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenScanner}
          className="px-5 py-3 bg-white text-emerald-950 hover:bg-emerald-50 rounded-2xl font-semibold text-xs shadow-lg transition flex items-center gap-2 self-stretch md:self-auto justify-center"
        >
          <QrCode className="w-4 h-4 text-emerald-700" />
          <span>สแกน QR / บาร์โค้ดรับเข้า</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs">
          {/* Mode Switcher */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2 font-heading">
              <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
              บันทึกการรับเข้าสินค้า
            </h3>

            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-medium">
              <button
                type="button"
                onClick={() => setMode('EXISTING')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  mode === 'EXISTING'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 font-semibold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                รับเข้าสินค้าเดิม ({products.length})
              </button>
              <button
                type="button"
                onClick={() => setMode('NEW')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                  mode === 'NEW'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 font-semibold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                รับเข้าสินค้าใหม่
              </button>
            </div>
          </div>

          {isSuccessFeedback && (
            <div className="mb-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-3 animate-in fade-in">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold">บันทึกรับเข้าและเพิ่มยอดคงเหลือในสต๊อกเรียบร้อยแล้ว!</p>
                <p className="text-[11px] opacity-80">ข้อมูลพร้อมสำหรับการซิงค์ลง Google Sheet</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 font-body">
            {/* Mode 1: Existing Product */}
            {mode === 'EXISTING' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    1. เลือกสินค้าที่มีในระบบ <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={onOpenScanner}
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    สแกนกล้อง
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="พิมพ์ค้นหารหัสหรือชื่อสินค้า..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>

                  <select
                    id="select-stockin-product"
                    value={selectedProductId}
                    onChange={(e) => handleProductSelect(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="">-- เลือกรายการสินค้าที่ต้องการรับเข้า --</option>
                    {filteredProductOptions.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.code}] {p.name} — คงเหลือ: {p.quantity} {p.unit} (ทุนเดิม: ฿{p.price.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
                {errors.product && <p className="text-xs text-rose-500 mt-1">{errors.product}</p>}

                {/* Info Card */}
                {activeProduct && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300">
                        {activeProduct.code}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 text-slate-700 dark:text-slate-300">
                        {activeProduct.category}
                      </span>
                    </div>
                    <p className="font-semibold text-slate-900 dark:text-white">{activeProduct.name}</p>
                    <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-emerald-200/50">
                      <span>คงเหลือก่อนรับเข้า: <strong className="text-slate-800 dark:text-slate-200 font-mono">{activeProduct.quantity}</strong> {activeProduct.unit}</span>
                      <span>ตำแหน่ง: {activeProduct.location || 'คลังกลาง'}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Mode 2: New Product */
              <div className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-emerald-600" />
                    ข้อมูลสินค้าใหม่ที่ต้องการสร้าง
                  </span>
                  <button
                    type="button"
                    onClick={onOpenScanner}
                    className="text-xs text-emerald-600 hover:underline flex items-center gap-1"
                  >
                    <QrCode className="w-3.5 h-3.5" /> สแกนรหัส
                  </button>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ประเภทสินค้า (6 หมวดหมู่) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ProductCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  >
                    {PRODUCT_CATEGORIES.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name} ({c.codePrefix})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      รหัสสินค้าใหม่ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                      placeholder="เช่น MED-005"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                    />
                    {errors.newCode && <p className="text-xs text-rose-500 mt-0.5">{errors.newCode}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ชื่อสินค้าใหม่ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="เช่น สำลีก้อนปลอดเชื้อ"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                    {errors.newName && <p className="text-xs text-rose-500 mt-0.5">{errors.newName}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      หน่วยนับ
                    </label>
                    <select
                      value={newUnit}
                      onChange={(e) => setNewUnit(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    >
                      {STANDARD_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ตำแหน่งจัดเก็บ
                    </label>
                    <select
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    >
                      {STORAGE_LOCATIONS.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Quantity, Unit Cost, Total Cost */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  จำนวนรับเข้า <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="input-stockin-quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-mono font-bold focus:outline-hidden focus:border-emerald-500"
                  />
                  <span className="text-xs text-slate-500 shrink-0">
                    {mode === 'EXISTING' && activeProduct ? activeProduct.unit : newUnit}
                  </span>
                </div>
                {errors.quantity && <p className="text-xs text-rose-500 mt-1">{errors.quantity}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  ราคาทุนต่อหน่วย (บาท) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="input-stockin-unitcost"
                    type="number"
                    min="0"
                    step="any"
                    value={unitCost}
                    onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-mono focus:outline-hidden focus:border-emerald-500"
                  />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">฿</span>
                </div>
                {errors.unitCost && <p className="text-xs text-rose-500 mt-1">{errors.unitCost}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  ยอดเงินซื้อรวม (บาท)
                </label>
                <div className="px-3.5 py-2 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between h-[42px]">
                  <span className="text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-1 font-medium">
                    <Calculator className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-base font-bold font-mono text-emerald-900 dark:text-emerald-300">
                    ฿{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Receiver Name & Supplier */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  ชื่อผู้รับเข้าพัสดุ <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-stockin-receiver"
                  type="text"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  placeholder="เช่น สมศรี (จนท.พัสดุ)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
                {errors.receiver && <p className="text-xs text-rose-500 mt-1">{errors.receiver}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-slate-400" />
                  ผู้จัดจำหน่าย / Supplier
                </label>
                <input
                  id="input-stockin-supplier"
                  type="text"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="เช่น บจก. สยามเมดิคอล ซัพพลาย"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Document No & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <FileCheck className="w-3.5 h-3.5 text-slate-400" />
                  เลขที่เอกสาร / เลขที่ใบสั่งซื้อ (PO)
                </label>
                <input
                  id="input-stockin-docno"
                  type="text"
                  value={documentNo}
                  onChange={(e) => setDocumentNo(e.target.value)}
                  placeholder="เช่น PO-690822 / INV-0491"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  วันที่และเวลาที่รับเข้า
                </label>
                <input
                  id="input-stockin-date"
                  type="datetime-local"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                หมายเหตุเพิ่มเติม
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="เช่น ใบส่งของรอบที่ 2 หรือ ล็อตผลิต LOT-994"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            {/* Submit */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                id="btn-submit-stockin"
                type="submit"
                className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-semibold text-sm rounded-2xl shadow-lg shadow-emerald-200 dark:shadow-none transition flex items-center justify-center gap-2"
              >
                <ArrowDownLeft className="w-5 h-5" />
                <span>ยืนยันการรับเข้าสินค้า (อัปเดตสต๊อกทันที)</span>
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
                ประวัติการรับเข้าสินค้าล่าสุด
              </h4>
              <span className="text-xs text-slate-500 font-mono">{stockInHistory.length} รายการ</span>
            </div>

            {stockInHistory.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Package className="w-10 h-10 mx-auto text-slate-300 mb-2 opacity-60" />
                <p className="text-xs font-body">ยังไม่มีรายการรับเข้าสินค้าในระบบ</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  เมื่อคุณบันทึกรับเข้า รายการจะแสดงประวัติที่นี่
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
                {stockInHistory.slice(0, 10).map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 space-y-1.5 text-xs font-body"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/60 px-2 py-0.5 rounded text-[11px]">
                        {item.productCode}
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        ฿{item.totalCost.toLocaleString()}
                      </span>
                    </div>

                    <p className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                      {item.productName}
                    </p>

                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span>รับเข้า: <strong className="text-slate-800 dark:text-slate-200 font-mono">{item.quantity}</strong> {item.unit}</span>
                      <span>ทุน/หน่วย: ฿{item.unitCost.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-700/50 text-[10px] text-slate-400">
                      <span>{item.supplier && item.supplier !== '-' ? item.supplier : 'ไม่ระบุผู้ขาย'}</span>
                      <span>{new Date(item.date).toLocaleDateString('th-TH')}</span>
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
