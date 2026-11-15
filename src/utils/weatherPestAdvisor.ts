import { Plant, WeatherCondition, WeatherPestRiskAlert } from '../types';

/**
 * Agricultural Epidemiological Rules for Weather-Induced Pests & Diseases
 * Evaluates real-time meteorological conditions against plant varieties in the user's garden.
 */
export function evaluateWeatherPestRisks(
  plants: Plant[],
  weather: WeatherCondition
): WeatherPestRiskAlert[] {
  const alerts: WeatherPestRiskAlert[] = [];
  const { temp, humidity, rainfallMm, condition, windSpeedKmH, city } = weather;

  plants.forEach(plant => {
    const nameLower = plant.name.toLowerCase();
    const sciLower = plant.scientificName.toLowerCase();
    const cat = plant.category;

    // 1. Solanaceae (Cà Chua, Cà Tím, Ớt, Khoai Tây)
    const isTomatoOrChili =
      nameLower.includes('cà chua') ||
      nameLower.includes('ớt') ||
      sciLower.includes('lycopersicum') ||
      sciLower.includes('capsicum') ||
      sciLower.includes('solanum');

    // 2. Roses & Ornamental Flowers
    const isRoseOrFlower =
      cat === 'flower' ||
      nameLower.includes('hồng') ||
      nameLower.includes('hoa') ||
      sciLower.includes('rosa');

    // 3. Indoor Foliage (Monstera, Lưỡi Hổ, Cây kiểng lá)
    const isIndoorFoliage =
      cat === 'indoor' ||
      nameLower.includes('trầu bà') ||
      nameLower.includes('lưỡi hổ') ||
      nameLower.includes('monstera') ||
      sciLower.includes('monstera') ||
      sciLower.includes('sansevieria');

    // 4. Fruit trees (Sầu riêng, Bưởi, Cam, Ổi, Xoài)
    const isFruitTree =
      cat === 'fruit' ||
      nameLower.includes('sầu riêng') ||
      nameLower.includes('bưởi') ||
      nameLower.includes('cam') ||
      nameLower.includes('ổi') ||
      nameLower.includes('xoài') ||
      nameLower.includes('chanh');

    // 5. Leafy Greens & Vegetables
    const isLeafyVeg =
      cat === 'vegetable' && !isTomatoOrChili;

    // --- RULE A: Sương Mai / Mốc Sương (Phytophthora infestans) ---
    // Trigger: Độ ẩm không khí cao (>75%), nhiệt độ mát/ấm 20-28°C, có mưa hoặc sương ẩm
    if (isTomatoOrChili && humidity >= 76 && temp >= 19 && temp <= 29 && (rainfallMm > 2 || condition === 'rainy' || condition === 'cloudy')) {
      const riskScore = Math.min(96, Math.round(55 + (humidity - 70) * 1.5 + rainfallMm * 0.8));
      alerts.push({
        id: `pest-blight-${plant.id}`,
        plantId: plant.id,
        plantName: plant.name,
        plantScientificName: plant.scientificName,
        plantImage: plant.imageUrl,
        plantCategory: plant.category,
        pestDiseaseName: 'Bệnh Mốc Sương (Sương Mai - Late Blight)',
        scientificPathogen: 'Phytophthora infestans',
        pathogenType: 'Nấm',
        riskLevel: riskScore >= 80 ? 'critical' : 'high',
        riskScore,
        weatherCondition: {
          temp,
          humidity,
          rainfallMm,
          windSpeedKmH,
          condition,
          description: `Độ ẩm cao ${humidity}% kết hợp nhiệt độ ${temp}°C và mưa ẩm ${rainfallMm}mm tại ${city.split('/')[0]} tạo điều kiện tối ưu để bào tử nấm mốc sương nảy mầm trong vòng 4-6 giờ.`
        },
        triggerReason: `Ẩm độ không khí cao ${humidity}% và lượng mưa ${rainfallMm}mm làm đọng nước trên tán lá trên 4 giờ liên tục.`,
        symptomsToWatch: [
          'Vết đốm úng nước màu xanh xám loang lổ ở chóp và mép lá',
          'Lớp mốc tơ màu trắng xốp xuất hiện ở mặt dưới phiến lá vào sáng sớm',
          'Vết thâm đen lan nhanh xuống cuống lá và thân cây gây gãy gục'
        ],
        immediateAction: 'Cắt tỉa ngay toàn bộ các lá chân già sát mặt đất, ngừng tưới phun sương lên mặt lá, kê chậu cây lên cao tránh ẩm.',
        organicRemedies: [
          'Phun chế phẩm sinh học nấm đối kháng Trichoderma harzianum tỷ lệ 15g/10L nước',
          'Pha dung dịch Nano Bạc 500ppm phun ướt đều 2 mặt lá lúc ráo sương',
          'Phun dung dịch vôi + lưu huỳnh nồng độ nhẹ vào buổi sáng'
        ],
        preventionAdvice: [
          'Che mái bạt trong suốt bảo vệ chậu cây khỏi mưa dập trực tiếp',
          'Bón tăng cường Kali Silic giúp vách tế bào lá dày chắc cản sợi nấm xuyên thủng'
        ],
        timestamp: 'Cảnh báo sớm thời tiết hôm nay'
      });
    }

    // --- RULE B: Nhện Đỏ & Bọ Trĩ Chích Hút (Spider Mites & Thrips) ---
    // Trigger: Nắng nóng gay gắt (temp >= 31°C), thời tiết khô nóng hoặc nắng gắt sau mưa
    if ((isTomatoOrChili || isRoseOrFlower || isFruitTree) && temp >= 31) {
      const riskScore = Math.min(95, Math.round(50 + (temp - 30) * 8 + (100 - humidity) * 0.2));
      alerts.push({
        id: `pest-thrips-${plant.id}`,
        plantId: plant.id,
        plantName: plant.name,
        plantScientificName: plant.scientificName,
        plantImage: plant.imageUrl,
        plantCategory: plant.category,
        pestDiseaseName: 'Bùng Phát Bọ Trĩ & Nhện Đỏ Hại Lá',
        scientificPathogen: 'Tetranychus urticae / Thripidae',
        pathogenType: 'Côn trùng',
        riskLevel: riskScore >= 75 ? 'critical' : 'high',
        riskScore,
        weatherCondition: {
          temp,
          humidity,
          rainfallMm,
          windSpeedKmH,
          condition,
          description: `Nhiệt độ nắng gắt ${temp}°C làm vòng đời nhện đỏ và bọ trĩ rút ngắn từ 14 ngày xuống chỉ còn 4-5 ngày, tốc độ nhân đàn theo cấp số nhân.`
        },
        triggerReason: `Nắng nóng ${temp}°C kèm gió giật ${windSpeedKmH}km/h phát tán nhanh ấu trùng chích hút giữa các chậu cây.`,
        symptomsToWatch: [
          'Mặt trên lá xuất hiện các chấm lấm tấm màu vàng bạc hoặc đồng',
          'Mặt dưới lá có màng tơ nhện mỏng li ti và ấu trùng chuyển động chậm',
          'Ngọn non và nụ hoa bị xoăn tít, dị dạng, chồi đen khô'
        ],
        immediateAction: 'Dùng vòi nước áp lực vừa xịt mạnh vào mặt dưới phiến lá vào buổi trưa để rửa trôi ổ nhện và hạ nhiệt tán lá.',
        organicRemedies: [
          'Phun dung dịch Dầu Neem (Cold-pressed Neem Oil) pha nước bồ hòn nồng độ 5ml/1L nước lúc chiều mát',
          'Pha cồn y tế 70 độ + tỏi ớt gừng phun phòng định kỳ 3 ngày/lần',
          'Treo bẫy dính màu vàng xung quanh chậu để gom bọ trĩ trưởng thành'
        ],
        preventionAdvice: [
          'Tưới đủ ẩm cho bầu rễ vào sáng sớm, phủ rơm rạ mục giữ ẩm gốc',
          'Tránh bón quá nhiều đạm hóa học làm mô lá quá non mềm'
        ],
        timestamp: 'Cảnh báo sớm thời tiết hôm nay'
      });
    }

    // --- RULE C: Bệnh Đốm Đen & Phấn Trắng Hoa Hồng (Black Spot & Powdery Mildew) ---
    // Trigger: Độ ẩm sáng sớm cao (>78%), sương mù, nhiệt độ ấm 22-30°C
    if (isRoseOrFlower && humidity >= 75 && temp >= 21 && temp <= 32) {
      const riskScore = Math.min(94, Math.round(60 + (humidity - 72) * 1.6));
      alerts.push({
        id: `pest-blackspot-${plant.id}`,
        plantId: plant.id,
        plantName: plant.name,
        plantScientificName: plant.scientificName,
        plantImage: plant.imageUrl,
        plantCategory: plant.category,
        pestDiseaseName: 'Bệnh Đốm Đen Lá & Phấn Trắng Hoa Hồng',
        scientificPathogen: 'Diplocarpon rosae / Podosphaera pannosa',
        pathogenType: 'Nấm',
        riskLevel: riskScore >= 80 ? 'critical' : 'high',
        riskScore,
        weatherCondition: {
          temp,
          humidity,
          rainfallMm,
          windSpeedKmH,
          condition,
          description: `Độ ẩm ${humidity}% tại ${city.split('/')[0]} kích thích bào tử nấm phấn trắng và đốm đen lây lan trên búp hoa và tán lá mỏng.`
        },
        triggerReason: `Ẩm độ ${humidity}% kéo dài qua đêm khiến đọng sương trên cuống hoa và chồi non.`,
        symptomsToWatch: [
          'Các đốm tròn màu đen có rìa răng cưa xuất hiện trên lá già và lá bánh tẻ',
          'Lớp phấn trắng như rắc bột phủ trên lá non, cuống nụ hoa',
          'Lá vàng hàng loạt quanh đốm đen và trút lá trơ cành'
        ],
        immediateAction: 'Nhặt sạch toàn bộ lá rụng và lá chớm đốm đen đem tiêu hủy, tuyệt đối không ủ phân hữu cơ lá bệnh.',
        organicRemedies: [
          'Phun hỗn hợp Baking soda (1 thìa cà phê) + dầu ăn hữu cơ (1 thìa) + 1 lít nước ấm',
          'Sữa tươi không đường pha tỷ lệ 1:9 với nước sạch phun vào sáng có nắng nhẹ',
          'Chế phẩm sinh học Bacillus subtilis ức chế bào tử nấm'
        ],
        preventionAdvice: [
          'Đặt chậu hoa hồng ở vị trí đón tối thiểu 4-6 tiếng nắng trực tiếp',
          'Tỉa sạch cành tăm, cành điếc ở tâm bụi giúp gió lưu thông'
        ],
        timestamp: 'Cảnh báo sớm thời tiết hôm nay'
      });
    }

    // --- RULE D: Bệnh Thán Thư Cây Ăn Trái & Cây Lá Nhiệt Đới (Anthracnose) ---
    // Trigger: Mưa ẩm (rainfall >= 8mm hoặc humidity >= 80%), nhiệt độ 26-34°C
    if ((isFruitTree || isIndoorFoliage || isTomatoOrChili) && humidity >= 78 && temp >= 25 && (rainfallMm >= 5 || condition === 'rainy' || condition === 'storm')) {
      const riskScore = Math.min(92, Math.round(55 + rainfallMm * 1.2 + (humidity - 70)));
      alerts.push({
        id: `pest-anthracnose-${plant.id}`,
        plantId: plant.id,
        plantName: plant.name,
        plantScientificName: plant.scientificName,
        plantImage: plant.imageUrl,
        plantCategory: plant.category,
        pestDiseaseName: 'Bệnh Thán Thư Thối Đốm Đồng Tâm (Anthracnose)',
        scientificPathogen: 'Colletotrichum gloeosporioides',
        pathogenType: 'Nấm',
        riskLevel: riskScore >= 78 ? 'high' : 'medium',
        riskScore,
        weatherCondition: {
          temp,
          humidity,
          rainfallMm,
          windSpeedKmH,
          condition,
          description: `Vũ lượng mưa ${rainfallMm}mm cùng độ ẩm ${humidity}% là môi trường phát tán giọt nước mang bào tử nấm thán thư bắn tung tóe giữa các tầng lá.`
        },
        triggerReason: `Mưa ẩm ${rainfallMm}mm làm bào tử nấm thán thư phân tán nhanh qua các giọt bắn.`,
        symptomsToWatch: [
          'Đốm bệnh hình tròn hoặc bán nguyệt màu nâu sẫm hơi lõm',
          'Vết bệnh có các vòng đồng tâm màu đen, mép có viền vàng sáng',
          'Đọt non bị thâm đen và chết ngược từ ngọn xuống'
        ],
        immediateAction: 'Dùng kéo vô trùng cắt bỏ phần phiến lá bị thâm đen trước khi nấm ăn sâu vào gân chính.',
        organicRemedies: [
          'Phun dịch chiết xuất Nano Bạc Đồng sinh học',
          'Phun dung dịch Nano Curcumin tinh nghệ sát khuẩn vết thương mô lá',
          'Tưới gốc nấm đối kháng Trichoderma bảo vệ rễ'
        ],
        preventionAdvice: [
          'Khơi thông rãnh thoát nước chậu, tránh đọng nước trên mặt giá thể',
          'Tăng cường bón Kali hữu cơ để thành biểu bì lá thêm dai khỏe'
        ],
        timestamp: 'Cảnh báo sớm thời tiết hôm nay'
      });
    }

    // --- RULE E: Bệnh Thối Rễ & Nghẹt Rễ Nấm Đất (Root Rot / Fusarium / Pythium) ---
    // Trigger: Mưa to dồn dập (rainfallMm >= 10mm) hoặc sình úng đất trồng
    if (isIndoorFoliage && (rainfallMm >= 10 || condition === 'rainy' || condition === 'storm' || (plant.soilMoisturePercent || 50) > 75)) {
      const riskScore = Math.min(95, Math.round(65 + rainfallMm * 1.5));
      alerts.push({
        id: `pest-rootrot-${plant.id}`,
        plantId: plant.id,
        plantName: plant.name,
        plantScientificName: plant.scientificName,
        plantImage: plant.imageUrl,
        plantCategory: plant.category,
        pestDiseaseName: 'Bệnh Ngập Úng & Thối Rễ Nấm Đất',
        scientificPathogen: 'Fusarium oxysporum / Pythium spp.',
        pathogenType: 'Nấm',
        riskLevel: riskScore >= 80 ? 'critical' : 'high',
        riskScore,
        weatherCondition: {
          temp,
          humidity,
          rainfallMm,
          windSpeedKmH,
          condition,
          description: `Mưa lớn dồn dập ${rainfallMm}mm làm đất trồng chậu bị nén chặt, thiếu oxy cục bộ, kích hoạt nấm kỵ khí tấn công chóp rễ tơ.`
        },
        triggerReason: `Mưa dồn dập ${rainfallMm}mm gây tích nước đáy chậu, độ ẩm đất bão hòa làm rễ thiếu oxy hô hấp.`,
        symptomsToWatch: [
          'Lá dưới gốc chuyển vàng úng mềm, cuống lá mất sức căng rũ xuống',
          'Đầu lá xuất hiện vệt thâm đen nâu nhũn ướt',
          'Gốc cây lung lay, có mùi ẩm mốc chua bốc lên từ bầu đất'
        ],
        immediateAction: 'Kê chậu lên gạch hoặc chân đế thoát nước, đổ sạch nước đọng trong đĩa lót, tạm dừng tưới 4-5 ngày.',
        organicRemedies: [
          'Tưới trực tiếp dung dịch nấm Trichoderma ủ vi sinh kích rễ',
          'Pha Oxy già y tế 3% (15ml / 1L nước) tưới cấp cứu bổ sung oxy cho rễ',
          'Rải một lớp xơ dừa sấy khô hoặc than củi vụn lên mặt chậu hút ẩm'
        ],
        preventionAdvice: [
          'Kiểm tra lại lỗ thoát nước đáy chậu định kỳ 1 tháng/lần',
          'Trộn giá thể thoát nước tốt gồm perlite, đá pumice, vỏ thông'
        ],
        timestamp: 'Cảnh báo sớm thời tiết hôm nay'
      });
    }

    // --- RULE F: Rệp Sáp Dính Bông Trắng & Nấm Muội Đen Bồ Hóng (Mealybugs) ---
    // Trigger: Thời tiết nhiều mây, nóng ẩm bí gió, nhiệt độ 26-32°C, độ ẩm 70-85%
    if ((isIndoorFoliage || isFruitTree || isTomatoOrChili) && temp >= 26 && temp <= 33 && humidity >= 68 && (condition === 'cloudy' || windSpeedKmH < 10)) {
      const riskScore = Math.min(88, Math.round(50 + (humidity - 65) * 1.2));
      alerts.push({
        id: `pest-mealybug-${plant.id}`,
        plantId: plant.id,
        plantName: plant.name,
        plantScientificName: plant.scientificName,
        plantImage: plant.imageUrl,
        plantCategory: plant.category,
        pestDiseaseName: 'Rệp Sáp Dính Trắng & Muội Đen Bồ Hóng',
        scientificPathogen: 'Pseudococcidae & Capnodium',
        pathogenType: 'Côn trùng',
        riskLevel: riskScore >= 75 ? 'high' : 'medium',
        riskScore,
        weatherCondition: {
          temp,
          humidity,
          rainfallMm,
          windSpeedKmH,
          condition,
          description: `Thời tiết nhiều mây bí gió (gió nhẹ ${windSpeedKmH}km/h) tạo môi trường ấm cúng lý tưởng để rệp sáp đẻ bọc trứng ở các nách lá khuất.`
        },
        triggerReason: `Thời tiết bí gió ít nắng làm rệp sáp phát triển mạnh trong các nách lá và kẽ chồi non.`,
        symptomsToWatch: [
          'Các cụm bông trắng như phấn sáp bám dày ở cuống lá và kẽ nhánh',
          'Lớp muội đen bồ hóng phủ trên bề mặt lá cản trở quang hợp',
          'Kiến đen hoặc kiến riện bò nhiều quanh chậu để ăn chất ngọt do rệp tiết ra'
        ],
        immediateAction: 'Dùng tăm bông thấm cồn y tế 70 độ lau miết trực tiếp làm tan lớp sáp bảo vệ của rệp.',
        organicRemedies: [
          'Xịt dung dịch nước rửa chén sinh học (5ml) + dầu ăn (5ml) + 1L nước sạch lúc trời râm mát',
          'Phun dung dịch nấm xanh Metarhizium anisopliae diệt rệp ký sinh',
          'Bôi keo ngăn kiến hoặc rắc vôi bột quanh chân chậu'
        ],
        preventionAdvice: [
          'Dọn dẹp cành lá khô mục quanh gốc thường xuyên',
          'Đưa chậu ra vị trí thoáng gió và có ánh sáng tán xạ mạnh'
        ],
        timestamp: 'Cảnh báo sớm thời tiết hôm nay'
      });
    }

    // --- RULE G: Thối Nhũn Vi Khuẩn Rau Ăn Lá (Bacterial Soft Rot) ---
    // Trigger: Rau cải, xà lách khi gặp mưa rào nhiệt độ cao (temp 27-33°C, mưa ẩm)
    if (isLeafyVeg && humidity >= 78 && (rainfallMm >= 4 || condition === 'rainy')) {
      const riskScore = Math.min(94, Math.round(60 + rainfallMm * 1.4));
      alerts.push({
        id: `pest-softrot-${plant.id}`,
        plantId: plant.id,
        plantName: plant.name,
        plantScientificName: plant.scientificName,
        plantImage: plant.imageUrl,
        plantCategory: plant.category,
        pestDiseaseName: 'Bệnh Thối Nhũn Vi Khuẩn Cấp Tính',
        scientificPathogen: 'Pectobacterium carotovorum',
        pathogenType: 'Vi khuẩn',
        riskLevel: riskScore >= 80 ? 'critical' : 'high',
        riskScore,
        weatherCondition: {
          temp,
          humidity,
          rainfallMm,
          windSpeedKmH,
          condition,
          description: `Mưa ẩm ${rainfallMm}mm dập nát vết thương cơ giới trên phiến rau mềm, vi khuẩn thối nhũn xâm nhập gây nhũn thối bốc mùi chua chỉ sau 1 đêm.`
        },
        triggerReason: `Mưa rào dập lá mềm tạo vết xước cơ giới cho vi khuẩn xâm nhập vào bẹ lá.`,
        symptomsToWatch: [
          'Gốc bẹ lá rau bị ủng nước, nhớt dính và mềm nhũn',
          'Cây héo rũ nhanh chóng vào buổi trưa có nắng',
          'Mùi khắm chua đặc trưng khi ngửi phần gốc thối'
        ],
        immediateAction: 'Nhổ bỏ ngay cây bệnh cùng bầu đất xung quanh, rắc vôi bột vào vị trí vừa nhổ để cách ly ổ dịch.',
        organicRemedies: [
          'Tưới dung dịch gừng tỏi ớt kháng khuẩn tự nhiên',
          'Phun chế phẩm sinh học vi khuẩn đối kháng Bacillus subtilis',
          'Phun nước vôi trong nồng độ 1% khử trùng mặt luống'
        ],
        preventionAdvice: [
          'Lên luống cao, làm mái che lưới mưa hạt mịn tránh dập lá',
          'Tuyệt đối không thu hoạch hoặc cắt tỉa rau khi lá còn ướt nước mưa'
        ],
        timestamp: 'Cảnh báo sớm thời tiết hôm nay'
      });
    }
  });

  // Sort alerts by riskScore descending (most critical first)
  return alerts.sort((a, b) => b.riskScore - a.riskScore);
}
