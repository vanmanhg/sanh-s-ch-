import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Initialize GoogleGenAI SDK
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const SYSTEM_INSTRUCTION_EXPERT = `Bạn là Bác Sĩ Cây Trồng & Kỹ Sư Nông Nghiệp Cấp Cao (Dr. Green / Nông Trợ Xanh AI).
Bạn có hơn 20 năm kinh nghiệm trong lĩnh vực làm vườn đô thị, hoa kiểng, cây ăn trái, lúa nước và nông nghiệp hữu cơ sạch tại Việt Nam và Đông Nam Á.
Tính cách: Ân cần, thực tế, dễ hiểu, hướng dẫn từng bước rõ ràng cho bà con nông dân và người yêu cây.
Luôn ưu tiên các giải pháp sinh học, hữu cơ an toàn (phân chuồng ủ hoai, trichoderma, dầu neem, gừng tỏi ớt, vi sinh bản địa IMO) trước khi đề xuất thuốc bảo vệ thực vật cần thiết.
Nếu người dùng hỏi bằng Tiếng Việt hãy trả lời bằng Tiếng Việt; nếu bằng tiếng Anh hãy trả lời tiếng Anh.`;

// 1. Multi-turn Chat endpoint
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { messages, userMessage } = req.body;
    if (!userMessage && (!messages || messages.length === 0)) {
      return res.status(400).json({ error: 'Nội dung tin nhắn không được để trống.' });
    }

    // Build contents array for multi-turn conversation
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(messages)) {
      for (const msg of messages) {
        if (msg.role === 'user' || msg.role === 'model') {
          contents.push({
            role: msg.role,
            parts: [{ text: msg.text || msg.content || '' }],
          });
        }
      }
    }

    if (userMessage) {
      contents.push({
        role: 'user',
        parts: [{ text: userMessage }],
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_EXPERT,
      },
    });

    const reply = response.text || 'Xin lỗi, tôi chưa thể trả lời câu hỏi này lúc này. Vui lòng thử lại!';
    return res.json({ reply });
  } catch (error: any) {
    console.error('Error in /api/gemini/chat:', error);
    // Intelligent fallback advice for common farming context if offline or API key missing
    return res.status(500).json({
      error: 'Không thể kết nối đến AI nông nghiệp.',
      fallbackReply: 'Bác sĩ cây trồng lưu ý: Hãy kiểm tra độ ẩm của đất trước khi tưới, đảm bảo chậu thoát nước tốt và cách ly cây bệnh để tránh lây lan sang các cây khỏe mạnh.',
      details: error?.message,
    });
  }
});

// 2. Identify Plant from Image
app.post('/api/gemini/identify', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Thiếu dữ liệu hình ảnh.' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `Phân tích hình ảnh cây trồng này và trả về JSON chuẩn xác không chứa markdown syntax hay dấu \`\`\`json.
Cấu trúc JSON cần có:
{
  "name": "Tên tiếng Việt thông dụng (ví dụ: Cây Trầu Bà Lỗ / Cây Cà Chua Bi / Cây Sầu Riêng Ri6)",
  "scientificName": "Tên khoa học in nghiêng",
  "family": "Họ thực vật",
  "description": "Mô tả ngắn gọn về đặc điểm của cây",
  "lightRequirement": "Nhu cầu ánh sáng chi tiết (ví dụ: Nắng gián tiếp, ưa bóng râm, nắng 6 tiếng/ngày)",
  "waterRequirement": "Hướng dẫn tưới nước chi tiết (ví dụ: Tưới khi 2-3cm đất mặt khô)",
  "wateringFrequencyDays": 2, // Số ngày trung bình giữa các lần tưới (số nguyên)
  "soilType": "Loại đất và độ thoát nước thích hợp",
  "temperature": "Nhiệt độ tối ưu (ví dụ: 20°C - 32°C)",
  "humidity": "Độ ẩm ưa thích (ví dụ: 60% - 80%)",
  "fertilizerSchedule": "Lịch bón phân khuyến nghị (ví dụ: Bón NPK hoặc phân trùn quế 2 tuần/lần)",
  "careLevel": "Dễ" | "Trung bình" | "Khó",
  "toxicity": "Mức độ an toàn với thú cưng / trẻ em",
  "quickTips": ["Mẹo chăm sóc 1", "Mẹo chăm sóc 2", "Mẹo chăm sóc 3"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: cleanBase64,
          },
        },
        { text: prompt },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const raw = response.text || '{}';
    const parsed = JSON.parse(raw);
    return res.json({ result: parsed });
  } catch (error: any) {
    console.error('Error in /api/gemini/identify:', error);
    return res.status(500).json({
      error: 'Không thể nhận diện hình ảnh.',
      details: error?.message,
    });
  }
});

