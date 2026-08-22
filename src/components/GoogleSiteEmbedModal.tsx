import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Globe,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Layers,
  Code2,
  HelpCircle,
} from 'lucide-react';
import { GoogleSheetConfig, UserProfile, Product, StockInTransaction, StockOutTransaction } from '../types';

interface GoogleSiteEmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GoogleSheetConfig;
  userProfile: UserProfile;
  products: Product[];
  stockIn: StockInTransaction[];
  stockOut: StockOutTransaction[];
  onLoginGoogle: () => void;
  onCreateNewSheet: () => void;
  onManualSync: () => void;
  onSaveConfig: (newConfig: GoogleSheetConfig) => void;
  isSyncing: boolean;
}

export const GoogleSiteEmbedModal: React.FC<GoogleSiteEmbedModalProps> = ({
  isOpen,
  onClose,
  config,
  userProfile,
  products,
  stockIn,
  stockOut,
  onLoginGoogle,
  onCreateNewSheet,
  onManualSync,
  onSaveConfig,
  isSyncing,
}) => {
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [copiedAppScript, setCopiedAppScript] = useState(false);
  const [activeTab, setActiveTab] = useState<'SHEETS' | 'EMBED_CODE' | 'APPS_SCRIPT'>('SHEETS');

  const [spreadsheetIdInput, setSpreadsheetIdInput] = useState(config.spreadsheetId || '');
  const [appsScriptUrlInput, setAppsScriptUrlInput] = useState(config.appsScriptUrl || '');
  const [autoSyncChecked, setAutoSyncChecked] = useState(config.autoSync ?? true);

  const currentAppUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-inventory-app.web.app';

  // Responsive Google Sites iFrame snippet
  const embedCodeSnippet = `<div style="position: relative; width: 100%; height: 100vh; min-height: 800px; overflow: hidden; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
  <iframe
    src="${currentAppUrl}"
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
    allow="camera; microphone; clipboard-read; clipboard-write;"
    loading="lazy"
    title="Inventory CSSD Makarak - ระบบจัดการสต๊อกสินค้า">
  </iframe>
</div>`;

  // Optional Apps Script code snippet for Webhook direct sync
  const appsScriptSnippet = `/**
 * Google Apps Script Web App for Inventory CSSD Makarak
 * 1. Open your Google Sheet -> Extensions -> Apps Script
 * 2. Paste this code -> Deploy -> New Deployment -> Web App (Execute as: Me, Who has access: Anyone)
 */
function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (data.action === "syncAll") {
    // 1. Write Products
    var prodSheet = ss.getSheetByName("Products") || ss.insertSheet("Products");
    prodSheet.clear();
    prodSheet.appendRow(["รหัสสินค้า", "ชื่อสินค้า", "ประเภทสินค้า", "หน่วย", "ราคาต่อหน่วย", "จำนวนคงเหลือ", "รวมมูลค่า", "จุดสั่งซื้อขั้นต่ำ", "ตำแหน่งจัดเก็บ", "หมายเหตุ"]);
    data.products.forEach(function(p) {
      prodSheet.appendRow([p.code, p.name, p.category, p.unit, p.price, p.quantity, p.quantity * p.price, p.minStock, p.location, p.notes]);
    });

    // 2. Write StockIn
    var inSheet = ss.getSheetByName("StockIn") || ss.insertSheet("StockIn");
    inSheet.clear();
    inSheet.appendRow(["รหัสรายการ", "วันที่-เวลา", "รหัสสินค้า", "ชื่อสินค้า", "ประเภท", "จำนวนรับ", "หน่วย", "ทุนต่อหน่วย", "ยอดเงินรวม", "ผู้รับเข้า", "Supplier", "เลขที่ PO"]);
    data.stockIn.forEach(function(i) {
      inSheet.appendRow([i.id, i.date, i.productCode, i.productName, i.category, i.quantity, i.unit, i.unitCost, i.totalCost, i.receiverName, i.supplier, i.documentNo]);
    });

    // 3. Write StockOut
    var outSheet = ss.getSheetByName("StockOut") || ss.insertSheet("StockOut");
    outSheet.clear();
    outSheet.appendRow(["รหัสรายการ", "วันที่-เวลา", "รหัสสินค้า", "ชื่อสินค้า", "ประเภท", "จำนวนเบิก", "หน่วย", "ราคาต่อหน่วย", "ยอดเงินเบิก", "ผู้เบิก", "แผนก/ฝ่าย", "วัตถุประสงค์"]);
    data.stockOut.forEach(function(o) {
      outSheet.appendRow([o.id, o.date, o.productCode, o.productName, o.category, o.quantity, o.unit, o.price, o.totalAmount, o.recipientName, o.department, o.purpose]);
    });

    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCodeSnippet);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  const handleCopyAppsScript = () => {
    navigator.clipboard.writeText(appsScriptSnippet);
    setCopiedAppScript(true);
    setTimeout(() => setCopiedAppScript(false), 2000);
  };

  const handleSaveConfigSettings = () => {
    let finalUrl = config.spreadsheetUrl;
    if (spreadsheetIdInput.trim() && !finalUrl) {
      finalUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetIdInput.trim()}/edit`;
    }
    onSaveConfig({
      ...config,
      spreadsheetId: spreadsheetIdInput.trim(),
      spreadsheetUrl: finalUrl,
      appsScriptUrl: appsScriptUrlInput.trim(),
      autoSync: autoSyncChecked,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div
        id="google-site-embed-modal"
        className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-auto max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white font-heading">
                การเชื่อมต่อ Google Sheets & โค้ดฝัง Google Site
              </h3>
              <p className="text-xs text-slate-500 font-body">
                ระบบจัดการสต๊อกคลังพัสดุและเวชภัณฑ์ Inventory CSSD Makarak
              </p>
            </div>
          </div>
          <button
            id="btn-close-embed-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center px-6 pt-3 border-b border-slate-100 dark:border-slate-800 gap-2 bg-slate-50/30 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('SHEETS')}
            className={`pb-3 px-3 border-b-2 transition flex items-center gap-2 ${
              activeTab === 'SHEETS'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>เชื่อมต่อ Google Sheets</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('EMBED_CODE')}
            className={`pb-3 px-3 border-b-2 transition flex items-center gap-2 ${
              activeTab === 'EMBED_CODE'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>โค้ดฝังใน Google Sites (Embed HTML)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('APPS_SCRIPT')}
            className={`pb-3 px-3 border-b-2 transition flex items-center gap-2 ${
              activeTab === 'APPS_SCRIPT'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Apps Script Sync URL</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 font-body">
          {/* TAB 1: GOOGLE SHEETS */}
          {activeTab === 'SHEETS' && (
            <div className="space-y-5">
              {/* Account status */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                    {userProfile.name ? userProfile.name.charAt(0) : 'G'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {userProfile.name || 'Google Account (มาตรฐาน Google Workspace)'}
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full font-medium">
                        เชื่อมต่อแล้ว
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {userProfile.email || 'makarak.cssdata@gmail.com'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onLoginGoogle}
                  className="px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-100 transition shadow-xs flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  ขอสิทธิ์การเข้าถึง Sheets ใหม่
                </button>
              </div>

              {/* Spreadsheets Section */}
              <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 font-heading">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      Google Spreadsheet คลังสินค้า
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      แยก 3 แท็บอัตโนมัติ: <strong>Products</strong> (สินค้า), <strong>StockIn</strong> (รับเข้า), <strong>StockOut</strong> (เบิกออก)
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onCreateNewSheet}
                      disabled={isSyncing}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      สร้าง Google Sheet ใหม่ใน Drive
                    </button>
                  </div>
                </div>

                {config.spreadsheetUrl && (
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                    <div className="truncate text-xs">
                      <span className="text-slate-400 mr-2 font-medium">ลิงก์ชีตปัจจุบัน:</span>
                      <a
                        href={config.spreadsheetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 dark:text-emerald-400 font-medium hover:underline inline-flex items-center gap-1"
                      >
                        {config.sheetTitle || 'Inventory CSSD Makarak'}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <a
                      href={config.spreadsheetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg transition shrink-0"
                    >
                      เปิดชีต
                    </a>
                  </div>
                )}

                {/* Manual Sync Button & Last Synced */}
                <div className="flex items-center justify-between pt-2 border-t border-emerald-200/50 text-xs">
                  <span className="text-slate-500">
                    ซิงค์ล่าสุด:{' '}
                    <strong className="font-mono text-slate-700 dark:text-slate-300">
                      {config.lastSyncedAt
                        ? new Date(config.lastSyncedAt).toLocaleString('th-TH')
                        : 'ยังไม่เคยซิงค์'}
                    </strong>
                  </span>

                  <button
                    id="btn-manual-sync-now"
                    type="button"
                    onClick={onManualSync}
                    disabled={isSyncing}
                    className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl transition flex items-center gap-1.5 shadow-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'กำลังซิงค์ข้อมูล...' : 'กดซิงค์ข้อมูลเดี๋ยวนี้ (Sync Now)'}
                  </button>
                </div>
              </div>

              {/* Manual Spreadsheet ID Input */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  หรือระบุ Spreadsheet ID ของ Google Sheet ที่มีอยู่เดิม:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={spreadsheetIdInput}
                    onChange={(e) => setSpreadsheetIdInput(e.target.value)}
                    placeholder="เช่น 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleSaveConfigSettings}
                    className="px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition"
                  >
                    บันทึกการตั้งค่า
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EMBED HTML CODE FOR GOOGLE SITES */}
          {activeTab === 'EMBED_CODE' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-300 space-y-2">
                <h4 className="font-bold flex items-center gap-1.5 text-sm font-heading">
                  <Globe className="w-4 h-4 text-blue-600" />
                  วิธีนำ WebApp ไปฝังลงใน Google Sites (Step-by-Step):
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 pl-1 leading-relaxed font-body">
                  <li>เปิดเว็บไซต์ <strong>Google Sites</strong> ของคุณในโหมดแก้ไข</li>
                  <li>ที่แถบเมนูด้านขวา เลือกเมนู <strong>แทรก (Insert)</strong> &rarr; คลิก <strong>ฝัง (Embed / &lt;&gt;)</strong></li>
                  <li>เลือกแท็บ <strong>ฝังโค้ด (Embed code)</strong></li>
                  <li>คัดลอกโค้ด HTML ด้านล่างนี้ไปวาง แล้วกด <strong>ถัดไป (Next)</strong> &rarr; <strong>แทรก (Insert)</strong></li>
                  <li>ปรับขนาดกรอบบนหน้า Google Sites ให้กว้างเต็มหน้าจอตามต้องการ แล้วกด <strong>เผยแพร่ (Publish)</strong></li>
                </ol>
              </div>

              {/* Code block with copy button */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    โค้ด HTML iFrame แบบ Responsive:
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyEmbed}
                    className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                  >
                    {copiedEmbed ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedEmbed ? 'คัดลอกแล้ว!' : 'คัดลอกโค้ด HTML'}
                  </button>
                </div>

                <div className="relative bg-slate-900 text-slate-200 p-4 rounded-2xl font-mono text-xs overflow-x-auto border border-slate-800 max-h-[160px]">
                  <pre>{embedCodeSnippet}</pre>
                </div>
              </div>

              {/* Direct App Link */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <div className="truncate">
                  <span className="text-slate-400 mr-2">URL ตรงของแอป:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{currentAppUrl}</span>
                </div>
                <a
                  href={currentAppUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-600 hover:underline flex items-center gap-1 font-medium shrink-0 ml-2"
                >
                  เปิดแท็บใหม่ <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* TAB 3: APPS SCRIPT WEBHOOK SYNC */}
          {activeTab === 'APPS_SCRIPT' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-300 space-y-1.5">
                <h4 className="font-bold flex items-center gap-1.5 text-sm font-heading">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  ทางเลือกเสริม: Google Apps Script Web App (ซิงค์ไม่ต้องกดล็อกอิน)
                </h4>
                <p className="leading-relaxed font-body">
                  หากต้องการให้ผู้ใช้งานทุกคนที่เข้าผ่าน Google Sites สามารถบันทึกข้อมูลลง Google Sheet เดียวกันได้โดยตรงโดยไม่ต้องขอสิทธิ์ Google แต่ละคน คุณสามารถสร้าง Google Apps Script Web App แล้วนำ URL มาใส่ที่นี่ได้
                </p>
              </div>

              {/* Code Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    โค้ด Apps Script (วางใน Extensions &rarr; Apps Script):
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyAppsScript}
                    className="flex items-center gap-1 text-emerald-600 font-semibold hover:underline"
                  >
                    {copiedAppScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedAppScript ? 'คัดลอกแล้ว!' : 'คัดลอกโค้ดสคริปต์'}
                  </button>
                </div>
                <div className="relative bg-slate-900 text-slate-200 p-4 rounded-2xl font-mono text-xs overflow-x-auto border border-slate-800 max-h-[160px]">
                  <pre>{appsScriptSnippet}</pre>
                </div>
              </div>

              {/* Web App URL input */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  วาง Web App Deployment URL ที่ได้:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={appsScriptUrlInput}
                    onChange={(e) => setAppsScriptUrlInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleSaveConfigSettings}
                    className="px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition"
                  >
                    บันทึก
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
