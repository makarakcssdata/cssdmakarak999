import React from 'react';
import { Package, ArrowUpRight, ArrowDownLeft, BarChart3, QrCode, Globe } from 'lucide-react';
import { ActiveTab } from '../types';

interface MobileNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenScanner: () => void;
  onOpenEmbedModal: () => void;
  totalProductsCount: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenScanner,
  onOpenEmbedModal,
  totalProductsCount,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 lg:hidden px-2 py-1 shadow-lg">
      <div className="grid grid-cols-5 gap-1">
        {/* Products */}
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`flex flex-col items-center justify-center py-2 rounded-xl transition ${
            activeTab === 'products'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <Package className="w-5 h-5" />
            {totalProductsCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-emerald-500 text-white font-mono text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {totalProductsCount > 99 ? '99+' : totalProductsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 font-body">สต๊อก</span>
        </button>

        {/* Stock Out */}
        <button
          type="button"
          onClick={() => setActiveTab('stock-out')}
          className={`flex flex-col items-center justify-center py-2 rounded-xl transition ${
            activeTab === 'stock-out'
              ? 'text-amber-600 dark:text-amber-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <ArrowUpRight className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-body">เบิกสินค้า</span>
        </button>

        {/* Floating Center Scan Button */}
        <button
          type="button"
          onClick={onOpenScanner}
          className="flex flex-col items-center justify-center -mt-4"
        >
          <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition">
            <QrCode className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5 font-body">
            สแกน QR
          </span>
        </button>

        {/* Stock In */}
        <button
          type="button"
          onClick={() => setActiveTab('stock-in')}
          className={`flex flex-col items-center justify-center py-2 rounded-xl transition ${
            activeTab === 'stock-in'
              ? 'text-teal-600 dark:text-teal-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <ArrowDownLeft className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-body">รับเข้า</span>
        </button>

        {/* Reports */}
        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`flex flex-col items-center justify-center py-2 rounded-xl transition ${
            activeTab === 'reports'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-body">รายงาน</span>
        </button>
      </div>
    </div>
  );
};
