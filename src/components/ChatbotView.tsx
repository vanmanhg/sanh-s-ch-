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
  RefreshCw,
  Lightbulb,
  Radio,
  SlidersHorizontal,
  WifiOff,
  Volume1
} from 'lucide-react';
import { findOfflineAgriculturalAnswer } from '../utils/offlineChatKnowledge';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  createdAt: string;
  isOfflineSource?: boolean;
}

interface ChatbotViewProps {
  initialPrompt?: string;
}

export const ChatbotView: React.FC<ChatbotViewProps> = ({ initialPrompt }) => {
  const {
    t,
    language,
    isOffline,
    autoSpeak,
    toggleAutoSpeak,
    voiceSpeed,
    setVoiceSpeed
  } = useApp();

  const getGreeting = () => {
    switch (language) {
      case 'en':
        return 'Hello gardeners and plant lovers! I am Dr. Green AI. I am ready to answer any questions about organic composting, plant diseases, fertilization, watering, or pruning. You can type or tap the microphone to speak!';
      case 'zh':
        return '您好！我是您的绿色植保AI医生（Dr. Green）。随时为您解答关于家庭厨余堆肥、病虫害救治、科学浇水及施肥等农艺问题。支持语音输入与朗读！';
      case 'km':
        return 'សួស្តីបងប្អូនកសិករ! ខ្ញុំជាគ្រូពេទ្យរុក្ខជាតិ AI (Dr. Green)។ ខ្ញុំត្រៀមខ្លួនជួយដោះស្រាយបញ្ហាដំណាំ ការធ្វើជីកំប៉ុស ជំងឺរុក្ខជាតិ និងការស្រោចទឹក។ អ្នកអាចសួរដោយវាយអក្សរ ឬនិយាយតាមមីក្រូហ្វូន!';
      case 'ja':
        return 'こんにちは！私は植物ドクターAI（Dr. Green）です。有機コンポスト、病害虫対策、水やり、施肥や剪定など何でもお答えします。文字入力またはマイクボタンで音声質問もできます！';
      default:
        return 'Kính chào bà con và các bạn yêu cây! Tôi là Bác Sĩ Cây Trồng AI (Dr. Green). Tôi sẵn sàng giải đáp mọi thắc mắc về kỹ thuật làm vườn, ủ phân hữu cơ, trị sâu bệnh, tỉa cành, hay điều chỉnh nước tưới. Bạn có thể gõ câu hỏi hoặc bấm nút Micro để nói chuyện trực tiếp nhé!';
    }
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-0',
      role: 'model',
      text: getGreeting(),
      createdAt: 'Vừa xong'
    }
  ]);

  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeakingId, setIsSpeakingId] = useState<string | null>(null);
  const [showVoiceSettings, setShowVoiceSettings] = useState<boolean>(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Suggestions per language
  const SUGGESTIONS: Record<string, string[]> = {
    vi: [
      'Cách ủ phân hữu cơ từ rác nhà bếp không mùi?',
      'Cà chua bị vàng lá gân xanh thì xử lý thế nào?',
      'Phòng trừ rệp sáp và bọ trĩ bằng dầu neem sinh học?',
      'Nên tưới cây cảnh vào thời gian nào trong ngày tốt nhất?'
    ],
    en: [
      'How to compost kitchen waste without odors?',
      'Why are my tomato leaves turning yellow?',
      'Organic treatment for mealybugs using neem oil?',
      'What is the best time of day to water plants?'
    ],
    zh: [
      '如何在家无臭制作厨余有机堆肥？',
      '番茄叶片发黄叶脉发绿该如何救治？',
      '使用印楝油生物防治蚧壳虫与蓟马？',
      '一天当中什么时间给花木浇水最好？'
    ],
    km: [
      'វិធីធ្វើជីកំប៉ុសពីកាកសំណល់ផ្ទះបាយគ្មានក្លិន?',
      'ស្លឹកប៉េងប៉ោះឡើងលឿង ត្រូវព្យាបាលយ៉ាងណា?',
      'វិធីកម្ចាត់សត្វល្អិតដោយប្រើប្រេង Neem?',
      'តើពេលណាជាពេលវេលាល្អបំផុតដើម្បីស្រោចទឹក?'
    ],
    ja: [
      '無臭でできる家庭用生ごみコンポストの作り方は？',
      'トマトの葉が黄色くなる原因と対策は？',
      'ニームオイルでカイガラムシを有機防除する方法は？',
      '観葉植物や野菜の水やりに最適な時間帯は？'
    ]
  };

  const currentSuggestions = SUGGESTIONS[language] || SUGGESTIONS.vi;

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

      // Locale mapping
      let locale = 'vi-VN';
      if (language === 'en') locale = 'en-US';
      if (language === 'zh') locale = 'zh-CN';
      if (language === 'km') locale = 'km-KH';
      if (language === 'ja') locale = 'ja-JP';

      recognition.lang = locale;

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
        console.warn('Speech recognition event:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [language]);

  const showTempVoiceNotice = (msg: string) => {
    setVoiceNotice(msg);
    setTimeout(() => setVoiceNotice(null), 3500);
  };

  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) {
      showTempVoiceNotice(
        language === 'en'
          ? 'Your browser does not support Web Speech Recognition. Please type your question.'
          : language === 'ja'
          ? 'お使いのブラウザは音声認識に対応していません。テキストで質問をご入力ください。'
          : 'Trình duyệt chưa hỗ trợ nhận diện giọng nói Web Speech. Bà con có thể gõ văn bản nhé!'
      );
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error(e);
      }
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
      showTempVoiceNotice(
        language === 'en'
          ? 'Speech synthesis is not supported in this browser.'
          : language === 'ja'
          ? 'お使いのブラウザは音声読み上げに対応していません。'
          : 'Trình duyệt không hỗ trợ phát âm.'
      );
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

    let locale = 'vi-VN';
    if (language === 'en') locale = 'en-US';
    if (language === 'zh') locale = 'zh-CN';
    if (language === 'km') locale = 'km-KH';
    if (language === 'ja') locale = 'ja-JP';

    utterance.lang = locale;
    utterance.rate = voiceSpeed || 1.0;

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

    // If currently offline or simulated offline, serve instant local knowledge response
    if (isOffline) {
      setTimeout(() => {
        const offlineReply = findOfflineAgriculturalAnswer(text, language);
        const botMsg: ChatMessage = {
          id: `m-bot-${Date.now()}`,
          role: 'model',
          text: offlineReply,
          createdAt: 'Vừa xong',
          isOfflineSource: true
        };
        setMessages(prev => [...prev, botMsg]);
        setIsLoading(false);

        if (autoSpeak) {
          handleSpeakText(botMsg.id, botMsg.text);
        }
      }, 350);
      return;
    }

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map(m => ({ role: m.role, text: m.text })),
          userMessage: text,
          language
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

      if (autoSpeak) {
        handleSpeakText(botMsg.id, botMsg.text);
      }
    } catch (err) {
      console.warn('API error, using offline agricultural knowledge response:', err);
      const fallbackText = findOfflineAgriculturalAnswer(text, language);

      const botMsg: ChatMessage = {
        id: `m-bot-${Date.now()}`,
        role: 'model',
        text: fallbackText,
        createdAt: 'Vừa xong',
        isOfflineSource: true
      };
      setMessages(prev => [...prev, botMsg]);

      if (autoSpeak) {
        handleSpeakText(botMsg.id, botMsg.text);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-6 py-3 flex flex-col h-[calc(100vh-140px)] min-h-[560px]">
      {/* Chat header */}
      <div className="bg-white dark:bg-zinc-900 rounded-t-3xl p-3 sm:p-4 border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/30">
              <Bot className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900 ${isOffline ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
                {language === 'en'
                  ? 'Dr. Green AI Assistant'
                  : language === 'zh'
                  ? '绿色植保AI医生'
                  : language === 'km'
                  ? 'គ្រូពេទ្យរុក្ខជាតិ AI'
                  : language === 'ja'
                  ? '植物ドクター AI (Dr. Green)'
                  : 'Bác Sĩ Cây Trồng AI (Dr. Green)'}
              </h3>
              {isOffline ? (
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-bold flex items-center gap-1">
                  <WifiOff className="w-2.5 h-2.5" />
                  Offline
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                  Gemini 3.8 Flash
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {language === 'en'
                ? 'Agri & Gardening Expert • Voice & Text 24/7'
                : language === 'zh'
                ? '全天候农业技术咨询 • 支持语音与文字'
                : language === 'ja'
                ? '24時間対応 園芸・農学アドバイザー • 音声/テキスト'
                : language === 'km'
                ? 'ជំនួយការកសិកម្ម 24/7 • សំឡេង និងអក្សរ'
                : 'Tư vấn sâu bệnh, phân bón & làm vườn • Giọng nói 24/7'}
            </p>
          </div>
        </div>

        {/* Header Tools: Hands-free Voice Toggle & Refresh */}
        <div className="flex items-center gap-2">
          {/* Hands-Free Voice AutoSpeak Button */}
          <button
            onClick={toggleAutoSpeak}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              autoSpeak
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
            }`}
            title={t('voiceAutoSpeak')}
          >
            {autoSpeak ? (
              <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            ) : (
              <Volume1 className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">
              {autoSpeak ? (language === 'en' ? 'Hands-free ON' : 'Rảnh tay: Bật') : (language === 'en' ? 'Hands-free' : 'Tự đọc')}
            </span>
          </button>

          {/* Voice Settings Slider Trigger */}
          <button
            onClick={() => setShowVoiceSettings(!showVoiceSettings)}
            className="p-1.5 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            title={t('settings')}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {/* Clear chat button */}
          <button
            onClick={() =>
              setMessages([
                {
                  id: `m-${Date.now()}`,
                  role: 'model',
                  text: getGreeting(),
                  createdAt: 'Vừa xong'
                }
              ])
            }
            className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 flex items-center gap-1 cursor-pointer p-1.5"
            title="Làm mới cuộc trò chuyện"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Voice Speed Dropdown Panel if toggled */}
      {showVoiceSettings && (
        <div className="bg-emerald-50 dark:bg-zinc-800/70 px-4 py-2.5 border-x border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold">{t('voiceSpeed')}:</span>
            <div className="flex gap-1.5">
              {[0.8, 1.0, 1.2].map(speed => (
                <button
                  key={speed}
                  onClick={() => setVoiceSpeed(speed)}
                  className={`px-2 py-0.5 rounded-md font-semibold text-xs cursor-pointer ${
                    voiceSpeed === speed
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700'
                  }`}
                >
                  {speed === 0.8 ? '0.8x (Chậm)' : speed === 1.0 ? '1.0x (Chuẩn)' : '1.2x (Nhanh)'}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => handleSpeakText('test-voice', 'Thử giọng đọc của Bác sĩ Cây trồng')}
            className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Thử giọng</span>
          </button>
        </div>
      )}

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
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-3.5 text-xs sm:text-sm space-y-1.5 leading-relaxed shadow-xs ${
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
                  <div className="flex items-center gap-2">
                    <span>{msg.createdAt}</span>
                    {msg.isOfflineSource && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold text-[9px]">
                        Lưu trữ offline
                      </span>
                    )}
                  </div>

                  {!isUser && (
                    <button
                      onClick={() => handleSpeakText(msg.id, msg.text)}
                      className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-emerald-600 dark:text-emerald-400 flex items-center gap-1 cursor-pointer font-semibold"
                      title={isSpeakingId === msg.id ? 'Dừng đọc' : t('voiceSpeakOut')}
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
              <span>
                {language === 'en'
                  ? 'Dr. Green is formulating agricultural solutions...'
                  : 'Bác sĩ đang phân tích giải pháp nông nghiệp...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      <div className="bg-white dark:bg-zinc-900 px-3 py-2 border-x border-zinc-200 dark:border-zinc-800 overflow-x-auto no-scrollbar shrink-0">
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          {currentSuggestions.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip)}
              className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-zinc-700 hover:text-emerald-700 dark:hover:text-emerald-300 text-[11px] font-medium transition-colors cursor-pointer shrink-0"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box & Voice Controls */}
      <div className="bg-white dark:bg-zinc-900 rounded-b-3xl p-3 sm:p-4 border border-zinc-200 dark:border-zinc-800 shadow-md shrink-0">
        {voiceNotice && (
          <div className="mb-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-semibold">
            {voiceNotice}
          </div>
        )}
        {isListening && (
          <div className="flex items-center justify-between mb-2 px-3 py-2 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-rose-700 dark:text-rose-300 text-xs animate-pulse border border-rose-200 dark:border-rose-900">
            <div className="flex items-center gap-2 font-semibold">
              <Mic className="w-4 h-4 text-rose-600 animate-spin" />
              <span>{t('voiceListening')}</span>
            </div>
            <button
              onClick={toggleVoiceRecording}
              className="font-bold underline text-xs cursor-pointer px-2 py-0.5 bg-rose-200 dark:bg-rose-900 rounded"
            >
              {t('voiceStop')}
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
            placeholder={
              language === 'en'
                ? 'Ask about plant diseases, organic compost, watering...'
                : language === 'zh'
                ? '向植保医生提问病虫害防治、堆肥、浇水方法...'
                : language === 'ja'
                ? '病害虫対策、有機肥料、水やりについて質問...'
                : language === 'km'
                ? 'សួរអំពីជំងឺរុក្ខជាតិ ជីកំប៉ុស ឬការស្រោចទឹក...'
                : 'Hỏi về sâu bệnh, phân bón, tưới nước hoặc gõ câu hỏi...'
            }
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
