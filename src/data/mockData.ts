import {
  Plant,
  WeatherCondition,
  WeatherAlert,
  CommunityPost,
  SeedExchangeItem,
  MarketItem,
  CareBookingService,
  AgriculturalExpert,
  AgriStation,
  FarmTransaction,
  CommodityPriceItem,
  DiseaseEncyclopediaItem,
  VideoGuideItem,
  MarketOrder,
  ExpertThread,
  ExpertQAQuestion
} from '../types';

export const INITIAL_PLANTS: Plant[] = [
  {
    id: 'plant-1',
    name: 'Cà Chua Bi F1 Cherry',
    scientificName: 'Solanum lycopersicum var. cerasiforme',
    category: 'vegetable',
    imageUrl: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=600&q=80',
    wateringFrequencyDays: 1,
    lastWatered: new Date(Date.now() - 36 * 3600 * 1000).toISOString(), // Cần tưới ngay
    lastFertilized: new Date(Date.now() - 7 * 86400 * 1000).toISOString(),
    sunlight: 'full_sun',
    soilType: 'Đất phù sa trộn phân trùn quế và trấu hun',
    difficulty: 'easy',
    healthScore: 92,
    soilMoisturePercent: 28, // Đang khô (dưới 50%) -> Cần tưới ngay
    minMoistureThreshold: 50,
    maxMoistureThreshold: 75,
    recommendedWaterAmount: '500ml',
    location: 'Ban công hướng Đông',
    notes: 'Đang ra chùm hoa thứ 3, chuẩn bị đậu quả lứa đầu.',
    createdAt: new Date(Date.now() - 35 * 86400 * 1000).toISOString(),
    careLogs: [
      { id: 'cl-1', plantId: 'plant-1', date: new Date(Date.now() - 36 * 3600 * 1000).toISOString(), type: 'water', amount: '500ml', notes: 'Tưới sáng sớm mát' },
      { id: 'cl-2', plantId: 'plant-1', date: new Date(Date.now() - 7 * 86400 * 1000).toISOString(), type: 'fertilize', notes: 'Bón thúc đạm cá hữu cơ vi sinh' },
      { id: 'cl-3', plantId: 'plant-1', date: new Date(Date.now() - 14 * 86400 * 1000).toISOString(), type: 'prune', notes: 'Vặt bỏ chồi nách phụ phía dưới' }
    ],
    growthHistory: [
      { id: 'g-1', plantId: 'plant-1', date: new Date(Date.now() - 28 * 86400 * 1000).toISOString(), heightCm: 15, leafCount: 6, healthScore: 85, photoUrl: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=400&q=80', notes: 'Cây giống bén rễ tốt' },
      { id: 'g-2', plantId: 'plant-1', date: new Date(Date.now() - 14 * 86400 * 1000).toISOString(), heightCm: 38, leafCount: 16, healthScore: 90, photoUrl: 'https://images.unsplash.com/photo-1582284540020-8acbe03f4924?auto=format&fit=crop&w=400&q=80', notes: 'Bắt đầu phân cành mạnh' },
      { id: 'g-3', plantId: 'plant-1', date: new Date(Date.now() - 2 * 86400 * 1000).toISOString(), heightCm: 65, leafCount: 28, healthScore: 94, photoUrl: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=400&q=80', notes: 'Xuất hiện nụ hoa vàng rực rỡ' }
    ]
  },
  {
    id: 'plant-2',
    name: 'Trầu Bà Lá Xẻ Nam Mỹ (Monstera)',
    scientificName: 'Monstera deliciosa',
    category: 'indoor',
    imageUrl: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=600&q=80',
    wateringFrequencyDays: 3,
    lastWatered: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    lastFertilized: new Date(Date.now() - 18 * 86400 * 1000).toISOString(),
    sunlight: 'indirect',
    soilType: 'Giá thể xơ dừa, perlite, vỏ thông',
    difficulty: 'easy',
    healthScore: 96,
    soilMoisturePercent: 58, // Độ ẩm thích hợp
    minMoistureThreshold: 35,
    maxMoistureThreshold: 70,
    recommendedWaterAmount: '800ml',
    location: 'Phòng khách cạnh cửa sổ',
    notes: 'Lá mới mở xẻ 4 rãnh rất đẹp.',
    createdAt: new Date(Date.now() - 60 * 86400 * 1000).toISOString(),
    careLogs: [
      { id: 'cl-4', plantId: 'plant-2', date: new Date(Date.now() - 12 * 3600 * 1000).toISOString(), type: 'water', amount: '800ml', notes: 'Lau bụi mặt lá' }
    ],
    growthHistory: [
      { id: 'g-4', plantId: 'plant-2', date: new Date(Date.now() - 30 * 86400 * 1000).toISOString(), heightCm: 45, leafCount: 5, healthScore: 92, photoUrl: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=400&q=80', notes: 'Chuyển chậu mới giá thể thoáng rễ' },
      { id: 'g-5', plantId: 'plant-2', date: new Date(Date.now() - 5 * 86400 * 1000).toISOString(), heightCm: 58, leafCount: 7, healthScore: 96, photoUrl: 'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=400&q=80', notes: 'Lá thứ 7 xẻ rãnh cân đối' }
    ]
  },
  {
    id: 'plant-3',
    name: 'Ớt Chỉ Thiên Siêu Cay',
    scientificName: 'Capsicum annuum',
    category: 'vegetable',
    imageUrl: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=600&q=80',
    wateringFrequencyDays: 2,
    lastWatered: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    lastFertilized: new Date(Date.now() - 10 * 86400 * 1000).toISOString(),
    sunlight: 'full_sun',
    soilType: 'Đất thịt nhẹ tơi xốp, giàu lân và kali',
    difficulty: 'easy',
    healthScore: 88,
    soilMoisturePercent: 32, // Đang khô (dưới 45%)
    minMoistureThreshold: 45,
    maxMoistureThreshold: 70,
    recommendedWaterAmount: '600ml',
    location: 'Sân thượng tầng 3',
    notes: 'Trái chín đỏ rất sai, cần chú ý bọ trĩ khi nắng gắt.',
    createdAt: new Date(Date.now() - 45 * 86400 * 1000).toISOString(),
    careLogs: [
      { id: 'cl-5', plantId: 'plant-3', date: new Date(Date.now() - 48 * 3600 * 1000).toISOString(), type: 'water', amount: '600ml' },
      { id: 'cl-6', plantId: 'plant-3', date: new Date(Date.now() - 10 * 86400 * 1000).toISOString(), type: 'pest_control', notes: 'Phun dung dịch tỏi ớt xua đuổi bọ trĩ' }
    ],
    growthHistory: [
      { id: 'g-6', plantId: 'plant-3', date: new Date(Date.now() - 20 * 86400 * 1000).toISOString(), heightCm: 32, leafCount: 22, healthScore: 88 },
      { id: 'g-7', plantId: 'plant-3', date: new Date(Date.now() - 3 * 86400 * 1000).toISOString(), heightCm: 48, leafCount: 35, healthScore: 91, notes: 'Thu hoạch đợt 1 được 300g ớt' }
    ]
  },
  {
    id: 'plant-4',
    name: 'Sầu Riêng Ri6 Cơm Vàng Hạt Lép',
    scientificName: 'Durio zibethinus Ri6',
    category: 'fruit',
    imageUrl: 'https://images.unsplash.com/photo-1546548970-71785318a17b?auto=format&fit=crop&w=600&q=80',
    wateringFrequencyDays: 2,
    lastWatered: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    lastFertilized: new Date(Date.now() - 15 * 86400 * 1000).toISOString(),
    sunlight: 'full_sun',
    soilType: 'Đất phù sa ven sông thoát nước tốt, pH 5.5 - 6.5',
    difficulty: 'hard',
    healthScore: 90,
    soilMoisturePercent: 44, // Thiếu ẩm giai đoạn nuôi quả non (min 60%)
    minMoistureThreshold: 60,
    maxMoistureThreshold: 80,
    recommendedWaterAmount: '40 Lít qua béc tưới',
    location: 'Vườn đồi khu A - Lô số 2',
    notes: 'Giai đoạn nuôi trái non đường kính 8cm, phòng ngừa xì mủ Phytophthora.',
    createdAt: new Date(Date.now() - 400 * 86400 * 1000).toISOString(),
    careLogs: [
      { id: 'cl-7', plantId: 'plant-4', date: new Date(Date.now() - 20 * 3600 * 1000).toISOString(), type: 'water', amount: '40 Lít qua béc tưới' },
      { id: 'cl-8', plantId: 'plant-4', date: new Date(Date.now() - 15 * 86400 * 1000).toISOString(), type: 'fertilize', notes: 'Bón hữu cơ vi sinh kết hợp Kali sunfat' }
    ],
    growthHistory: [
      { id: 'g-8', plantId: 'plant-4', date: new Date(Date.now() - 60 * 86400 * 1000).toISOString(), heightCm: 320, leafCount: 120, healthScore: 89, notes: 'Xổ nhụy đồng loạt' },
      { id: 'g-9', plantId: 'plant-4', date: new Date(Date.now() - 10 * 86400 * 1000).toISOString(), heightCm: 340, leafCount: 145, healthScore: 92, notes: 'Tỉa định quả giữ 60 trái/cây' }
    ]
  }
];

export const CURRENT_WEATHER: WeatherCondition = {
  city: 'Đồng Bằng Sông Cửu Long / TP.HCM',
  temp: 31,
  humidity: 78,
  rainfallMm: 24,
  windSpeedKmH: 14,
  uvIndex: 7,
  condition: 'rainy',
  forecastSummary: 'Có mưa rào và dông rải rác về chiều, độ ẩm cao thuận lợi cho nấm bệnh phát triển nếu đọng nước.'
};

export const WEATHER_ALERTS: WeatherAlert[] = [
  {
    id: 'wa-1',
    level: 'warning',
    title: 'Cảnh báo mưa dông lớn & nguy cơ úng rễ cục bộ',
    description: 'Dự báo chiều tối nay có mưa to vũ lượng 40-70mm kèm gió giật mạnh cấp 5-6.',
    affectedPlants: 'Cà chua, ớt, rau ăn lá, phong lan ngoài trời',
    recommendedAction: 'Khơi thông rãnh thoát nước ngay, hạ chậu treo xuống thấp, ngừng tưới bổ sung.',
    timestamp: 'Hôm nay, 14:30'
  },
  {
    id: 'wa-2',
    level: 'danger',
    title: 'Cảnh báo nhiệt độ đỉnh điểm & chỉ số UV cực cao (38°C)',
    description: 'Đợt nắng nóng gay gắt kéo dài từ 11:00 đến 15:30 ngày mai.',
    affectedPlants: 'Sen đá, trầu bà, cây giống mới ươm, rau mầm',
    recommendedAction: 'Kéo lưới lan đen che 50% nắng, phun sương làm mát không khí lúc 10h sáng.',
    timestamp: 'Hôm nay, 08:15'
  }
];

export const INITIAL_POSTS: CommunityPost[] = [
  {
    id: 'post-qa-1',
    category: 'qa',
    title: 'Cây cà chua bi bị xoăn lá đọt non và đốm vàng, nhờ bà con và chuyên gia bắt bệnh giúp?',
    author: {
      name: 'Nguyễn Văn Minh',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      badge: 'Nông Dân Phố',
      location: 'Củ Chi, TP.HCM'
    },
    createdAt: '30 phút trước',
    content: 'Chào cả nhà, em mới trồng 15 gốc cà chua bi trong thùng xốp được 25 ngày. Mấy hôm nay đọt non cứ co quắp xoăn lại, mặt dưới lá thấy có vài con bọ li ti màu trắng và phấn bạc. Em đã ngưng tưới đạm nhưng lá vẫn chưa thẳng ra được. Có phải bị bọ phấn trắng truyền virus xoăn lá không ạ? Nhờ anh em và chuyên gia hướng dẫn cách xử lý hữu cơ an toàn với ạ!',
    images: [
      'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1582284540020-8acbe03f4924?auto=format&fit=crop&w=700&q=80'
    ],
    tags: ['HỏiĐápLàmVườn', 'CàChua', 'BọPhấnTrắng', 'XoănLá', 'HữuCơ'],
    likes: 18,
    isLiked: false,
    isSolved: false,
    comments: [
      {
        id: 'c-qa-1',
        author: 'Kỹ sư Hai Lúa (Lê Văn Thuận)',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
        content: 'Chính xác là bọ phấn trắng chích hút và có nguy cơ truyền virus Begomovirus gây khảm lá bạn nhé. Cách xử lý hữu cơ khẩn cấp:\n1. Phun xịt dầu Neem ép lạnh (5ml Neem + 2ml nước rửa chén + 1 lít nước ấm) vào lúc chiều mát, xịt đẫm 2 mặt lá.\n2. Cắm bẫy dính màu vàng xung quanh luống để bắt bọ trưởng thành.\n3. Ngắt bỏ các đọt xoăn biến dạng quá nặng mang đi tiêu hủy.',
        createdAt: '15 phút trước',
        isExpert: true,
        isHelpfulSolution: true,
        likes: 12,
        isLiked: true
      }
    ]
  },
  {
    id: 'post-seed-1',
    category: 'seed_exchange',
    title: 'Tặng 40 phần hạt giống Cải Kale xoăn khủng & Cà chua bi Cherry ngọt lịm cho thành viên',
    author: {
      name: 'Vườn Xanh Cô Ba',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
      badge: 'Người Gieo Hạt Xanh',
      location: 'Đà Lạt, Lâm Đồng'
    },
    createdAt: '1 giờ trước',
    content: 'Vụ vừa rồi mình thu hoạch hạt giống thuần giống hữu cơ F1 rất chuẩn, tỷ lệ nảy mầm thử nghiệm đạt 96%. Nay muốn san sẻ yêu thương cho các bạn thích trồng rau sạch tự cung tự cấp. Mỗi phần gồm 30 hạt Kale xoăn và 25 hạt cà chua cherry ngọt. Mọi người có thể nhận trực tiếp tại vườn hoặc mình gửi bưu điện COD phí ship 15k nhé!',
    images: [
      'https://images.unsplash.com/photo-1524179091875-bf99a9a6af57?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=700&q=80'
    ],
    tags: ['TraoĐổiHạtGiống', 'CảiKale', 'CàChuaCherry', 'HạtMiễnPhí', 'GieoMầm'],
    likes: 56,
    isLiked: true,
    seedDetails: {
      seedName: 'Cải Kale Xoăn Khủng & Cà Chua Cherry F1',
      quantity: '40 Phần hạt giống',
      deliveryMethod: 'both',
      phone: '0912.888.345',
      location: 'Đà Lạt & Toàn Quốc (Bưu điện)',
      claimedCount: 28,
      maxClaims: 40
    },
    comments: [
      {
        id: 'c-seed-1',
        author: 'Trần Hoài Nam',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
        content: 'Tuyệt vời quá cô Ba ơi! Em vừa đăng ký 1 phần ship về Bình Dương nhé ạ!',
        createdAt: '30 phút trước',
        likes: 4
      }
    ]
  },
  {
    id: 'post-exp-1',
    category: 'experience',
    title: 'Kinh nghiệm chống rụng trái non sầu riêng Ri6 sau mưa đêm kéo dài',
    author: {
      name: 'Kỹ sư Hai Lúa (Lê Văn Thuận)',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      badge: 'Chuyên gia Cây Ăn Trái',
      location: 'Cái Bè, Tiền Giang'
    },
    createdAt: '2 giờ trước',
    content: 'Kinh nghiệm chống rụng trái non sầu riêng Ri6 sau mưa đêm kéo dài: Bà con chú ý kiểm tra ngay cổ rễ và tầng mặt đất. Nếu đất bí chặt, hãy xới nhẹ quanh tán để thoát khí CO2, phun ngừa nấm Phytophthora bằng Ridomil Gold hoặc thuốc sinh học Trichoderma. Tuyệt đối không bón đạm cao lúc này!',
    images: [
      'https://images.unsplash.com/photo-1546548970-71785318a17b?auto=format&fit=crop&w=700&q=80'
    ],
    tags: ['KinhNghiệmCanhTác', 'SầuRiêng', 'TrịNấmBệnh', 'HữuCơ'],
    likes: 42,
    isLiked: false,
    comments: [
      {
        id: 'c-1',
        author: 'Nguyễn Văn Tâm',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
        content: 'Cảm ơn kỹ sư Thuận, vườn nhà em ở Cai Lậy mấy hôm nay rụng lai rai may có bài này!',
        createdAt: '1 giờ trước',
        likes: 3
      },
      {
        id: 'c-2',
        author: 'Kỹ sư Hai Lúa',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
        content: 'Bạn Tâm nhớ bổ sung thêm Bo và Canxi hữu cơ để cuống trái dai chắc nhé.',
        createdAt: '45 phút trước',
        isExpert: true,
        likes: 6
      }
    ]
  },
  {
    id: 'post-showcase-1',
    category: 'showcase',
    title: 'Khoe góc ban công 4m² xanh mướt rau củ sau 2 tháng tự ủ rác nhà bếp IMO',
    author: {
      name: 'Thu Hương Farm',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
      badge: 'Làm Vườn Ban Công',
      location: 'Quận 7, TP.HCM'
    },
    createdAt: '4 giờ trước',
    content: 'Tự hào khoe với cả nhà góc sân nhỏ 4m² của mình! Từ khi áp dụng men vi sinh IMO tự làm từ sữa chua và men rượu để ủ rác nhà bếp (vỏ chuối, bã cà phê, rau thừa), đất tơi xốp đen nhánh, giun đất bò đầy chậu. Dưa leo baby, ớt xiêm rừng và cải cầu vồng lớn như thổi, ăn không kịp luôn!',
    images: [
      'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=700&q=80'
    ],
    tags: ['KhoeVườnXanh', 'NôngNghiệpĐôThị', 'ỦRácNhàBếp', 'RauSạchBanCông'],
    likes: 89,
    isLiked: true,
    comments: [
      {
        id: 'c-3',
        author: 'Bảo Trâm',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
        content: 'Quá khéo tay luôn chị ơi! Nhìn giàn dưa leo thích mắt quá, bữa nào cho em xin ít men giống IMO nha!',
        createdAt: '3 giờ trước',
        likes: 5
      }
    ]
  },
  {
    id: 'post-qa-2',
    category: 'qa',
    title: 'Lan Hồ Điệp bị thối nhũn lá đốm nước lan nhanh, đã cứu sống thành công!',
    author: {
      name: 'Lê Hoàng Phong',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      badge: 'Người Yêu Phong Lan',
      location: 'Thủ Đức, TP.HCM'
    },
    createdAt: '1 ngày trước',
    content: 'Cập nhật tình hình chậu lan hồ điệp tuần trước em đăng hỏi. Sau khi làm theo hướng dẫn: dùng dao lam hơ cồn gọt sạch vết nhũn, bôi vôi cày hoặc bột quế sát trùng rồi treo nơi thoáng gió cách ly 4 ngày, cây đã lành sẹo khô ráo và chuẩn bị nhú rễ mới. Xin chia sẻ để bác nào gặp tình trạng tương tự đừng vội vứt cây nhé!',
    images: [
      'https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?auto=format&fit=crop&w=700&q=80'
    ],
    tags: ['HỏiĐápLàmVườn', 'PhongLan', 'ThốiNhũn', 'ĐãGiảiQuyết'],
    likes: 64,
    isLiked: true,
    isSolved: true,
    comments: [
      {
        id: 'c-qa-solved-1',
        author: 'Bác Sĩ Cây Trồng AI',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
        content: 'Chúc mừng bạn Phong! Bột quế có tính kháng khuẩn tự nhiên rất mạnh và lành tính với mô lan. Hãy nhớ tưới vào gốc lúc sáng sớm, tránh để nước đọng qua đêm ở ngọn nhé!',
        createdAt: '1 ngày trước',
        isExpert: true,
        isHelpfulSolution: true,
        likes: 19
      }
    ]
  }
];

export const SEED_EXCHANGE_ITEMS: SeedExchangeItem[] = [
  {
    id: 'seed-1',
    title: 'Hạt giống Cà chua trái tim F1 siêu ngọt',
    variety: 'Cà chua Oxheart Organic',
    category: 'vegetable',
    giverName: 'Bác Sáu Vườn Rau',
    giverPhone: '0918.234.567',
    location: 'Đà Lạt, Lâm Đồng',
    quantity: 'Tặng 50 phần (mỗi phần 30 hạt)',
    shippingOption: 'both',
    imageUrl: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=500&q=80',
    description: 'Hạt giống thu hoạch từ quả chuẩn thuần chủng, tỷ lệ nảy mầm >95%. Tặng miễn phí cho anh chị em yêu vườn, chỉ nhận phí ship COD bưu điện 15k.',
    status: 'available',
    dateListed: 'Hôm qua'
  },
  {
    id: 'seed-2',
    title: 'Hạt giống Mướp hương đồng quê trái dài thơm nức',
    variety: 'Mướp hương truyền thống',
    category: 'vegetable',
    giverName: 'Chị Mai Nông Trại Xanh',
    giverPhone: '0903.888.999',
    location: 'Hóc Môn, TP.HCM',
    quantity: 'Còn 35 túi hạt',
    shippingOption: 'direct',
    imageUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=500&q=80',
    description: 'Trái dài 60-80cm, thịt dày ngọt thơm. Ai qua Hóc Môn lấy trực tiếp thoải mái giao lưu kinh nghiệm nhé.',
    status: 'available',
    dateListed: '3 ngày trước'
  },
  {
    id: 'seed-3',
    title: 'Cây giống Hoa Hồng Cổ Hải Phòng chiết cành',
    variety: 'Hồng cổ leo Hải Phòng',
    category: 'flower',
    giverName: 'CLB Yêu Hoa Ban Công',
    giverPhone: '0988.112.233',
    location: 'Hà Đông, Hà Nội',
    quantity: 'Tặng 20 bầu cây',
    shippingOption: 'direct',
    imageUrl: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=500&q=80',
    description: 'Cành chiết khỏe, rễ ra trắng bầu, hoa đỏ nhung thơm đậm nở quanh năm. Tặng các bạn mới tập trồng hoa.',
    status: 'available',
    dateListed: '1 ngày trước'
  },
  {
    id: 'seed-4',
    title: 'Hạt Ớt Charapita Peru đắt nhất thế giới',
    variety: 'Aji Charapita',
    category: 'vegetable',
    giverName: 'Đức Thắng Bonsai',
    giverPhone: '0977.456.789',
    location: 'Cần Thơ',
    quantity: '10 phần hạt ươm',
    shippingOption: 'both',
    imageUrl: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=500&q=80',
    description: 'Ớt hạt tiêu vàng óng, mùi thơm hoa quả độc đáo vị cay giòn rụm.',
    status: 'available',
    dateListed: 'Hôm nay'
  }
];

export const MARKET_ITEMS: MarketItem[] = [
  {
    id: 'prod-1',
    title: 'Sầu Riêng Ri6 Chín Cây Tự Nhiên (Bao Ăn 1 Đổi 1)',
    category: 'produce',
    price: 95000,
    originalPrice: 120000,
    unit: '1 kg',
    sellerName: 'Hợp Tác Xã Sầu Riêng Tiền Giang',
    sellerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    sellerPhone: '0912.333.444',
    sellerZalo: '0912333444',
    sellerBadge: 'Vườn VietGAP Cấp Tỉnh',
    sellerResponseRate: 99,
    sellerJoinYear: 2022,
    location: 'Cai Lậy, Tiền Giang',
    rating: 4.9,
    reviewsCount: 128,
    soldCount: 840,
    imageUrl: 'https://images.unsplash.com/photo-1546548970-71785318a17b?auto=format&fit=crop&w=600&q=80',
    description: 'Sầu riêng chín rụng tự nhiên, cơm dày vàng óng, dẻo béo không sượng, bảo đảm canh tác theo tiêu chuẩn VietGAP không nhúng thuốc bảo quản. Bao ăn từng múi, 1 đổi 1 trong vòng 24 giờ nếu sượng hỏng.',
    specifications: {
      'Xuất xứ': 'Cai Lậy, Tiền Giang',
      'Tiêu chuẩn': 'VietGAP, Không chất kích thích',
      'Độ đường': 'Brix 32-35%',
      'Trọng lượng quả': '2.2kg - 4.5kg/trái'
    },
    stock: 250,
    isOrganic: true,
    shippingCarriers: ['ghtk', 'viettel', 'express', 'pickup'],
    reviews: [
      {
        id: 'rev-1-1',
        authorName: 'Nguyễn Văn Hùng',
        authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
        rating: 5,
        date: '08/11/2026',
        content: 'Trái sầu riêng 3.2kg nhận về thơm nức mũi cả nhà, khui ra múi vàng óng, hạt lép kẹp béo ngọt lịm. Đóng gói thùng carton chống sốc rất cẩn thận!',
        verifiedPurchase: true,
        sellerReply: 'Cảm ơn anh Hùng đã ủng hộ HTX vườn sầu riêng Cai Lậy ạ!'
      },
      {
        id: 'rev-1-2',
        authorName: 'Trần Thị Mai',
        authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
        rating: 5,
        date: '02/11/2026',
        content: 'Giao hỏa tốc nhận trong ngày tại Sài Gòn, cơm dẻo quánh chuẩn sầu chín rụng cây.',
        verifiedPurchase: true
      }
    ]
  },
  {
    id: 'prod-2',
    title: 'Cây Trầu Bà Lỗ (Monstera Adansonii) Chậu Sứ Men Mát',
    category: 'plant',
    price: 145000,
    originalPrice: 180000,
    unit: 'Chậu gốm sẵn cây',
    sellerName: 'Vườn Cảnh Bonsai Sài Gòn',
    sellerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    sellerPhone: '0908.555.666',
    sellerZalo: '0908555666',
    sellerBadge: 'Vườn Ươm Uy Tín 5⭐',
    sellerResponseRate: 98,
    sellerJoinYear: 2021,
    location: 'Quận 12, TP.HCM',
    rating: 4.8,
    reviewsCount: 86,
    soldCount: 312,
    imageUrl: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=600&q=80',
    description: 'Cây trầu bà lá thủng phong thủy tài lộc, thanh lọc formaldehyde và benzene trong không khí cực tốt. Cây đã thuần chậu rễ khỏe, tặng kèm đĩa lót gốm chống tràn nước và gói phân tan chậm.',
    specifications: {
      'Chiều cao': '30 - 45 cm',
      'Đường kính chậu': '16 cm',
      'Ánh sáng': 'Tán xạ gián tiếp / Ban công mát',
      'Bảo hành': 'Bảo hành cây xanh tươi 7 ngày'
    },
    stock: 45,
    shippingCarriers: ['ghtk', 'viettel', 'express', 'pickup'],
    reviews: [
      {
        id: 'rev-2-1',
        authorName: 'Lê Thanh Thảo',
        rating: 5,
        date: '05/11/2026',
        content: 'Cây nhận về lá xanh mướt không rách lá nào, rễ bám chắc chậu. Để bàn làm việc nhìn thư thái hẳn.',
        verifiedPurchase: true
      }
    ]
  },
  {
    id: 'prod-3',
    title: 'Hạt Giống Cà Chua Bi Lùn F1 Siêu Ngọt Sugar Cherry (Gói 50 Hạt)',
    category: 'seed',
    price: 35000,
    originalPrice: 45000,
    unit: 'Gói 50 hạt F1',
    sellerName: 'Viện Giống Cây Trồng Nhiệt Đới',
    sellerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    sellerPhone: '0935.123.456',
    sellerZalo: '0935123456',
    sellerBadge: 'Nhà Cung Cấp Hạt Giống Chuẩn',
    sellerResponseRate: 100,
    sellerJoinYear: 2020,
    location: 'Đống Đa, Hà Nội',
    rating: 4.9,
    reviewsCount: 342,
    soldCount: 1520,
    imageUrl: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=600&q=80',
    description: 'Giống cà chua bi lùn thích hợp trồng chậu ban công và sân thượng, cây cao 45-60cm sai trĩu quả chùm 15-25 trái. Quả đỏ mọng, vị ngọt thanh giòn tan, kháng bệnh sương mai cực tốt.',
    specifications: {
      'Tỷ lệ nảy mầm': '> 92%',
      'Độ sạch': '99.5%',
      'Thời gian thu hoạch': '60 - 65 ngày',
      'Hạn sử dụng': '2 năm (Bao bì nhôm hút chân không)'
    },
    stock: 600,
    isOrganic: true,
    shippingCarriers: ['ghtk', 'viettel', 'express'],
    reviews: [
      {
        id: 'rev-3-1',
        authorName: 'Phạm Đức Toàn',
        rating: 5,
        date: '09/11/2026',
        content: 'Ủ hạt bằng khăn ẩm sau 48h nảy mầm đều tăm tắp 100%. Rất tin tưởng hạt giống của Viện.',
        verifiedPurchase: true,
        sellerReply: 'Cảm ơn anh Toàn, nhớ tỉa bớt nhánh phụ ở nách lá để cây dồn sức nuôi chùm quả ngọt nhé!'
      }
    ]
  },
  {
    id: 'prod-4',
    title: 'Hạt Giống Dưa Lưới Ruột Cam Nhật Bản F1 Taki (Gói 20 Hạt)',
    category: 'seed',
    price: 55000,
    originalPrice: 70000,
    unit: 'Gói 20 hạt',
    sellerName: 'Hạt Giống Nông Nghiệp Công Nghệ Cao',
    sellerAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
    sellerPhone: '0982.789.012',
    sellerZalo: '0982789012',
    sellerBadge: 'Đại Lý Hạt F1 Nhập Khẩu',
    sellerResponseRate: 97,
    sellerJoinYear: 2022,
    location: 'Đà Lạt, Lâm Đồng',
    rating: 4.8,
    reviewsCount: 156,
    soldCount: 680,
    imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80',
    description: 'Giống dưa lưới vân nổi dày đều đẹp như tác phẩm điêu khắc, ruột cam đậm giòn ngọt thơm lừng, độ đường đạt 14-16 Brix. Trồng tốt trong nhà màng và sân thượng.',
    specifications: {
      'Tỷ lệ nảy mầm': '> 90%',
      'Trọng lượng quả': '1.5 - 2.2 kg',
      'Thời gian sinh trưởng': '75 ngày',
      'Độ Brix': '14 - 16%'
    },
    stock: 300,
    isOrganic: true,
    shippingCarriers: ['ghtk', 'viettel', 'express'],
    reviews: [
      {
        id: 'rev-4-1',
        authorName: 'Hoàng Minh Quân',
        rating: 5,
        date: '04/11/2026',
        content: 'Dưa leo giàn lên khỏe, quả to vân nổi cực đều và thơm ngọt nức tiếng.',
        verifiedPurchase: true
      }
    ]
  },
  {
    id: 'prod-5',
    title: 'Phân Trùn Quế Hữu Cơ Ép Viên Tan Chậm Nguyên Chất (Bao 5kg)',
    category: 'fertilizer',
    price: 85000,
    originalPrice: 105000,
    unit: 'Bao 5kg',
    sellerName: 'Nông Trại Hữu Cơ Sinh Học Củ Chi',
    sellerAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    sellerPhone: '0938.777.888',
    sellerZalo: '0938777888',
    sellerBadge: 'Hữu Cơ Vi Sinh Chuẩn OMRI',
    sellerResponseRate: 99,
    sellerJoinYear: 2021,
    location: 'Củ Chi, TP.HCM',
    rating: 5.0,
    reviewsCount: 215,
    soldCount: 1420,
    imageUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=600&q=80',
    description: 'Giàu kén trùn và hệ vi sinh vật có ích cố định đạm phân giải lân, hoàn toàn không mùi hôi. Kháng nấm rễ, thích hợp bón lót và bón thúc cho hoa lan, hoa hồng, dâu tây và rau sạch ban công.',
    specifications: {
      'Thành phần': '100% phân trùn quế ép viên',
      'Độ ẩm': '< 25%',
      'Hữu cơ': '> 50%',
      'Quy cách': 'Bao dập nhiệt 5kg'
    },
    stock: 500,
    isOrganic: true,
    shippingCarriers: ['ghtk', 'viettel', 'express', 'pickup'],
    reviews: [
      {
        id: 'rev-5-1',
        authorName: 'Đặng Tuấn Kiệt',
        rating: 5,
        date: '07/11/2026',
        content: 'Phân viên nén chắc, rải chậu tưới nước không bị bở nát bẩn sàn, cây đâm chồi xanh mỡ gà.',
        verifiedPurchase: true
      }
    ]
  },
  {
    id: 'prod-6',
    title: 'Bộ Kéo Cắt Tỉa Cành Thép SK5 Nhật Bản Chuyên Dụng (Kèm Lò Xo Phụ)',
    category: 'tool',
    price: 180000,
    originalPrice: 240000,
    unit: 'Bộ',
    sellerName: 'Vật Tư Nông Nghiệp Minh Phát',
    sellerAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80',
    sellerPhone: '0944.999.000',
    sellerZalo: '0944999000',
    sellerBadge: 'Dụng Cụ Chính Hãng',
    sellerResponseRate: 96,
    sellerJoinYear: 2022,
    location: 'Hoàng Mai, Hà Nội',
    rating: 4.9,
    reviewsCount: 194,
    soldCount: 780,
    imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=600&q=80',
    description: 'Lưỡi kéo thép carbon SK5 Nhật Bản siêu sắc bén tôi nhiệt cao tần, vết cắt ngọt lịm không dập nát cành. Tay cầm đúc hợp kim nhôm bọc cao su chống trơn trượt kèm khóa an toàn thông minh.',
    specifications: {
      'Chất liệu lưỡi': 'Thép carbon cao SK5 mạ Teflon',
      'Độ mở lưỡi': 'Cắt cành tối đa đường kính 25mm',
      'Chiều dài tổng thể': '210mm',
      'Trọng lượng': '240g'
    },
    stock: 80,
    shippingCarriers: ['ghtk', 'viettel', 'express'],
    reviews: [
      {
        id: 'rev-6-1',
        authorName: 'Vũ Quốc Bảo',
        rating: 5,
        date: '03/11/2026',
        content: 'Kéo cầm đầm tay, bấm cành ổi ngọt xớt không tốn sức. Rất đáng đồng tiền bát gạo.',
        verifiedPurchase: true
      }
    ]
  },
  {
    id: 'prod-7',
    title: 'Hạt Giống Hoa Hồng Leo Pháp Eden Rose 85 (Gói 30 Hạt)',
    category: 'seed',
    price: 45000,
    originalPrice: 60000,
    unit: 'Gói 30 hạt',
    sellerName: 'CLB Giống Hoa Ngoại Nhập',
    sellerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    sellerPhone: '0988.112.233',
    sellerZalo: '0988112233',
    sellerBadge: 'Chuyên Hoa Ngoại Nhập',
    sellerResponseRate: 98,
    sellerJoinYear: 2021,
    location: 'Đà Lạt, Lâm Đồng',
    rating: 4.8,
    reviewsCount: 112,
    soldCount: 490,
    imageUrl: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=600&q=80',
    description: 'Hoa hồng leo hoàng gia Pháp Pierre de Ronsard (Eden 85), cánh kép viền hồng phớt kem lãng mạn, hương thơm dịu nhẹ, leo giàn cổng vòm tuyệt đẹp chịu nhiệt tốt.',
    specifications: {
      'Tỷ lệ nảy mầm': '> 85%',
      'Chiều cao leo': '2.5 - 4.5 mét',
      'Đường kính hoa': '9 - 11 cm',
      'Hương thơm': 'Hương trái cây thảo mộc'
    },
    stock: 150,
    shippingCarriers: ['ghtk', 'viettel', 'express'],
    reviews: [
      {
        id: 'rev-7-1',
        authorName: 'Bùi Ánh Tuyết',
        rating: 5,
        date: '06/11/2026',
        content: 'Hạt giống chất lượng, có giấy hướng dẫn ngâm kích mầm chi tiết đính kèm.',
        verifiedPurchase: true
      }
    ]
  },
  {
    id: 'prod-8',
    title: 'Đất Sạch Hữu Cơ Cao Cấp Trộn Sẵn Đá Perlite & Trấu Hun (Bao 20 Lít)',
    category: 'supplies',
    price: 65000,
    originalPrice: 80000,
    unit: 'Bao 20L',
    sellerName: 'Công Ty Giá Thể Nông Nghiệp Xanh',
    sellerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    sellerPhone: '0918.456.789',
    sellerZalo: '0918456789',
    sellerBadge: 'Giá Thể Sạch Chuẩn Nông Nghiệp',
    sellerResponseRate: 95,
    sellerJoinYear: 2020,
    location: 'Bình Chánh, TP.HCM',
    rating: 4.9,
    reviewsCount: 280,
    soldCount: 2100,
    imageUrl: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=600&q=80',
    description: 'Hỗn hợp đất thịt phù sa đã khử trùng nấm bệnh, phối trộn perlite trắng, trấu hun, xơ dừa lên men và phân trùn quế. Thoát nước cực tốt, tơi xốp không lo nghẹt rễ.',
    specifications: {
      'Thể tích': '20 Lít (~10kg)',
      'Độ pH': '6.2 - 6.8',
      'Độ EC': '< 1.2 mS/cm',
      'Thành phần': 'Đất thịt phù sa + Perlite + Mùn dừa + Phân vi sinh'
    },
    stock: 400,
    isOrganic: true,
    shippingCarriers: ['ghtk', 'viettel', 'pickup'],
    reviews: [
      {
        id: 'rev-8-1',
        authorName: 'Lý Gia Hưng',
        rating: 5,
        date: '10/11/2026',
        content: 'Đất tơi xốp thơm mùi mùn tự nhiên, trồng dâu tây và hoa hồng thoát nước cực nhanh không đọng vũng.',
        verifiedPurchase: true
      }
    ]
  },
  {
    id: 'prod-9',
    title: 'Hệ Thống Tưới Nhỏ Giọt Ban Công Tự Động 15 Đầu Phun Tiết Kiệm Nước',
    category: 'tool',
    price: 260000,
    originalPrice: 320000,
    unit: 'Bộ kit hoàn chỉnh',
    sellerName: 'Thiết Bị Tưới Thông Minh Miền Nam',
    sellerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    sellerPhone: '0933.222.111',
    sellerZalo: '0933222111',
    sellerBadge: 'Thiết Bị Tưới Chuẩn ISO',
    sellerResponseRate: 99,
    sellerJoinYear: 2021,
    location: 'Quận 7, TP.HCM',
    rating: 4.8,
    reviewsCount: 167,
    soldCount: 520,
    imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80',
    description: 'Bộ kit tưới nhỏ giọt thông minh kèm 15m dây dẫn PE, 15 béc tưới điều chỉnh lưu lượng, đầu nối ren vòi nước tiêu chuẩn. Giúp bạn an tâm đi công tác du lịch cả tuần cây vẫn đủ nước tươi tốt.',
    specifications: {
      'Chiều dài dây dẫn': '15 mét dây phi 6mm UV chống giòn',
      'Số béc tưới': '15 béc tưới cắm gốc điều chỉnh giọt - xòe',
      'Áp lực làm việc': '0.5 - 2.5 bar',
      'Tiết kiệm nước': 'Giảm 70% lượng nước so với tưới tràn'
    },
    stock: 95,
    shippingCarriers: ['ghtk', 'viettel', 'express'],
    reviews: [
      {
        id: 'rev-9-1',
        authorName: 'Ngô Thùy Trang',
        rating: 5,
        date: '01/11/2026',
        content: 'Lắp ráp theo sơ đồ mất có 15 phút, vặn vòi là 15 chậu rau ban công được tưới nhỏ giọt đều tăm tắp.',
        verifiedPurchase: true
      }
    ]
  },
  {
    id: 'prod-10',
    title: 'Cây Bonsai Tùng La Hán Mini Cổ Kính Men Rạn Đẹp Mắt',
    category: 'plant',
    price: 490000,
    originalPrice: 650000,
    unit: 'Chậu gốm men rạn',
    sellerName: 'Vườn Kiểng Cổ Thụ & Bonsai Nam Bộ',
    sellerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    sellerPhone: '0966.333.888',
    sellerZalo: '0966333888',
    sellerBadge: 'Nghệ Nhân Bonsai Việt Nam',
    sellerResponseRate: 97,
    sellerJoinYear: 2019,
    location: 'Chợ Lách, Bến Tre',
    rating: 5.0,
    reviewsCount: 78,
    soldCount: 145,
    imageUrl: 'https://images.unsplash.com/photo-1512428813834-c702c7702b78?auto=format&fit=crop&w=600&q=80',
    description: 'Cây Tùng La Hán dáng văn nhân 6 năm tuổi, thân uốn lượn phong trần, mâm tán lá kim tầng bậc đậm chất thiền định. Tượng trưng cho sự trường thọ, uy vũ và hưng thịnh gia đạo.',
    specifications: {
      'Chiều cao': '38 cm',
      'Tuổi cây': '6 năm',
      'Chậu': 'Gốm men rạn Bát Tràng đắp nổi rồng phượng',
      'Bảo hành': 'Bảo đảm cây sống khỏe 30 ngày'
    },
    stock: 12,
    shippingCarriers: ['viettel', 'express', 'pickup'],
    reviews: [
      {
        id: 'rev-10-1',
        authorName: 'Trịnh Hoài Nam',
        rating: 5,
        date: '07/11/2026',
        content: 'Cây đóng khung gỗ vận chuyển về Hà Nội nguyên vẹn từng cành lá kim, rêu phủ gốc xanh mướt.',
        verifiedPurchase: true
      }
    ]
  }
];

export const INITIAL_ORDERS: MarketOrder[] = [
  {
    id: 'ORD-2026-8891',
    createdAt: '10/11/2026 14:20',
    items: [
      {
        item: MARKET_ITEMS[2], // Cà chua bi F1
        quantity: 2,
        selectedPrice: 35000
      },
      {
        item: MARKET_ITEMS[4], // Phân trùn quế
        quantity: 1,
        selectedPrice: 85000
      }
    ],
    buyerName: 'David Khang',
    buyerPhone: '0988.888.386',
    buyerAddress: 'Đường Song Hành, Huyện Hóc Môn, TP. Hồ Chí Minh',
    shippingCarrier: 'ghtk',
    shippingFee: 25000,
    paymentMethod: 'vietqr',
    paymentStatus: 'escrow_holding',
    orderStatus: 'shipping',
    subtotal: 155000,
    discountAmount: 15000,
    totalAmount: 165000,
    voucherCode: 'VUONXANH10',
    escrowProtectionCode: 'ESCROW-NZ8891-SAFE',
    trackingCode: 'GHTK-VN-88492019',
    notes: 'Giao giờ hành chính, bọc kỹ gói hạt giống giúp mình nhé!',
    hasReviewed: false
  },
  {
    id: 'ORD-2026-7732',
    createdAt: '02/11/2026 09:15',
    items: [
      {
        item: MARKET_ITEMS[1], // Trầu bà lỗ Monstera
        quantity: 1,
        selectedPrice: 145000
      }
    ],
    buyerName: 'David Khang',
    buyerPhone: '0988.888.386',
    buyerAddress: 'Đường Song Hành, Huyện Hóc Môn, TP. Hồ Chí Minh',
    shippingCarrier: 'express',
    shippingFee: 35000,
    paymentMethod: 'cod',
    paymentStatus: 'paid',
    orderStatus: 'delivered',
    subtotal: 145000,
    discountAmount: 0,
    totalAmount: 180000,
    escrowProtectionCode: 'ESCROW-TR7732-SAFE',
    trackingCode: 'AHAMOVE-SG-33291',
    notes: 'Gọi trước khi giao 15 phút.',
    hasReviewed: true
  }
];


export const CARE_SERVICES: CareBookingService[] = [
  {
    id: 'svc-1',
    title: 'Cắt Tỉa & Tạo Dáng Cây Cảnh Bonsai Định Kỳ',
    pricePerSession: 250000,
    unit: 'buổi (2 giờ)',
    description: 'Nghệ nhân cây cảnh trực tiếp tới tận nhà cắt tỉa, uốn nắn thế cành, làm sạch lá già và vệ sinh gốc chậu.',
    iconName: 'Scissors',
    highlights: ['Nghệ nhân >10 năm kinh nghiệm', 'Dụng cụ chuyên dụng khử khuẩn', 'Bảo hành dáng cây 30 ngày']
  },
  {
    id: 'svc-2',
    title: 'Cứu Chữa Bệnh Cây & Thay Đất Sang Chậu',
    pricePerSession: 200000,
    unit: 'lần / cụm cây',
    description: 'Chuẩn đoán rệp sáp, thối rễ úng nước, xử lý thuốc sinh học an toàn, thay đất dinh dưỡng hữu cơ mới.',
    iconName: 'Stethoscope',
    highlights: ['Cam kết sống khỏe sau phục hồi', 'Không độc hại cho trẻ nhỏ & thú cưng', 'Đất sạch đã xử lý vi sinh']
  },
  {
    id: 'svc-3',
    title: 'Lắp Đặt Hệ Thống Tưới Nước Tự Động Thông Minh',
    pricePerSession: 450000,
    unit: 'ban công / sân thượng',
    description: 'Khảo sát và thi công hệ thống tưới nhỏ giọt hoặc phun sương hẹn giờ thông minh điều khiển qua điện thoại.',
    iconName: 'Droplets',
    highlights: ['Tiết kiệm 70% nước', 'Tự động tưới khi bạn đi du lịch', 'Bảo hành thiết bị 12 tháng']
  }
];

export const AGRI_EXPERTS: AgriculturalExpert[] = [
  {
    id: 'exp-1',
    name: 'TS. Nguyễn Văn Toàn',
    title: 'Chuyên gia Bệnh học Thực vật',
    organization: 'Viện Nghiên Cứu Cây Ăn Quả Miền Nam',
    experienceYears: 24,
    specialty: ['Sầu riêng & Cây có múi', 'Bệnh nấm & Thối rễ', 'Quản lý dịch hại IPM'],
    rating: 4.95,
    reviewsCount: 340,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    phone: '0913.789.012',
    zalo: '0913789012',
    isOnline: true,
    consultationFee: 'Tư vấn miễn phí qua App'
  },
  {
    id: 'exp-2',
    name: 'ThS. Trần Thị Kim Oanh',
    title: 'Kỹ sư Thổ nhưỡng & Nông nghiệp Hữu cơ',
    organization: 'Trung tâm Khuyến nông Quốc gia',
    experienceYears: 16,
    specialty: ['Cải tạo đất phèn & mặn', 'Phân bón hữu cơ vi sinh', 'Rau thủy canh & Aquaponics'],
    rating: 4.9,
    reviewsCount: 215,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    phone: '0908.456.789',
    zalo: '0908456789',
    isOnline: true,
    consultationFee: 'Tư vấn miễn phí qua App'
  },
  {
    id: 'exp-3',
    name: 'KS. Đặng Hoàng Nam',
    title: 'Chuyên gia Hoa kiểng & Cây cảnh Nội thất',
    organization: 'Hội Sinh vật cảnh Việt Nam',
    experienceYears: 12,
    specialty: ['Monstera & Kiểng lá quý', 'Hoa hồng cổ & Phong lan', 'Ánh sáng nhân tạo cho cây'],
    rating: 4.88,
    reviewsCount: 178,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    phone: '0979.234.567',
    zalo: '0979234567',
    isOnline: false,
    consultationFee: 'Tư vấn miễn phí qua App'
  }
];

export const AGRI_STATIONS: AgriStation[] = [
  {
    id: 'st-1',
    name: 'Trạm Vật Tư Nông Nghiệp Xanh Hóc Môn',
    type: 'supply',
    address: '142 Đường Đỗ Văn Dậy, Hóc Môn',
    province: 'TP. Hồ Chí Minh',
    lat: 10.8872,
    lng: 106.5921,
    distanceKm: 2.4,
    phone: '028.3712.4567',
    openingHours: '06:30 - 18:30 (Mở cả tuần)',
    rating: 4.8,
    services: ['Phân bón hữu cơ & NPK', 'Hạt giống F1', 'Dụng cụ làm vườn', 'Tư vấn thuốc BVTV sinh học']
  },
  {
    id: 'st-2',
    name: 'Trạm Canh Tác Hữu Cơ & Vi Sinh Bản Địa IMO',
    type: 'organic_station',
    address: 'Tỉnh Lộ 7, Xã An Nhơn Tây, Củ Chi',
    province: 'TP. Hồ Chí Minh',
    lat: 11.0254,
    lng: 106.5123,
    distanceKm: 8.7,
    phone: '0933.222.111',
    openingHours: '07:00 - 17:00',
    rating: 4.9,
    services: ['Cung cấp men ủ vi sinh IMO', 'Thu mua nông sản hữu cơ', 'Chuyển giao kỹ thuật ủ phân', 'Kiểm tra độ pH đất miễn phí']
  },
  {
    id: 'st-3',
    name: 'Vườn Ươm Cây Giống Chuẩn VietGAP Đồng Nai',
    type: 'nursery',
    address: 'Ấp Suối Tre, TP. Long Khánh',
    province: 'Đồng Nai',
    lat: 10.9421,
    lng: 107.2415,
    distanceKm: 28.5,
    phone: '0918.555.444',
    openingHours: '06:00 - 18:00',
    rating: 4.95,
    services: ['Giống sầu riêng Ri6 & Musang King', 'Cây giống bưởi da xanh', 'Cây cảnh đô thị']
  },
  {
    id: 'st-4',
    name: 'Cửa Hàng Vật Tư & Phân Bón Sinh Học Cái Bè',
    type: 'supply',
    address: 'Quốc Lộ 1A, Thị trấn Cái Bè',
    province: 'Tiền Giang',
    lat: 10.3392,
    lng: 105.9921,
    distanceKm: 42.0,
    phone: '0273.3855.999',
    openingHours: '06:00 - 19:00',
    rating: 4.7,
    services: ['Béc tưới tự động', 'Phân bón lá sinh học', 'Đo đạc dinh dưỡng đất']
  }
];

export const INITIAL_TRANSACTIONS: FarmTransaction[] = [
  {
    id: 'tx-1',
    date: '2026-11-04',
    type: 'expense',
    category: 'fertilizer',
    amount: 1250000,
    cropName: 'Vườn Sầu Riêng Ri6',
    description: 'Mua 10 bao phân hữu cơ vi sinh bón đón hoa'
  },
  {
    id: 'tx-2',
    date: '2026-11-03',
    type: 'expense',
    category: 'pesticide',
    amount: 450000,
    cropName: 'Cà Chua & Rau Ban Công',
    description: 'Dầu neem ép lạnh nguyên chất & nấm Trichoderma'
  },
  {
    id: 'tx-3',
    date: '2026-11-01',
    type: 'income',
    category: 'harvest_sale',
    amount: 8600000,
    cropName: 'Vườn Ổi Nữ Hoàng & Rau Thủy Canh',
    description: 'Xuất bán 120kg ổi giòn ngọt và 60kg rau cải xanh cho siêu thị'
  },
  {
    id: 'tx-4',
    date: '2026-10-28',
    type: 'expense',
    category: 'labor',
    amount: 1200000,
    cropName: 'Toàn bộ trang trại',
    description: 'Thuê công làm cỏ, khơi rãnh thoát nước chống ngập'
  },
  {
    id: 'tx-5',
    date: '2026-10-22',
    type: 'income',
    category: 'harvest_sale',
    amount: 15400000,
    cropName: 'Sầu Riêng Thu Hoạch Đợt 2',
    description: 'Bán 180kg sầu riêng loại 1 tại vườn cho thương lái'
  }
];

export const COMMODITY_PRICES: CommodityPriceItem[] = [
  {
    id: 'price-1',
    name: 'Sầu Riêng Ri6',
    variety: 'Hàng tuyển xô loại 1',
    region: 'Tiền Giang & Bến Tre',
    currentPrice: 92000,
    unit: 'đ/kg',
    changePercent: 4.5,
    trend: 'up',
    history: [
      { day: '31/10', price: 84000 },
      { day: '01/11', price: 86000 },
      { day: '02/11', price: 87500 },
      { day: '03/11', price: 89000 },
      { day: '04/11', price: 90000 },
      { day: '05/11', price: 92000 }
    ],
    marketAnalysis: 'Nhu cầu xuất khẩu sang thị trường Trung Quốc tăng mạnh cuối năm. Dự báo giá tiếp tục giữ mức cao trong 2 tuần tới.'
  },
  {
    id: 'price-2',
    name: 'Cà Phê Nhân Xô Robusta',
    variety: 'Cà phê nhân hạt khô',
    region: 'Đắk Lắk & Lâm Đồng',
    currentPrice: 118500,
    unit: 'đ/kg',
    changePercent: 1.8,
    trend: 'up',
    history: [
      { day: '31/10', price: 114000 },
      { day: '01/11', price: 115200 },
      { day: '02/11', price: 116000 },
      { day: '03/11', price: 117000 },
      { day: '04/11', price: 117800 },
      { day: '05/11', price: 118500 }
    ],
    marketAnalysis: 'Tồn kho toàn cầu đang thấp kỷ lục. Khuyến nghị bà con phơi sấy đạt chuẩn thủy phần 12.5% trước khi xuất bán để đạt giá tối đa.'
  },
  {
    id: 'price-3',
    name: 'Lúa Hạt Dài OM 5451 (Tươi)',
    variety: 'Cắt máy tại ruộng',
    region: 'An Giang & Đồng Tháp',
    currentPrice: 8200,
    unit: 'đ/kg',
    changePercent: -1.2,
    trend: 'down',
    history: [
      { day: '31/10', price: 8500 },
      { day: '01/11', price: 8450 },
      { day: '02/11', price: 8350 },
      { day: '03/11', price: 8300 },
      { day: '04/11', price: 8250 },
      { day: '05/11', price: 8200 }
    ],
    marketAnalysis: 'Vụ thu hoạch rộ khiến nguồn cung dồi dào tạm thời. Giá ổn định quanh ngưỡng 8.000 - 8.300 đ/kg.'
  },
  {
    id: 'price-4',
    name: 'Hồ Tiêu Đen',
    variety: 'Tiêu hạt dung trọng 550g/l',
    region: 'Gia Lai & Đắk Nông',
    currentPrice: 142000,
    unit: 'đ/kg',
    changePercent: 2.1,
    trend: 'up',
    history: [
      { day: '31/10', price: 137000 },
      { day: '01/11', price: 138000 },
      { day: '02/11', price: 139500 },
      { day: '03/11', price: 140000 },
      { day: '04/11', price: 141000 },
      { day: '05/11', price: 142000 }
    ],
    marketAnalysis: 'Thương lái gom hàng xuất khẩu mạnh, người trồng chủ động giữ hàng nên giá tăng đều.'
  },
  {
    id: 'price-5',
    name: 'Thanh Long Ruột Đỏ',
    variety: 'Hàng xuất khẩu loại 1',
    region: 'Bình Thuận & Long An',
    currentPrice: 38000,
    unit: 'đ/kg',
    changePercent: 5.5,
    trend: 'up',
    history: [
      { day: '31/10', price: 32000 },
      { day: '01/11', price: 34000 },
      { day: '02/11', price: 35000 },
      { day: '03/11', price: 36000 },
      { day: '04/11', price: 37000 },
      { day: '05/11', price: 38000 }
    ],
    marketAnalysis: 'Vụ xông đèn nghịch vụ sản lượng vừa phải, sức mua tiêu thụ thị trường tết sớm sôi động.'
  }
];

export const DISEASE_ENCYCLOPEDIA: DiseaseEncyclopediaItem[] = [
  {
    id: 'dis-1',
    diseaseName: 'Bệnh Thán Thư (Anthracnose)',
    cropType: 'Xoài, Ớt, Cà chua, Hoa lan, Sầu riêng',
    pathogenType: 'Nấm',
    severity: 'Trung bình',
    imageUrl: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=500&q=80',
    symptoms: [
      'Vết bệnh hình tròn hoặc bầu dục màu nâu sẫm hơi lõm xuống',
      'Trên đốm bệnh xuất hiện các vòng đồng tâm màu đen',
      'Lá khô cháy từng mảng, hoa và trái non bị rụng hàng loạt'
    ],
    organicSolution: [
      'Phun chế phẩm Nano Bạc hoặc nấm đối kháng Trichoderma nồng độ 10g/bình 16 lít',
      'Pha cồn tỏi ớt gừng phun phòng định kỳ vào sáng sớm',
      'Cắt bỏ toàn bộ cành lá nhiễm bệnh nặng đem đốt tiêu hủy'
    ],
    chemicalSolution: [
      'Hoạt chất Azoxystrobin + Difenoconazole (Amistar Top), Mancozeb hoặc Antracol 70WP'
    ],
    prevention: [
      'Tỉa thông thoáng tán lá, tránh tưới phun mưa lên tán lúc chiều tối',
      'Bón cân đối N-P-K, tăng cường Canxi và Silic giúp thành tế bào lá dày chắc'
    ]
  },
  {
    id: 'dis-2',
    diseaseName: 'Bệnh Xì Mủ & Thối Rễ (Phytophthora)',
    cropType: 'Sầu riêng, Cam quýt, Tiêu, Bơ',
    pathogenType: 'Nấm',
    severity: 'Nghiêm trọng',
    imageUrl: 'https://images.unsplash.com/photo-1546548970-71785318a17b?auto=format&fit=crop&w=500&q=80',
    symptoms: [
      'Thân cây ứa giọt mủ màu nâu đỏ, cạo lớp vỏ thấy gỗ thâm đen',
      'Lá vàng hàng loạt, rễ tơ bị thối mục có mùi hôi chua',
      'Cây suy kiệt nhanh chóng và có thể chết đứng sau mùa mưa'
    ],
    organicSolution: [
      'Cạo sạch vết bệnh trên thân, quét vôi tôi hoặc bột đồng đỏ pha Trichoderma',
      'Tưới gốc bằng Phosphonate sinh học (Acid Phosphorous) kích kháng tự nhiên'
    ],
    chemicalSolution: [
      'Hoạt chất Metalaxyl (Ridomil Gold), Fosetyl Aluminium (Aliette), Dimethomorph'
    ],
    prevention: [
      'Làm mô cao thoát nước, tuyệt đối không để nước tù đọng quanh gốc',
      'Hàng năm quét gốc bằng vôi và rải lân nung chảy khử chua đất'
    ]
  },
  {
    id: 'dis-3',
    diseaseName: 'Bệnh Vàng Lá Gân Xanh (Greening / HLB)',
    cropType: 'Cây có múi (Cam, Bưởi, Chanh)',
    pathogenType: 'Vi khuẩn',
    severity: 'Nghiêm trọng',
    imageUrl: 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?auto=format&fit=crop&w=500&q=80',
    symptoms: [
      'Phiến lá chuyển vàng nhưng gân lá vẫn giữ màu xanh đậm',
      'Trái phát triển lệch tâm, hạt lép đen, nước chua chát',
      'Rầy chổng cánh là tác nhân chính truyền bệnh từ cây này sang cây khác'
    ],
    organicSolution: [
      'Nuôi kiến vàng trong vườn cam bưởi để săn bắt rầy chổng cánh',
      'Phun tinh dầu cam neem sinh học xua đuổi côn trùng chích hút'
    ],
    chemicalSolution: [
      'Không có thuốc hóa học trị dứt điểm vi khuẩn một khi đã nhiễm toàn thân. Cần tiêu hủy cây bệnh để bảo vệ vườn.'
    ],
    prevention: [
      'Chỉ chọn mua cây giống sạch bệnh từ các viện nghiên cứu có chứng chỉ',
      'Trồng hàng rào cây chắn gió và bẫy dính màu vàng giám sát rầy'
    ]
  },
  {
    id: 'dis-4',
    diseaseName: 'Rệp Sáp Dính Trắng & Bồ Hóng',
    cropType: 'Cây cảnh trong nhà, Hoa sứ, Ớt, Cà phê',
    pathogenType: 'Côn trùng',
    severity: 'Nhẹ',
    imageUrl: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=500&q=80',
    symptoms: [
      'Lớp bông trắng như phấn bám dày ở nách lá, cuống hoa, mặt dưới lá',
      'Xuất hiện lớp nấm muội đen bồ hóng do dịch ngọt rệp tiết ra',
      'Lá non xoăn tít, cây chậm lớn còi cọc'
    ],
    organicSolution: [
      'Lấy tăm bông thấm cồn y tế 70 độ lau trực tiếp lên ổ rệp sáp',
      'Pha 5ml nước rửa chén + 5ml dầu ăn hữu cơ + 1 lít nước lắc đều xịt ướt đẫm'
    ],
    chemicalSolution: [
      'Hoạt chất Spirotetramat (Movento 150OD) lưu dẫn 2 chiều hiệu quả cao'
    ],
    prevention: [
      'Thường xuyên kiểm tra kẽ lá, giữ vườn thông thoáng nhiều ánh sáng mặt trời'
    ]
  }
];

export const VIDEO_GUIDES: VideoGuideItem[] = [
  {
    id: 'vid-1',
    title: 'Kỹ Thuật Chiết & Ghép Cành Cây Ăn Trái Tỷ Lệ Sống 100%',
    category: 'Kỹ Thuật Nhân Giống',
    duration: '12:45',
    thumbnailUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=600&q=80',
    summary: 'Hướng dẫn chuẩn bị dao ghép chuyên dụng, chọn mắt ghép bánh tẻ khỏe mạnh, cách bọc nylon giữ ẩm và thời điểm tháo dây ghép.',
    steps: [
      'Chọn cành mẹ khỏe mạnh, không sâu bệnh ở tầng tán giữa.',
      'Dùng dao sắc khoanh vỏ một đoạn dài 2-3cm, cạo sạch lớp màng tượng tầng.',
      'Trộn giá thể xơ dừa ẩm + rễ bèo tây bọc quanh vết khoanh.',
      'Dùng màng bọc nilong trong suốt quấn chặt hai đầu chống nước mưa ngấm vào.',
      'Sau 35-45 ngày khi rễ chuyển màu vàng cánh gián thì cắt bầu trồng.'
    ]
  },
  {
    id: 'vid-2',
    title: 'Cách Tự Nuôi Vi Sinh Bản Địa (IMO 4) Từ Cơm Nguội & Cám Gạo',
    category: 'Nông Nghiệp Hữu Cơ',
    duration: '18:20',
    thumbnailUrl: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=600&q=80',
    summary: 'Phương pháp phân lập vi sinh có ích tự nhiên từ rừng tre hoặc đất vườn cổ, biến phế phẩm nông nghiệp thành men ủ phân siêu tốc không mùi.',
    steps: [
      'Nấu cơm dẻo, để nguội cho vào rổ tre đậy lá chuối đặt dưới gốc tre 5 ngày tạo IMO 1.',
      'Trộn IMO 1 với mật rỉ đường tỷ lệ 1:1 ủ 5 ngày tạo dịch men lỏng IMO 2.',
      'Pha nước IMO 2 tưới vào cám gạo giữ độ ẩm 60% ủ yếm khí tạo men bột IMO 3.',
      'Trộn IMO 3 với đất mùn rừng và cám để nhân sinh khối men IMO 4 phục vụ bón vườn.'
    ]
  },
  {
    id: 'vid-3',
    title: 'Xử Lý Nước Tưới & Cân Bằng Độ Ẩm Chống Úng Cho Chậu Cây Ban Công',
    category: 'Làm Vườn Đô Thị',
    duration: '09:15',
    thumbnailUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=600&q=80',
    summary: 'Bí quyết khoan lỗ thoát nước đáy chậu, lót lớp đá perlite/than củi và nguyên tắc kiểm tra đất khô trước khi tưới.',
    steps: [
      'Luôn lót 2-3cm đất nung hoặc sỏi nhẹ ở đáy chậu trước khi đổ đất.',
      'Kiểm tra độ ẩm bằng cách cắm ngón tay sâu 3cm vào đất: nếu thấy đất dính mát thì chưa cần tưới.',
      'Tưới từ từ đến khi thấy nước thừa chảy ra đáy đĩa lót thì dừng lại.',
      'Đổ bỏ nước đọng trong đĩa lót sau 30 phút để chống nghẹt rễ.'
    ]
  }
];

export const INITIAL_EXPERT_THREADS: ExpertThread[] = [
  {
    id: 'thread-exp-1',
    expertId: 'exp-1',
    lastMessageAt: '10 phút trước',
    unreadCount: 1,
    status: 'active',
    linkedPlantId: 'plant-4',
    messages: [
      {
        id: 'em-1',
        threadId: 'thread-exp-1',
        sender: 'expert',
        senderName: 'TS. Nguyễn Văn Toàn',
        senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        content: 'Chào bạn! Tôi là TS. Nguyễn Văn Toàn (Viện Nghiên Cứu Cây Ăn Quả Miền Nam). Bạn có thể gửi ảnh lá hoặc hồ sơ cây trồng từ Vườn Của Tôi để tôi xem trực tiếp và lên phác đồ xử lý bệnh nấm hoặc tưới bón phù hợp nhất nhé.',
        timestamp: '09:15',
        isRead: true
      },
      {
        id: 'em-2',
        threadId: 'thread-exp-1',
        sender: 'user',
        senderName: 'Tôi (Nhà nông)',
        content: 'Chào Tiến sĩ, cây Sầu Riêng Ri6 nhà em đang giai đoạn nuôi trái non 8cm, mấy ngày nay mưa chiều nhiều nên em hơi lo nấm Phytophthora xì mủ thân và rụng trái.',
        timestamp: '09:20',
        isRead: true,
        attachments: [
          {
            type: 'plant_report',
            plantId: 'plant-4',
            plantName: 'Sầu Riêng Ri6 Cơm Vàng Hạt Lép',
            summary: 'Sức khỏe 90% · Độ ẩm đất 44% · Đang nuôi trái non 8cm'
          }
        ]
      },
      {
        id: 'em-3',
        threadId: 'thread-exp-1',
        sender: 'expert',
        senderName: 'TS. Nguyễn Văn Toàn',
        senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        content: 'Tôi đã kiểm tra thông số vườn của bạn: độ ẩm đất đang 44% trong khi ngưỡng chuẩn giai đoạn nuôi trái cần duy trì 60-75% ổn định (tránh sốc khô rồi mưa ngập gây rụng trái). Bạn áp dụng ngay phác đồ phòng xì mủ sinh học dưới đây nhé:',
        timestamp: '09:24',
        isRead: false,
        attachments: [
          {
            type: 'care_prescription',
            plantId: 'plant-4',
            plantName: 'Sầu Riêng Ri6 Cơm Vàng Hạt Lép',
            title: 'Phác đồ chống sốc nước & ngừa xì mủ trái non',
            recommendations: [
              'Tưới giữ ẩm gốc đều đặn 40L/gốc vào sáng sớm, không để đất tụt dưới 55%.',
              'Tưới hoặc quét gốc chế phẩm Trichoderma kết hợp Humic để ức chế nấm Phytophthora.',
              'Bổ sung Canxi-Bo qua lá vào sáng mát để dai cuống, hạn chế rụng trái sau mưa đêm.'
            ],
            suggestedCareType: 'pest_control'
          }
        ]
      }
    ]
  },
  {
    id: 'thread-exp-2',
    expertId: 'exp-2',
    lastMessageAt: 'Hôm qua',
    unreadCount: 0,
    status: 'active',
    linkedPlantId: 'plant-1',
    messages: [
      {
        id: 'em-4',
        threadId: 'thread-exp-2',
        sender: 'expert',
        senderName: 'ThS. Trần Thị Kim Oanh',
        senderAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
        content: 'Xin chào! Tôi hỗ trợ tư vấn cải tạo đất, phối trộn giá thể hữu cơ, phân trùn quế và vi sinh IMO cho rau ăn quả tại nhà. Bạn cần cân đối dinh dưỡng cho chậu cây nào cứ nhắn cho tôi nhé!',
        timestamp: 'Hôm qua',
        isRead: true
      }
    ]
  }
];

export const INITIAL_EXPERT_QA: ExpertQAQuestion[] = [
  {
    id: 'qa-exp-1',
    title: 'Cà chua bi ra hoa chùm 3 nhưng rụng hoa nhiều do thời tiết nóng ẩm, cách tăng đậu trái?',
    category: 'nutrition',
    plantId: 'plant-1',
    plantName: 'Cà Chua Bi F1 Cherry',
    authorName: 'Nguyễn Minh Tuấn',
    location: 'Hóc Môn, TP.HCM',
    createdAt: '2 giờ trước',
    content: 'Cây cà chua bi của mình cao 65cm, ra chùm hoa thứ 3 rất sai nhưng mấy hôm nay nắng nóng 32°C rồi chiều mưa nên bị rụng bớt hoa chưa kịp đậu quả. Mình đã bón đạm cá tuần trước. Nhờ kỹ sư tư vấn cách bổ sung phân bón và chăm sóc để giữ hoa đậu quả tối đa.',
    images: ['https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=500&q=80'],
    attachedReportSummary: 'Chiều cao: 65cm · 28 lá · Sức khỏe: 92% · Độ ẩm đất: 28%',
    targetExpertId: 'exp-2',
    status: 'answered',
    answers: [
      {
        id: 'ans-1',
        expertId: 'exp-2',
        expertName: 'ThS. Trần Thị Kim Oanh',
        expertTitle: 'Kỹ sư Thổ nhưỡng & Nông nghiệp Hữu cơ',
        expertAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
        organization: 'Trung tâm Khuyến nông Quốc gia',
        content: 'Nguyên nhân chính khiến cà chua rụng hoa là cây đang thiếu ẩm đột ngột (độ ẩm đất chỉ còn 28%) kết hợp bón nhiều đạm cá làm cây thiên về phát triển lá, thiếu Canxi-Bo và Kali để thụ phấn.',
        recommendations: [
          'Ngừng bón đạm cá trong 10 ngày, chuyển sang bổ sung phân hữu cơ giàu Kali + Lân (hoặc dịch chuối trứng sữa) 7 ngày/lần.',
          'Phun bổ sung Canxi-Bo sinh học liều nhẹ vào lúc 7h sáng giúp hạt phấn khỏe và dai cuống hoa.',
          'Duy trì độ ẩm đất 55-70% đều đặn, phủ rơm rạ hoặc xơ dừa trên mặt chậu để tránh đất bốc hơi quá nhanh.',
          'Rung nhẹ giàn hoa lúc 9h-10h sáng hàng ngày để tăng tỷ lệ tự thụ phấn.'
        ],
        followUpDays: 5,
        createdAt: '1 giờ trước',
        helpfulCount: 19,
        isMarkedHelpful: false
      }
    ]
  },
  {
    id: 'qa-exp-2',
    title: 'Lá Monstera mới mở bị rách nhẹ và hơi rũ xuống dù độ ẩm đất vẫn 58%, nguyên nhân do đâu?',
    category: 'general',
    plantId: 'plant-2',
    plantName: 'Trầu Bà Lá Xẻ Nam Mỹ (Monstera)',
    authorName: 'Lê Thảo Vy',
    location: 'Quận 7, TP.HCM',
    createdAt: '1 ngày trước',
    content: 'Cây Monstera trồng trong phòng khách gần cửa sổ, giá thể xơ dừa + perlite + vỏ thông. Lá mới thứ 7 vừa bung ra xẻ 4 rãnh đẹp nhưng phiến lá còn hơi mềm rũ. Tôi có nên tưới thêm nước hay bón thêm phân ngay không?',
    images: ['https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=500&q=80'],
    attachedReportSummary: 'Chiều cao: 58cm · 7 lá · Sức khỏe: 96% · Độ ẩm đất: 58%',
    targetExpertId: 'exp-3',
    status: 'resolved',
    answers: [
      {
        id: 'ans-2',
        expertId: 'exp-3',
        expertName: 'KS. Đặng Hoàng Nam',
        expertTitle: 'Chuyên gia Hoa kiểng & Cây cảnh Nội thất',
        expertAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
        organization: 'Hội Sinh vật cảnh Việt Nam',
        content: 'Với độ ẩm đất 58% thì bạn TUYỆT ĐỐI không tưới thêm nước nhé! Lá non Monstera mới mở trong 5-7 ngày đầu luôn có mô lá mềm, màu xanh non nhạt và cần thời gian cứng cáp dần.',
        recommendations: [
          'Chờ mặt giá thể khô 3-4cm (độ ẩm khoảng 35-40%) mới tưới đợt tiếp theo.',
          'Đặt cây cách cửa sổ có ánh sáng tán xạ mạnh khoảng 1-1.5m, xoay chậu 90 độ mỗi tuần để tán lá cân đối.',
          'Sau khi lá non chuyển xanh đậm hoàn toàn (khoảng 7 ngày nữa) mới bón phân tan chậm hoặc đạm rong biển loãng.'
        ],
        followUpDays: 7,
        createdAt: '20 giờ trước',
        helpfulCount: 27,
        isMarkedHelpful: true
      }
    ]
  }
];

