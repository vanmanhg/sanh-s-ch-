import React, { useRef } from 'react';
import { Plant } from '../types';
import { useApp } from '../context/AppContext';
import {
  Printer,
  Download,
  FileText,
  X,
  Droplets,
  Sparkles,
  Calendar,
  MapPin,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';

interface PlantReportPdfModalProps {
  plant: Plant;
  onClose: () => void;
}

export const PlantReportPdfModal: React.FC<PlantReportPdfModalProps> = ({ plant, onClose }) => {
  const { farmLocation, weather } = useApp();
  const printAreaRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    // Standard high-quality browser print to PDF
    window.print();
  };

  const handleDownloadTextSummary = () => {
    const textContent = `
======================================================
BÁO CÁO THEO DÕI SINH TRƯỞNG & LỊCH SỬ TƯỚI TIÊU NÔNG VỤ
NÔNG TRỢ XANH AI - SMART GARDENING & AGRICULTURE
======================================================
Tên cây trồng: ${plant.name} (${plant.scientificName})
Thuộc cơ sở/Vườn: ${farmLocation.name}
Địa chỉ canh tác: ${farmLocation.address}
Ngày xuất báo cáo: ${new Date().toLocaleDateString('vi-VN')}
Điều kiện thời tiết: ${weather.temp}°C, Độ ẩm không khí: ${weather.humidity}%

I. THÔNG SỐ CANH TÁC & THỔ NHƯỠNG:
- Loại đất: ${plant.soilType}
- Nhu cầu ánh sáng: ${plant.sunlight}
- Độ ẩm đất hiện tại: ${plant.soilMoisturePercent || 50}% (Ngưỡng thích hợp: ${plant.minMoistureThreshold || 45}% - ${plant.maxMoistureThreshold || 75}%)
- Tần suất tưới: ${plant.wateringFrequencyDays} ngày/lần
- Lượng nước tưới khuyến nghị: ${plant.recommendedWaterAmount || '500ml - 1L'}
- Điểm đánh giá sức khỏe cây: ${plant.healthScore || 90}/100

II. NHẬT KÝ TĂNG TRƯỞNG (GROWTH LOGS):
${plant.growthHistory.map((g, idx) => `[Mốc ${idx + 1}] Ngày: ${new Date(g.date).toLocaleDateString('vi-VN')} | Chiều cao: ${g.heightCm} cm | Số lá: ${g.leafCount} | Sức khỏe: ${g.healthScore}% | Ghi chú: ${g.notes || 'Bình thường'}`).join('\n')}

III. LỊCH SỬ TƯỚI TIÊU & BÓN PHÂN (IRRIGATION & FERTILIZATION HISTORY):
${plant.careLogs.map((c, idx) => `[${idx + 1}] ${new Date(c.date).toLocaleDateString('vi-VN')} - ${c.type.toUpperCase()} | Lượng: ${c.amount || 'Đầy đủ'} | Chi tiết: ${c.notes || 'Hoàn thành'}`).join('\n')}

IV. Ý KIẾN CHUYÊN GIA NÔNG NGHIỆP:
..................................................................
..................................................................
Chữ ký Cố Vấn Nông Nghiệp / Kỹ Sư: ..............................
`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bao_Cao_${plant.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Modal Container */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-3xl w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Modal Top Bar (Hidden during print) */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-850 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
                Xuất Báo Cáo Sinh Trưởng & Lịch Sử Tưới Nước
              </h3>
              <p className="text-xs text-zinc-500">
                Lưu trữ hồ sơ thực tế hoặc gửi cho chuyên gia nông nghiệp tư vấn
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTextSummary}
              className="px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1 cursor-pointer"
              title="Tải tóm tắt văn bản"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Tải File Text</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>In PDF / Lưu A4</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE REPORT PREVIEW BODY */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 bg-white text-zinc-900 print:p-0 print:m-0 print:text-black" id="printable-report" ref={printAreaRef}>
          {/* Official Document Header */}
          <div className="border-b-2 border-emerald-700 pb-4 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-emerald-800 uppercase tracking-wider">
                  NÔNG TRỢ XANH AI
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold uppercase">
                  Agri-Smart Pro
                </span>
              </div>
              <p className="text-xs text-zinc-600 font-medium mt-0.5">
                Hệ Thống Quản Lý Canh Tác & Bệnh Học Cây Trồng Thông Minh
              </p>
              <div className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-700" />
                <span>{farmLocation.name} • {farmLocation.address}</span>
              </div>
            </div>

            <div className="text-right text-xs space-y-0.5 shrink-0">
              <div className="font-bold text-zinc-800">
                MÃ HỒ SƠ: <span className="font-mono text-emerald-700">PLANT-{plant.id.toUpperCase()}</span>
              </div>
              <div className="text-zinc-500 text-[11px]">
                Ngày xuất: {new Date().toLocaleDateString('vi-VN')}
              </div>
              <div className="text-[11px] text-zinc-500">
                Thời tiết tại vườn: {weather.temp}°C, Ẩm {weather.humidity}%
              </div>
            </div>
          </div>

          {/* Title of Document */}
          <div className="text-center py-2">
            <h2 className="text-lg sm:text-xl font-black text-emerald-900 uppercase tracking-tight">
              HỒ SƠ THEO DÕI TĂNG TRƯỞNG & LỊCH TRÌNH TƯỚI TIÊU
            </h2>
            <p className="text-xs text-zinc-500 italic mt-0.5">
              Tài liệu xác thực dữ liệu sinh học cây trồng lưu trữ phục vụ tư vấn nông nghiệp
            </p>
          </div>

          {/* Plant Profile Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200">
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
              <img
                src={plant.imageUrl}
                alt={plant.name}
                className="w-28 h-28 rounded-2xl object-cover border border-emerald-300 shadow-sm"
              />
              <span className="text-[10px] text-emerald-800 font-bold mt-1.5 uppercase">
                {plant.category}
              </span>
            </div>

            <div className="sm:col-span-2 space-y-2 text-xs">
              <div>
                <h3 className="text-base font-black text-emerald-950">{plant.name}</h3>
                <p className="italic text-zinc-600 text-xs">{plant.scientificName}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-zinc-800">
                <div>
                  <span className="text-zinc-500 block text-[10px]">Loại đất / Giá thể:</span>
                  <strong>{plant.soilType}</strong>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Ánh sáng:</span>
                  <strong>{plant.sunlight === 'full_sun' ? 'Nắng toàn phần' : 'Bóng râm mát'}</strong>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Độ ẩm đất hiện tại:</span>
                  <strong className="text-emerald-700">{plant.soilMoisturePercent || 50}% (Tối ưu: {plant.minMoistureThreshold || 45}% - {plant.maxMoistureThreshold || 75}%)</strong>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Chu kỳ tưới định kỳ:</span>
                  <strong>{plant.wateringFrequencyDays} ngày/lần ({plant.recommendedWaterAmount || '500ml'})</strong>
                </div>
              </div>

              {plant.notes && (
                <div className="text-[11px] text-zinc-600 bg-white p-2 rounded-xl border border-emerald-100 mt-1">
                  <strong>Ghi chú của người trồng:</strong> {plant.notes}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 1: GROWTH PROGRESSION TABLE */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-900 border-b border-zinc-200 pb-1">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              <span>1. TIẾN TRÌNH SINH TRƯỞNG & PHÁT TRIỂN (GROWTH MILESTONES)</span>
            </div>

            <table className="w-full text-xs text-left border-collapse border border-zinc-200">
              <thead>
                <tr className="bg-zinc-100 text-zinc-700 text-[11px]">
                  <th className="border border-zinc-200 p-2">Thời gian</th>
                  <th className="border border-zinc-200 p-2">Chiều cao (cm)</th>
                  <th className="border border-zinc-200 p-2">Số lượng lá/nhánh</th>
                  <th className="border border-zinc-200 p-2">Chỉ số sức khỏe</th>
                  <th className="border border-zinc-200 p-2">Đặc điểm quan sát & Phát triển</th>
                </tr>
              </thead>
              <tbody>
                {plant.growthHistory.map((g, i) => (
                  <tr key={i} className="hover:bg-zinc-50 border-b border-zinc-200">
                    <td className="border border-zinc-200 p-2 font-medium">
                      {new Date(g.date).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="border border-zinc-200 p-2 font-bold text-emerald-700">
                      {g.heightCm} cm
                    </td>
                    <td className="border border-zinc-200 p-2">{g.leafCount} lá</td>
                    <td className="border border-zinc-200 p-2">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        {g.healthScore}%
                      </span>
                    </td>
                    <td className="border border-zinc-200 p-2 text-zinc-600">
                      {g.notes || 'Cây sinh trưởng ổn định, không sâu hại'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SECTION 2: IRRIGATION & CARE LOGS TABLE */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-900 border-b border-zinc-200 pb-1">
              <Droplets className="w-4 h-4 text-sky-600" />
              <span>2. NHẬT KÝ TƯỚI TIÊU & BÓN PHÂN (IRRIGATION & FERTILIZATION LOGS)</span>
            </div>

            <table className="w-full text-xs text-left border-collapse border border-zinc-200">
              <thead>
                <tr className="bg-zinc-100 text-zinc-700 text-[11px]">
                  <th className="border border-zinc-200 p-2">Ngày thực hiện</th>
                  <th className="border border-zinc-200 p-2">Hoạt động</th>
                  <th className="border border-zinc-200 p-2">Định lượng</th>
                  <th className="border border-zinc-200 p-2">Chi tiết thao tác</th>
                </tr>
              </thead>
              <tbody>
                {plant.careLogs.map((c, i) => (
                  <tr key={i} className="hover:bg-zinc-50 border-b border-zinc-200">
                    <td className="border border-zinc-200 p-2 font-medium">
                      {new Date(c.date).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="border border-zinc-200 p-2 font-bold">
                      {c.type === 'water' ? '💧 Tưới nước' : c.type === 'fertilize' ? '🌿 Bón phân' : c.type === 'prune' ? '✂️ Tỉa cành' : '🛡️ Phòng bệnh'}
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

          {/* SECTION 3: ADVISOR RECOMMENDATION & SIGNATURE */}
          <div className="pt-4 border-t-2 border-dashed border-zinc-200 grid grid-cols-2 gap-8 text-xs">
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
              <div className="border-b border-zinc-400 w-40 mt-8" />
            </div>
          </div>

          {/* Footer watermark */}
          <div className="pt-4 text-center text-[10px] text-zinc-400 border-t border-zinc-100">
            Hồ sơ được tạo tự động bởi ứng dụng Nông Trợ Xanh AI • Hỗ trợ kết nối canh tác thông minh 2026
          </div>
        </div>
      </div>
    </div>
  );
};
