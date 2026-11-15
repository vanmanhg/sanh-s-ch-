import { Language } from '../types';

export interface OfflineQAPair {
  keywords: string[];
  answers: Record<Language, string>;
  category: 'compost' | 'disease' | 'water' | 'fertilizer' | 'fruit' | 'general';
}

export const OFFLINE_AGRICULTURAL_QA: OfflineQAPair[] = [
  {
    category: 'compost',
    keywords: ['ủ phân', 'rác bếp', 'compost', 'hữu cơ', 'phân chuồng', '堆肥', 'kitchen waste', 'ជីកំប៉ុស', 'コンポスト', '生ごみ'],
    answers: {
      vi: `🌿 **Kỹ thuật ủ phân rác nhà bếp không mùi hôi tại nhà:**
1. **Thu gom:** Vỏ rau củ, bã cà phê, vỏ chuối, lá cây khô. Tuyệt đối tránh thịt, cá tươi sống và dầu mỡ.
2. **Cắt nhỏ:** Băm vụn rác hữu cơ để vi sinh vật phân hủy nhanh gấp 3 lần.
3. **Phối trộn tỷ lệ vàng:** 3 phần rác nâu (lá khô, mùn cưa, trấu hun) : 1 phần rác xanh (vỏ rau quả).
4. **Bổ sung men vi sinh:** Rắc 1 nắm nấm đối kháng *Trichoderma* hoặc chế phẩm EM/IMO.
5. **Độ ẩm lý tưởng:** Giữ ẩm như miếng mút vắt ráo (55-60%). Đậy kín, đảo đều mỗi tuần 1 lần. Sau 3-4 tuần bạn sẽ có phân mùn đen giàu dinh dưỡng an toàn tuyệt đối!`,
      en: `🌿 **Odorless Home Kitchen Composting Guide:**
1. **Collect:** Vegetable scraps, fruit peels, coffee grounds, eggshells, dried leaves (avoid meats, dairy, and oils).
2. **Chop Small:** Finely shred materials to triple microbial breakdown speed.
3. **Golden Ratio:** 3 parts brown (dry leaves, saw dust, rice husks) to 1 part green (kitchen scraps).
4. **Inoculate:** Add a handful of Trichoderma or EM microorganisms to accelerate fermentation and prevent odor.
5. **Moisture:** Keep damp like a wrung-out sponge (55-60%). Turn once a week. In 3-4 weeks, you will have rich, crumbly organic compost!`,
      zh: `🌿 **无臭家庭厨余堆肥制作指南：**
1. **收集原料：** 蔬菜果皮、咖啡渣、香蕉皮、落叶（严禁放入生肉、鱼骨及重油脂）。
2. **切碎处理：** 将厨余剪成2-3厘米碎片，显著加快微生物分解。
3. **黄金配比：** 3份棕色碳质材料（干树叶、稻壳、椰糠）配1份绿色氮质材料（厨余果蔬）。
4. **添加菌种：** 拌入少许哈茨木霉菌或EM菌剂，消除异味并抑制有害杂菌。
5. **湿度管理：** 保持手握成团、指缝不滴水状态（湿度55-60%）。每周翻堆一次，3-4周即可获得黝黑肥沃的优质有机腐殖土！`,
      km: `🌿 **ការធ្វើជីកំប៉ុសពីកាកសំណល់ផ្ទះបាយដោយគ្មានក្លិនស្អុយ៖**
1. **ប្រមូលសម្ភារៈ៖** សម្បកបន្លែ ផ្លែឈើ កាកកាហ្វេ និងស្លឹកឈើស្ងួត (ជៀសវាងសាច់ ត្រី និងខ្លាញ់)។
2. **កាត់ឲ្យតូចៗ៖** ចិញ្ច្រាំកាកសំណល់ឲ្យម៉ត់ ដើម្បីឲ្យបាក់តេរីរលួយបានលឿន។
3. **សមាមាត្រ៖** ស្លឹកឈើស្ងួត ៣ ភាគ + កាកសំណល់បន្លែ ១ ភាគ។
4. **បន្ថែមមេជី៖** ដាក់ផ្សិត Trichoderma ឬ EM ដើម្បីបំបាត់ក្លិនស្អុយ។
5. **រក្សាសំណើម៖** ស្រោចទឹកល្មមសើម។ ក្រោយរយៈពេល ៣-៤ សប្តាហ៍ អ្នកនឹងទទួលបានជីសរីរាង្គល្អបំផុត!`,
      ja: `🌿 **無臭・家庭用生ごみコンポストの作り方：**
1. **材料の分別：** 野菜くず、果物の皮、コーヒーかす、落ち葉を使用（肉・魚・油分は避けてください）。
2. **細かく刻む：** 2〜3cmに刻むことで微生物による分解速度が約3倍になります。
3. **黄金比率：** 炭素源3（落ち葉・もみ殻くん炭・おがくず）：窒素源1（生ごみ）で混ぜ合わせます。
4. **菌床を追加：** トリコデルマ菌やEMぼかしをひと握り混ぜると悪臭を防ぎ発酵が早まります。
5. **水分管理：** 軽く握って水が垂れない程度（55〜60%）を保ち、週1回切り返せば3〜4週間で良質な有機堆肥が完成します！`
    }
  },
  {
    category: 'disease',
    keywords: ['vàng lá', 'thối rễ', 'yellow leaves', 'root rot', 'ngập úng', '黄叶', '烂根', 'ស្លឹកលឿង', '黄葉', '根腐れ'],
    answers: {
      vi: `🍂 **Chẩn đoán & Xử lý hiện tượng vàng lá, thối rễ:**
- **Nguyên nhân phổ biến:** 80% do tưới quá nhiều làm bí rễ, đất thiếu oxy sinh nấm *Fusarium* hoặc *Pythium*.
- **Giải pháp khẩn cấp:**
  1. Ngừng tưới ngay lập tức. Dùng que gỗ xới nhẹ lớp đất mặt cho thoáng khí.
  2. Kiểm tra lỗ thoát nước đáy chậu. Nếu đất bết dính, hãy thay đất mới trộn 30% đá perlite hoặc trấu hun.
  3. Cắt bỏ rễ thối (màu đen, nhũn), ngâm gốc 10 phút vào dung dịch nấm đối kháng *Trichoderma* hoặc *Atonik* loãng rồi trồng lại.
  4. Đặt cây ở nơi râm mát 3-5 ngày để phục hồi rễ cám.`,
      en: `🍂 **Yellow Leaves & Root Rot Treatment:**
- **Primary Cause:** Over 80% is caused by overwatering and compacted soil depriving roots of oxygen, inviting *Fusarium* and *Pythium* fungi.
- **Immediate Steps:**
  1. Stop watering immediately. Gently aerate the topsoil using a wooden stick.
  2. Inspect drainage holes. Repot with high-drainage soil containing 30% perlite, pumice, or charred rice husks.
  3. Trim away black, mushy rotting roots with sterilized scissors. Treat root ball with Trichoderma bio-fungicide.
  4. Place plant in bright indirect light for 3-5 days while new root hairs regenerate.`,
      zh: `🍂 **植物黄叶与烂根的救治方案：**
- **核心病因：** 超过80%是由于盆土长期过湿、积水闷根导致根系缺氧，引发镰刀菌或腐霉菌侵染。
- **紧急施救步骤：**
  1. 立即控水断水，用小竹签轻轻松动表土加速水分蒸发。
  2. 检查花盆底部排水孔是否堵塞。若土壤已板结发黏，需洗根换土，加入30%珍珠岩或粗颗粒植料。
  3. 彻底修剪发黑发软的腐烂根须，并在多菌灵或哈茨木霉菌稀释液中浸泡消毒15分钟。
  4. 移至通风半阴处服盆缓苗3-5天，待萌发新白根后再恢复正常养护。`,
      km: `🍂 **វិធីព្យាបាលស្លឹកលឿង និងរលួយឫស៖**
- **មូលហេតុ៖** ការស្រោចទឹកច្រើនពេកធ្វើឲ្យដីស្អាប់ ខ្វះខ្យល់ និងកើតផ្សិត។
- **ដំណោះស្រាយ៖**
  1. ផ្អាកស្រោចទឹកជាបន្ទាន់។ ឆ្កឹះដីខាងលើឲ្យធូរ។
  2. ពិនិត្យរន្ធបង្ហូរទឹកបាតផើង។ បើដីដក់ទឹក ត្រូវប្តូរដីថ្មីដែលមានលាយផេះអង្កាម។
  3. កាត់ឫសដែលរលួយខ្មៅចោល រួចលាងជម្រះជាមួយថ្នាំផ្សិតជីវសាស្ត្រ Trichoderma។
  4. ដាក់ដើមឈើនៅកន្លែងម្លប់ ៣-៥ ថ្ងៃដើម្បីឲ្យឫសថ្មីដុះឡើងវិញ។`,
      ja: `🍂 **葉の黄変・根腐れの診断と対処法：**
- **主な原因：** 約80%は水のやり過ぎと排水不良による根の酸欠、およびフザリウム菌・ピシウム菌の繁殖です。
- **緊急対処ステップ：**
  1. 直ちに水やりを停止し、割り箸などで表土を軽くほぐして通気性を確保します。
  2. 鉢底穴の詰まりを確認し、土が硬く湿っている場合はパーライトやくん炭を30%混ぜた排水性の高い培養土に植え替えます。
  3. 黒く変色した腐敗根を消毒済みのハサミで切り落とし、トリコデルマ菌や殺菌剤の希釈液に根鉢を10分ほど浸します。
  4. 新しい白根が出るまで3〜5日間、風通しの良い半日陰で養生させてください。`
    }
  },
  {
    category: 'disease',
    keywords: ['rệp sáp', 'bọ trĩ', 'mealybug', 'thrips', 'sâu bệnh', 'rầy', '蚧壳虫', '蓟马', 'សត្វល្អិត', 'カイガラムシ', 'アザミウマ', 'ニーム'],
    answers: {
      vi: `🐛 **Phòng trừ Rệp sáp & Bọ trĩ bằng phương pháp hữu cơ sinh học:**
- **Triệu chứng:** Xuất hiện lớp phấn trắng mịn như bông gòn bám kẽ lá, hoặc đọt non bị xoăn tít, lá mất màu diệp lục.
- **Công thức sinh học tự nhiên (Hiệu quả 95%):**
  1. **Dầu Neem nguyên chất:** Pha 5ml dầu neem + 3ml nước rửa chén hữu cơ vào 1 lít nước ấm. Lắc thật mạnh cho nhũ hóa rồi phun ướt đều 2 mặt lá.
  2. **Dung dịch Gừng - Tỏi - Ớt ngâm rượu:** Pha 10ml vào 1 lít nước, phun định kỳ 5 ngày/lần vào lúc xế chiều mát mẻ.
  3. Cắt tỉa thông thoáng cành tán để ánh nắng xuyên qua triệt tiêu môi trường trú ẩn của kiến và rệp.`,
      en: `🐛 **Organic Control for Mealybugs & Thrips:**
- **Symptoms:** White cottony deposits in leaf armpits, curled deformed new shoots, sticky honeydew attracting black sooty mold.
- **Safe Organic Solution:**
  1. **Pure Cold-Pressed Neem Oil:** Emulsify 5ml Neem oil + 3ml mild dish soap into 1 liter of warm water. Shake vigorously and spray thoroughly underneath leaves.
  2. **Garlic-Chili-Ginger Extract:** 10ml per 1 liter water, applied every 5 days in early morning or late afternoon.
  3. Wipe heavy infestations manually with a cotton swab soaked in 70% rubbing alcohol.`,
      zh: `🐛 **蚧壳虫、红蜘蛛与蓟马的生物有机防治法：**
- **受害症状：** 叶腋处有白色棉絮状蜡质粉末，新嫩梢皱缩扭曲，叶面发粘分泌蜜露并引发煤污病。
- **天然高效配方（安全无残留）：**
  1. **纯印楝素乳液：** 取5毫升印楝油加入3毫升洗洁精，注入1升温水中用力摇晃乳化，全株喷洒，重点覆盖叶片背面。
  2. **大蒜辣椒生物浸出液：** 10毫升兑水1升，傍晚阴凉时每5-7天喷洒一次。
  3. 虫量较少时，直接使用棉签蘸取75%医用酒精点涂虫体，可迅速溶解其蜡质保护外壳。`,
      km: `🐛 **វិធីកម្ចាត់សត្វល្អិត និងចៃសលើស្លឹកឈើតាមបែបធម្មជាតិ៖**
- **រោគសញ្ញា៖** មានម្សៅសៗដូចកប្បាសនៅក្រោមស្លឹក ស្លឹកក្តាញ់រួញ និងឡើងផ្សិតខ្មៅ។
- **រូបមន្តធម្មជាតិ៖**
  1. **ប្រេង Neem:** ៥ មីលីលីត្រ + ទឹកសាប៊ូលាងចាន ៣ មីលីលីត្រ លាយជាមួយទឹកក្តៅឧណ្ហៗ ១ លីត្រ។ អ្រងួនឲ្យសព្វ រួចបាញ់លើស្លឹក។
  2. **ទឹកខ្ទឹមស ម្ទេស ខ្ញី ត្រាំស្រា៖** បាញ់រៀងរាល់ ៥ ថ្ងៃម្តងនៅពេលរសៀលត្រជាក់។
  3. បើមានតិចតួច អាចយកសំឡីជ្រលក់អាល់កុលជូតចេញដោយផ្ទាល់។`,
      ja: `🐛 **カイガラムシ・アザミウマの有機バイオ防除：**
- **主な症状：** 葉の付け根に白い綿状の塊が付着する、新芽が縮れて変形する、ベタつく甘露にすす病が発生する。
- **安全な天然防除レシピ：**
  1. **ニームオイル乳剤：** ぬるま湯1Lにニームオイル5ml＋植物性食器用洗剤3mlをよく混ぜ、葉の裏までしっかり散布します。
  2. **ニンニク・唐辛子・ショウガ抽出液：** 水1Lあたり10mlに希釈し、5日おきに夕方の涼しい時間帯に散布します。
  3. 発生が少ない場合は、70%消毒用アルコールを染み込ませた綿棒で直接拭き取ると効果的です。`
    }
  },
  {
    category: 'water',
    keywords: ['tưới nước', 'watering', 'lượng nước', 'độ ẩm', '浇水', 'ស្រោចទឹក', '水やり', '灌水'],
    answers: {
      vi: `💧 **Nguyên tắc tưới nước chuẩn khoa học cho cây:**
1. **Kiểm tra độ ẩm đất trước khi tưới (Nguyên tắc 2 đốt ngón tay):** Cắm ngón tay trỏ sâu 3-5cm vào đất; nếu rút lên thấy đất còn ẩm mát dính tay thì KHÔNG tưới.
2. **Thời điểm tưới tốt nhất:**
   - Sáng sớm (6h - 8h): Cây hấp thu nước tốt nhất để chuẩn bị quang hợp cả ngày.
   - Chiều mát (16h30 - 18h): Chỉ tưới gốc, tránh đọng nước trên lá ban đêm để ngừa nấm bệnh.
   - Tuyệt đối không tưới lúc giữa trưa nắng gắt (gây sốc nhiệt và cháy lá).
3. **Kỹ thuật tưới:** Tưới chậm và sâu quanh mép chậu đến khi thấy nước rỉ nhẹ dưới đáy chậu.`,
      en: `💧 **Scientific Watering Rules for Plants:**
1. **The 2-Knuckle Finger Test:** Insert your finger 3-5cm into the soil. If it feels cool and soil clings to your skin, hold off watering!
2. **Optimal Timing:**
   - Early morning (6:00 - 8:00 AM): Best time for root uptake before daytime photosynthesis.
   - Late afternoon (4:30 - 6:00 PM): Water root zone only. Keep foliage dry overnight to prevent mildew.
   - Never water in scorching midday sun (causes root shock and leaf scald).
3. **Method:** Water deeply and slowly around the root perimeter until light runoff appears from the bottom drainage holes.`,
      zh: `💧 **科学浇水三大黄金法则：**
1. **手指测墒法：** 将手指插入盆土3-5厘米处；若感觉潮凉并粘带泥土，坚决不浇！待微干松散时再浇。
2. **最佳浇水时机：**
   - 清晨（6:00-8:00）：植物开始一天的蒸腾与光合作用，水分吸收最高效。
   - 傍晚（16:30-18:00）：只浇根部，避免叶面夜间残留水珠导致灰霉病。
   - 严禁正午烈日暴晒时浇冷水，否则温差骤变会造成“炸根”和落蕾落叶。
3. **原则：** 遵循“不干不浇，浇则浇透”，沿花盆边缘缓慢浇注，直到盆底孔微微渗水即可。`,
      km: `💧 **ក្បួនស្រោចទឹកដំណាំតាមក្បួនបច្ចេកទេស៖**
1. **ស្ទង់សំណើមដី៖** យកម្រាមដៃស៊កចូលដីជម្រៅ ៣-៥ សង់ទីម៉ែត្រ។ បើដីនៅសើម មិនបាច់ស្រោចទេ។
2. **ពេលវេលាល្អបំផុត៖**
   - ពេលព្រឹកព្រលឹម (៦:០០ - ៨:០០ ព្រឹក)៖ រុក្ខជាតិស្រូបយកទឹកបានល្អបំផុត។
   - ពេលរសៀល (៤:៣០ - ៦:០០ ល្ងាច)៖ ស្រោចតែគល់ដី កុំឲ្យសើមស្លឹកពេលយប់ព្រោះងាយកើតផ្សិត។
   - ហាមស្រោចទឹកពេលថ្ងៃត្រង់ក្តៅខ្លាំង។
3. **វិធីស្រោច៖** ស្រោចយឺតៗជុំវិញគល់រហូតដល់ជ្រាបទឹកដល់បាតផើង។`,
      ja: `💧 **科学的な水やりの3原則：**
1. **指差し水分チェック：** 土の表面から3〜5cm下に指を入れ、ひんやり湿っている場合はまだ水やり不要です。
2. **最適な時間帯：**
   - 早朝（6:00〜8:00）：日中の光合成に向けて根が最も効率よく吸水できるベストタイムです。
   - 夕方（16:30〜18:00）：株元のみに与え、夜間に葉が濡れたままにならないよう注意します。
   - 真夏の直射日光が強い日中は温度ショックや葉焼けの原因となるため厳禁です。
3. **与え方：** 鉢の縁に沿ってゆっくりと、鉢底から軽く水が流れ出るまでたっぷり与えます。`
    }
  },
  {
    category: 'fertilizer',
    keywords: ['bón phân', 'npk', 'fertilizer', 'dinh dưỡng', 'đất trồng', '施肥', 'ជីជាតិ', '肥料', '追肥'],
    answers: {
      vi: `🌱 **Cẩm nang bón phân cân đối cho cây phát triển vượt trội:**
1. **Nguyên tắc vàng:** "Ăn ít no lâu" - Bón phân loãng định kỳ tốt hơn bón đặc một lần.
2. **Giai đoạn phát triển:**
   - **Cây con, đâm chồi:** Cần Đạm (N) cao -> Phân trùn quế, đạm cá hữu cơ ủ men vi sinh.
   - **Phân hóa mầm hoa:** Cần Lân (P) cao -> Bột xương, super lân, phân dơi.
   - **Nuôi quả, củ:** Cần Kali (K) cao -> Dịch chuối ủ vi sinh, tro trấu hun, Kali hữu cơ.
3. **Lưu ý an toàn:** Tưới ẩm đất trước khi bón phân để rễ không bị cháy xót do nồng độ muối khoáng cao.`,
      en: `🌱 **Balanced Plant Nutrition & Fertilization Guide:**
1. **Golden Rule:** "Weakly, weekly" — frequent mild feedings are safer and more effective than heavy single doses.
2. **Growth Stages:**
   - **Foliage & Growth:** High Nitrogen (N) -> Vermicompost, fermented fish amino acids.
   - **Flower Bud Formation:** High Phosphorus (P) -> Bone meal, rock phosphate, bat guano.
   - **Fruit & Root Development:** High Potassium (K) -> Fermented banana peel tea, wood ash.
3. **Safety Tip:** Always moisten the soil with plain water before applying fertilizer to prevent salt-induced root burn.`,
      zh: `🌱 **植物科学施肥与营养配比秘诀：**
1. **黄金铁律：** “薄肥勤施，宁淡勿浓” —— 少量多次补充最安全，过浓易造成烧根烧叶。
2. **生长阶段精准供肥：**
   - **幼苗生长期（长枝发叶）：** 偏重氮肥（N）-> 蚯蚓粪、发酵鱼蛋白菌肥。
   - **花芽分化期（促花保蕾）：** 偏重磷肥（P）-> 骨粉、磷酸二氢钾稀释1000倍叶面喷施。
   - **坐果膨大期（壮果增甜）：** 偏重钾肥（K）-> 发酵香蕉皮水、草木灰浸出液。
3. **防护要点：** 施肥前一天应浇透水，严禁在干燥土壤中施入未经发酵的生肥。`,
      km: `🌱 **វិធីដាក់ជីឲ្យដំណាំលូតលាស់ល្អ៖**
1. **គោលការណ៍សំខាន់៖** ដាក់ជីតិចៗតែញឹកញាប់ ល្អជាងដាក់ជីច្រើនតែម្តងដែលនាំឲ្យរលាកឫស។
2. **តាមដំណាក់កាល៖**
   - **ពេលលូតលាស់ដើមនិងស្លឹក៖** ត្រូវការជីអាសូត (N) -> ជីកំប៉ុស ជីជន្លេន ជីត្រី។
   - **ពេលចេញផ្កា៖** ត្រូវការជីផូស្វ័រ (P) -> ម្សៅឆ្អឹង ជីអាចម៍ប្រចៀវ។
   - **ពេលចិញ្ចឹមផ្លែ៖** ត្រូវការជីប៉ូតាស្យូម (K) -> ទឹកត្រាំសម្បកចេក ផេះអង្កាម។
3. **ចំណាំ៖** ត្រូវស្រោចទឹកដីឲ្យសើមសិនមុនពេលដាក់ជី។`,
      ja: `🌱 **生育ステージ別・バランス施肥ガイド：**
1. **基本原則：** 「薄めの液肥をこまめに」が安全で効果的。一度に濃い肥料を与えると肥料焼けを起こします。
2. **時期別の栄養素：**
   - **育苗・葉の成長期：** 窒素(N)重視 → ミミズ堆肥、発酵魚アミノ酸液肥。
   - **花芽分化・開花期：** リン酸(P)重視 → 骨粉、バットグアノ、リンカリ肥料。
   - **結実・根菜肥大期：** カリ(K)重視 → バナナの皮発酵液、草木灰、有機カリ。
3. **注意点：** 施肥の前には必ず土を水で湿らせ、根の浸透圧ストレスを防ぎましょう。`
    }
  },
  {
    category: 'fruit',
    keywords: ['sầu riêng', 'durian', 'cà chua', 'tomato', 'cây ăn trái', '榴莲', '番茄', 'ផ្លែទុរេន', 'トマト', '果樹'],
    answers: {
      vi: `🍈 **Kỹ thuật chăm sóc Cây Ăn Trái & Cà chua sai trĩu quả:**
1. **Cà chua trong chậu:**
   - Vặt tỉa chồi nách (nhánh phụ) chỉ giữ lại 1-2 thân chính để dinh dưỡng dồn nuôi chùm quả to.
   - Bổ sung Canxi sữa hoặc vỏ trứng nghiền vào gốc để chống thối đít quả (Blossom End Rot).
2. **Sầu riêng & Cây ăn trái lớn:**
   - Xiết nước làm bông khi cơi đọt bánh tẻ cứng cáp.
   - Phun Canxi-Bo khi nhú hoa để cuống dai, tỷ lệ đậu trái cao và hạn chế rụng sinh lý.
   - Phòng xì mủ thân rễ bằng chế phẩm nấm đối kháng *Chaetomium* hoặc *Trichoderma* quét định kỳ vào gốc.`,
      en: `🍈 **Fruit Trees & Tomato High-Yield Care Guide:**
1. **Container Tomatoes:**
   - Prune suckers to retain 1-2 strong main stems so nutrients flow into flower trusses.
   - Supplement Calcium (crushed eggshells or cal-mag) to prevent Blossom End Rot.
2. **Durian & Orchard Trees:**
   - Controlled water restriction induces uniform flower bud initiation.
   - Apply Foliar Boron-Calcium during bloom to strengthen stems and minimize fruit drop.
   - Prevent phytophthora stem canker by brushing tree trunks with copper or bio-fungicide paste.`,
      zh: `🍈 **果树与盆栽番茄高产养护技术：**
1. **盆栽番茄管理：**
   - 及时打杈（抹去叶腋处侧芽），保留1-2根健壮主干，集中养分供给花序。
   - 根部追施钙质（熟石灰粉、蛋壳粉或螯合钙），彻底预防脐腐病（果实底部黑腐）。
2. **榴莲与南方热带果树：**
   - 适度控水“逼花”，当花蕾长至2-3厘米时再恢复少量给水。
   - 开花期叶面喷施硼钙叶面肥，强化果柄韧性，大幅减少生理性落果。
   - 树干基部刷白涂剂或木霉菌膏剂，防止疫霉菌引起的流胶病。`,
      km: `🍈 **បច្ចេកទេសថែទាំទុរេន និងប៉េងប៉ោះឲ្យផ្លែច្រើន៖**
1. **ដំណាំប៉េងប៉ោះ៖**
   - កាត់ខ្នែងតូចៗចោល ទុកតែដើមមេ ១-២ ដើម្បីឲ្យផ្លែធំល្អ។
   - បន្ថែមកាល់ស្យូម (សម្បកពងមាន់កិនម៉ត់) ដើម្បីការពារកុំឲ្យផ្លែស្អុយគូទ។
2. **ដំណាំទុរេន៖**
   - ផ្អាកទឹកដើម្បីជំរុញឲ្យចេញផ្កា។
   - បាញ់ជីបំប៉នកាល់ស្យូម-បូរ៉ុន ពេលចេញផ្កា ដើម្បីឲ្យទងផ្កាមាំ មិនជ្រុះក្តឹប។
   - លាបថ្នាំផ្សិតលើគល់ដើមដើម្បីការពារជំងឺស្អុយដើមនិងហៀរជ័រ។`,
      ja: `🍈 **果樹・プランタートマトの多収穫ケア：**
1. **プランタートマト：**
   - わき芽をこまめに摘み取り、主枝1〜2本仕立てにすることで果実へ栄養を集中させます。
   - 尻腐れ病を防ぐため、卵の殻の粉末やカルシウム資材を補ってください。
2. **果樹類の管理：**
   - 花芽形成期に適度な水分コントロールを行い、開花を揃えます。
   - 開花期にホウ素・カルシウムの葉面散布を行うと着果率が向上し、生理落果を抑えられます。
   - 株元にトリコデルマ菌などのバイオ資材を施し、疫病による樹脂病を予防しましょう。`
    }
  }
];

