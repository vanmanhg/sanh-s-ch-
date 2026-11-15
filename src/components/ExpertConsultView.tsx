import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { AGRI_EXPERTS } from '../data/mockData';
import { ExpertQAQuestion, Plant } from '../types';
import {
  Send,
  Image as ImageIcon,
  Sprout,
  CheckCircle2,
  Clock,
  Star,
  Search,
  ThumbsUp,
  Plus,
  X,
  FileText,
  BookmarkCheck,
  Loader2,
  MessageSquarePlus,
  Check,
  HelpCircle,
  Filter,
  ShieldCheck,
  Phone,
  Stethoscope,
  Sparkles,
  CornerDownRight
} from 'lucide-react';

interface ExpertConsultViewProps {
  mode: 'dm' | 'qa';
  selectedExpertId?: string;
  onSelectExpertId?: (id: string) => void;
  initialPlant?: Plant | null;
  onClearInitialPlant?: () => void;
}

const QA_CATEGORY_LABELS: Record<ExpertQAQuestion['category'], string> = {
  disease: 'Nấm & Bệnh hại',
  pest: 'Sâu & Côn trùng',
  nutrition: 'Dinh dưỡng & Phân bón',
  soil: 'Đất & Giá thể',
  pruning: 'Cắt tỉa & Tạo tán',
  general: 'Chăm sóc tổng quát'
};

const compressImageFile = (file: File, maxDim: number = 900): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image'));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
};

