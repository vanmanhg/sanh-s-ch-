export type CropCategory = 'rice' | 'coffee' | 'vegetables' | 'fruits';

export interface DailyPricePoint {
  date: string; // YYYY-MM-DD
  dayLabel: string; // DD/MM
  price: number; // VND per kg
  high: number;
  low: number;
  volumeTons: number;
}

export interface AgriculturalCommodity {
  id: string;
  category: CropCategory;
  name: string;
  nameEn: string;
  variety: string;
  region: string;
  unit: string;
  marketAnalysis: string;
  marketAnalysisEn: string;
  dailyHistory: DailyPricePoint[];
}

function buildDailySeries(
  basePrices: number[],
  spreadRatio: number,
  baseVolumeTons: number,
  endDateIso = '2026-11-14'
): DailyPricePoint[] {
  const end = new Date(`${endDateIso}T12:00:00Z`);
  const len = basePrices.length;

  return basePrices.map((price, idx) => {
    const d = new Date(end);
    d.setUTCDate(end.getUTCDate() - (len - 1 - idx));
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');

    const roundedPrice = Math.round(price);
    const halfSpread = Math.max(50, Math.round(roundedPrice * spreadRatio));
    const wave = Math.sin((idx + 1) * 0.85) * 0.14 + Math.cos((idx + 2) * 0.45) * 0.08;
    const volumeTons = Math.max(12, Math.round(baseVolumeTons * (1 + wave)));

    return {
      date: `${yyyy}-${mm}-${dd}`,
      dayLabel: `${dd}/${mm}`,
      price: roundedPrice,
      high: roundedPrice + halfSpread,
      low: Math.max(500, roundedPrice - halfSpread),
      volumeTons
    };
  });
}

