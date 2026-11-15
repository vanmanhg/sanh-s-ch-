import { jsPDF } from 'jspdf';
import { Plant, WeatherCondition } from '../types';

export interface PdfReportOptions {
  includePhotos: boolean;
  includeChart: boolean;
  includeCareLogs: boolean;
  includeSignature: boolean;
}

export interface GeneratedPdfResult {
  blob: Blob;
  filename: string;
}

const PAGE_W = 1240; // ~150 DPI A4 width (210mm)
const PAGE_H = 1754; // ~150 DPI A4 height (297mm)
const MARGIN = 72;
const CONTENT_W = PAGE_W - MARGIN * 2;
const BOTTOM_LIMIT = PAGE_H - 96;

function loadImageSafe(src?: string): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    if (!src.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    const timer = window.setTimeout(() => resolve(null), 5000);
    img.onload = () => {
      window.clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      resolve(null);
    };
    img.src = src;
  });
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = (text || '').split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const testLine = current ? `${current} ${word}` : word;
    if (ctx.measureText(testLine).width <= maxWidth) {
      current = testLine;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [''];
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fillStyle?: string,
  strokeStyle?: string,
  lineWidth: number = 1.5
) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  if (fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
  ctx.restore();
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fallbackLabel?: string
) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.clip();

  if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const boxRatio = w / h;
    let sx = 0;
    let sy = 0;
    let sw = img.naturalWidth;
    let sh = img.naturalHeight;

    if (imgRatio > boxRatio) {
      sw = img.naturalHeight * boxRatio;
      sx = (img.naturalWidth - sw) / 2;
    } else {
      sh = img.naturalWidth / boxRatio;
      sy = (img.naturalHeight - sh) / 2;
    }

    try {
      ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
    } catch {
      ctx.fillStyle = '#ecfdf5';
      ctx.fillRect(x, y, w, h);
    }
  } else {
    ctx.fillStyle = '#ecfdf5';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#059669';
    ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(fallbackLabel || 'Ảnh cây trồng', x + w / 2, y + h / 2 + 6);
  }
  ctx.restore();

  drawRoundedRect(ctx, x, y, w, h, r, undefined, '#a7f3d0', 2);
}

