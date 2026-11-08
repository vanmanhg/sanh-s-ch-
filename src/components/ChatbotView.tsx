import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Bot,
  User,
  Sparkles,
  RefreshCw,
  Lightbulb,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  createdAt: string;
}

interface ChatbotViewProps {
  initialPrompt?: string;
}

export const ChatbotView: React.FC<ChatbotViewProps> = ({ initialPrompt }) => {
  const { t, language } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-0',
      role: 'model',
      text: 'Kính chào bà con và các bạn yêu cây! Tôi là Bác Sĩ Cây Trồng AI (Dr. Green). Tôi sẵn sàng giải đáp mọi thắc mắc về kỹ thuật làm vườn, ủ phân hữu cơ, trị sâu bệnh, tỉa cành, hay điều chỉnh nước tưới. Bạn có thể gõ câu hỏi hoặc bấm nút Micro để nói chuyện trực tiếp nhé!',
      createdAt: 'Vừa xong'
    }
  ]);

  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeakingId, setIsSpeakingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Quick preset questions
  const SUGGESTION_CHIPS = [
    'Cách ủ phân hữu cơ từ rác nhà bếp không mùi?',
    'Cà chua bị vàng lá gân xanh thì xử lý thế nào?',
    'Cách phòng ngừa rụng hoa và trái non trên sầu riêng?',
    'Nên tưới cây cảnh vào thời gian nào trong ngày tốt nhất?'
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (initialPrompt) {
      setInputText(initialPrompt);
    }
  }, [initialPrompt]);

  // Voice Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'en' ? 'en-US' : 'vi-VN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText(prev => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [language]);

  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) {
      alert('Trình duyệt của bạn chưa hỗ trợ nhận diện giọng nói trực tiếp qua Web Speech API. Bạn có thể gõ văn bản nhé!');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSpeakText = (msgId: string, text: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Trình duyệt không hỗ trợ phát âm.');
      return;
    }

    if (isSpeakingId === msgId) {
      window.speechSynthesis.cancel();
      setIsSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === 'en' ? 'en-US' : 'vi-VN';
    utterance.rate = 1.0;

    utterance.onend = () => {
      setIsSpeakingId(null);
    };
    utterance.onerror = () => {
      setIsSpeakingId(null);
    };

    setIsSpeakingId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      role: 'user',
      text,
      createdAt: 'Vừa xong'
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map(m => ({ role: m.role, text: m.text })),
          userMessage: text
        })
      });

      if (!response.ok) {
        throw new Error('Lỗi máy chủ trò chuyện');
      }

      const data = await response.json();
      const botReply = data.reply || data.fallbackReply;

      const botMsg: ChatMessage = {
        id: `m-bot-${Date.now()}`,
        role: 'model',
        text: botReply,
        createdAt: 'Vừa xong'
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.warn('API error, using offline agricultural knowledge response:', err);
      // Offline fallback smart response
      let fallbackText =
        'Bác sĩ cây trồng AI xin chia sẻ với bà con: Để xử lý vấn đề này, hãy ưu tiên kiểm tra độ ẩm đất quanh vùng rễ (cắm ngón tay sâu 3-5cm, nếu đất còn ẩm mát thì khoan tưới). Nếu thấy dấu hiệu nấm hoặc sâu bệnh, hãy cắt tỉa lá già nhiễm bệnh tiêu hủy, phun chế phẩm sinh học (dầu neem 5ml/lít hoặc nấm đối kháng Trichoderma) vào lúc sáng sớm hoặc chiều mát.';

      if (text.toLowerCase().includes('ủ phân') || text.toLowerCase().includes('rác')) {
        fallbackText =
          '🌿 Hướng dẫn ủ phân rác nhà bếp không mùi:\n1. Thu gom vỏ rau củ quả, bã cà phê, vỏ chuối (tránh dầu mỡ, thịt cá tươi sống).\n2. Cắt nhỏ rác để tăng diện tích tiếp xúc.\n3. Trộn rác với 1 nắm men vi sinh Trichoderma hoặc EM1 + 1 lớp đất mỏng hoặc trấu hun.\n4. Đậy kín thùng ủ, sau 3-4 tuần bạn sẽ có phân mùn hữu cơ cực kỳ giàu dinh dưỡng bón cây!';
      } else if (text.toLowerCase().includes('sầu riêng')) {
        fallbackText =
          '🍈 Đối với sầu riêng:\n- Giai đoạn ra hoa - nuôi quả non: Chú ý xiết nước nhẹ khi làm bông, đến khi mắt cua nhú 2-3cm thì nhấp nước từ từ.\n- Khi cây xổ nhụy: Cần bổ sung Canxi-Bo để tăng hạt phấn và chống rụng trái non.\n- Phòng trừ nấm Phytophthora bằng cách quét vôi cổ rễ và dùng Phosphonate sinh học.';
      }

      const botMsg: ChatMessage = {
        id: `m-bot-${Date.now()}`,
        role: 'model',
        text: fallbackText,
        createdAt: 'Vừa xong'
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-6 py-4 flex flex-col h-[calc(100vh-140px)] min-h-[580px]">
      {/* Chat header */}
      <div className="bg-white dark:bg-zinc-900 rounded-t-3xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/30">
              <Bot className="w-6 h-6" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
                Bác Sĩ Cây Trồng AI (Dr. Green)
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Chuyên gia nông nghiệp & làm vườn • Tư vấn giọng nói & văn bản 24/7
            </p>
          </div>
        </div>

        {/* Clear chat button */}
        <button
          onClick={() =>
            setMessages([
              {
                id: `m-${Date.now()}`,
                role: 'model',
                text: 'Hộp thoại đã được làm mới. Mời bà con đặt câu hỏi tiếp theo nhé!',
                createdAt: 'Vừa xong'
              }
            ])
          }
          className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 flex items-center gap-1 cursor-pointer p-1.5"
          title="Làm mới cuộc trò chuyện"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Làm mới</span>
        </button>
      </div>

      {/* Messages Thread (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50 dark:bg-zinc-950 border-x border-zinc-200 dark:border-zinc-800">
        {messages.map(msg => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white ${
                  isUser
                    ? 'bg-zinc-800 dark:bg-zinc-700'
                    : 'bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-xs'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 text-xs sm:text-sm space-y-1.5 leading-relaxed shadow-xs ${
                  isUser
                    ? 'bg-emerald-600 text-white rounded-tr-xs'
                    : 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-tl-xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                <div
                  className={`flex items-center justify-between gap-2 pt-1 text-[10px] ${
                    isUser ? 'text-emerald-200' : 'text-zinc-400'
                  }`}
                >
                  <span>{msg.createdAt}</span>

                  {!isUser && (
                    <button
                      onClick={() => handleSpeakText(msg.id, msg.text)}
                      className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-emerald-600 dark:text-emerald-400 flex items-center gap-1 cursor-pointer font-semibold"
                      title={isSpeakingId === msg.id ? 'Dừng đọc' : 'Đọc câu trả lời thành tiếng'}
                    >
                      {isSpeakingId === msg.id ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                          <span className="text-rose-500">Đang đọc...</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Nghe đọc</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2.5 text-zinc-500 text-xs pl-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
              <Bot className="w-4 h-4 animate-bounce" />
            </div>
            <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Bác sĩ đang phân tích giải pháp nông nghiệp...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      <div className="bg-white dark:bg-zinc-900 px-3 py-2 border-x border-zinc-200 dark:border-zinc-800 overflow-x-auto no-scrollbar shrink-0">
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          {SUGGESTION_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip)}
              className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-zinc-700 text-[11px] font-medium transition-colors cursor-pointer shrink-0"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box & Voice Controls */}
      <div className="bg-white dark:bg-zinc-900 rounded-b-3xl p-3 sm:p-4 border border-zinc-200 dark:border-zinc-800 shadow-md shrink-0">
        {isListening && (
          <div className="flex items-center justify-between mb-2 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-rose-700 dark:text-rose-300 text-xs animate-pulse">
            <div className="flex items-center gap-2 font-semibold">
              <Mic className="w-4 h-4 text-rose-600 animate-spin" />
              <span>{t('voiceListening')} (Hãy nói vào micro điện thoại hoặc máy tính)</span>
            </div>
            <button
              onClick={toggleVoiceRecording}
              className="font-bold underline text-xs cursor-pointer"
            >
              Dừng
            </button>
          </div>
        )}

        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* Voice Input Microphone Button */}
          <button
            type="button"
            onClick={toggleVoiceRecording}
            className={`p-2.5 sm:p-3 rounded-2xl font-bold transition-all cursor-pointer ${
              isListening
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/40 animate-pulse'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-zinc-700 hover:text-emerald-600'
            }`}
            title={isListening ? t('voiceStop') : t('voiceClickToSpeak')}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Hỏi về sâu bệnh, phân bón, tưới nước hoặc gõ câu hỏi..."
            className="flex-1 px-4 py-2.5 sm:py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-emerald-600"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-2.5 sm:p-3 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors disabled:opacity-40 cursor-pointer shadow-md shadow-emerald-600/20"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
