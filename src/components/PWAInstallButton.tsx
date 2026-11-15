import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, Check } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showInstalledToast, setShowInstalledToast] = useState(false);

  // If already running as an installed standalone PWA, hide the button
  if (isInstalled) {
    return (
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[11px] font-bold">
        <Check className="w-3.5 h-3.5" />
        <span>Đã Cài Đặt Ứng Dụng</span>
      </div>
    );
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
        title="Cài đặt Nông Trợ Xanh AI về màn hình chính để dùng offline mượt mà"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Cài Ứng Dụng (PWA)</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Cài trên iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>Cài Đặt Trên iPhone / iPad</span>
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-zinc-400 hover:text-zinc-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-300">
                <p>
                  1. Nhấn nút <strong>Chia sẻ (Share <span className="inline-block px-1 bg-zinc-200 dark:bg-zinc-800 rounded">⎋</span>)</strong> trên thanh công cụ Safari.
                </p>
                <p>
                  2. Cuộn xuống và chọn <strong>Thêm vào MH chính (Add to Home Screen <span className="inline-block px-1 bg-zinc-200 dark:bg-zinc-800 rounded">⊞</span>)</strong>.
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 pt-1">
                  ✓ Ứng dụng sẽ hoạt động mượt mà ngoại tuyến ngay cả khi mất sóng ở rẫy, vườn!
                </p>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback ambient button
  return (
    <button
      onClick={() => setShowInstalledToast(true)}
      className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[11px] font-semibold hover:bg-zinc-200"
      title="Ứng dụng có thể chạy ngoại tuyến qua PWA"
    >
      <Download className="w-3 h-3 text-emerald-600" />
      <span>Hỗ Trợ Ngoại Tuyến</span>
    </button>
  );
};
