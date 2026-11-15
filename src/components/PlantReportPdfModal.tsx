import React, { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plant } from '../types';
import { useApp } from '../context/AppContext';
import { generatePlantGrowthPdfReport } from '../utils/pdfReportGenerator';
import {
  Printer,
  Download,
  FileText,
  X,
  Droplets,
  Calendar,
  MapPin,
  TrendingUp,
  Share2,
  Check,
  Image as ImageIcon,
  Stethoscope,
  Loader2,
  Sprout
} from 'lucide-react';

interface PlantReportPdfModalProps {
  plant: Plant;
  onClose: () => void;
  onSendToExpert?: (plant: Plant) => void;
}

export const PlantReportPdfModal: React.FC<PlantReportPdfModalProps> = ({
  plant: initialPlant,
  onClose,
  onSendToExpert,
}) => {
  const { plants, farmLocation, weather } = useApp();
  const printAreaRef = useRef<HTMLDivElement>(null);

  const [selectedPlantId, setSelectedPlantId] = useState<string>(initialPlant.id);
  const activePlant = useMemo(
    () => plants.find((p) => p.id === selectedPlantId) || initialPlant,
    [plants, selectedPlantId, initialPlant]
  );

  // Report customization options
  const [includePhotos, setIncludePhotos] = useState<boolean>(true);
  const [includeChart, setIncludeChart] = useState<boolean>(true);
  const [includeCareLogs, setIncludeCareLogs] = useState<boolean>(true);
  const [includeSignature, setIncludeSignature] = useState<boolean>(true);

  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const markImageFailed = (key: string) => {
    setFailedImages((prev) => ({ ...prev, [key]: true }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const { blob, filename } = await generatePlantGrowthPdfReport(
        activePlant,
        farmLocation,
        weather,
        {
          includePhotos,
          includeChart,
          includeCareLogs,
          includeSignature,
        }
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
      setShareStatus('Đã tải xuống file PDF!');
      window.setTimeout(() => setShareStatus(null), 3000);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      setShareStatus('Không thể tạo PDF, hãy thử nút In A4.');
      window.setTimeout(() => setShareStatus(null), 3000);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleShareReport = async () => {
    const latest = activePlant.growthHistory[activePlant.growthHistory.length - 1];
    const summaryText =
      `Báo cáo nhật ký sinh trưởng: ${activePlant.name} (${activePlant.scientificName})\n` +
      `Vườn: ${farmLocation.name}\n` +
      `Sức khỏe: ${activePlant.healthScore}% | Độ ẩm đất: ${activePlant.soilMoisturePercent || 50}%\n` +
      (latest ? `Chiều cao mới nhất: ${latest.heightCm} cm (${latest.leafCount} lá) - ${latest.notes || ''}\n` : '') +
      `Tổng số mốc theo dõi: ${activePlant.growthHistory.length} mốc | Số lần chăm sóc: ${activePlant.careLogs.length} lần`;

    try {
      setIsExportingPdf(true);
      const { blob, filename } = await generatePlantGrowthPdfReport(
        activePlant,
        farmLocation,
        weather,
        { includePhotos, includeChart, includeCareLogs, includeSignature }
      );
      const pdfFile = new File([blob], filename, { type: 'application/pdf' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          title: `Nhật ký sinh trưởng - ${activePlant.name}`,
          text: summaryText,
          files: [pdfFile],
        });
        setShareStatus('Đã chia sẻ báo cáo PDF!');
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(summaryText);
        setShareStatus('Đã sao chép tóm tắt báo cáo để gửi qua Zalo/Email!');
      }
    } catch {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(summaryText).catch(() => {});
        setShareStatus('Đã sao chép nội dung báo cáo!');
      }
    } finally {
      setIsExportingPdf(false);
      window.setTimeout(() => setShareStatus(null), 3200);
    }
  };

  const maxHeightCm = Math.max(
    ...activePlant.growthHistory.map((item) => item.heightCm),
    60
  );

  const modalContent = (
    <div
      id="printable-report-backdrop"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      {/* Modal Container */}
      <div
        id="printable-report-container"
        className="bg-white dark:bg-zinc-900 rounded-3xl max-w-4xl w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[94vh]"
      >
        {/* Modal Top Toolbar (Hidden during print) */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/90 shrink-0 print:hidden space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
                  Xuất Báo Cáo Nhật Ký Sinh Trưởng (PDF)
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Bao gồm hình ảnh cột mốc, biểu đồ chiều cao và lịch sử chăm sóc để in hoặc chia sẻ
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              {onSendToExpert && (
                <button
                  onClick={() => {
                    onClose();
                    onSendToExpert(activePlant);
                  }}
                  className="px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/60 flex items-center gap-1.5 cursor-pointer"
                  title="Đính kèm báo cáo cây này gửi chuyên gia nông nghiệp tư vấn"
                >
                  <Stethoscope className="w-4 h-4" />
                  <span className="hidden sm:inline">Hỏi Chuyên Gia</span>
                </button>
              )}

              <button
                onClick={handleShareReport}
                disabled={isExportingPdf}
                className="px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1.5 cursor-pointer"
                title="Chia sẻ file PDF hoặc sao chép tóm tắt"
              >
                <Share2 className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">Chia Sẻ</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1.5 cursor-pointer"
                title="Mở hộp thoại in khổ giấy A4"
              >
                <Printer className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
                <span>In A4</span>
              </button>

              <button
                onClick={handleDownloadPdf}
                disabled={isExportingPdf}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {isExportingPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>{isExportingPdf ? 'Đang tạo PDF...' : 'Tải File PDF'}</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Plant Picker & Section Toggles */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-zinc-200/70 dark:border-zinc-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-600 dark:text-zinc-400 shrink-0">
                Chọn cây xuất báo cáo:
              </span>
              <select
                value={activePlant.id}
                onChange={(e) => setSelectedPlantId(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 font-semibold text-xs"
              >
                {plants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.growthHistory.length} mốc)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-600 dark:text-zinc-300">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePhotos}
                  onChange={(e) => setIncludePhotos(e.target.checked)}
                  className="accent-emerald-600 rounded"
                />
                <span>Hình ảnh nhật ký</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeChart}
                  onChange={(e) => setIncludeChart(e.target.checked)}
                  className="accent-emerald-600 rounded"
                />
                <span>Biểu đồ tăng trưởng</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeCareLogs}
                  onChange={(e) => setIncludeCareLogs(e.target.checked)}
                  className="accent-emerald-600 rounded"
                />
                <span>Nhật ký tưới/bón</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSignature}
                  onChange={(e) => setIncludeSignature(e.target.checked)}
                  className="accent-emerald-600 rounded"
                />
                <span>Khung xác nhận</span>
              </label>
            </div>
          </div>

          {shareStatus && (
            <div className="px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-1.5">
              <Check className="w-4 h-4 shrink-0" />
              <span>{shareStatus}</span>
            </div>
          )}
        </div>

        {/* PRINTABLE A4 REPORT PREVIEW BODY */}
        <div
          className="p-6 sm:p-8 overflow-y-auto space-y-6 bg-white text-zinc-900 print:p-0 print:m-0 print:text-black"
          id="printable-report"
          ref={printAreaRef}
        >
          {/* Official Document Header */}
          <div className="border-b-2 border-emerald-700 pb-4 flex flex-col sm:flex-row justify-between items-start gap-4 print-avoid-break">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-emerald-800 uppercase tracking-wider">
                  NÔNG TRỢ XANH AI
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold uppercase">
                  Báo Cáo A4
                </span>
              </div>
              <p className="text-xs text-zinc-600 font-medium mt-0.5">
                Hệ Thống Quản Lý Canh Tác & Nhật Ký Sinh Trưởng Cây Trồng
              </p>
              <div className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-700" />
                <span>
                  {farmLocation.name} · {farmLocation.address}
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right text-xs space-y-0.5 shrink-0 tabular-nums">
              <div className="font-bold text-zinc-800">
                MÃ HỒ SƠ:{' '}
                <span className="font-mono text-emerald-700">
                  PLANT-{activePlant.id.toUpperCase()}
                </span>
              </div>
              <div className="text-zinc-500 text-[11px]">
                Ngày xuất: {new Date().toLocaleDateString('vi-VN')}
              </div>
              <div className="text-[11px] text-zinc-500">
                Thời tiết tại vườn: {weather.temp}°C, Ẩm {weather.humidity}%
              </div>
            </div>
          </div>

          {/* Document Title */}
          <div className="text-center py-1 print-avoid-break">
            <h2 className="text-lg sm:text-xl font-black text-emerald-900 uppercase tracking-tight">
              BÁO CÁO NHẬT KÝ SINH TRƯỞNG & CHĂM SÓC CÂY TRỒNG
            </h2>
            <p className="text-xs text-zinc-500 italic mt-0.5">
              Tổng hợp dữ liệu hình ảnh, cột mốc tăng trưởng và lịch sử chăm sóc lưu trữ phục vụ in ấn & tư vấn chuyên gia
            </p>
          </div>

          {/* Plant Profile Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 print-avoid-break">
            {includePhotos && (
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                {!failedImages[`hero-${activePlant.id}`] ? (
                  <img
                    src={activePlant.imageUrl}
                    alt={activePlant.name}
                    referrerPolicy="no-referrer"
                    onError={() => markImageFailed(`hero-${activePlant.id}`)}
                    className="w-32 h-32 rounded-2xl object-cover border border-emerald-300 shadow-sm"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-2xl bg-emerald-100 border border-emerald-300 flex flex-col items-center justify-center text-emerald-700 p-2">
                    <Sprout className="w-8 h-8 mb-1" />
                    <span className="text-[10px] font-bold text-center">{activePlant.name}</span>
                  </div>
                )}
                <span className="text-[10px] text-emerald-800 font-bold mt-1.5 uppercase">
                  Nhóm: {activePlant.category} · {activePlant.location || 'Vườn nhà'}
                </span>
              </div>
            )}

            <div className={`${includePhotos ? 'sm:col-span-2' : 'sm:col-span-3'} space-y-2 text-xs`}>
              <div>
                <h3 className="text-base font-black text-emerald-950">{activePlant.name}</h3>
                <p className="italic text-zinc-600 text-xs">{activePlant.scientificName}</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-zinc-800 tabular-nums">
                <div>
                  <span className="text-zinc-500 block text-[10px]">Loại đất / Giá thể:</span>
                  <strong>{activePlant.soilType}</strong>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Ánh sáng:</span>
                  <strong>
                    {activePlant.sunlight === 'full_sun'
                      ? 'Nắng toàn phần'
                      : activePlant.sunlight === 'indirect'
                      ? 'Ánh sáng gián tiếp'
                      : 'Nắng bán phần / Mát'}
                  </strong>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Độ ẩm đất hiện tại:</span>
                  <strong className="text-emerald-700">
                    {activePlant.soilMoisturePercent || 50}% (Chuẩn:{' '}
                    {activePlant.minMoistureThreshold || 45}% -{' '}
                    {activePlant.maxMoistureThreshold || 75}%)
                  </strong>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Chu kỳ tưới định kỳ:</span>
                  <strong>
                    {activePlant.wateringFrequencyDays} ngày/lần (
                    {activePlant.recommendedWaterAmount || '500ml'})
                  </strong>
                </div>
              </div>

              {activePlant.notes && (
                <div className="text-[11px] text-zinc-700 bg-white p-2.5 rounded-xl border border-emerald-100 mt-1">
                  <strong>Ghi chú của người trồng:</strong> {activePlant.notes}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 1: GROWTH PROGRESSION CHART */}
          {includeChart && activePlant.growthHistory.length > 0 && (
            <div className="space-y-2.5 print-avoid-break">
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-900 border-b border-zinc-200 pb-1">
                <TrendingUp className="w-4 h-4 text-emerald-700" />
                <span>1. BIỂU ĐỒ TIẾN TRÌNH SINH TRƯỞNG (CHIỀU CAO & SỨC KHỎE)</span>
              </div>

              <div className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50/70">
                <div className="flex items-end gap-4 h-36 pt-6 pb-2 px-3 border-b border-zinc-200 tabular-nums">
                  {activePlant.growthHistory.map((g, idx) => {
                    const hPercent = Math.max(
                      16,
                      Math.min(100, (g.heightCm / maxHeightCm) * 100)
                    );
                    return (
                      <div
                        key={g.id || idx}
                        className="flex-1 flex flex-col items-center gap-1 h-full justify-end"
                      >
                        <span className="text-[11px] font-extrabold text-emerald-800">
                          {g.heightCm} cm
                        </span>
                        <div
                          style={{ height: `${hPercent}%` }}
                          className="w-full max-w-[36px] rounded-t-lg bg-gradient-to-t from-emerald-600 to-teal-400 border border-emerald-700/20"
                        />
                        <span className="text-[10px] font-semibold text-zinc-600">
                          {new Date(g.date).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                          })}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-zinc-600 tabular-nums">
                  <span>
                    Tổng số mốc ghi nhận: <strong>{activePlant.growthHistory.length}</strong>
                  </span>
                  <span>
                    Tăng trưởng chiều cao:{' '}
                    <strong className="text-emerald-700">
                      +
                      {Math.max(
                        0,
                        (activePlant.growthHistory[activePlant.growthHistory.length - 1]?.heightCm || 0) -
                          (activePlant.growthHistory[0]?.heightCm || 0)
                      )}{' '}
                      cm
                    </strong>
                  </span>
                  <span>
                    Điểm sức khỏe hiện tại:{' '}
                    <strong className="text-emerald-700">{activePlant.healthScore}%</strong>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: VISUAL TIMELINE & IMAGES */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-900 border-b border-zinc-200 pb-1">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <span>
                {includeChart && activePlant.growthHistory.length > 0 ? '2' : '1'}. NHẬT KÝ CỘT MỐC
                TĂNG TRƯỞNG & HÌNH ẢNH THEO DÕI
              </span>
            </div>

            {activePlant.growthHistory.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">
                Chưa có cột mốc tăng trưởng nào được ghi nhận.
              </p>
            ) : (
              <div className="space-y-3">
                {activePlant.growthHistory.map((g, i) => {
                  const hasPhoto = includePhotos && Boolean(g.photoUrl);
                  const imgKey = `milestone-${g.id || i}`;
                  return (
                    <div
                      key={g.id || i}
                      className="flex flex-col sm:flex-row gap-3.5 p-3.5 rounded-2xl border border-zinc-200 bg-white print-avoid-break"
                    >
                      {hasPhoto && (
                        <div className="shrink-0">
                          {!failedImages[imgKey] ? (
                            <img
                              src={g.photoUrl}
                              alt={`Mốc ${i + 1}`}
                              referrerPolicy="no-referrer"
                              onError={() => markImageFailed(imgKey)}
                              className="w-24 h-24 rounded-xl object-cover border border-zinc-200"
                            />
                          ) : (
                            <div className="w-24 h-24 rounded-xl bg-zinc-100 border border-zinc-200 flex flex-col items-center justify-center text-zinc-500">
                              <ImageIcon className="w-6 h-6 mb-1" />
                              <span className="text-[10px]">Mốc {i + 1}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex-1 space-y-1.5 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-extrabold text-emerald-900">
                            Mốc {i + 1} ·{' '}
                            {new Date(g.date).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="text-[11px] font-bold text-emerald-700 tabular-nums">
                            Chiều cao {g.heightCm} cm · {g.leafCount} lá · Sức khỏe {g.healthScore}%
                          </span>
                        </div>
                        <p className="text-zinc-600 leading-relaxed">
                          {g.notes || 'Cây sinh trưởng ổn định, phát triển chồi lá bình thường.'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 3: IRRIGATION & CARE LOGS TABLE */}
          {includeCareLogs && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-900 border-b border-zinc-200 pb-1">
                <Droplets className="w-4 h-4 text-sky-600" />
                <span>
                  {includeChart && activePlant.growthHistory.length > 0 ? '3' : '2'}. LỊCH SỬ TƯỚI
                  NƯỚC, BÓN PHÂN & PHÒNG BỆNH
                </span>
              </div>

              <table className="w-full text-xs text-left border-collapse border border-zinc-200 tabular-nums">
                <thead>
                  <tr className="bg-zinc-100 text-zinc-700 text-[11px]">
                    <th className="border border-zinc-200 p-2">Ngày thực hiện</th>
                    <th className="border border-zinc-200 p-2">Hoạt động</th>
                    <th className="border border-zinc-200 p-2">Định lượng</th>
                    <th className="border border-zinc-200 p-2">Chi tiết thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {activePlant.careLogs.map((c, i) => (
                    <tr key={c.id || i} className="hover:bg-zinc-50 border-b border-zinc-200">
                      <td className="border border-zinc-200 p-2 font-medium">
                        {new Date(c.date).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="border border-zinc-200 p-2 font-bold text-emerald-800">
                        {c.type === 'water'
                          ? 'Tưới nước'
                          : c.type === 'fertilize'
                          ? 'Bón phân'
                          : c.type === 'prune'
                          ? 'Cắt tỉa'
                          : c.type === 'repot'
                          ? 'Thay chậu'
                          : 'Phòng bệnh'}
                      </td>
                      <td className="border border-zinc-200 p-2 text-zinc-700 font-medium">
                        {c.amount || 'Theo chuẩn'}
                      </td>
                      <td className="border border-zinc-200 p-2 text-zinc-600">
                        {c.notes || 'Hoàn tất theo khuyến nghị'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* SECTION 4: ADVISOR RECOMMENDATION & SIGNATURE */}
          {includeSignature && (
            <div className="pt-4 border-t-2 border-dashed border-zinc-200 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs print-avoid-break">
              <div>
                <span className="font-bold text-zinc-800 block mb-1">
                  GHI CHÚ / KHUYẾN NGHỊ CỦA CHUYÊN GIA NÔNG NGHIỆP:
                </span>
                <div className="border border-zinc-300 rounded-xl p-3 h-24 text-zinc-400 italic text-[11px]">
                  (Dành cho kỹ sư nông nghiệp hoặc cán bộ khuyến nông ghi chú phác đồ chăm sóc giai đoạn tiếp theo...)
                </div>
              </div>

              <div className="flex flex-col items-center justify-between text-center">
                <span className="font-bold text-zinc-800">
                  XÁC NHẬN CỦA KỸ SƯ / CHỦ VƯỜN
                </span>
                <div className="text-[11px] text-zinc-400 italic">
                  (Ký, ghi rõ họ tên & ngày xác nhận)
                </div>
                <div className="border-b border-zinc-400 w-44 mt-10" />
              </div>
            </div>
          )}

          {/* Footer watermark */}
          <div className="pt-3 text-center text-[10px] text-zinc-400 border-t border-zinc-100">
            Hồ sơ được tạo bởi ứng dụng Nông Trợ Xanh AI · Tài liệu hỗ trợ lưu trữ & tư vấn nông nghiệp
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
