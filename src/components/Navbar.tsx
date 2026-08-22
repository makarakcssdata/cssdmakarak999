import React from 'react';
import {
  Package,
  QrCode,
  FileSpreadsheet,
  Globe,
  RefreshCw,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  BarChart3,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ActiveTab, GoogleSheetConfig, UserProfile } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenScanner: () => void;
  onOpenAddProduct: () => void;
  onOpenEmbedModal: () => void;
  sheetConfig: GoogleSheetConfig;
  userProfile: UserProfile;
  isSyncing: boolean;
  totalProductsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenScanner,
  onOpenAddProduct,
  onOpenEmbedModal,
  sheetConfig,
  userProfile,
  isSyncing,
  totalProductsCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className="flex items-center gap-3 text-left group"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight font-heading">
                    Inventory CSSD Makarak
                  </h1>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-body">
                  ระบบจัดการสต๊อกสินค้าและพัสดุ
                </p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl">
            <button
              id="nav-tab-products"
              type="button"
              onClick={() => setActiveTab('products')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'products'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>สต๊อกสินค้า</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 font-mono">
                {totalProductsCount}
              </span>
            </button>

            <button
              id="nav-tab-stockout"
              type="button"
              onClick={() => setActiveTab('stock-out')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'stock-out'
                  ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>เบิกสินค้า</span>
            </button>

            <button
              id="nav-tab-stockin"
              type="button"
              onClick={() => setActiveTab('stock-in')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'stock-in'
                  ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-400 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>รับเข้าสินค้า</span>
            </button>

            <button
              id="nav-tab-reports"
              type="button"
              onClick={() => setActiveTab('reports')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'reports'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>รายงานวิเคราะห์</span>
            </button>
          </nav>

          {/* Right Action Icons: QR Scanner, Google Sheets sync, Embed */}
          <div className="flex items-center gap-2">
            {/* QR Scanner trigger */}
            <button
              id="btn-nav-scan-qr"
              type="button"
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-semibold border border-emerald-200 dark:border-emerald-800 transition"
              title="เปิดกล้องสแกน QR Code / บาร์โค้ด"
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">สแกน QR</span>
            </button>

            {/* Google Sheets / Embed modal trigger */}
            <button
              id="btn-nav-google-sync"
              type="button"
              onClick={onOpenEmbedModal}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 transition"
              title="ตั้งค่าเชื่อมต่อ Google Sheets & โค้ดฝัง Google Sites"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Google Sheets & Sites</span>
              {sheetConfig.lastSyncedAt && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
