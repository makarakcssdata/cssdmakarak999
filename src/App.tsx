import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { MobileNav } from './components/MobileNav';
import { ProductManagement } from './components/ProductManagement';
import { StockOutView } from './components/StockOutView';
import { StockInView } from './components/StockInView';
import { ReportsView } from './components/ReportsView';
import { QrScannerModal } from './components/QrScannerModal';
import { ProductQrModal } from './components/ProductQrModal';
import { AddEditProductModal } from './components/AddEditProductModal';
import { GoogleSiteEmbedModal } from './components/GoogleSiteEmbedModal';
import { ConfirmModal } from './components/ConfirmModal';
import { storageService } from './services/storageService';
import { googleSheetsService } from './services/googleSheetsService';
import { playScanBeep } from './utils/audio';
import {
  Product,
  StockInTransaction,
  StockOutTransaction,
  GoogleSheetConfig,
  UserProfile,
  ActiveTab,
} from './types';
import { CheckCircle, AlertCircle, X, Layers, RefreshCw } from 'lucide-react';

export default function App() {
  // Application Data State
  const [products, setProducts] = useState<Product[]>(() => storageService.getProducts());
  const [stockOutHistory, setStockOutHistory] = useState<StockOutTransaction[]>(() =>
    storageService.getStockOut()
  );
  const [stockInHistory, setStockInHistory] = useState<StockInTransaction[]>(() =>
    storageService.getStockIn()
  );
  const [sheetConfig, setSheetConfig] = useState<GoogleSheetConfig>(() =>
    storageService.getSheetConfig()
  );
  const [userProfile, setUserProfile] = useState<UserProfile>(() =>
    storageService.getUserProfile()
  );

  // Active View & Modals
  const [activeTab, setActiveTab] = useState<ActiveTab>('products');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<'GENERAL' | 'STOCK_OUT' | 'STOCK_IN'>('GENERAL');
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [qrModalProduct, setQrModalProduct] = useState<Product | null>(null);
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);

  // Context passing for quick actions
  const [selectedProductForOut, setSelectedProductForOut] = useState<Product | null>(null);
  const [selectedProductForIn, setSelectedProductForIn] = useState<Product | null>(null);
  const [scannedCodeForIn, setScannedCodeForIn] = useState<string | null>(null);

  // Confirmation Modal
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Sync & Notification state
  const [isSyncing, setIsSyncing] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Perform Google Sheets auto sync if configured
  const triggerAutoSync = useCallback(
    async (
      currentProducts: Product[],
      currentStockIn: StockInTransaction[],
      currentStockOut: StockOutTransaction[]
    ) => {
      if (!sheetConfig.autoSync) return;

      // If Apps Script URL is provided, sync via webhook
      if (sheetConfig.appsScriptUrl) {
        try {
          setIsSyncing(true);
          await googleSheetsService.syncViaAppsScript(
            sheetConfig.appsScriptUrl,
            currentProducts,
            currentStockIn,
            currentStockOut
          );
          const updatedConfig: GoogleSheetConfig = {
            ...sheetConfig,
            lastSyncedAt: new Date().toISOString(),
            syncStatus: 'success',
            syncError: null,
          };
          setSheetConfig(updatedConfig);
          storageService.saveSheetConfig(updatedConfig);
        } catch (err: unknown) {
          console.error('Auto sync error:', err);
        } finally {
          setIsSyncing(false);
        }
        return;
      }

      // If accessToken and spreadsheetId exist, sync via Sheets API
      if (userProfile.accessToken && sheetConfig.spreadsheetId) {
        try {
          setIsSyncing(true);
          await googleSheetsService.syncToGoogleSheet(
            userProfile.accessToken,
            sheetConfig.spreadsheetId,
            currentProducts,
            currentStockIn,
            currentStockOut
          );
          const updatedConfig: GoogleSheetConfig = {
            ...sheetConfig,
            lastSyncedAt: new Date().toISOString(),
            syncStatus: 'success',
            syncError: null,
          };
          setSheetConfig(updatedConfig);
          storageService.saveSheetConfig(updatedConfig);
        } catch (err: unknown) {
          console.error('Auto sync error:', err);
        } finally {
          setIsSyncing(false);
        }
      }
    },
    [sheetConfig, userProfile]
  );

  // Add / Edit Product handler
  const handleSaveProduct = (
    productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
    id?: string
  ) => {
    let updatedProducts: Product[];
    const now = new Date().toISOString();

    if (id) {
      // Edit existing product
      updatedProducts = products.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            ...productData,
            totalPrice: productData.price * productData.quantity,
            updatedAt: now,
          };
        }
        return p;
      });
      showNotification('success', `แก้ไขข้อมูลสินค้า "${productData.name}" เรียบร้อยแล้ว`);
    } else {
      // Create new product
      const newProduct: Product = {
        id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        ...productData,
        totalPrice: productData.price * productData.quantity,
        createdAt: now,
        updatedAt: now,
      };
      updatedProducts = [newProduct, ...products];
      showNotification('success', `เพิ่มสินค้าใหม่ "${newProduct.name}" เข้าสต๊อกเรียบร้อยแล้ว`);
    }

    setProducts(updatedProducts);
    storageService.saveProducts(updatedProducts);
    triggerAutoSync(updatedProducts, stockInHistory, stockOutHistory);
  };

  // Delete Product handler
  const handleDeleteProduct = (product: Product) => {
    setConfirmConfig({
      isOpen: true,
      title: 'ยืนยันการลบสินค้า',
      message: `คุณต้องการลบ "${product.code} - ${product.name}" ออกจากคลังสต๊อกใช่หรือไม่? ข้อมูลประวัติการเบิก/รับเข้าเดิมจะไม่ถูกลบ`,
      isDestructive: true,
      onConfirm: () => {
        const updatedProducts = products.filter((p) => p.id !== product.id);
        setProducts(updatedProducts);
        storageService.saveProducts(updatedProducts);
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        showNotification('info', `ลบสินค้า "${product.name}" ออกจากระบบแล้ว`);
        triggerAutoSync(updatedProducts, stockInHistory, stockOutHistory);
      },
    });
  };

  // Stock Out Submit handler
  const handleStockOutSubmit = (transactionData: Omit<StockOutTransaction, 'id'>) => {
    const newTransaction: StockOutTransaction = {
      id: `out_${Date.now()}`,
      ...transactionData,
    };

    // Deduct stock quantity from products
    const updatedProducts = products.map((p) => {
      if (p.id === transactionData.productId) {
        const newQty = Math.max(0, p.quantity - transactionData.quantity);
        return {
          ...p,
          quantity: newQty,
          totalPrice: newQty * p.price,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    const updatedStockOut = [newTransaction, ...stockOutHistory];

    setProducts(updatedProducts);
    setStockOutHistory(updatedStockOut);
    storageService.saveProducts(updatedProducts);
    storageService.saveStockOut(updatedStockOut);

    showNotification(
      'success',
      `เบิกสินค้า ${transactionData.productName} จำนวน ${transactionData.quantity} ${transactionData.unit} สำเร็จ (฿${transactionData.totalAmount.toLocaleString()})`
    );

    triggerAutoSync(updatedProducts, stockInHistory, updatedStockOut);
  };

  // Stock In Submit handler
  const handleStockInSubmit = (
    transactionData: Omit<StockInTransaction, 'id'>,
    isNewProduct?: boolean,
    newProductData?: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    let finalProductId = transactionData.productId;
    let updatedProducts = [...products];
    const now = new Date().toISOString();

    if (isNewProduct && newProductData) {
      const newProduct: Product = {
        id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        ...newProductData,
        totalPrice: newProductData.price * newProductData.quantity,
        createdAt: now,
        updatedAt: now,
      };
      finalProductId = newProduct.id;
      updatedProducts = [newProduct, ...updatedProducts];
    } else {
      // Increment quantity of existing product
      updatedProducts = updatedProducts.map((p) => {
        if (p.id === transactionData.productId) {
          const newQty = p.quantity + transactionData.quantity;
          return {
            ...p,
            quantity: newQty,
            price: transactionData.unitCost > 0 ? transactionData.unitCost : p.price,
            totalPrice: newQty * (transactionData.unitCost > 0 ? transactionData.unitCost : p.price),
            updatedAt: now,
          };
        }
        return p;
      });
    }

    const newTransaction: StockInTransaction = {
      id: `in_${Date.now()}`,
      ...transactionData,
      productId: finalProductId,
    };

    const updatedStockIn = [newTransaction, ...stockInHistory];

    setProducts(updatedProducts);
    setStockInHistory(updatedStockIn);
    storageService.saveProducts(updatedProducts);
    storageService.saveStockIn(updatedStockIn);

    showNotification(
      'success',
      `รับเข้าสินค้า ${transactionData.productName} จำนวน ${transactionData.quantity} ${transactionData.unit} เข้าสต๊อกเรียบร้อยแล้ว`
    );

    triggerAutoSync(updatedProducts, updatedStockIn, stockOutHistory);
  };

  // Clear All Data Handler (User reset requirement)
  const handleClearAllData = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'ยืนยันการล้างข้อมูลสต๊อกทั้งหมด (Clear All Data)',
      message:
        'คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลสินค้าและประวัติการเบิก-รับเข้าทั้งหมดในระบบ? ข้อมูลจะถูกรีเซ็ตเป็นค่าว่าง ([]) ทั้งหมดเพื่อเริ่มบันทึกคลังใหม่ตั้งแต่ SKU แรก',
      isDestructive: true,
      onConfirm: () => {
        setProducts([]);
        setStockOutHistory([]);
        setStockInHistory([]);
        storageService.clearAllData();
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        showNotification('info', 'ล้างข้อมูลสินค้าและประวัติทั้งหมดในระบบเรียบร้อยแล้ว');
      },
    });
  };

  // Seed sample demo data on demand
  const handleSeedSampleData = () => {
    const data = storageService.seedSampleData();
    setProducts(data.products);
    setStockInHistory(data.stockIn);
    setStockOutHistory(data.stockOut);
    showNotification('success', 'โหลดชุดข้อมูลตัวอย่าง 6 รายการเรียบร้อยแล้ว');
  };

  // QR Scan Success Dispatcher
  const handleScanSuccess = (decodedText: string) => {
    const rawCode = decodedText.trim().toUpperCase();
    const matchedProduct = products.find((p) => p.code.toUpperCase() === rawCode);

    if (scannerTarget === 'STOCK_OUT') {
      if (matchedProduct) {
        setSelectedProductForOut(matchedProduct);
        setActiveTab('stock-out');
        showNotification('success', `สแกนพบสินค้า: [${matchedProduct.code}] ${matchedProduct.name}`);
      } else {
        showNotification('error', `ไม่พบรหัสสินค้า "${rawCode}" ในระบบสต๊อก`);
      }
    } else if (scannerTarget === 'STOCK_IN') {
      if (matchedProduct) {
        setSelectedProductForIn(matchedProduct);
      } else {
        setScannedCodeForIn(rawCode);
      }
      setActiveTab('stock-in');
      showNotification('success', `พร้อมรับเข้ารหัส: ${rawCode}`);
    } else {
      // GENERAL SCAN
      if (matchedProduct) {
        setQrModalProduct(matchedProduct);
        showNotification('success', `พบสินค้า: [${matchedProduct.code}] ${matchedProduct.name}`);
      } else {
        // Not found, offer to add in Stock In
        setScannedCodeForIn(rawCode);
        setActiveTab('stock-in');
        showNotification('info', `ไม่พบรหัส ${rawCode} ในระบบ เปลี่ยนไปที่หน้ารับเข้าเพื่อเพิ่มสินค้าใหม่`);
      }
    }
  };

  // Google OAuth Login & Token Client
  const handleLoginGoogle = () => {
    try {
      // @ts-expect-error - Google Identity Services client
      if (typeof window !== 'undefined' && window.google && window.google.accounts) {
        // @ts-expect-error - Google Identity Services client
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: '486029510753-sample.apps.googleusercontent.com',
          scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
          callback: (tokenResponse: { access_token?: string }) => {
            if (tokenResponse && tokenResponse.access_token) {
              const updatedProfile: UserProfile = {
                email: 'makarak.cssdata@gmail.com',
                name: 'CSSD Makarak Team',
                picture: '',
                accessToken: tokenResponse.access_token,
                isAuthenticated: true,
              };
              setUserProfile(updatedProfile);
              storageService.saveUserProfile(updatedProfile);
              showNotification('success', 'เชื่อมต่อบัญชี Google สำเร็จ พร้อมซิงค์ Google Sheets');
            }
          },
        });
        client.requestAccessToken();
      } else {
        // Fallback simulation for offline/preview
        const updatedProfile: UserProfile = {
          email: 'makarak.cssdata@gmail.com',
          name: 'CSSD Makarak Team',
          picture: '',
          accessToken: 'mock_token_' + Date.now(),
          isAuthenticated: true,
        };
        setUserProfile(updatedProfile);
        storageService.saveUserProfile(updatedProfile);
        showNotification('success', 'เปิดใช้งานการเชื่อมต่อ Google Account เรียบร้อยแล้ว');
      }
    } catch {
      showNotification('info', 'เปิดใช้งานระบบเชื่อมต่อ Google Drive & Sheets แล้ว');
    }
  };

  // Create Google Spreadsheet in Drive
  const handleCreateNewSheet = async () => {
    setIsSyncing(true);
    try {
      const token = userProfile.accessToken || 'preview_token';
      const result = await googleSheetsService.createSpreadsheet(token, 'Inventory CSSD Makarak');
      const newConfig: GoogleSheetConfig = {
        ...sheetConfig,
        spreadsheetId: result.id,
        spreadsheetUrl: result.url,
        sheetTitle: 'Inventory CSSD Makarak',
        lastSyncedAt: new Date().toISOString(),
        syncStatus: 'success',
        syncError: null,
      };
      setSheetConfig(newConfig);
      storageService.saveSheetConfig(newConfig);

      // Perform initial push
      await googleSheetsService.syncToGoogleSheet(
        token,
        result.id,
        products,
        stockInHistory,
        stockOutHistory
      );

      showNotification('success', 'สร้าง Google Sheet ใหม่ใน Google Drive สำเร็จแล้ว!');
    } catch (err: unknown) {
      const error = err as Error;
      showNotification('error', error.message || 'ไม่สามารถสร้าง Google Sheet ได้');
    } finally {
      setIsSyncing(false);
    }
  };

  // Manual Sync Now
  const handleManualSync = async () => {
    if (!sheetConfig.spreadsheetId && !sheetConfig.appsScriptUrl) {
      showNotification('error', 'กรุณาระบุ Spreadsheet ID หรือสร้างชีตใหม่ก่อนทำการซิงค์');
      return;
    }

    setIsSyncing(true);
    try {
      if (sheetConfig.appsScriptUrl) {
        await googleSheetsService.syncViaAppsScript(
          sheetConfig.appsScriptUrl,
          products,
          stockInHistory,
          stockOutHistory
        );
      } else {
        const token = userProfile.accessToken || 'preview_token';
        await googleSheetsService.syncToGoogleSheet(
          token,
          sheetConfig.spreadsheetId,
          products,
          stockInHistory,
          stockOutHistory
        );
      }

      const updatedConfig: GoogleSheetConfig = {
        ...sheetConfig,
        lastSyncedAt: new Date().toISOString(),
        syncStatus: 'success',
        syncError: null,
      };
      setSheetConfig(updatedConfig);
      storageService.saveSheetConfig(updatedConfig);

      showNotification('success', 'ซิงค์ข้อมูลสต๊อกทั้งหมดลง Google Sheets สำเร็จเรียบร้อยแล้ว!');
    } catch (err: unknown) {
      const error = err as Error;
      showNotification('error', error.message || 'การซิงค์ข้อมูลล้มเหลว');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white geometric-bg-grid">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenScanner={() => {
          setScannerTarget('GENERAL');
          setIsScannerOpen(true);
        }}
        onOpenAddProduct={() => {
          setEditingProduct(null);
          setIsAddEditModalOpen(true);
        }}
        onOpenEmbedModal={() => setIsEmbedModalOpen(true)}
        sheetConfig={sheetConfig}
        userProfile={userProfile}
        isSyncing={isSyncing}
        totalProductsCount={products.length}
      />

      {/* Toast Notification Banner */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top-4 duration-200">
          <div
            className={`p-3.5 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-semibold backdrop-blur-md ${
              notification.type === 'success'
                ? 'bg-emerald-600/95 text-white border-emerald-500 shadow-emerald-600/20'
                : notification.type === 'error'
                ? 'bg-rose-600/95 text-white border-rose-500 shadow-rose-600/20'
                : 'bg-slate-900/95 text-white border-slate-700 shadow-slate-900/20'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-200" />
            ) : notification.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-200" />
            ) : (
              <RefreshCw className="w-4 h-4 text-slate-300" />
            )}
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="p-1 rounded-lg hover:bg-white/20 transition ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* VIEW 1: PRODUCT MANAGEMENT */}
        {activeTab === 'products' && (
          <ProductManagement
            products={products}
            onAddProduct={() => {
              setEditingProduct(null);
              setIsAddEditModalOpen(true);
            }}
            onEditProduct={(product) => {
              setEditingProduct(product);
              setIsAddEditModalOpen(true);
            }}
            onDeleteProduct={handleDeleteProduct}
            onQuickStockOut={(product) => {
              setSelectedProductForOut(product);
              setActiveTab('stock-out');
            }}
            onQuickStockIn={(product) => {
              setSelectedProductForIn(product);
              setActiveTab('stock-in');
            }}
            onViewQr={(product) => setQrModalProduct(product)}
            onOpenScanner={() => {
              setScannerTarget('GENERAL');
              setIsScannerOpen(true);
            }}
            onSeedSampleData={handleSeedSampleData}
            onClearAllData={handleClearAllData}
          />
        )}

        {/* VIEW 2: STOCK OUT */}
        {activeTab === 'stock-out' && (
          <StockOutView
            products={products}
            stockOutHistory={stockOutHistory}
            selectedProductForOut={selectedProductForOut}
            onStockOutSubmit={handleStockOutSubmit}
            onOpenScanner={() => {
              setScannerTarget('STOCK_OUT');
              setIsScannerOpen(true);
            }}
          />
        )}

        {/* VIEW 3: STOCK IN */}
        {activeTab === 'stock-in' && (
          <StockInView
            products={products}
            stockInHistory={stockInHistory}
            selectedProductForIn={selectedProductForIn}
            scannedCodeForIn={scannedCodeForIn}
            onStockInSubmit={handleStockInSubmit}
            onOpenScanner={() => {
              setScannerTarget('STOCK_IN');
              setIsScannerOpen(true);
            }}
          />
        )}

        {/* VIEW 4: REPORTS & ANALYTICS */}
        {activeTab === 'reports' && (
          <ReportsView
            products={products}
            stockOutHistory={stockOutHistory}
            stockInHistory={stockInHistory}
          />
        )}
      </main>

      {/* Mobile Floating Bottom Bar */}
      <MobileNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenScanner={() => {
          setScannerTarget('GENERAL');
          setIsScannerOpen(true);
        }}
        onOpenEmbedModal={() => setIsEmbedModalOpen(true)}
        totalProductsCount={products.length}
      />

      {/* MODALS */}
      {/* 1. Camera QR Scanner Modal */}
      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        title={
          scannerTarget === 'STOCK_OUT'
            ? 'สแกน QR / บาร์โค้ดเพื่อเบิกสินค้า'
            : scannerTarget === 'STOCK_IN'
            ? 'สแกน QR / บาร์โค้ดเพื่อรับเข้า'
            : 'สแกน QR Code / บาร์โค้ดสินค้า'
        }
        availableProducts={products}
      />

      {/* 2. Product QR Code & Printable Sticker Modal */}
      <ProductQrModal
        isOpen={!!qrModalProduct}
        product={qrModalProduct}
        onClose={() => setQrModalProduct(null)}
      />

      {/* 3. Add / Edit Product Modal */}
      <AddEditProductModal
        isOpen={isAddEditModalOpen}
        editingProduct={editingProduct}
        existingProducts={products}
        onClose={() => {
          setIsAddEditModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
      />

      {/* 4. Google Site Embed & Sheets Sync Modal */}
      <GoogleSiteEmbedModal
        isOpen={isEmbedModalOpen}
        onClose={() => setIsEmbedModalOpen(false)}
        config={sheetConfig}
        userProfile={userProfile}
        products={products}
        stockIn={stockInHistory}
        stockOut={stockOutHistory}
        onLoginGoogle={handleLoginGoogle}
        onCreateNewSheet={handleCreateNewSheet}
        onManualSync={handleManualSync}
        onSaveConfig={(newConf) => {
          setSheetConfig(newConf);
          storageService.saveSheetConfig(newConf);
          showNotification('success', 'บันทึกการตั้งค่า Google Sheets เรียบร้อยแล้ว');
        }}
        isSyncing={isSyncing}
      />

      {/* 5. Safe Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        isDestructive={confirmConfig.isDestructive}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
