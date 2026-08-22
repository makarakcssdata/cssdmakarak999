import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { X, Printer, Download, Copy, Check, Tag } from 'lucide-react';
import { Product } from '../types';

interface ProductQrModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductQrModal: React.FC<ProductQrModalProps> = ({ product, isOpen, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (product && isOpen) {
      // Encode product code or JSON payload for fast detection
      QRCode.toDataURL(product.code, {
        width: 360,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR generation error:', err));
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR_${product.code}_${product.name.substring(0, 15)}.png`;
    link.click();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(product.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="product-qr-modal"
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white font-heading">
                ป้ายบาร์โค้ด / QR Code สินค้า
              </h3>
              <p className="text-xs text-slate-500 font-body">สำหรับติดหน้ากล่องหรือชั้นวางพัสดุ</p>
            </div>
          </div>
          <button
            id="btn-close-product-qr-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Label Card */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <div
            id="printable-qr-area"
            ref={printAreaRef}
            className="p-5 bg-white border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center text-center shadow-xs"
          >
            {/* Header Badge */}
            <div className="w-full pb-2 mb-2 border-b border-slate-200 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-800 tracking-wider">
                INVENTORY CSSD MAKARAK
              </span>
              <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono">
                {product.category}
              </span>
            </div>

            {/* QR Image */}
            <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-100 my-1">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Code ${product.code}`}
                  className="w-48 h-48 object-contain"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center bg-slate-50 text-slate-400 text-xs">
                  กำลังสร้าง QR...
                </div>
              )}
            </div>

            {/* Code */}
            <div className="mt-2 inline-flex items-center gap-1.5 bg-slate-900 text-white font-mono font-bold text-base px-3.5 py-1 rounded-lg">
              <span>{product.code}</span>
            </div>

            {/* Product Name & Specs */}
            <h4 className="mt-2 text-sm font-bold text-slate-900 line-clamp-2 px-2">
              {product.name}
            </h4>

            <div className="w-full mt-3 pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-left text-[11px]">
              <div>
                <span className="text-slate-400">ราคา/หน่วย: </span>
                <span className="font-semibold text-slate-700">฿{product.price.toLocaleString()} / {product.unit}</span>
              </div>
              <div>
                <span className="text-slate-400">ตำแหน่ง: </span>
                <span className="font-semibold text-slate-700">{product.location || 'คลังกลาง'}</span>
              </div>
            </div>
          </div>

          {/* Quick Copy Code Button */}
          <div className="mt-4 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400 font-body">รหัสสินค้า:</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{product.code}</span>
            </div>
            <button
              id="btn-copy-product-code"
              onClick={handleCopyCode}
              className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'คัดลอกแล้ว' : 'คัดลอกรหัส'}
            </button>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
          <button
            id="btn-download-qr-png"
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition shadow-xs"
          >
            <Download className="w-4 h-4" />
            ดาวน์โหลด PNG
          </button>
          <button
            id="btn-print-qr-sticker"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs shadow-emerald-200 dark:shadow-none"
          >
            <Printer className="w-4 h-4" />
            พิมพ์ป้ายสติกเกอร์ (Print)
          </button>
        </div>
      </div>
    </div>
  );
};