export const MARKET_COMMODITIES: AgriculturalCommodity[] = [
  {
    id: 'rice-om5451',
    category: 'rice',
    name: 'Lúa Hạt Dài OM 5451 (Tươi)',
    nameEn: 'OM 5451 Long-Grain Paddy (Fresh)',
    variety: 'Cắt máy tại ruộng · ĐBSCL',
    region: 'An Giang & Đồng Tháp',
    unit: 'đ/kg',
    marketAnalysis:
      'Thu hoạch vụ Thu Đông dần khép lại giúp nguồn cung ổn định trở lại; thương lái thu mua mạnh tại các cánh đồng lớn An Giang.',
    marketAnalysisEn:
      'Autumn-Winter harvest supply is stabilizing while millers step up procurement across An Giang and Dong Thap.',
    dailyHistory: buildDailySeries(
      [
        8600, 8580, 8550, 8520, 8500, 8450, 8420, 8400, 8380, 8350,
        8320, 8300, 8260, 8250, 8220, 8180, 8150, 8150, 8180, 8200,
        8220, 8250, 8280, 8310, 8340, 8360, 8390, 8410, 8430, 8450
      ],
      0.018,
      420
    )
  },
  {
    id: 'rice-st25',
    category: 'rice',
    name: 'Lúa Thơm Đặc Sản ST25',
    nameEn: 'ST25 Fragrant Specialty Paddy',
    variety: 'Lúa khô tiêu chuẩn xuất khẩu',
    region: 'Sóc Trăng & Bạc Liêu',
    unit: 'đ/kg',
    marketAnalysis:
      'Đơn hàng gạo thơm xuất khẩu cuối năm tăng 14%, giá lúa ST25 giữ đà nhích nhẹ và duy trì mặt bằng cao.',
    marketAnalysisEn:
      'Year-end fragrant rice export orders rose 14%, keeping ST25 farm-gate quotes firm near seasonal highs.',
    dailyHistory: buildDailySeries(
      [
        10400, 10450, 10420, 10480, 10500, 10520, 10560, 10600, 10580, 10620,
        10650, 10680, 10700, 10720, 10750, 10740, 10780, 10800, 10820, 10850,
        10880, 10900, 10940, 10950, 10980, 11000, 11020, 11050, 11080, 11120
      ],
      0.015,
      260
    )
  },
  {
    id: 'coffee-robusta',
    category: 'coffee',
    name: 'Cà Phê Nhân Xô Robusta',
    nameEn: 'Robusta Green Coffee Beans',
    variety: 'Hạt khô tiêu chuẩn thủy phần 12.5%',
    region: 'Đắk Lắk & Đắk Nông',
    unit: 'đ/kg',
    marketAnalysis:
      'Tồn kho Robusta toàn cầu duy trì ở mức thấp cùng tiến độ thu hái đầu vụ chậm do mưa trái mùa hỗ trợ giá nội địa vượt 118.000 đ/kg.',
    marketAnalysisEn:
      'Tight global Robusta inventories and delayed early picking from unseasonal rains support domestic prices above 118,000 VND/kg.',
    dailyHistory: buildDailySeries(
      [
        112400, 112800, 113100, 112900, 113400, 113800, 114200, 114000, 114600, 115000,
        114800, 115300, 115700, 116100, 116000, 116400, 116800, 117200, 117000, 117500,
        117900, 118100, 117800, 118300, 118600, 119000, 118800, 119200, 119500, 119800
      ],
      0.012,
      310
    )
  },
  {
    id: 'coffee-arabica',
    category: 'coffee',
    name: 'Cà Phê Arabica Cầu Đất',
    nameEn: 'Cau Dat Arabica Coffee',
    variety: 'Chế biến ướt · Sàng 16+',
    region: 'Đà Lạt, Lâm Đồng',
    unit: 'đ/kg',
    marketAnalysis:
      'Nhu cầu rang xay đặc sản nội địa và xuất khẩu châu Âu tăng mạnh giúp Arabica Cầu Đất giữ biên độ tăng ổn định.',
    marketAnalysisEn:
      'Strong specialty roaster demand and European export contracts keep Cau Dat Arabica trading in a steady uptrend.',
    dailyHistory: buildDailySeries(
      [
        136000, 136500, 136800, 137200, 137000, 137600, 138000, 138400, 138200, 138800,
        139100, 139500, 139800, 139600, 140000, 140400, 140800, 141000, 141200, 141500,
        141300, 141800, 142100, 142400, 142800, 143000, 143200, 143500, 143700, 144000
      ],
      0.014,
      95
    )
  },
  {
    id: 'veg-tomato',
    category: 'vegetables',
    name: 'Cà Chua Beef Đà Lạt',
    nameEn: 'Dalat Beefsteak Tomatoes',
    variety: 'Hàng loại 1 nhà kính · Không dập',
    region: 'Lâm Đồng',
    unit: 'đ/kg',
    marketAnalysis:
      'Mưa lạnh đầu mùa làm sản lượng cà chua ngoài trời giảm khoảng 18%, đẩy giá thu mua tại vựa Đà Lạt tăng rõ rệt trong 10 ngày qua.',
    marketAnalysisEn:
      'Early cold rains trimmed open-field output by ~18%, lifting greenhouse Grade-1 tomato quotes across Dalat packing hubs.',
    dailyHistory: buildDailySeries(
      [
        21500, 21800, 22000, 21700, 22100, 22400, 22800, 22600, 23000, 23400,
        23200, 23500, 23800, 24000, 24300, 24600, 24500, 24800, 25200, 25500,
        25400, 25800, 26000, 26300, 26500, 26400, 26700, 27000, 27200, 27500
      ],
      0.032,
      145
    )
  },
  {
    id: 'veg-leafy',
    category: 'vegetables',
    name: 'Rau Cải Xanh & Xà Lách VietGAP',
    nameEn: 'VietGAP Mustard Greens & Lettuce',
    variety: 'Rau ăn lá tươi thu hoạch sáng sớm',
    region: 'Củ Chi & Hóc Môn, TP.HCM',
    unit: 'đ/kg',
    marketAnalysis:
      'Thời tiết mát mẻ thuận lợi giúp lứa rau ăn lá phát triển đều, nguồn cung vào chợ đầu mối dồi dào nên giá điều chỉnh nhẹ dễ tiếp cận.',
    marketAnalysisEn:
      'Mild temperatures supported uniform leafy vegetable harvests, easing wholesale prices slightly as daily supply increased.',
    dailyHistory: buildDailySeries(
      [
        24500, 24200, 24000, 23800, 23600, 23900, 23500, 23200, 23000, 22800,
        23100, 22900, 22600, 22400, 22200, 22500, 22300, 22000, 21800, 21600,
        21900, 21700, 21500, 21400, 21600, 21300, 21200, 21000, 21100, 20900
      ],
      0.038,
      190
    )
  },
  {
    id: 'veg-chili',
    category: 'vegetables',
    name: 'Ớt Chỉ Thiên Tươi Loại 1',
    nameEn: 'Fresh Bird’s Eye Chili (Grade 1)',
    variety: 'Ớt chín đỏ xuất khẩu & chợ đầu mối',
    region: 'Tiền Giang & Đồng Tháp',
    unit: 'đ/kg',
    marketAnalysis:
      'Thương lái thu gom ớt đi cửa khẩu tăng mạnh trở lại sau kỳ mưa bão, giá ớt vườn phục hồi nhanh trong tuần gần đây.',
    marketAnalysisEn:
      'Cross-border buyers stepped up fresh chili collections after recent storms, driving a sharp weekly price rebound.',
    dailyHistory: buildDailySeries(
      [
        29000, 29200, 28800, 28500, 28900, 29400, 29800, 30200, 30000, 30500,
        31000, 31400, 31200, 31800, 32200, 32500, 32800, 32600, 33000, 33500,
        33900, 34200, 34000, 34500, 34800, 35200, 35500, 35800, 36100, 36500
      ],
      0.04,
      82
    )
  },
  {
    id: 'fruit-durian',
    category: 'fruits',
    name: 'Sầu Riêng Ri6 Tuyển Chọn',
    nameEn: 'Ri6 Durian (Export Grade 1)',
    variety: 'Hàng xô lựa · Đạt chuẩn mã vùng',
    region: 'Cai Lậy, Tiền Giang & Bến Tre',
    unit: 'đ/kg',
    marketAnalysis:
      'Nguồn hàng nghịch vụ thu hoạch chưa nhiều trong khi nhu cầu container xuất khẩu cao giữ giá sầu riêng Ri6 ổn định trên mốc 90.000 đ/kg.',
    marketAnalysisEn:
      'Moderate off-season harvest volumes paired with steady export container demand hold Ri6 durian firm above 90,000 VND/kg.',
    dailyHistory: buildDailySeries(
      [
        83000, 83500, 84000, 84200, 84800, 85000, 85500, 86000, 85800, 86400,
        87000, 87500, 87200, 87800, 88200, 88600, 89000, 89500, 89200, 89800,
        90200, 90600, 91000, 90800, 91200, 91600, 92000, 92400, 92800, 93200
      ],
      0.022,
      210
    )
  },
  {
    id: 'fruit-dragon',
    category: 'fruits',
    name: 'Thanh Long Ruột Đỏ Loại 1',
    nameEn: 'Red-Flesh Dragon Fruit (Grade 1)',
    variety: 'Chong đèn nghịch vụ · Trọng lượng ≥ 450g',
    region: 'Bình Thuận & Long An',
    unit: 'đ/kg',
    marketAnalysis:
      'Sản lượng chong đèn lứa mới vừa phải, sức mua tiêu thụ nội địa và xuất khẩu tích cực giúp giá thanh long duy trì sắc xanh liên tiếp.',
    marketAnalysisEn:
      'Balanced off-season lighted crop yields and healthy export uptake support continuous daily gains for red-flesh dragon fruit.',
    dailyHistory: buildDailySeries(
      [
        31500, 31800, 32000, 32200, 32500, 32400, 32800, 33100, 33500, 33800,
        34000, 34200, 34600, 34900, 35100, 35000, 35400, 35800, 36000, 36200,
        36500, 36800, 37000, 37200, 37500, 37700, 38000, 38200, 38500, 38800
      ],
      0.028,
      175
    )
  },
  {
    id: 'coffee-pepper',
    category: 'coffee',
    name: 'Hồ Tiêu Đen Tây Nguyên',
    nameEn: 'Central Highlands Black Pepper',
    variety: 'Dung trọng 550g/l · Hạt chắc sạch',
    region: 'Gia Lai & Đắk Nông',
    unit: 'đ/kg',
    marketAnalysis:
      'Nông dân có xu hướng giữ hàng chờ giá tốt hơn sau vụ thu hoạch, đẩy mặt bằng giá hồ tiêu đen giữ vững vùng 142.000 đ/kg.',
    marketAnalysisEn:
      'Post-harvest farmer stock holding continues to tighten spot supply, anchoring black pepper around 142,000 VND/kg.',
    dailyHistory: buildDailySeries(
      [
        136500, 136800, 137200, 137500, 137300, 137800, 138000, 138400, 138900, 139200,
        139000, 139400, 139800, 140100, 140400, 140200, 140600, 141000, 141200, 141500,
        141400, 141800, 142000, 142200, 142500, 142300, 142600, 142900, 143200, 143500
      ],
      0.013,
      110
    )
  }
];

export function computeMovingAverage(
  series: DailyPricePoint[],
  windowSize = 7
): Array<{ date: string; maPrice: number }> {
  return series.map((pt, idx) => {
    const start = Math.max(0, idx - windowSize + 1);
    const slice = series.slice(start, idx + 1);
    const avg = slice.reduce((acc, s) => acc + s.price, 0) / slice.length;
    return {
      date: pt.date,
      maPrice: Math.round(avg)
    };
  });
}