export const ExpertConsultView: React.FC<ExpertConsultViewProps> = ({
  mode,
  selectedExpertId,
  onSelectExpertId,
  initialPlant,
  onClearInitialPlant
}) => {
  const {
    plants,
    addCareLog,
    expertThreads,
    sendingExpertId,
    sendExpertMessage,
    markExpertThreadRead,
    toggleExpertThreadResolved,
    expertQAQuestions,
    isSubmittingQA,
    createExpertQAQuestion,
    addQAFollowUp,
    toggleQAHelpful,
    toggleQAResolved,
    isOffline
  } = useApp();

  // Direct Messaging State
  const [internalExpertId, setInternalExpertId] = useState<string>(
    selectedExpertId || AGRI_EXPERTS[0].id
  );
  const activeExpertId = selectedExpertId || internalExpertId;
  const setActiveExpertId = (id: string) => {
    setInternalExpertId(id);
    onSelectExpertId?.(id);
    markExpertThreadRead(id);
  };

  const [expertSearch, setExpertSearch] = useState<string>('');
  const [messageInput, setMessageInput] = useState<string>('');
  const [attachedPlant, setAttachedPlant] = useState<Plant | null>(initialPlant || null);
  const [showPlantPicker, setShowPlantPicker] = useState<boolean>(false);
  const [uploadedDmImage, setUploadedDmImage] = useState<string>('');
  const [savedPrescriptionKeys, setSavedPrescriptionKeys] = useState<Record<string, boolean>>({});
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync initialPlant when coming from MyGardenView or PDF Report Modal
  useEffect(() => {
    if (initialPlant) {
      setAttachedPlant(initialPlant);
      setMessageInput(prev =>
        prev.trim()
          ? prev
          : `Nhờ chuyên gia xem giúp hồ sơ sinh trưởng và tình trạng hiện tại của cây "${initialPlant.name}" trong vườn nhà tôi.`
      );
    }
  }, [initialPlant]);

  useEffect(() => {
    if (selectedExpertId) {
      setInternalExpertId(selectedExpertId);
      markExpertThreadRead(selectedExpertId);
    }
  }, [selectedExpertId]);

  const activeExpert = useMemo(
    () => AGRI_EXPERTS.find(e => e.id === activeExpertId) || AGRI_EXPERTS[0],
    [activeExpertId]
  );

  const activeThread = useMemo(
    () => expertThreads.find(t => t.expertId === activeExpert.id),
    [expertThreads, activeExpert.id]
  );

  useEffect(() => {
    if (mode === 'dm') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeThread?.messages.length, sendingExpertId, mode]);

  const filteredExperts = useMemo(() => {
    const q = expertSearch.trim().toLowerCase();
    if (!q) return AGRI_EXPERTS;
    return AGRI_EXPERTS.filter(
      e =>
        e.name.toLowerCase().includes(q) ||
        e.title.toLowerCase().includes(q) ||
        e.specialty.some(s => s.toLowerCase().includes(q))
    );
  }, [expertSearch]);

  const handleDmPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file);
      setUploadedDmImage(dataUrl);
    } catch {
      // ignore invalid file
    }
    e.target.value = '';
  };

  const handleSendDm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = messageInput.trim();
    if (!trimmed && !uploadedDmImage && !attachedPlant) return;
    if (sendingExpertId === activeExpert.id) return;

    const textToSend =
      trimmed ||
      (attachedPlant
        ? `Gửi chuyên gia hồ sơ cây ${attachedPlant.name} để nhờ tư vấn chăm sóc.`
        : 'Gửi ảnh cây trồng nhờ chuyên gia kiểm tra.');

    const plantPayload = attachedPlant || undefined;
    const imgPayload = uploadedDmImage || undefined;

    setMessageInput('');
    setUploadedDmImage('');
    setAttachedPlant(null);
    setShowPlantPicker(false);
    onClearInitialPlant?.();

    await sendExpertMessage(activeExpert.id, textToSend, {
      imageUrl: imgPayload,
      plant: plantPayload
    });
  };

  const handleSavePrescriptionToLog = (
    key: string,
    plantId: string | undefined,
    title: string,
    recommendations: string[],
    careType?: 'water' | 'fertilize' | 'prune' | 'pest_control'
  ) => {
    const targetId = plantId || activeThread?.linkedPlantId || plants[0]?.id;
    if (!targetId) return;
    addCareLog(targetId, {
      date: new Date().toISOString(),
      type: careType || 'pest_control',
      notes: `[${activeExpert.name}] ${title}: ${recommendations.join(' • ')}`
    });
    setSavedPrescriptionKeys(prev => ({ ...prev, [key]: true }));
  };

  // Q&A Board State
  const [qaSearch, setQaSearch] = useState<string>('');
  const [qaFilter, setQaFilter] = useState<'all' | 'mine' | ExpertQAQuestion['category']>('all');
  const [showAskModal, setShowAskModal] = useState<boolean>(false);
  const [qaTitle, setQaTitle] = useState<string>('');
  const [qaCategory, setQaCategory] = useState<ExpertQAQuestion['category']>('disease');
  const [qaTargetExpertId, setQaTargetExpertId] = useState<string>(AGRI_EXPERTS[0].id);
  const [qaPlantId, setQaPlantId] = useState<string>(initialPlant?.id || '');
  const [qaContent, setQaContent] = useState<string>('');
  const [qaImage, setQaImage] = useState<string>('');
  const [qaFormError, setQaFormError] = useState<string>('');

  const [followUpTargetId, setFollowUpTargetId] = useState<string | null>(null);
  const [followUpText, setFollowUpText] = useState<string>('');

  useEffect(() => {
    if (initialPlant && mode === 'qa') {
      setQaPlantId(initialPlant.id);
    }
  }, [initialPlant, mode]);

  const filteredQuestions = useMemo(() => {
    const q = qaSearch.trim().toLowerCase();
    return expertQAQuestions.filter(item => {
      if (qaFilter === 'mine') {
        if (!item.authorName.startsWith('Tôi')) return false;
      } else if (qaFilter !== 'all' && item.category !== qaFilter) {
        return false;
      }
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q) ||
        (item.plantName || '').toLowerCase().includes(q) ||
        item.answers.some(a => a.content.toLowerCase().includes(q))
      );
    });
  }, [expertQAQuestions, qaFilter, qaSearch]);

  const handleQaImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file);
      setQaImage(dataUrl);
    } catch {
      // ignore
    }
    e.target.value = '';
  };

  const handleSubmitQa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qaTitle.trim() || !qaContent.trim()) {
      setQaFormError('Vui lòng nhập tiêu đề và mô tả chi tiết tình trạng cây.');
      return;
    }
    setQaFormError('');
    const chosenPlant = plants.find(p => p.id === qaPlantId);
    await createExpertQAQuestion({
      title: qaTitle.trim(),
      category: qaCategory,
      content: qaContent.trim(),
      targetExpertId: qaTargetExpertId,
      plant: chosenPlant,
      images: qaImage ? [qaImage] : undefined
    });
    setQaTitle('');
    setQaContent('');
    setQaImage('');
    setShowAskModal(false);
    onClearInitialPlant?.();
  };

  const handleSendFollowUp = async (questionId: string) => {
    if (!followUpText.trim() || isSubmittingQA) return;
    const txt = followUpText.trim();
    setFollowUpText('');
    setFollowUpTargetId(null);
    await addQAFollowUp(questionId, txt);
  };

  const markImgFailed = (key: string) => {
    setFailedImages(prev => ({ ...prev, [key]: true }));
  };

  // ==================== DIRECT MESSAGING VIEW ====================
  if (mode === 'dm') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Sidebar: Expert Directory & Threads */}
        <aside className="lg:col-span-4 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
              Danh sách Chuyên Gia
            </h3>
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              {AGRI_EXPERTS.filter(e => e.isOnline).length} trực tuyến
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={expertSearch}
              onChange={e => setExpertSearch(e.target.value)}
              placeholder="Tìm chuyên gia, chuyên môn..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>

          <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
            {filteredExperts.map(exp => {
              const thread = expertThreads.find(t => t.expertId === exp.id);
              const lastMsg = thread?.messages[thread.messages.length - 1];
              const isSelected = exp.id === activeExpert.id;
              const unread = thread?.unreadCount || 0;

              return (
                <button
                  key={exp.id}
                  type="button"
                  onClick={() => setActiveExpertId(exp.id)}
                  className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isSelected
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 shadow-xs'
                      : 'bg-zinc-50/60 dark:bg-zinc-800/40 border-zinc-200/80 dark:border-zinc-800 hover:border-emerald-400/50'
                  }`}
                >
                  <div className="relative shrink-0">
                    {!failedImages[`exp-${exp.id}`] ? (
                      <img
                        src={exp.avatar}
                        alt={exp.name}
                        referrerPolicy="no-referrer"
                        onError={() => markImgFailed(`exp-${exp.id}`)}
                        className="w-11 h-11 rounded-2xl object-cover border border-zinc-200 dark:border-zinc-700"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-sm">
                        {exp.name.slice(0, 2)}
                      </div>
                    )}
                    {exp.isOnline && (
                      <span
                        title="Đang trực tuyến"
                        className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900"
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 truncate">
                        {exp.name}
                      </span>
                      {unread > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold shrink-0">
                          {unread}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 truncate">
                      {exp.title}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-1">
                      {lastMsg
                        ? `${lastMsg.sender === 'user' ? 'Bạn: ' : ''}${lastMsg.content}`
                        : exp.specialty.slice(0, 2).join(' · ')}
                    </p>
                    <div className="flex items-center justify-between mt-1.5 text-[10px] text-zinc-400">
                      <span>{thread?.lastMessageAt || (exp.isOnline ? 'Phản hồi ~5 phút' : 'Ngoại tuyến')}</span>
                      {thread?.status === 'resolved' && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          Đã xong
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Pane: Active Conversation */}
        <section className="lg:col-span-8 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex flex-col min-h-[580px] max-h-[720px] overflow-hidden">
          {/* Conversation Header */}
          <div className="px-4 sm:px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 bg-zinc-50/70 dark:bg-zinc-900">
            <div className="flex items-center gap-3 min-w-0">
              {!failedImages[`hdr-${activeExpert.id}`] ? (
                <img
                  src={activeExpert.avatar}
                  alt={activeExpert.name}
                  referrerPolicy="no-referrer"
                  onError={() => markImgFailed(`hdr-${activeExpert.id}`)}
                  className="w-11 h-11 rounded-2xl object-cover border border-emerald-500/40 shrink-0"
                />
              ) : (
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0">
                  {activeExpert.name.slice(0, 2)}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 truncate">
                    {activeExpert.name}
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    {activeExpert.rating}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                  {activeExpert.title} · {activeExpert.organization}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`tel:${activeExpert.phone}`}
                className="px-2.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">{activeExpert.phone}</span>
              </a>

              {activeThread && (
                <button
                  type="button"
                  onClick={() => toggleExpertThreadResolved(activeExpert.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    activeThread.status === 'resolved'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{activeThread.status === 'resolved' ? 'Đã giải quyết' : 'Đánh dấu xong'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-zinc-50/40 dark:bg-zinc-950/40">
            {(!activeThread || activeThread.messages.length === 0) && (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 text-center space-y-2 max-w-md mx-auto my-6">
                <Stethoscope className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  Bắt đầu tư vấn 1-1 cùng {activeExpert.name}
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Đính kèm hồ sơ cây từ Vườn Của Tôi hoặc tải ảnh triệu chứng lá/rễ để nhận phác đồ chăm sóc cá nhân hóa.
                </p>
              </div>
            )}

            {activeThread?.messages.map(msg => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="shrink-0 mt-1">
                      {!failedImages[`m-${msg.id}`] && msg.senderAvatar ? (
                        <img
                          src={msg.senderAvatar}
                          alt={msg.senderName}
                          referrerPolicy="no-referrer"
                          onError={() => markImgFailed(`m-${msg.id}`)}
                          className="w-8 h-8 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                          CG
                        </div>
                      )}
                    </div>
                  )}

                  <div className={`max-w-[85%] sm:max-w-[75%] space-y-2 ${isUser ? 'items-end flex flex-col' : ''}`}>
                    <div
                      className={`rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                        isUser
                          ? 'bg-emerald-600 text-white rounded-tr-sm shadow-xs'
                          : 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-tl-sm shadow-xs'
                      }`}
                    >
                      {msg.content}
                    </div>

                    {/* Message Attachments */}
                    {msg.attachments?.map((att, idx) => {
                      if (att.type === 'image' && att.url) {
                        const imgKey = `att-img-${msg.id}-${idx}`;
                        return !failedImages[imgKey] ? (
                          <img
                            key={imgKey}
                            src={att.url}
                            alt="Ảnh cây gửi chuyên gia"
                            referrerPolicy="no-referrer"
                            onError={() => markImgFailed(imgKey)}
                            className="max-h-56 rounded-2xl border border-zinc-200 dark:border-zinc-700 object-cover shadow-xs"
                          />
                        ) : null;
                      }

                      if (att.type === 'plant_report') {
                        return (
                          <div
                            key={`att-plant-${msg.id}-${idx}`}
                            className="w-full rounded-2xl border border-emerald-200 dark:border-emerald-800/70 bg-emerald-50/90 dark:bg-emerald-950/40 p-3 flex items-center gap-3 text-left"
                          >
                            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                                Hồ sơ cây đính kèm
                              </div>
                              <div className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 truncate">
                                {att.plantName}
                              </div>
                              <div className="text-[11px] text-zinc-600 dark:text-zinc-300">
                                {att.summary}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      if (att.type === 'care_prescription' && att.recommendations) {
                        const saveKey = `rx-${msg.id}-${idx}`;
                        const isSaved = savedPrescriptionKeys[saveKey];
                        return (
                          <div
                            key={saveKey}
                            className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 space-y-2.5 shadow-xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-extrabold text-xs">
                                <ShieldCheck className="w-4 h-4 shrink-0" />
                                <span>{att.title || 'Phác đồ chăm sóc khuyến nghị'}</span>
                              </div>
                              {att.plantName && (
                                <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                                  {att.plantName}
                                </span>
                              )}
                            </div>

                            <ul className="space-y-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                              {att.recommendations.map((rec, rIdx) => (
                                <li key={rIdx} className="flex items-start gap-2">
                                  <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                    {rIdx + 1}
                                  </span>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>

                            {plants.length > 0 && (
                              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end">
                                <button
                                  type="button"
                                  disabled={isSaved}
                                  onClick={() =>
                                    handleSavePrescriptionToLog(
                                      saveKey,
                                      att.plantId,
                                      att.title || 'Phác đồ chuyên gia',
                                      att.recommendations || [],
                                      att.suggestedCareType
                                    )
                                  }
                                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                                    isSaved
                                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 cursor-default'
                                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                  }`}
                                >
                                  {isSaved ? (
                                    <>
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Đã lưu vào Nhật Ký Cây</span>
                                    </>
                                  ) : (
                                    <>
                                      <BookmarkCheck className="w-3.5 h-3.5" />
                                      <span>Lưu Phác Đồ Vào Vườn</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      }

                      return null;
                    })}

                    <span className="text-[10px] text-zinc-400 px-1">{msg.timestamp}</span>
                  </div>
                </div>
              );
            })}

            {sendingExpertId === activeExpert.id && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-2.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {activeExpert.name} đang kiểm tra dữ liệu và soạn hướng dẫn...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Composer Area */}
          <form
            onSubmit={handleSendDm}
            className="p-3 sm:p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2.5"
          >
            {/* Previews of Attached Plant & Image */}
            {(attachedPlant || uploadedDmImage) && (
              <div className="flex flex-wrap items-center gap-2">
                {attachedPlant && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
                    <Sprout className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-bold truncate max-w-[200px]">
                      {attachedPlant.name} ({attachedPlant.healthScore}% sức khỏe)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAttachedPlant(null);
                        onClearInitialPlant?.();
                      }}
                      className="text-emerald-700 dark:text-emerald-400 hover:text-rose-600 cursor-pointer"
                      aria-label="Bỏ đính kèm cây"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {uploadedDmImage && (
                  <div className="relative inline-flex items-center">
                    <img
                      src={uploadedDmImage}
                      alt="Ảnh đính kèm"
                      className="h-12 w-12 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700"
                    />
                    <button
                      type="button"
                      onClick={() => setUploadedDmImage('')}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center cursor-pointer"
                      aria-label="Xóa ảnh"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Quick Suggestion Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {[
                'Lên phác đồ ngừa nấm mùa mưa',
                'Kiểm tra lịch tưới & độ ẩm đất',
                'Tư vấn phân hữu cơ giúp đậu hoa/quả'
              ].map(chip => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setMessageInput(chip)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-zinc-600 dark:text-zinc-300 hover:text-emerald-700 dark:hover:text-emerald-300 text-[11px] font-medium whitespace-nowrap cursor-pointer transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Garden Plant Picker Popover */}
            {showPlantPicker && (
              <div className="p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
                  <span>Chọn cây từ Vườn Của Tôi để gửi kèm thông số:</span>
                  <button
                    type="button"
                    onClick={() => setShowPlantPicker(false)}
                    className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
                  {plants.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setAttachedPlant(p);
                        setShowPlantPicker(false);
                      }}
                      className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:border-emerald-500 text-left cursor-pointer"
                    >
                      <Sprout className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          Sức khỏe {p.healthScore}% · Ẩm đất {p.soilMoisturePercent ?? 50}%
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => setShowPlantPicker(prev => !prev)}
                title="Đính kèm hồ sơ cây từ vườn"
                className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-zinc-600 dark:text-zinc-300 hover:text-emerald-700 cursor-pointer transition-colors shrink-0"
              >
                <Sprout className="w-4 h-4" />
              </button>

              <label
                title="Tải ảnh lá hoặc thân cây"
                className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-zinc-600 dark:text-zinc-300 hover:text-emerald-700 cursor-pointer transition-colors shrink-0"
              >
                <ImageIcon className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleDmPhotoUpload}
                  className="hidden"
                />
              </label>

              <textarea
                rows={1}
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendDm();
                  }
                }}
                placeholder={
                  isOffline
                    ? 'Đang ngoại tuyến — tin nhắn sẽ nhận tư vấn cơ bản & lưu cục bộ...'
                    : `Nhắn tin cho ${activeExpert.name}...`
                }
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none max-h-28"
              />

              <button
                type="submit"
                disabled={sendingExpertId === activeExpert.id || (!messageInput.trim() && !uploadedDmImage && !attachedPlant)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs sm:text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
              >
                {sendingExpertId === activeExpert.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Gửi</span>
              </button>
            </div>
          </form>
        </section>
      </div>
    );
  }

  // ==================== PERSONALIZED EXPERT Q&A BOARD ====================
  return (
    <div className="space-y-5">
      {/* Top Toolbar */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-emerald-600" />
              <span>Hỏi Đáp Cá Nhân Hóa Cùng Chuyên Gia Nông Nghiệp</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Gửi câu hỏi kèm thông số vườn và hình ảnh thực tế để nhận giải đáp có phác đồ từng bước từ chuyên gia phù hợp
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAskModal(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs shrink-0 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Đặt Câu Hỏi Chuyên Gia</span>
          </button>
        </div>

        {/* Search & Category Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={qaSearch}
              onChange={e => setQaSearch(e.target.value)}
              placeholder="Tìm kiếm câu hỏi theo tên cây, triệu chứng hoặc phác đồ..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <Filter className="w-3.5 h-3.5 text-zinc-400 shrink-0 mr-1" />
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'mine', label: 'Của tôi' },
              { id: 'disease', label: 'Bệnh hại' },
              { id: 'pest', label: 'Sâu bọ' },
              { id: 'nutrition', label: 'Dinh dưỡng' },
              { id: 'soil', label: 'Đất trồng' },
              { id: 'general', label: 'Tổng quát' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setQaFilter(tab.id as typeof qaFilter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  qaFilter === tab.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 text-center space-y-2">
            <HelpCircle className="w-8 h-8 text-zinc-400 mx-auto" />
            <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
              Chưa có câu hỏi nào khớp bộ lọc hiện tại
            </p>
            <button
              type="button"
              onClick={() => {
                setQaFilter('all');
                setQaSearch('');
              }}
              className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
            >
              Xem tất cả câu hỏi
            </button>
          </div>
        ) : (
          filteredQuestions.map(q => (
            <article
              key={q.id}
              className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4 shadow-xs"
            >
              {/* Question Header */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span
                      className={`px-2.5 py-0.5 rounded-lg font-bold ${
                        q.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : q.status === 'answered'
                          ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {q.status === 'resolved'
                        ? 'Đã giải quyết'
                        : q.status === 'answered'
                        ? 'Chuyên gia đã trả lời'
                        : 'Đang chờ chuyên gia'}
                    </span>

                    <span className="px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-semibold">
                      {QA_CATEGORY_LABELS[q.category]}
                    </span>

                    <span className="text-zinc-400">
                      {q.authorName} · {q.location} · {q.createdAt}
                    </span>
                  </div>

                  <h4 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-zinc-100 leading-snug">
                    {q.title}
                  </h4>
                </div>

                <button
                  type="button"
                  onClick={() => toggleQAResolved(q.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 ${
                    q.status === 'resolved'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{q.status === 'resolved' ? 'Đã xử lý xong' : 'Đánh dấu đã xong'}</span>
                </button>
              </div>

              {/* Attached Plant Snapshot */}
              {(q.plantName || q.attachedReportSummary) && (
                <div className="rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900 px-3.5 py-2.5 flex flex-wrap items-center gap-2 text-xs">
                  <Sprout className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold text-emerald-800 dark:text-emerald-300">
                    {q.plantName}
                  </span>
                  {q.attachedReportSummary && (
                    <span className="text-zinc-600 dark:text-zinc-300">
                      — {q.attachedReportSummary}
                    </span>
                  )}
                </div>
              )}

              {/* Question Body & Photos */}
              <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                {q.content}
              </p>

              {q.images && q.images.length > 0 && (
                <div className="flex flex-wrap gap-2.5">
                  {q.images.map((imgUrl, idx) => {
                    const key = `qa-img-${q.id}-${idx}`;
                    return !failedImages[key] ? (
                      <img
                        key={key}
                        src={imgUrl}
                        alt={q.title}
                        referrerPolicy="no-referrer"
                        onError={() => markImgFailed(key)}
                        className="h-32 w-44 object-cover rounded-2xl border border-zinc-200 dark:border-zinc-700"
                      />
                    ) : null;
                  })}
                </div>
              )}

              {/* Expert Answers */}
              {q.answers.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  {q.answers.map(ans => {
                    const saveKey = `qa-rx-${q.id}-${ans.id}`;
                    const isSaved = savedPrescriptionKeys[saveKey];
                    return (
                      <div
                        key={ans.id}
                        className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 p-4 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            {!failedImages[`ans-${ans.id}`] ? (
                              <img
                                src={ans.expertAvatar}
                                alt={ans.expertName}
                                referrerPolicy="no-referrer"
                                onError={() => markImgFailed(`ans-${ans.id}`)}
                                className="w-9 h-9 rounded-xl object-cover border border-emerald-500/40"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                                CG
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">
                                  {ans.expertName}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                                  Chuyên gia xác thực
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                {ans.expertTitle} · {ans.organization}
                              </p>
                            </div>
                          </div>

                          <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {ans.createdAt}
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line">
                          {ans.content}
                        </p>

                        {ans.recommendations && ans.recommendations.length > 0 && (
                          <div className="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-3 space-y-1.5">
                            <div className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                              Các bước xử lý khuyến nghị
                            </div>
                            <ul className="space-y-1 text-xs text-zinc-700 dark:text-zinc-300">
                              {ans.recommendations.map((step, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="font-bold text-emerald-600">{i + 1}.</span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleQAHelpful(q.id, ans.id)}
                              className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                                ans.isMarkedHelpful
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-emerald-500'
                              }`}
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                              <span>Hữu ích ({ans.helpfulCount})</span>
                            </button>

                            {ans.followUpDays && (
                              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                Kiểm tra lại sau {ans.followUpDays} ngày
                              </span>
                            )}
                          </div>

                          {q.plantId && ans.recommendations && ans.recommendations.length > 0 && (
                            <button
                              type="button"
                              disabled={isSaved}
                              onClick={() =>
                                handleSavePrescriptionToLog(
                                  saveKey,
                                  q.plantId,
                                  q.title,
                                  ans.recommendations || [],
                                  q.category === 'nutrition' ? 'fertilize' : q.category === 'pruning' ? 'prune' : 'pest_control'
                                )
                              }
                              className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                                isSaved
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
                              }`}
                            >
                              <BookmarkCheck className="w-3.5 h-3.5" />
                              <span>{isSaved ? 'Đã lưu nhật ký' : 'Lưu vào Nhật Ký Cây'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Follow-up Action */}
              <div className="pt-1 flex flex-col gap-2">
                {followUpTargetId === q.id ? (
                  <div className="flex items-center gap-2">
                    <CornerDownRight className="w-4 h-4 text-zinc-400 shrink-0" />
                    <input
                      type="text"
                      value={followUpText}
                      onChange={e => setFollowUpText(e.target.value)}
                      placeholder="Nhập câu hỏi bổ sung hoặc kết quả sau khi xử lý..."
                      className="flex-1 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100"
                    />
                    <button
                      type="button"
                      disabled={isSubmittingQA || !followUpText.trim()}
                      onClick={() => handleSendFollowUp(q.id)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                    >
                      {isSubmittingQA ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Gửi</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFollowUpTargetId(null);
                        setFollowUpText('');
                      }}
                      className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setFollowUpTargetId(q.id)}
                      className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquarePlus className="w-3.5 h-3.5" />
                      <span>Hỏi thêm chuyên gia về vấn đề này</span>
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))
        )}
      </div>

      {/* ASK EXPERT MODAL */}
      {showAskModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 sm:p-6 max-w-xl w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Gửi Câu Hỏi Tới Chuyên Gia Nông Nghiệp</span>
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Hệ thống tự động đính kèm điều kiện thời tiết khu vực để chuyên gia chẩn đoán chuẩn xác
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAskModal(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitQa} className="space-y-3.5 text-xs">
              {qaFormError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-semibold">
                  {qaFormError}
                </div>
              )}

              <div>
                <label className="font-bold block mb-1 text-zinc-700 dark:text-zinc-300">
                  Tiêu đề câu hỏi *
                </label>
                <input
                  type="text"
                  required
                  value={qaTitle}
                  onChange={e => setQaTitle(e.target.value)}
                  placeholder="Ví dụ: Lá cà chua xuất hiện đốm vàng viền nâu sau mưa..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1 text-zinc-700 dark:text-zinc-300">
                    Chủ đề tư vấn
                  </label>
                  <select
                    value={qaCategory}
                    onChange={e => setQaCategory(e.target.value as ExpertQAQuestion['category'])}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                  >
                    {Object.entries(QA_CATEGORY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1 text-zinc-700 dark:text-zinc-300">
                    Đính kèm cây từ Vườn (tùy chọn)
                  </label>
                  <select
                    value={qaPlantId}
                    onChange={e => setQaPlantId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="">-- Không đính kèm cây --</option>
                    {plants.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Sức khỏe {p.healthScore}%)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1.5 text-zinc-700 dark:text-zinc-300">
                  Chọn chuyên gia giải đáp
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {AGRI_EXPERTS.map(exp => (
                    <button
                      key={exp.id}
                      type="button"
                      onClick={() => setQaTargetExpertId(exp.id)}
                      className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        qaTargetExpertId === exp.id
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500'
                          : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {exp.name}
                      </div>
                      <div className="text-[10px] text-emerald-700 dark:text-emerald-400 truncate">
                        {exp.specialty[0]}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1 text-zinc-700 dark:text-zinc-300">
                  Mô tả chi tiết hiện trạng & lịch chăm sóc gần đây *
                </label>
                <textarea
                  rows={4}
                  required
                  value={qaContent}
                  onChange={e => setQaContent(e.target.value)}
                  placeholder="Mô tả triệu chứng lá/thân/rễ, loại đất trồng, phân bón đã dùng trong 14 ngày qua..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold cursor-pointer">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  <span>{qaImage ? 'Đổi ảnh đính kèm' : 'Tải ảnh hiện trạng cây'}</span>
                  <input type="file" accept="image/*" onChange={handleQaImageUpload} className="hidden" />
                </label>

                {qaImage && (
                  <div className="flex items-center gap-2">
                    <img
                      src={qaImage}
                      alt="Preview"
                      className="w-10 h-10 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700"
                    />
                    <button
                      type="button"
                      onClick={() => setQaImage('')}
                      className="text-rose-500 text-[11px] font-bold cursor-pointer"
                    >
                      Xóa
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAskModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingQA}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmittingQA ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang gửi chuyên gia...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Gửi Câu Hỏi Ngay</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