// 3. Diagnose Disease & Pest from Image
app.post('/api/gemini/diagnose', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', notes } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Thiếu dữ liệu hình ảnh.' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `Bạn là chuyên gia chuẩn đoán bệnh học thực vật. Phân tích lá hoặc thân cây trong ảnh và phát hiện bệnh hoặc sâu hại. Trả về đúng định dạng JSON không có mã markdown:
{
  "plantName": "Tên loại cây có thể nhận diện được",
  "diseaseName": "Tên bệnh hoặc sâu hại (ví dụ: Bệnh Đốm Lá Nấm Cercospora, Bệnh Thán Thư, Nhện Đỏ, Thối Rễ, Thiếu Đạm...)",
  "pathogenType": "Nấm" | "Vi khuẩn" | "Virus" | "Côn trùng sâu rầy" | "Rối loạn sinh lý / Thiếu chất" | "Khỏe mạnh",
  "severity": "Nhẹ" | "Trung bình" | "Nghiêm trọng",
  "confidence": 92, // Số nguyên từ 60 đến 99
  "symptoms": ["Triệu chứng 1", "Triệu chứng 2", "Triệu chứng 3"],
  "causes": "Nguyên nhân gây ra hiện tượng này (độ ẩm cao, tưới đọng nước, lây nhiễm qua gió...)",
  "organicTreatment": [
    "Biện pháp sinh học 1 (ví dụ: Phun chế phẩm Trichoderma hoặc dầu neem 5ml/lít)",
    "Biện pháp sinh học 2 (cắt bỏ lá bệnh và tiêu hủy)"
  ],
  "chemicalTreatment": [
    "Thuốc BVTV an toàn đề xuất nếu bệnh lây lan nặng (ví dụ: Mancozeb, Hexaconazole... tuân thủ thời gian cách ly)"
  ],
  "prevention": [
    "Cách phòng tránh 1",
    "Cách phòng tránh 2"
  ]
}
${notes ? `Ghi chú thêm của người trồng: "${notes}"` : ''}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: cleanBase64,
          },
        },
        { text: prompt },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const raw = response.text || '{}';
    const parsed = JSON.parse(raw);
    return res.json({ result: parsed });
  } catch (error: any) {
    console.error('Error in /api/gemini/diagnose:', error);
    return res.status(500).json({
      error: 'Không thể chuẩn đoán bệnh qua ảnh.',
      details: error?.message,
    });
  }
});

// 4. Weather Advisory & Crop Suggestion
app.post('/api/gemini/weather-crop-advice', async (req, res) => {
  try {
    const { weather, location, season } = req.body;
    const prompt = `Dựa vào thời tiết hiện tại: ${JSON.stringify(weather)} tại khu vực: ${location || 'Việt Nam'}, mùa vụ: ${season || 'Hiện tại'}.
Hãy đưa ra tư vấn nông nghiệp ngắn gọn và danh sách 4 loại cây trồng thích hợp nhất để gieo trồng hoặc chăm sóc trong điều kiện này.
Trả về JSON:
{
  "warning": "Cảnh báo thời tiết ngắn gọn cho vườn (ví dụ: Mưa lớn dồn dập, nguy cơ ngập úng rễ)",
  "immediateAction": "Hành động cấp bách cần làm ngay (ví dụ: Khơi thông rãnh thoát nước, che lưới lan giảm dập nát lá)",
  "recommendedCrops": [
    {
      "name": "Tên cây",
      "reason": "Lý do thích hợp với điều kiện thời tiết này",
      "growthDays": 45,
      "difficulty": "Dễ" | "Trung bình"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const raw = response.text || '{}';
    const parsed = JSON.parse(raw);
    return res.json({ result: parsed });
  } catch (error: any) {
    console.error('Error in /api/gemini/weather-crop-advice:', error);
    return res.status(500).json({
      error: 'Không thể lấy tư vấn thời tiết.',
      details: error?.message,
    });
  }
});

// Start Express + Vite middleware in Dev / Static in Prod
async function startServer() {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`🌾 Server Nông Trợ Xanh AI running at http://localhost:${port}`);
  });
}

startServer();
