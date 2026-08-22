import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, RefreshCw, Zap, ZapOff, Upload, Search, CheckCircle, AlertCircle } from 'lucide-react';
import jsQR from 'jsqr';
import { playScanBeep } from '../utils/audio';
import { Product } from '../types';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
  title?: string;
  subtitle?: string;
  availableProducts?: Product[];
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'สแกน QR Code / บาร์โค้ดสินค้า',
  subtitle = 'จัดวางรหัสให้อยู่ในกรอบเพื่อตรวจจับอัตโนมัติ',
  availableProducts = [],
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Stop camera media tracks
  const stopCamera = () => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Start camera stream
  const startCamera = async () => {
    stopCamera();
    setIsInitializing(true);
    setErrorMsg(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('เบราว์เซอร์นี้ไม่รองรับการเปิดกล้อง กรุณาอัปโหลดรูปหรือพิมพ์รหัส');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
      }

      // Check for torch capability
      const videoTrack = stream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities ? videoTrack.getCapabilities() : ({} as Record<string, unknown>);
      if ('torch' in capabilities) {
        setHasTorch(true);
      } else {
        setHasTorch(false);
      }

      setIsInitializing(false);
      scanLoop();
    } catch (err: unknown) {
      const error = err as { name?: string; message?: string };
      setIsInitializing(false);
      if (error.name === 'NotAllowedError') {
        setErrorMsg('กรุณาอนุญาตการเข้าถึงกล้องในเบราว์เซอร์เพื่อใช้งานระบบสแกน');
      } else if (error.name === 'NotFoundError') {
        setErrorMsg('ไม่พบอุปกรณ์กล้องบนอุปกรณ์นี้ คุณสามารถอัปโหลดรูปภาพหรือพิมพ์รหัสแทนได้');
      } else {
        setErrorMsg(error.message || 'ไม่สามารถเปิดกล้องได้');
      }
    }
  };

  // Continuous frame analysis
  const scanLoop = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data && code.data.trim()) {
        const result = code.data.trim();
        handleSuccessfulScan(result);
        return;
      }
    }

    animationFrameIdRef.current = requestAnimationFrame(scanLoop);
  };

  const handleSuccessfulScan = (code: string) => {
    stopCamera();
    playScanBeep(true);
    setScannedCode(code);
    setTimeout(() => {
      onScanSuccess(code);
      onClose();
    }, 600);
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      const newTorch = !torchOn;
      if (typeof (track as unknown as { applyConstraints: (c: unknown) => Promise<void> }).applyConstraints === 'function') {
        await (track as unknown as { applyConstraints: (c: unknown) => Promise<void> }).applyConstraints({
          advanced: [{ torch: newTorch }],
        });
      }
      setTorchOn(newTorch);
    } catch {
      // ignore
    }
  };

  const flipCamera = () => {
    setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imgData.data, imgData.width, imgData.height);
          if (code && code.data) {
            handleSuccessfulScan(code.data.trim());
          } else {
            playScanBeep(false);
            setErrorMsg('ไม่พบ QR Code ในรูปภาพที่เลือก กรุณาลองใช้รูปที่คมชัดขึ้น');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleSuccessfulScan(manualCode.trim());
    }
  };

  useEffect(() => {
    if (isOpen) {
      setScannedCode(null);
      setManualCode('');
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, cameraFacing]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="qr-scanner-modal"
        className="w-full max-w-lg bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white font-heading">{title}</h3>
              <p className="text-xs text-slate-400 font-body">{subtitle}</p>
            </div>
          </div>
          <button
            id="btn-close-qr-scanner"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
            aria-label="ปิดกล้อง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewfinder Area */}
        <div className="relative bg-black flex-1 min-h-[300px] flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-cover max-h-[340px]"
            autoPlay
            playsInline
            muted
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Scanner Overlay Box */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
            <div className="relative w-64 h-64 border-2 border-emerald-400/60 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.25)]">
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

              {/* Animated Laser Line */}
              {!scannedCode && !errorMsg && !isInitializing && (
                <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-bounce duration-1000 top-1/2" />
              )}

              {/* Success badge */}
              {scannedCode && (
                <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-center p-4">
                  <CheckCircle className="w-12 h-12 text-emerald-400 animate-in zoom-in-75 duration-200" />
                  <p className="text-sm font-semibold text-emerald-200 mt-2">สแกนสำเร็จ!</p>
                  <p className="text-xs text-white font-mono bg-emerald-900/60 px-3 py-1 rounded-full mt-1">
                    {scannedCode}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Camera Controls Overlay */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {hasTorch && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`p-2.5 rounded-full backdrop-blur-md transition ${
                  torchOn ? 'bg-amber-500 text-white' : 'bg-slate-900/70 text-slate-300 hover:text-white'
                }`}
                title={torchOn ? 'ปิดไฟฉาย' : 'เปิดไฟฉาย'}
              >
                {torchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
              </button>
            )}
            <button
              type="button"
              onClick={flipCamera}
              className="p-2.5 rounded-full bg-slate-900/70 text-slate-300 hover:text-white backdrop-blur-md transition"
              title="สลับกล้องหน้า/หลัง"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Loading / Error state */}
          {isInitializing && (
            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-sm text-slate-300">กำลังเปิดกล้อง...</p>
            </div>
          )}

          {errorMsg && (
            <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center">
              <AlertCircle className="w-10 h-10 text-amber-400 mb-2" />
              <p className="text-sm text-slate-200 font-medium">{errorMsg}</p>
              <button
                type="button"
                onClick={startCamera}
                className="mt-4 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-500 transition"
              >
                ลองใหม่อีกครั้ง
              </button>
            </div>
          )}
        </div>

        {/* Fallback Tools & Quick Actions */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
          {/* Manual Input Form */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="input-manual-barcode"
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="หรือพิมพ์รหัสสินค้า/บาร์โค้ดที่นี่..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-body"
              />
            </div>
            <button
              id="btn-submit-manual-code"
              type="submit"
              disabled={!manualCode.trim()}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition"
            >
              ตกลง
            </button>
          </form>

          {/* Upload image button */}
          <div className="flex items-center justify-between pt-1">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1.5 transition"
            >
              <Upload className="w-3.5 h-3.5" />
              อัปโหลดรูป QR จากเครื่อง
            </button>

            {/* Quick Test simulator buttons if products exist */}
            {availableProducts.length > 0 && (
              <div className="flex items-center gap-1 overflow-x-auto max-w-[240px]">
                <span className="text-[11px] text-slate-500">ทดสอบ:</span>
                {availableProducts.slice(0, 3).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSuccessfulScan(p.code)}
                    className="px-2 py-0.5 text-[11px] bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-md transition font-mono whitespace-nowrap"
                  >
                    {p.code}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
