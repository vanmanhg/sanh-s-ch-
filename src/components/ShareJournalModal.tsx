import React, { useState, useRef } from 'react';
import { Plant } from '../types';
import { useApp } from '../context/AppContext';
import {
  Share2,
  Download,
  Users,
  Copy,
  CheckCircle2,
  X,
  Sparkles,
  TrendingUp,
  Droplets,
  Calendar,
  MapPin,
  ExternalLink,
  Sprout,
  Image as ImageIcon
} from 'lucide-react';

interface ShareJournalModalProps {
  plant: Plant;
  onClose: () => void;
  onNavigateToCommunity?: () => void;
}

export const ShareJournalModal: React.FC<ShareJournalModalProps> = ({
  plant,
  onClose,
  onNavigateToCommunity
}) => {
  const { farmLocation, addPost } = useApp();
  const [copied, setCopied] = useState<boolean>(false);
  const [postedSuccess, setPostedSuccess] = useState<boolean>(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);

  const cardRef = useRef<HTMLDivElement>(null);

  // Latest growth metrics
  const latestGrowth = plant.growthHistory[plant.growthHistory.length - 1] || {
    heightCm: 30,
    leafCount: 10,
    healthScore: 90,
    notes: 'Sinh trưởng ổn định'
  };

  const initialGrowth = plant.growthHistory[0] || latestGrowth;
  const heightGain = Math.max(0, latestGrowth.heightCm - initialGrowth.heightCm);

  // 1. One-click Publish to Community Feed
  const handlePublishToCommunity = () => {
    const postContent = `🌱 NHẬT KÝ TĂNG TRƯỞNG: ${plant.name.toUpperCase()} (${plant.scientificName})\n\n` +
      `📍 Vườn: ${farmLocation.name}\n` +
      `📏 Chiều cao hiện tại: ${latestGrowth.heightCm} cm (+${heightGain}cm sau ${plant.growthHistory.length} mốc theo dõi)\n` +
      `🍃 Số lượng lá: ${latestGrowth.leafCount} lá/chồi khỏe mạnh\n` +
      `💧 Độ ẩm đất hiện tại: ${plant.soilMoisturePercent || 50}%\n` +
      `💖 Đánh giá sức khỏe: ${latestGrowth.healthScore}% Tốt\n\n` +
      `📝 Ghi chú: "${latestGrowth.notes || plant.notes || 'Cây phát triển rất tốt, đọt non bật đều đặn.'}"\n\n` +
      `Cả nhà có kinh nghiệm bón phân gì thêm cho giai đoạn này chia sẻ cho mình với nhé! 🌿`;

    addPost({
      author: {
        name: 'Tôi (Chủ Vườn ' + farmLocation.name.split('-')[0].trim() + ')',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        badge: 'Nhà Nông Chăm Chỉ',
        location: farmLocation.address.split(',')[0]
      },
      content: postContent,
      tags: ['NhậtKýVườn', 'KhoeCây', plant.category === 'fruit' ? 'CâyĂnTrái' : 'LàmVườn', 'HữuCơ'],
      images: [plant.imageUrl]
    });

    setPostedSuccess(true);
    setTimeout(() => {
      onClose();
      if (onNavigateToCommunity) {
        onNavigateToCommunity();
      }
    }, 1200);
  };

  // 2. Generate and Download Canvas PNG Image Card
  const handleDownloadImageCard = () => {
    setIsGeneratingImage(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 1000;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas not supported');
      }

      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 800, 1000);
      bgGrad.addColorStop(0, '#064e3b'); // Emerald-900
      bgGrad.addColorStop(0.5, '#065f46'); // Emerald-800
      bgGrad.addColorStop(1, '#022c22'); // Emerald-950
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 800, 1000);

      // Card Header
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('NÔNG TRỢ XANH AI • NHẬT KÝ TĂNG TRƯỞNG', 50, 60);

      ctx.fillStyle = '#a7f3d0';
      ctx.font = '16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`📍 ${farmLocation.name} • ${new Date().toLocaleDateString('vi-VN')}`, 50, 90);

      // White inner panel
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(50, 120, 700, 780, 24);
      ctx.fill();

      // Inner Title
      ctx.fillStyle = '#064e3b';
      ctx.font = 'bold 32px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(plant.name, 80, 175);

      ctx.fillStyle = '#6b7280';
      ctx.font = 'italic 18px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(plant.scientificName, 80, 205);

      // Stats boxes (Height, Leaves, Health, Moisture)
      const drawBox = (x: number, y: number, w: number, h: number, title: string, val: string, color: string) => {
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 16);
        ctx.fill();
        ctx.strokeStyle = '#e2e8f0';
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.font = '14px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(title, x + 20, y + 30);

        ctx.fillStyle = color;
        ctx.font = 'bold 28px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(val, x + 20, y + 68);
      };

      drawBox(80, 230, 310, 95, 'Chiều Cao Hiện Tại', `${latestGrowth.heightCm} cm (+${heightGain}cm)`, '#059669');
      drawBox(410, 230, 310, 95, 'Số Lượng Lá / Nhánh', `${latestGrowth.leafCount} Lá`, '#0284c7');
      drawBox(80, 340, 310, 95, 'Điểm Sức Khỏe', `${latestGrowth.healthScore}% Rất Tốt`, '#059669');
      drawBox(410, 340, 310, 95, 'Độ Ẩm Đất Đo Được', `${plant.soilMoisturePercent || 50}% Tối Ưu`, '#2563eb');

      // Timeline Visual Progression Title
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Lịch Trình Chiều Cao Qua Các Mốc Đo:', 80, 480);

      // Milestone bars
      plant.growthHistory.forEach((g, i) => {
        const y = 520 + i * 45;
        if (y < 700) {
          ctx.fillStyle = '#334155';
          ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
          ctx.fillText(`Mốc ${i + 1} (${new Date(g.date).toLocaleDateString('vi-VN')}):`, 80, y);

          ctx.fillStyle = '#059669';
          ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
          ctx.fillText(`${g.heightCm} cm`, 260, y);

          // Bar
          ctx.fillStyle = '#e2e8f0';
          ctx.beginPath();
          ctx.roundRect(330, y - 14, 380, 16, 8);
          ctx.fill();

          const maxH = Math.max(...plant.growthHistory.map(item => item.heightCm), 80);
          const barW = Math.max(30, (g.heightCm / maxH) * 380);
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.roundRect(330, y - 14, barW, 16, 8);
          ctx.fill();
        }
      });

      // Farmer notes box
      ctx.fillStyle = '#ecfdf5';
      ctx.beginPath();
      ctx.roundRect(80, 720, 640, 100, 16);
      ctx.fill();
      ctx.strokeStyle = '#a7f3d0';
      ctx.stroke();

      ctx.fillStyle = '#065f46';
      ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('🌱 Ghi chú sinh trưởng:', 100, 750);

      ctx.fillStyle = '#047857';
      ctx.font = '14px "Plus Jakarta Sans", sans-serif';
      const notesText = latestGrowth.notes || plant.notes || 'Cây phân cành mạnh, lá xanh bóng mượt và hấp thụ dinh dưỡng tốt.';
      ctx.fillText(notesText.length > 70 ? notesText.substring(0, 70) + '...' : notesText, 100, 785);

      // Watermark footer
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Nông Trợ Xanh AI • Ứng dụng Làm Vườn & Nông Nghiệp Thông Minh', 180, 860);

      // Trigger download
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `The_Nhat_Ky_${plant.name.replace(/\s+/g, '_')}.png`;
      a.click();
    } catch (err) {
      console.error('Error generating image canvas:', err);
      alert('Không thể xuất thẻ ảnh tự động. Bạn có thể chụp màn hình thẻ bên dưới nhé!');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // 3. Copy text summary
  const handleCopySummary = () => {
    const summary = `🌿 Nhật Ký Cây: ${plant.name} | Chiều cao: ${latestGrowth.heightCm}cm | Sức khỏe: ${latestGrowth.healthScore}% | Độ ẩm: ${plant.soilMoisturePercent || 50}% tại ${farmLocation.name}`;
    navigator.clipboard?.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 flex flex-col">
        {/* Modal Top Bar */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
                Chia Sẻ Thẻ Nhật Ký Tăng Trưởng
              </h3>
              <p className="text-xs text-zinc-500">
                Đăng lên cộng đồng làm vườn hoặc chia sẻ mạng xã hội
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* VISUAL COMPILED SHARE CARD PREVIEW */}
        <div className="p-4 sm:p-5 overflow-y-auto max-h-[65vh]">
          <div
            ref={cardRef}
            className="rounded-3xl overflow-hidden bg-gradient-to-tr from-emerald-800 via-teal-800 to-emerald-950 text-white p-5 shadow-xl space-y-4 border border-emerald-600/40 relative"
          >
            {/* Ambient background decoration */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />

            {/* Header info */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                  <Sprout className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold text-xs tracking-tight block">
                    NÔNG TRỢ XANH AI
                  </span>
                  <span className="text-[10px] text-emerald-200 flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" />
                    <span>{farmLocation.name.split('-')[0]}</span>
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-emerald-100 text-[10px] font-bold">
                {new Date().toLocaleDateString('vi-VN')}
              </span>
            </div>

            {/* Plant Hero Card */}
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 flex items-center gap-3.5 relative z-10">
              <img
                src={plant.imageUrl}
                alt={plant.name}
                className="w-16 h-16 rounded-xl object-cover border border-white/30 shrink-0"
              />
              <div className="space-y-0.5">
                <span className="px-1.5 py-0.2 rounded bg-emerald-400 text-emerald-950 text-[9px] font-extrabold uppercase">
                  {plant.category}
                </span>
                <h4 className="font-black text-sm sm:text-base leading-tight">
                  {plant.name}
                </h4>
                <p className="text-[11px] text-emerald-200 italic line-clamp-1">
                  {plant.scientificName}
                </p>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs relative z-10">
              <div className="bg-black/25 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
                <span className="text-[10px] text-emerald-200 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-300" /> Chiều cao hiện tại
                </span>
                <div className="text-lg font-black text-white mt-0.5">
                  {latestGrowth.heightCm} cm{' '}
                  <span className="text-xs font-normal text-emerald-300">(+{heightGain}cm)</span>
                </div>
              </div>

              <div className="bg-black/25 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
                <span className="text-[10px] text-emerald-200 flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-sky-300" /> Độ ẩm đất
                </span>
                <div className="text-lg font-black text-sky-300 mt-0.5">
                  {plant.soilMoisturePercent || 50}%{' '}
                  <span className="text-xs font-normal text-emerald-200">Tối ưu</span>
                </div>
              </div>
            </div>

            {/* Growth Journey Milestones Timeline */}
            <div className="bg-black/20 backdrop-blur-xs p-3 rounded-xl border border-white/10 space-y-2 text-xs relative z-10">
              <div className="text-[11px] font-bold text-emerald-200">
                Tiến trình tăng trưởng:
              </div>
              <div className="flex items-end justify-between gap-2 h-16 pt-2 px-1">
                {plant.growthHistory.map((g, idx) => {
                  const maxHeight = Math.max(...plant.growthHistory.map(item => item.heightCm), 80);
                  const hPercent = Math.max(20, Math.min(100, (g.heightCm / maxHeight) * 100));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <span className="text-[10px] font-black text-emerald-200">{g.heightCm}cm</span>
                      <div
                        style={{ height: `${hPercent}%` }}
                        className="w-full max-w-[20px] rounded-t-sm bg-gradient-to-t from-emerald-400 to-teal-200"
                      />
                      <span className="text-[9px] text-emerald-300">
                        {new Date(g.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Note bubble */}
            <div className="p-2.5 bg-emerald-950/60 rounded-xl border border-emerald-600/40 text-[11px] text-emerald-100 italic relative z-10">
              💬 "{latestGrowth.notes || plant.notes || 'Cây phát triển đều đặn, màu lá xanh tốt không có sâu bệnh.'}"
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-850 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
          {/* Main Action: 1-Click Publish to Community */}
          <button
            onClick={handlePublishToCommunity}
            disabled={postedSuccess}
            className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer ${
              postedSuccess
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {postedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Đã Đăng Lên Diễn Đàn Cộng Đồng!</span>
              </>
            ) : (
              <>
                <Users className="w-4 h-4" />
                <span>Đăng Ngay Lên Diễn Đàn Làm Vườn & Nông Dân</span>
              </>
            )}
          </button>

          {/* Social share row */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleDownloadImageCard}
              disabled={isGeneratingImage}
              className="py-2 px-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isGeneratingImage ? 'Đang tạo...' : 'Tải Ảnh (PNG)'}</span>
            </button>

            <a
              href={`https://zalo.me/share?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(`Nhật ký tăng trưởng ${plant.name}: Đã đạt ${latestGrowth.heightCm}cm!`)}`}
              target="_blank"
              rel="noreferrer"
              className="py-2 px-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center justify-center gap-1 hover:bg-blue-700"
            >
              <span>Gửi Zalo</span>
            </a>

            <button
              onClick={handleCopySummary}
              className="py-2 px-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-zinc-500" />
              <span>{copied ? 'Đã chép!' : 'Chép text'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
