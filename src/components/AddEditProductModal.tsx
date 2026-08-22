import React, { useState, useEffect } from 'react';
import { X, Sparkles, Package, Calculator, MapPin, Layers, FileText } from 'lucide-react';
import { Product, ProductCategory, PRODUCT_CATEGORIES } from '../types';
import { STANDARD_UNITS, STORAGE_LOCATIONS } from '../constants/departments';

interface AddEditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => void;
  editingProduct?: Product | null;
  existingProducts: Product[];
}

export const AddEditProductModal: React.FC<AddEditProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingProduct,
  existingProducts,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('วัสดุการแพทย์');
  const [unit, setUnit] = useState('ชิ้น');
  const [customUnit, setCustomUnit] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(5);
  const [location, setLocation] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Auto calculate total price
  const totalPrice = Math.max(0, (Number(price) || 0) * (Number(quantity) || 0));

  // Initialize or reset form values
  useEffect(() => {
    if (editingProduct) {
      setCode(editingProduct.code);
      setName(editingProduct.name);
      setCategory(editingProduct.category);
      if (STANDARD_UNITS.includes(editingProduct.unit as (typeof STANDARD_UNITS)[number])) {
        setUnit(editingProduct.unit);
        setCustomUnit('');
      } else {
        setUnit('custom');
        setCustomUnit(editingProduct.unit);
      }
      setPrice(editingProduct.price);
      setQuantity(editingProduct.quantity);
      setMinStock(editingProduct.minStock ?? 5);
      if (STORAGE_LOCATIONS.includes(editingProduct.location as (typeof STORAGE_LOCATIONS)[number])) {
        setLocation(editingProduct.location || '');
        setCustomLocation('');
      } else {
        setLocation('custom');
        setCustomLocation(editingProduct.location || '');
      }
      setNotes(editingProduct.notes || '');
    } else {
      // New product defaults
      generateAutoCode('วัสดุการแพทย์');
      setName('');
      setCategory('วัสดุการแพทย์');
      setUnit('ชิ้น');
      setCustomUnit('');
      setPrice(0);
      setQuantity(0);
      setMinStock(5);
      setLocation(STORAGE_LOCATIONS[0]);
      setCustomLocation('');
      setNotes('');
    }
    setErrors({});
  }, [editingProduct, isOpen]);

  // Generate prefix-based automatic SKU code
  const generateAutoCode = (catName: ProductCategory) => {
    const catConfig = PRODUCT_CATEGORIES.find((c) => c.name === catName);
    const prefix = catConfig ? catConfig.codePrefix : 'SKU';
    
    // Find next available integer
    const matchingCodes = existingProducts
      .filter((p) => p.category === catName && p.code.startsWith(prefix))
      .map((p) => {
        const numPart = p.code.replace(prefix + '-', '').replace(prefix, '');
        return parseInt(numPart, 10);
      })
      .filter((n) => !isNaN(n));

    const maxNum = matchingCodes.length > 0 ? Math.max(...matchingCodes) : 0;
    const nextNum = (maxNum + 1).toString().padStart(3, '0');
    setCode(`${prefix}-${nextNum}`);
  };

  const handleCategoryChange = (newCategory: ProductCategory) => {
    setCategory(newCategory);
    // If user hasn't typed custom code, auto generate
    if (!editingProduct) {
      generateAutoCode(newCategory);
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!code.trim()) newErrors.code = 'กรุณาระบุรหัสสินค้า';
    if (!name.trim()) newErrors.name = 'กรุณาระบุชื่อสินค้า';
    if (price < 0) newErrors.price = 'ราคาต้องไม่ติดลบ';
    if (quantity < 0) newErrors.quantity = 'จำนวนต้องไม่ติดลบ';

    // Duplicate check for new items or edited codes
    const isDuplicate = existingProducts.some(
      (p) => p.code.trim().toUpperCase() === code.trim().toUpperCase() && p.id !== editingProduct?.id
    );
    if (isDuplicate) {
      newErrors.code = 'รหัสสินค้านี้มีอยู่ในระบบแล้ว';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const finalUnit = unit === 'custom' ? customUnit.trim() || 'ชิ้น' : unit;
    const finalLocation = location === 'custom' ? customLocation.trim() : location;

    onSave(
      {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        category,
        unit: finalUnit,
        price: Number(price) || 0,
        quantity: Number(quantity) || 0,
        totalPrice,
        minStock: Number(minStock) || 0,
        location: finalLocation || undefined,
        notes: notes.trim() || undefined,
      },
      editingProduct?.id
    );
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div
        id="add-edit-product-modal"
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-auto"
      >
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white font-heading">
                {editingProduct ? 'แก้ไขข้อมูลสินค้า' : 'เพิ่มสินค้าใหม่เข้าสต๊อก'}
              </h3>
              <p className="text-xs text-slate-500 font-body">
                กรอกรายละเอียดสินค้าตามมาตรฐาน 6 หมวดหมู่พัสดุ
              </p>
            </div>
          </div>
          <button
            id="btn-close-add-product"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto font-body">
          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              ประเภทสินค้า (6 หมวดหมู่มาตรฐาน) <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRODUCT_CATEGORIES.map((cat) => {
                const isSelected = category === cat.name;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => handleCategoryChange(cat.name)}
                    className={`p-2.5 rounded-xl text-left border text-xs font-medium transition flex items-center justify-between ${
                      isSelected
                        ? `${cat.bgColor} ${cat.borderColor} ${cat.color} font-semibold ring-2 ring-emerald-500/20`
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-[10px] font-mono opacity-70 px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10">
                      {cat.codePrefix}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Code & Auto Gen */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  รหัสสินค้า (SKU / Barcode) <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => generateAutoCode(category)}
                  className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <Sparkles className="w-3 h-3" />
                  สร้างรหัสอัตโนมัติ
                </button>
              </div>
              <input
                id="input-product-code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="เช่น MED-001"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 ${
                  errors.code
                    ? 'border-rose-400 focus:border-rose-500'
                    : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500'
                }`}
              />
              {errors.code && <p className="text-xs text-rose-500 mt-1">{errors.code}</p>}
            </div>

            {/* Product Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                ชื่อสินค้า / รายการพัสดุ <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-product-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น ถุงมือตรวจโรคปลอดเชื้อ เบอร์ 7"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 ${
                  errors.name
                    ? 'border-rose-400 focus:border-rose-500'
                    : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500'
                }`}
              />
              {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
            </div>
          </div>

          {/* Unit, Price, Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Unit */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                หน่วยนับ <span className="text-rose-500">*</span>
              </label>
              <select
                id="select-product-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
              >
                {STANDARD_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
                <option value="custom">ระบุหน่วยอื่นๆ...</option>
              </select>
              {unit === 'custom' && (
                <input
                  type="text"
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  placeholder="พิมพ์หน่วยนับ"
                  className="mt-2 w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              )}
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                ราคาต่อหน่วย (บาท) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="input-product-price"
                  type="number"
                  min="0"
                  step="any"
                  value={price === 0 && editingProduct ? '' : price}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 font-mono"
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">฿</span>
              </div>
              {errors.price && <p className="text-xs text-rose-500 mt-1">{errors.price}</p>}
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                จำนวนคงเหลือ <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-product-quantity"
                type="number"
                min="0"
                value={quantity === 0 && editingProduct ? '' : quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
                placeholder="0"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 font-mono"
              />
              {errors.quantity && <p className="text-xs text-rose-500 mt-1">{errors.quantity}</p>}
            </div>
          </div>

          {/* Auto-Calculated Total Price Highlight Banner */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <Calculator className="w-4 h-4" />
              <span className="text-xs font-medium">รวมราคามูลค่าสต๊อก (จำนวน × ราคา):</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400">
                ฿{totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-slate-500 ml-1">บาท</span>
            </div>
          </div>

          {/* Reorder point & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                จุดสั่งซื้อขั้นต่ำ (Reorder Point)
              </label>
              <input
                id="input-product-minstock"
                type="number"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(parseInt(e.target.value, 10) || 0)}
                placeholder="5"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">เตือนเมื่อสินค้าเหลือน้อยกว่าจำนวนนี้</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                ตำแหน่งจัดเก็บ / ชั้นวาง
              </label>
              <select
                id="select-product-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
              >
                {STORAGE_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
                <option value="custom">ระบุตำแหน่งอื่นๆ...</option>
              </select>
              {location === 'custom' && (
                <input
                  type="text"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  placeholder="เช่น ตู้กระจก A3 หรือ คลังย่อย 2"
                  className="mt-2 w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              หมายเหตุ / รายละเอียดเพิ่มเติม
            </label>
            <textarea
              id="textarea-product-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="เช่น สำหรับใช้เฉพาะเคส OR หรือสั่งซื้อจากบริษัท ก..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              id="btn-cancel-add-product"
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
            >
              ยกเลิก
            </button>
            <button
              id="btn-save-product-submit"
              type="submit"
              className="px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs shadow-emerald-200 dark:shadow-none transition flex items-center gap-2"
            >
              <Package className="w-4 h-4" />
              {editingProduct ? 'บันทึกการแก้ไข' : 'บันทึกเข้าสต๊อก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