export async function generatePlantGrowthPdfReport(
  plant: Plant,
  farmLocation: { name: string; address: string },
  weather: WeatherCondition,
  options: PdfReportOptions = {
    includePhotos: true,
    includeChart: true,
    includeCareLogs: true,
    includeSignature: true,
  }
): Promise<GeneratedPdfResult> {
  // Preload hero image & milestone images safely in parallel
  const [heroImg, ...milestoneImgs] = await Promise.all([
    options.includePhotos ? loadImageSafe(plant.imageUrl) : Promise.resolve(null),
    ...(options.includePhotos
      ? plant.growthHistory.map((g) => loadImageSafe(g.photoUrl))
      : []),
  ]);

  const pages: HTMLCanvasElement[] = [];

  const createPage = (pageNum: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = PAGE_W;
    canvas.height = PAGE_H;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);

    // Subtle footer watermark on every page
    ctx.fillStyle = '#94a3b8';
    ctx.font = '15px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(
      `Nông Trợ Xanh AI • Hồ sơ nhật ký sinh trưởng: ${plant.name}`,
      MARGIN,
      PAGE_H - 40
    );
    ctx.textAlign = 'right';
    ctx.fillText(`Trang ${pageNum}`, PAGE_W - MARGIN, PAGE_H - 40);
    ctx.textAlign = 'left';

    pages.push(canvas);
    return { canvas, ctx };
  };

  let pageNum = 1;
  let { ctx } = createPage(pageNum);
  let y = MARGIN;

  const ensureSpace = (neededHeight: number) => {
    if (y + neededHeight > BOTTOM_LIMIT) {
      pageNum += 1;
      const next = createPage(pageNum);
      ctx = next.ctx;
      y = MARGIN;
      // Continuation header
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(
        `TIẾP THEO • HỒ SƠ CÂY TRỒNG: ${plant.name.toUpperCase()}`,
        MARGIN,
        y
      );
      y += 14;
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(MARGIN, y);
      ctx.lineTo(PAGE_W - MARGIN, y);
      ctx.stroke();
      y += 28;
    }
  };

  // --- OFFICIAL HEADER ---
  ctx.fillStyle = '#065f46';
  ctx.font = '800 30px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('NÔNG TRỢ XANH AI', MARGIN, y + 26);

  ctx.fillStyle = '#475569';
  ctx.font = '600 17px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Hệ Thống Quản Lý Canh Tác & Nhật Ký Sinh Trưởng Thông Minh', MARGIN, y + 54);
  ctx.fillText(`Vườn: ${farmLocation.name} · ${farmLocation.address}`, MARGIN, y + 80);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 17px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`MÃ HỒ SƠ: PLANT-${plant.id.toUpperCase()}`, PAGE_W - MARGIN, y + 26);
  ctx.fillStyle = '#475569';
  ctx.font = '16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`, PAGE_W - MARGIN, y + 52);
  ctx.fillText(
    `Thời tiết tại vườn: ${weather.temp}°C · Độ ẩm ${weather.humidity}%`,
    PAGE_W - MARGIN,
    y + 78
  );
  ctx.textAlign = 'left';

  y += 102;
  ctx.strokeStyle = '#047857';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(MARGIN, y);
  ctx.lineTo(PAGE_W - MARGIN, y);
  ctx.stroke();
  y += 38;

  // --- REPORT TITLE ---
  ctx.textAlign = 'center';
  ctx.fillStyle = '#064e3b';
  ctx.font = '800 28px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('BÁO CÁO NHẬT KÝ SINH TRƯỞNG & CHĂM SÓC CÂY TRỒNG', PAGE_W / 2, y);
  y += 28;
  ctx.fillStyle = '#64748b';
  ctx.font = 'italic 16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    'Tài liệu tổng hợp dữ liệu hình ảnh, cột mốc tăng trưởng và nhật ký tưới bón phục vụ lưu trữ & tư vấn chuyên gia',
    PAGE_W / 2,
    y
  );
  ctx.textAlign = 'left';
  y += 34;

  // --- PLANT OVERVIEW CARD ---
  const cardH = 225;
  drawRoundedRect(ctx, MARGIN, y, CONTENT_W, cardH, 20, '#f0fdf4', '#a7f3d0', 2);

  if (options.includePhotos) {
    drawImageCover(ctx, heroImg, MARGIN + 22, y + 22, 180, 180, 16, plant.name);
  }

  const infoX = options.includePhotos ? MARGIN + 226 : MARGIN + 28;
  const infoW = CONTENT_W - (options.includePhotos ? 250 : 56);

  ctx.fillStyle = '#022c22';
  ctx.font = '800 25px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(plant.name, infoX, y + 48);

  ctx.fillStyle = '#475569';
  ctx.font = 'italic 17px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`${plant.scientificName} · Nhóm: ${plant.category.toUpperCase()}`, infoX, y + 76);

  const col1X = infoX;
  const col2X = infoX + infoW / 2;

  ctx.font = '15px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Loại đất / Giá thể:', col1X, y + 112);
  ctx.fillText('Độ ẩm đất hiện tại:', col2X, y + 112);

  ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#0f172a';
  const soilShort = plant.soilType.length > 34 ? plant.soilType.slice(0, 34) + '...' : plant.soilType;
  ctx.fillText(soilShort, col1X, y + 135);
  ctx.fillStyle = '#047857';
  ctx.fillText(
    `${plant.soilMoisturePercent || 50}% (Chuẩn: ${plant.minMoistureThreshold || 45}%-${plant.maxMoistureThreshold || 75}%)`,
    col2X,
    y + 135
  );

  ctx.font = '15px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Chu kỳ tưới & Lượng nước:', col1X, y + 168);
  ctx.fillText('Điểm sức khỏe hiện tại:', col2X, y + 168);

  ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(
    `${plant.wateringFrequencyDays} ngày/lần (${plant.recommendedWaterAmount || '500ml'})`,
    col1X,
    y + 191
  );
  ctx.fillStyle = '#059669';
  ctx.fillText(`${plant.healthScore || 90}/100 · Vị trí: ${plant.location || 'Vườn nhà'}`, col2X, y + 191);

  y += cardH + 34;

  // --- SECTION 1: GROWTH CHART ---
  if (options.includeChart && plant.growthHistory.length > 0) {
    ensureSpace(260);
    ctx.fillStyle = '#064e3b';
    ctx.font = '800 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('1. BIỂU ĐỒ TIẾN TRÌNH CHIỀU CAO & SỨC KHỎE', MARGIN, y);
    y += 14;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(MARGIN, y);
    ctx.lineTo(PAGE_W - MARGIN, y);
    ctx.stroke();
    y += 18;

    const chartH = 205;
    drawRoundedRect(ctx, MARGIN, y, CONTENT_W, chartH, 16, '#f8fafc', '#e2e8f0', 1.5);

    const maxH = Math.max(...plant.growthHistory.map((g) => g.heightCm), 60);
    const barCount = plant.growthHistory.length;
    const slotW = (CONTENT_W - 80) / Math.max(barCount, 1);
    const barMaxH = 115;
    const baseY = y + 160;

    plant.growthHistory.forEach((g, idx) => {
      const centerX = MARGIN + 40 + slotW * idx + slotW / 2;
      const barW = Math.min(72, slotW * 0.55);
      const barH = Math.max(18, (g.heightCm / maxH) * barMaxH);

      drawRoundedRect(
        ctx,
        centerX - barW / 2,
        baseY - barH,
        barW,
        barH,
        8,
        '#10b981'
      );

      ctx.textAlign = 'center';
      ctx.fillStyle = '#065f46';
      ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`${g.heightCm} cm`, centerX, baseY - barH - 8);

      ctx.fillStyle = '#475569';
      ctx.font = '14px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(
        new Date(g.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        centerX,
        baseY + 22
      );
      ctx.textAlign = 'left';
    });

    y += chartH + 34;
  }

  // --- SECTION 2: TIMELINE WITH PHOTOS ---
  ensureSpace(90);
  ctx.fillStyle = '#064e3b';
  ctx.font = '800 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    `${options.includeChart && plant.growthHistory.length > 0 ? '2' : '1'}. NHẬT KÝ CỘT MỐC SINH TRƯỞNG & HÌNH ẢNH`,
    MARGIN,
    y
  );
  y += 14;
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(MARGIN, y);
  ctx.lineTo(PAGE_W - MARGIN, y);
  ctx.stroke();
  y += 20;

  plant.growthHistory.forEach((entry, idx) => {
    const hasPhoto = options.includePhotos && Boolean(entry.photoUrl);
    ctx.font = '16px "Plus Jakarta Sans", sans-serif';
    const notesText = entry.notes || 'Cây sinh trưởng ổn định, lá xanh đều, không phát hiện sâu bệnh.';
    const textWidth = CONTENT_W - (hasPhoto ? 185 : 56);
    const noteLines = wrapTextLines(ctx, notesText, textWidth);
    const boxH = Math.max(hasPhoto ? 132 : 98, 72 + noteLines.length * 22);

    ensureSpace(boxH + 16);

    drawRoundedRect(ctx, MARGIN, y, CONTENT_W, boxH, 14, '#ffffff', '#cbd5e1', 1.5);

    if (hasPhoto) {
      drawImageCover(
        ctx,
        milestoneImgs[idx] || null,
        MARGIN + 16,
        y + 16,
        100,
        100,
        12,
        `Mốc ${idx + 1}`
      );
    }

    const tx = hasPhoto ? MARGIN + 136 : MARGIN + 24;
    ctx.fillStyle = '#065f46';
    ctx.font = 'bold 17px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      `Mốc ${idx + 1} · ${new Date(entry.date).toLocaleDateString('vi-VN')}`,
      tx,
      y + 34
    );

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      `Chiều cao: ${entry.heightCm} cm   |   Số lá: ${entry.leafCount} lá   |   Sức khỏe: ${entry.healthScore}%`,
      tx,
      y + 60
    );

    ctx.fillStyle = '#475569';
    ctx.font = '15px "Plus Jakarta Sans", sans-serif';
    noteLines.forEach((line, lineIdx) => {
      ctx.fillText(line, tx, y + 88 + lineIdx * 22);
    });

    y += boxH + 14;
  });

  y += 18;

  // --- SECTION 3: CARE LOGS ---
  if (options.includeCareLogs && plant.careLogs.length > 0) {
    const secIdx = options.includeChart && plant.growthHistory.length > 0 ? '3' : '2';
    ensureSpace(120);
    ctx.fillStyle = '#064e3b';
    ctx.font = '800 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`${secIdx}. LỊCH SỬ TƯỚI NƯỚC, BÓN PHÂN & PHÒNG BỆNH`, MARGIN, y);
    y += 14;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(MARGIN, y);
    ctx.lineTo(PAGE_W - MARGIN, y);
    ctx.stroke();
    y += 18;

    // Table header
    drawRoundedRect(ctx, MARGIN, y, CONTENT_W, 42, 8, '#f1f5f9', '#cbd5e1', 1);
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Ngày thực hiện', MARGIN + 16, y + 27);
    ctx.fillText('Hoạt động', MARGIN + 190, y + 27);
    ctx.fillText('Định lượng', MARGIN + 390, y + 27);
    ctx.fillText('Ghi chú thao tác', MARGIN + 580, y + 27);
    y += 42;

    const careLabelMap: Record<string, string> = {
      water: 'Tưới nước',
      fertilize: 'Bón phân',
      prune: 'Cắt tỉa',
      pest_control: 'Phòng bệnh',
      repot: 'Thay chậu',
    };

    plant.careLogs.forEach((log) => {
      const note = log.notes || 'Hoàn tất theo quy trình';
      ctx.font = '15px "Plus Jakarta Sans", sans-serif';
      const noteLines = wrapTextLines(ctx, note, CONTENT_W - 596);
      const rowH = Math.max(40, 18 + noteLines.length * 20);
      ensureSpace(rowH + 6);

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.strokeRect(MARGIN, y, CONTENT_W, rowH);

      ctx.fillStyle = '#0f172a';
      ctx.font = '15px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(new Date(log.date).toLocaleDateString('vi-VN'), MARGIN + 16, y + 25);

      ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#047857';
      ctx.fillText(careLabelMap[log.type] || 'Chăm sóc', MARGIN + 190, y + 25);

      ctx.font = '15px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#334155';
      ctx.fillText(log.amount || 'Theo chuẩn', MARGIN + 390, y + 25);

      noteLines.forEach((line, lIdx) => {
        ctx.fillText(line, MARGIN + 580, y + 25 + lIdx * 20);
      });

      y += rowH;
    });

    y += 28;
  }

  // --- SECTION 4: SIGNATURE / ADVISOR NOTES ---
  if (options.includeSignature) {
    ensureSpace(165);
    const leftW = CONTENT_W * 0.58;
    const rightW = CONTENT_W * 0.38;
    const rightX = MARGIN + leftW + CONTENT_W * 0.04;

    drawRoundedRect(ctx, MARGIN, y, leftW, 130, 14, '#f8fafc', '#cbd5e1', 1.5);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('NHẬN XÉT & KHUYẾN NGHỊ CỦA CHUYÊN GIA NÔNG NGHIỆP:', MARGIN + 18, y + 30);
    ctx.fillStyle = '#64748b';
    ctx.font = 'italic 14px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      '(Dành cho kỹ sư nông nghiệp hoặc cán bộ khuyến nông ghi chú phác đồ giai đoạn tiếp theo)',
      MARGIN + 18,
      y + 56
    );

    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('XÁC NHẬN CỦA CHỦ VƯỜN / KỸ SƯ', rightX + rightW / 2, y + 30);
    ctx.fillStyle = '#64748b';
    ctx.font = 'italic 14px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('(Ký, ghi rõ họ tên & ngày xác nhận)', rightX + rightW / 2, y + 54);
    ctx.strokeStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(rightX + 40, y + 115);
    ctx.lineTo(rightX + rightW - 40, y + 115);
    ctx.stroke();
    ctx.textAlign = 'left';
  }

  // Build PDF using jsPDF
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  pages.forEach((canvas, index) => {
    if (index > 0) pdf.addPage();
    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
  });

  const safePlantName = plant.name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

  const filename = `Bao_Cao_Sinh_Truong_${safePlantName || 'Cay_Trong'}_${new Date()
    .toISOString()
    .slice(0, 10)}.pdf`;

  const blob = pdf.output('blob');
  return { blob, filename };
}