export function findOfflineAgriculturalAnswer(query: string, lang: Language): string {
  const normalized = query.toLowerCase();

  for (const item of OFFLINE_AGRICULTURAL_QA) {
    if (item.keywords.some(k => normalized.includes(k.toLowerCase()))) {
      return item.answers[lang] || item.answers.vi;
    }
  }

  // Generic fallback if not directly matched in offline Q&A
  const genericAnswers: Record<Language, string> = {
    vi: `🌿 **Lời khuyên từ Bác sĩ Cây trồng AI (Chế độ Ngoại tuyến):**
- **Độ ẩm đất:** Hãy kiểm tra độ ẩm đất quanh vùng rễ (sâu 3-5cm) trước khi tưới. Đất ẩm mát thì chưa cần thêm nước.
- **Ánh sáng:** Đảm bảo cây nhận đủ 4-6 tiếng ánh sáng gián tiếp hoặc nắng sáng dịu mỗi ngày.
- **Sâu bệnh:** Nếu thấy lá có đốm nấm hoặc rệp, hãy ngắt bỏ lá bệnh cách ly, sau đó phun dung dịch dầu neem (5ml/lít) hoặc nước tỏi ớt vào buổi chiều mát.
- **Tra cứu thêm:** Mời bạn vào mục **"Bắt Bệnh Cây"** hoặc **"Thư Viện & Video"** trên thanh menu để xem hướng dẫn chi tiết đã được lưu trữ sẵn trong máy!`,
    en: `🌿 **Dr. Green AI Advice (Offline Knowledge Base):**
- **Soil Moisture:** Check 3-5cm beneath topsoil before watering. If cool and damp, postpone watering.
- **Sunlight:** Ensure 4-6 hours of appropriate light depending on species.
- **Pests & Fungi:** Isolate affected foliage immediately and spray organic Neem oil solution (5ml/liter) in the evening.
- **More Guides:** Open the **"Disease Clinic"** or **"Library & Video"** tab to access complete offline diagnostic guides cached locally!`,
    zh: `🌿 **绿色植保AI医生建议（本地离线知识库）：**
- **土壤水分：** 浇水前务必测定表土下3-5厘米湿度，潮润微凉则无需浇水。
- **光照通风：** 保证良好的通风环境，根据植物习性给予充足散射光或清晨柔光。
- **病虫处理：** 发现少量病叶应立即剪除隔离，傍晚喷施5ml/升印楝油或生物杀菌剂。
- **离线查阅：** 您可直接前往**“病虫害诊断”**或**“知识库与视频”**标签页，查阅已完整保存在设备中的离线资料！`,
    km: `🌿 **ដំបូន្មានពីគ្រូពេទ្យរុក្ខជាតិ AI (របៀបក្រៅបណ្តាញ):**
- **សំណើមដី៖** ពិនិត្យដីជម្រៅ ៣-៥ សង់ទីម៉ែត្រមុននឹងស្រោចទឹក។
- **ពន្លឺថ្ងៃ៖** ដាក់ដំណាំនៅកន្លែងដែលមានពន្លឺថ្ងៃគ្រប់គ្រាន់ និងមានខ្យល់ចេញចូលល្អ។
- **សត្វល្អិត៖** កាត់ស្លឹកដែលមានជំងឺចោល រួចបាញ់ថ្នាំប្រេង Neem (៥ មីលីលីត្រ/លីត្រ) នៅពេលល្ងាច។
- **ស្វែងរកបន្ថែម៖** សូមចូលទៅកាន់ផ្ទាំង **"ពិនិត្យជំងឺរុក្ខជាតិ"** ឬ **"បណ្ណាល័យ"** ដើម្បីមើលឯកសារដែលបានរក្សាទុកក្នុងទូរស័ព្ទ!`,
    ja: `🌿 **植物ドクターAIからのアドバイス（オフライン知識ベース）：**
- **土壌水分：** 水やりの前に表土3〜5cm下の湿り気を確認し、湿っていれば控えましょう。
- **日照と風通し：** 品種に合わせて毎日4〜6時間の柔らかな日光と良好な通風を確保してください。
- **病害虫対策：** 病斑のある葉は早めに取り除き、夕方にニームオイル希釈液（5ml/L）を散布します。
- **詳細ガイド：** メニューの**「病害虫クリニック」**や**「栽培ガイド・動画」**から端末にキャッシュされた完全版ガイドを閲覧できます！`
  };

  return genericAnswers[lang] || genericAnswers.vi;
}
