import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  QrCode,
  Edit2,
  Trash2,
  AlertTriangle,
  Package,
  Layers,
  Filter,
  RefreshCw,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { Product, ProductCategory, PRODUCT_CATEGORIES } from '../types';

interface ProductManagementProps {
  products: Product[];
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  onQuickStockOut: (product: Product) => void;
  onQuickStockIn: (product: Product) => void;
  onViewQr: (product: Product) => void;
  onOpenScanner: () => void;
  onSeedSampleData: () => void;
  onClearAllData: () => void;
}

export const ProductManagement: React.FC<ProductManagementProps> = ({
  products,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onQuickStockOut,
  onQuickStockIn,
  onViewQr,
  onOpenScanner,
  onSeedSampleData,
  onClearAllData,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'NORMAL' | 'LOW' | 'OUT'>('ALL');

  // Filtered list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (selectedStatus === 'OUT' && p.quantity > 0) return false;
      if (selectedStatus === 'LOW' && (p.quantity === 0 || p.quantity > p.minStock)) return false;
      if (selectedStatus === 'NORMAL' && (p.quantity === 0 || p.quantity <= p.minStock)) return false;

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.code.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.location && p.location.toLowerCase().includes(q)) ||
        (p.notes && p.notes.toLowerCase().includes(q))
      );
    });
  }, [products, searchQuery, selectedCategory, selectedStatus]);

  // Quick stats calculation
  const totalStockValue = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.totalPrice || p.quantity * p.price), 0);
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.quantity > 0 && p.quantity <= p.minStock).length;
  }, [products]);

  const outOfStockCount = useMemo(() => {
    return products.filter((p) => p.quantity === 0).length;
  }, [products]);

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Top Banner & KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total SKUs */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-medium font-body">รายการสินค้าทั้งหมด</span>
            <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {products.length}
            </span>
            <span className="text-xs text-slate-500">SKU</span>
          </div>
        </div>

        {/* Total Stock Value */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-medium font-body">มูลค่าสต๊อกคงเหลือรวม</span>
            <span className="text-xs font-bold text-emerald-600 font-mono">THB</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
              ฿{totalStockValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        {/* Low Stock Warning */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-medium font-body">สินค้าใกล้หมด (Reorder)</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-bold font-mono ${lowStockCount > 0 ? 'text-amber-600' : 'text-slate-700 dark:text-slate-300'}`}>
              {lowStockCount}
            </span>
            <span className="text-xs text-slate-500">รายการ</span>
          </div>
        </div>

        {/* Out of Stock Warning */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-medium font-body">สินค้าหมดสต๊อก</span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-bold font-mono ${outOfStockCount > 0 ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}`}>
              {outOfStockCount}
            </span>
            <span className="text-xs text-slate-500">รายการ</span>
          </div>
        </div>
      </div>

      {/* Action Header & Control Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        {/* Top Controls: Search, QR Scanner, Add Product */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="input-search-product"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหารหัส, ชื่อสินค้า, หมวดหมู่, หรือตำแหน่งจัดเก็บ..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-body"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ล้าง
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              id="btn-open-scanner-pm"
              type="button"
              onClick={onOpenScanner}
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition"
              title="สแกน QR / บาร์โค้ด"
            >
              <QrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">สแกนกล้อง</span>
            </button>

            <button
              id="btn-add-new-product"
              type="button"
              onClick={onAddProduct}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs shadow-emerald-200 dark:shadow-none transition"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มสินค้าใหม่</span>
            </button>
          </div>
        </div>

        {/* Category Pills Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
              selectedCategory === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <span>ทั้งหมด</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/20">
              {products.length}
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
                className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition flex items-center gap-1.5 border ${
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

        {/* Status Filters & Item Count */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-slate-400 mr-1 flex items-center gap-1 font-body">
              <Filter className="w-3.5 h-3.5" /> สถานะ:
            </span>
            <button
              type="button"
              onClick={() => setSelectedStatus('ALL')}
              className={`px-2.5 py-1 rounded-lg transition ${
                selectedStatus === 'ALL'
                  ? 'bg-emerald-100 text-emerald-800 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400'
              }`}
            >
              ทั้งหมด ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus('NORMAL')}
              className={`px-2.5 py-1 rounded-lg transition ${
                selectedStatus === 'NORMAL'
                  ? 'bg-emerald-100 text-emerald-800 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400'
              }`}
            >
              ปกติ
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus('LOW')}
              className={`px-2.5 py-1 rounded-lg transition ${
                selectedStatus === 'LOW'
                  ? 'bg-amber-100 text-amber-800 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400'
              }`}
            >
              ใกล้หมด ({lowStockCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus('OUT')}
              className={`px-2.5 py-1 rounded-lg transition ${
                selectedStatus === 'OUT'
                  ? 'bg-rose-100 text-rose-800 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400'
              }`}
            >
              หมด ({outOfStockCount})
            </button>
          </div>

          <div className="text-slate-400 font-body">
            แสดง {filteredProducts.length} จากทั้งหมด {products.length} รายการ
          </div>
        </div>
      </div>

      {/* Main Content Area: Table / Cards */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-4">
            <Package className="w-8 h-8" />
          </div>
          {products.length === 0 ? (
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white font-heading">
                ยังไม่มีข้อมูลสินค้าในคลังสต๊อก
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 font-body">
                ระบบเริ่มต้นด้วยคลังสินค้าว่างเพื่อให้คุณบันทึก SKU แรกของคุณ หรือคลิกปุ่มด้านล่างเพื่อทดลองโหลดตัวอย่างข้อมูล
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onAddProduct}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  เพิ่มสินค้าชิ้นแรก
                </button>
                <button
                  type="button"
                  onClick={onSeedSampleData}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  ทดลองโหลดตัวอย่างข้อมูลสต๊อก
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white font-heading">
                ไม่พบรายการสินค้าที่ตรงกับเงื่อนไขการค้นหา
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-body">ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่น</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                  setSelectedStatus('ALL');
                }}
                className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-xl transition"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View (Hidden on mobile) */}
          <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-body">
                <thead className="bg-slate-50/90 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">รหัสสินค้า</th>
                    <th className="py-3 px-4">ชื่อสินค้า / รายการ</th>
                    <th className="py-3 px-4">ประเภทสินค้า</th>
                    <th className="py-3 px-4 text-right">ราคาต่อหน่วย</th>
                    <th className="py-3 px-4 text-center">คงเหลือ</th>
                    <th className="py-3 px-4 text-right">รวมมูลค่า (บาท)</th>
                    <th className="py-3 px-4">ตำแหน่งจัดเก็บ</th>
                    <th className="py-3 px-4 text-center">สถานะ</th>
                    <th className="py-3 px-4 text-center">ปุ่มลัด</th>
                    <th className="py-3 px-4 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredProducts.map((p) => {
                    const catConfig = PRODUCT_CATEGORIES.find((c) => c.name === p.category);
                    const isOutOfStock = p.quantity === 0;
                    const isLowStock = p.quantity > 0 && p.quantity <= p.minStock;
                    const rowTotal = p.totalPrice || p.quantity * p.price;

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition group"
                      >
                        {/* SKU */}
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => onViewQr(p)}
                            className="font-mono font-bold text-slate-800 dark:text-slate-200 hover:text-emerald-600 flex items-center gap-1.5 group/code"
                            title="คลิกเพื่อดูและพิมพ์ QR Code"
                          >
                            <QrCode className="w-3.5 h-3.5 text-slate-400 group-hover/code:text-emerald-600 transition" />
                            <span>{p.code}</span>
                          </button>
                        </td>

                        {/* Name */}
                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                            {p.name}
                          </div>
                          {p.notes && (
                            <div className="text-[11px] text-slate-400 line-clamp-1">{p.notes}</div>
                          )}
                        </td>

                        {/* Category Badge */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                              catConfig?.badgeBg || 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {p.category}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                          ฿{p.price.toLocaleString(undefined, { minimumFractionDigits: 2 })} / {p.unit}
                        </td>

                        {/* Quantity */}
                        <td className="py-3 px-4 text-center font-mono">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-lg font-bold text-xs ${
                              isOutOfStock
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                                : isLowStock
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                                : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                            }`}
                          >
                            {p.quantity} {p.unit}
                          </span>
                        </td>

                        {/* Total Price */}
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          ฿{rowTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>

                        {/* Location */}
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[120px]">{p.location || '-'}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-center">
                          {isOutOfStock ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              หมดสต๊อก
                            </span>
                          ) : isLowStock ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              ใกล้หมด (&le; {p.minStock})
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ปกติ
                            </span>
                          )}
                        </td>

                        {/* Quick Stock Out / In Buttons */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onQuickStockOut(p)}
                              disabled={isOutOfStock}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-[11px] font-medium transition flex items-center gap-0.5 border border-amber-200/80"
                              title="เบิกด่วน"
                            >
                              <ArrowUpRight className="w-3 h-3" />
                              <span>เบิก</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onQuickStockIn(p)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-medium transition flex items-center gap-0.5 border border-emerald-200/80"
                              title="รับเข้าด่วน"
                            >
                              <ArrowDownLeft className="w-3 h-3" />
                              <span>รับ</span>
                            </button>
                          </div>
                        </td>

                        {/* Actions (QR, Edit, Delete) */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => onViewQr(p)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                              title="พิมพ์ป้าย QR Code"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onEditProduct(p)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                              title="แก้ไขข้อมูล"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteProduct(p)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                              title="ลบสินค้า"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Responsive Cards (Visible on mobile/tablet) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:hidden">
            {filteredProducts.map((p) => {
              const catConfig = PRODUCT_CATEGORIES.find((c) => c.name === p.category);
              const isOutOfStock = p.quantity === 0;
              const isLowStock = p.quantity > 0 && p.quantity <= p.minStock;
              const rowTotal = p.totalPrice || p.quantity * p.price;

              return (
                <div
                  key={p.id}
                  className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3"
                >
                  {/* Card Top: Code, Category, QR button */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md">
                        {p.code}
                      </span>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-md font-medium border ${
                          catConfig?.badgeBg || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {p.category}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onViewQr(p)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="ดู QR Code"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Product Name */}
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white font-heading">
                    {p.name}
                  </h4>

                  {/* Stock, Price, Total Price Grid */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl text-center text-xs font-body">
                    <div>
                      <span className="text-[10px] text-slate-400 block">คงเหลือ</span>
                      <span
                        className={`font-bold font-mono text-sm ${
                          isOutOfStock
                            ? 'text-rose-600'
                            : isLowStock
                            ? 'text-amber-600'
                            : 'text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {p.quantity} {p.unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">ราคา/หน่วย</span>
                      <span className="font-semibold font-mono text-slate-700 dark:text-slate-300">
                        ฿{p.price.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">รวมมูลค่า</span>
                      <span className="font-bold font-mono text-slate-900 dark:text-white">
                        ฿{rowTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Location & Status Badge */}
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1 truncate max-w-[180px]">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {p.location || 'คลังกลาง'}
                    </span>
                    {isOutOfStock ? (
                      <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        หมดสต๊อก
                      </span>
                    ) : isLowStock ? (
                      <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        เตือนสั่งซื้อ (&le; {p.minStock})
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        สถานะปกติ
                      </span>
                    )}
                  </div>

                  {/* Actions & Quick Buttons */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-1">
                      <button
                        type="button"
                        onClick={() => onQuickStockOut(p)}
                        disabled={isOutOfStock}
                        className="flex-1 py-1.5 bg-amber-50 hover:bg-amber-100 disabled:opacity-30 text-amber-700 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 border border-amber-200"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        เบิกด่วน
                      </button>
                      <button
                        type="button"
                        onClick={() => onQuickStockIn(p)}
                        className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 border border-emerald-200"
                      >
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                        รับเข้า
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEditProduct(p)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 bg-slate-100 dark:bg-slate-800 rounded-lg transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteProduct(p)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 bg-slate-100 dark:bg-slate-800 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Data Tools & Reset Section */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200/80 dark:border-slate-800 text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSeedSampleData}
            className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 flex items-center gap-1 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            โหลดชุดข้อมูลตัวอย่าง
          </button>
        </div>

        <button
          type="button"
          onClick={onClearAllData}
          className="text-rose-500 hover:text-rose-700 hover:underline flex items-center gap-1 transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
          ล้างข้อมูลสินค้าทั้งหมดในระบบ (Clear All)
        </button>
      </div>
    </div>
  );
};
