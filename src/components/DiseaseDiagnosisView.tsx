import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useFirebaseAuth } from '../context/FirebaseAuthContext';
import {
  deleteDiagnosisFromFirestore,
  DiagnosisPayload,
  SavedDiseaseDiagnosis,
  saveDiagnosisToFirestore,
  subscribeUserDiagnoses,
  TreatmentStep,
  updateDiagnosisStatusInFirestore,
} from '../lib/firebaseDiagnoses';
import {
  Camera,
  Upload,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Stethoscope,
  RefreshCw,
  Leaf,
  Layers,
  HelpCircle,
  BookOpen,
  MessageCircle,
  Cloud,
  CheckCircle2,
  Clock,
  Trash2,
  LogIn,
  Loader2,
  X,
  Sprout,
  BookmarkCheck,
  Check,
  WifiOff,
  Aperture,
  SwitchCamera,
  CalendarClock
} from 'lucide-react';

interface DiseaseDiagnosisViewProps {
  onGoToChatbot: (initialPrompt?: string) => void;
  onGoToLibrary: () => void;
}

interface DiagnosisViewResult extends DiagnosisPayload {
  urgencyLevel?: string;
}

const SAMPLE_DISEASES = [
  {
    title: 'Đốm Lá & Thán Thư',
    crop: 'Cà chua / Ớt',
    url: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=600&q=80',
    note: 'Lá xuất hiện đốm tròn màu nâu viền vàng, lá già rụng sớm.',
  },
  {
    title: 'Xì Mủ Thân Cổ Rễ',
    crop: 'Sầu riêng',
    url: 'https://images.unsplash.com/photo-1546548970-71785318a17b?auto=format&fit=crop&w=600&q=80',
    note: 'Thân cây ứa mủ vàng sậm, lá vàng rụng sau đợt mưa dầm.',
  },
  {
    title: 'Rệp Sáp Phấn Trắng',
    crop: 'Cây kiểng & Cà phê',
    url: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=600&q=80',
    note: 'Cụm trắng như bông bám nách lá, lá non xoăn quăn queo.',
  },
];

const compressImageDataUrl = (
  sourceDataUrl: string,
  maxDim: number,
  quality: number
): Promise<string> => {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(sourceDataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(sourceDataUrl);
    img.src = sourceDataUrl;
  });
};

export const DiseaseDiagnosisView: React.FC<DiseaseDiagnosisViewProps> = ({
  onGoToChatbot,
  onGoToLibrary,
}) => {
  const { plants, addCareLog, isOffline, t } = useApp();
  const { user, authReady, isSigningIn, signInWithGoogle } = useFirebaseAuth();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | undefined>(undefined);
  const [farmerNotes, setFarmerNotes] = useState<string>('');
  const [linkedPlantId, setLinkedPlantId] = useState<string>('');
  const [isDiagnosing, setIsDiagnosing] = useState<boolean>(false);
  const [diagnosisError, setDiagnosisError] = useState<string | null>(null);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisViewResult | null>(null);
  const [savedCareLogDone, setSavedCareLogDone] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Firebase Firestore cloud history state
  const [cloudHistory, setCloudHistory] = useState<SavedDiseaseDiagnosis[]>([]);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [isSavingCloud, setIsSavingCloud] = useState<boolean>(false);
  const [savedCloudId, setSavedCloudId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // Live Camera Modal state
  const [showCameraModal, setShowCameraModal] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [treatmentScheduled, setTreatmentScheduled] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to user's Firestore diagnoses when authenticated
  useEffect(() => {
    if (!authReady || !user) {
      setCloudHistory([]);
      return;
    }

    setCloudError(null);
    const unsub = subscribeUserDiagnoses(
      user.uid,
      records => {
        setCloudHistory(records);
      },
      err => {
        console.error('Diagnoses subscription error:', err);
        setCloudError('Không thể đồng bộ lịch sử chẩn đoán từ Firebase Firestore.');
      }
    );
    return () => unsub();
  }, [authReady, user]);

  // Manage camera stream lifecycle
  const stopCameraStream = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  useEffect(() => {
    if (showCameraModal && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(() => {});
    }
  }, [showCameraModal, cameraStream]);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const startCameraWithFacing = async (facing: 'environment' | 'user') => {
    setCameraError(null);
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Trình duyệt không hỗ trợ truy cập camera trực tiếp. Bạn có thể chọn ảnh từ máy.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing },
        audio: false,
      });
      setCameraStream(stream);
    } catch {
      setCameraError('Không thể mở camera (chưa cấp quyền hoặc không tìm thấy camera). Vui lòng dùng nút chọn ảnh từ thiết bị.');
    }
  };

  const openLiveCamera = async () => {
    setShowCameraModal(true);
    await startCameraWithFacing(cameraFacing);
  };

  const handleFlipCamera = async () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    await startCameraWithFacing(nextFacing);
  };

  const closeLiveCamera = () => {
    stopCameraStream();
    setShowCameraModal(false);
    setCameraError(null);
  };

  const captureFromCamera = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const w = video.videoWidth || 800;
    const h = video.videoHeight || 600;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    const rawDataUrl = canvas.toDataURL('image/jpeg', 0.88);
    closeLiveCamera();
    await handlePreparedImage(rawDataUrl);
  };

  const handlePreparedImage = async (rawDataUrl: string) => {
    const compressedAi = await compressImageDataUrl(rawDataUrl, 1200, 0.85);
    const compactThumb = await compressImageDataUrl(rawDataUrl, 240, 0.65);
    setSelectedImage(compressedAi);
    setThumbnailPreview(compactThumb.length <= 145000 ? compactThumb : undefined);
    setDiagnosisResult(null);
    setDiagnosisError(null);
    setSavedCloudId(null);
    setSavedCareLogDone(false);
    setTreatmentScheduled(false);
  };

  const processSelectedFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setDiagnosisError('Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WebP...).');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      await handlePreparedImage(String(reader.result));
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processSelectedFile(file);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleSelectSample = (sample: typeof SAMPLE_DISEASES[0]) => {
    setSelectedImage(sample.url);
    setThumbnailPreview(undefined);
    setFarmerNotes(sample.note);
    setDiagnosisResult(null);
    setDiagnosisError(null);
    setSavedCloudId(null);
    setSavedCareLogDone(false);
  };

  const handleSaveToCloud = async (resultToSave: DiagnosisViewResult) => {
    if (!user) return;
    setIsSavingCloud(true);
    setCloudError(null);
    try {
      const id = await saveDiagnosisToFirestore(user, {
        ...resultToSave,
        plantId: linkedPlantId || undefined,
        farmerNotes: farmerNotes || undefined,
        thumbnailDataUrl: thumbnailPreview,
      });
      setSavedCloudId(id);
    } catch (err) {
      console.error('Error saving diagnosis to Firestore:', err);
      setCloudError('Không thể lưu kết quả lên Firebase Firestore. Vui lòng thử lại.');
    } finally {
      setIsSavingCloud(false);
    }
  };

  const runDiagnosis = async () => {
    if (!selectedImage) return;

    setIsDiagnosing(true);
    setDiagnosisError(null);
    setSavedCloudId(null);
    setSavedCareLogDone(false);

    const linkedPlant = plants.find(p => p.id === linkedPlantId);

    try {
      let base64Data = selectedImage;
      let thumbForCloud = thumbnailPreview;

      if (selectedImage.startsWith('http')) {
        const res = await fetch(selectedImage);
        if (!res.ok) throw new Error('Không thể tải ảnh mẫu để phân tích.');
        const blob = await res.blob();
        const rawUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error('Lỗi đọc dữ liệu ảnh'));
          reader.readAsDataURL(blob);
        });
        base64Data = await compressImageDataUrl(rawUrl, 1200, 0.85);
        const compact = await compressImageDataUrl(rawUrl, 240, 0.65);
        if (compact.length <= 145000) {
          thumbForCloud = compact;
          setThumbnailPreview(compact);
        }
      }

      if (isOffline) {
        const offlineFallback: DiagnosisViewResult = {
          plantName: linkedPlant?.name || 'Cà Chua / Cây Trồng Vườn',
          diseaseName: 'Nghi ngờ Bệnh Đốm Lá Nấm & Cháy Mép Lá (Phân tích ngoại tuyến)',
          pathogenType: 'Nấm',
          severity: 'Trung bình',
          confidence: 78,
          isHealthy: false,
          urgencyLevel: 'Theo dõi',
          symptoms: [
            'Vết đốm nâu hoặc vàng úa xuất hiện trên phiến lá trưởng thành',
            'Mép lá có dấu hiệu khô giòn, lan nhanh khi ẩm độ cao',
          ],
          causes: 'Chế độ ngoại tuyến đang bật — phân tích sơ bộ dựa trên dữ liệu bệnh phổ biến khi ẩm độ cao hoặc đất thoát nước kém.',
          treatmentSteps: [
            {
              stepNumber: 1,
              title: 'Cắt tỉa & cách ly lá bệnh',
              detail: 'Dùng kéo đã sát khuẩn cồn cắt bỏ lá đốm nặng để ngăn bào tử phát tán.',
              timing: 'Ngay hôm nay',
            },
            {
              stepNumber: 2,
              title: 'Phun chế phẩm sinh học',
              detail: 'Phun nấm đối kháng Trichoderma hoặc dầu Neem ép lạnh (5ml/1 lít nước) vào chiều mát.',
              timing: 'Ngày 1 & Ngày 5',
            },
            {
              stepNumber: 3,
              title: 'Điều chỉnh tưới & kiểm tra lại',
              detail: 'Chỉ tưới vào gốc buổi sáng, tránh ướt tán lá qua đêm rồi kết nối mạng để AI kiểm tra lại.',
              timing: 'Trong 5 ngày tới',
            },
          ],
          organicTreatment: [
            'Cắt bỏ lá bệnh phía dưới và tiêu hủy xa khu vực trồng.',
            'Phun Trichoderma hoặc dung dịch dầu Neem sinh học vào chiều mát.',
          ],
          chemicalTreatment: [
            'Nếu bệnh lan rộng >30% tán lá: Cân nhắc Mancozeb hoặc Azoxystrobin đúng liều khuyến cáo.',
          ],
          prevention: [
            'Không tưới phun lên lá vào chiều tối, giữ tán cây thông thoáng.',
            'Kết nối lại Internet để chạy chẩn đoán thị giác AI chính xác hơn.',
          ],
          followUpDays: 5,
        };
        setDiagnosisResult(offlineFallback);
        return;
      }

      const response = await fetch('/api/gemini/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          notes: farmerNotes,
          plantContext: linkedPlant
            ? {
                name: linkedPlant.name,
                scientificName: linkedPlant.scientificName,
                soilMoisturePercent: linkedPlant.soilMoisturePercent,
              }
            : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Máy chủ AI không thể xử lý ảnh lúc này.');
      }

      if (!data.result) {
        throw new Error('Dữ liệu chẩn đoán trả về không đầy đủ.');
      }

      const parsedResult: DiagnosisViewResult = {
        plantName: data.result.plantName || linkedPlant?.name || 'Cây trồng',
        diseaseName: data.result.diseaseName || 'Cần theo dõi thêm',
        pathogenType: data.result.pathogenType || 'Nấm',
        severity: data.result.severity || 'Trung bình',
        confidence: Number(data.result.confidence) || 88,
        isHealthy: Boolean(data.result.isHealthy),
        urgencyLevel: data.result.urgencyLevel,
        symptoms: Array.isArray(data.result.symptoms) ? data.result.symptoms : [],
        causes: data.result.causes || '',
        treatmentSteps: Array.isArray(data.result.treatmentSteps)
          ? data.result.treatmentSteps
          : undefined,
        organicTreatment: Array.isArray(data.result.organicTreatment)
          ? data.result.organicTreatment
          : [],
        chemicalTreatment: Array.isArray(data.result.chemicalTreatment)
          ? data.result.chemicalTreatment
          : [],
        prevention: Array.isArray(data.result.prevention) ? data.result.prevention : [],
        followUpDays: Number(data.result.followUpDays) || 5,
      };

      setDiagnosisResult(parsedResult);

      // Auto-sync to Firebase Firestore if user is authenticated
      if (user) {
        setIsSavingCloud(true);
        try {
          const id = await saveDiagnosisToFirestore(user, {
            ...parsedResult,
            plantId: linkedPlantId || undefined,
            farmerNotes: farmerNotes || undefined,
            thumbnailDataUrl: thumbForCloud,
          });
          setSavedCloudId(id);
        } catch (cloudErr) {
          console.warn('Auto-save to Firestore failed:', cloudErr);
          setCloudError('Chẩn đoán thành công nhưng không thể tự động lưu vào Firebase.');
        } finally {
          setIsSavingCloud(false);
        }
      }
    } catch (err: any) {
      setDiagnosisError(
        err?.message || 'Không thể phân tích ảnh lúc này. Vui lòng thử lại với ảnh rõ nét hơn.'
      );
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleSaveTreatmentToGardenLog = () => {
    if (!linkedPlantId || !diagnosisResult) return;
    const summarySteps =
      diagnosisResult.treatmentSteps && diagnosisResult.treatmentSteps.length > 0
        ? diagnosisResult.treatmentSteps.map(s => `${s.title} (${s.timing})`).join(' -> ')
        : diagnosisResult.organicTreatment.slice(0, 2).join('; ');

    addCareLog(linkedPlantId, {
      date: new Date().toISOString(),
      type: 'pest_control',
      notes: `[AI Chẩn đoán: ${diagnosisResult.diseaseName}] ${summarySteps}`,
    });
    setSavedCareLogDone(true);
  };

  const handleScheduleFollowUpTreatment = async () => {
    if (!diagnosisResult || treatmentScheduled) return;
    const payload = {
      plantName: diagnosisResult.plantName || 'Cây cần điều trị',
      plantCategory: 'indoor',
      location: 'Khu vực cách ly / Vườn chính',
      sunlight: 'partial_sun',
      wateringFrequencyDays: 2,
      fertilizingFrequencyDays: 14,
      pruningFrequencyDays: 14,
      pestCheckFrequencyDays: Math.max(2, Math.min(14, Number(diagnosisResult.followUpDays) || 3)),
      recommendedWaterAmount: 'Tưới gốc buổi sáng, tránh làm ướt lá',
      recommendedFertilizer: 'Bổ sung Trichoderma & vi sinh phục hồi rễ',
      pruningInstructions: diagnosisResult.organicTreatment?.[0] || 'Tỉa lá bệnh và cách ly',
      specialCareNotes: `[Theo dõi bệnh: ${diagnosisResult.diseaseName}] ${diagnosisResult.causes || ''}`.slice(0, 280),
      notificationEnabled: true,
      notificationTime: '07:00',
    };
    try {
      const res = await fetch('/api/care-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'current_farmer' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('fallback');
    } catch {
      try {
        const existing = JSON.parse(localStorage.getItem('nongtro_care_plans') || '[]');
        localStorage.setItem(
          'nongtro_care_plans',
          JSON.stringify([{ ...payload, id: Date.now(), userId: 'current_farmer', isActive: true }, ...existing])
        );
      } catch {}
    }
    setTreatmentScheduled(true);
  };

  const handleCycleCloudStatus = async (item: SavedDiseaseDiagnosis) => {
    if (item.status === 'resolved') return;
    const nextStatus = item.status === 'active' ? 'treating' : 'resolved';
    try {
      await updateDiagnosisStatusInFirestore(item.id, nextStatus, item.farmerNotes);
    } catch {
      setCloudError('Không thể cập nhật trạng thái điều trị trên Firebase.');
    }
  };

  const handleDeleteCloudRecord = async (id: string) => {
    try {
      await deleteDiagnosisFromFirestore(id);
      setConfirmDeleteId(null);
      if (savedCloudId === id) {
        setSavedCloudId(null);
      }
    } catch {
      setCloudError('Không thể xóa hồ sơ trên Firebase.');
    }
  };

  const loadHistoryRecordIntoView = (record: SavedDiseaseDiagnosis) => {
    if (record.thumbnailDataUrl) {
      setSelectedImage(record.thumbnailDataUrl);
    }
    setFarmerNotes(record.farmerNotes || '');
    setLinkedPlantId(record.plantId || '');
    setDiagnosisResult(record);
    setSavedCloudId(record.id);
    setDiagnosisError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-xs font-bold mb-1">
          <Stethoscope className="w-3.5 h-3.5" />
          <span>{t('diagnosisBadge')}</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
          {t('diagnosisTitle')}
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto">
          {t('diagnosisSubtitle')}
        </p>
      </div>

      {/* Offline Info Strip */}
      {isOffline && (
        <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-4 py-3 flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200">
          <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            {t('diagnosisOfflineNote')}
          </span>
        </div>
      )}

      {/* Upload & Camera Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 sm:p-7 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {!selectedImage ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-7 sm:p-10 text-center space-y-4 transition-colors ${
              isDragging
                ? 'border-rose-500 bg-rose-100/60 dark:bg-rose-950/40'
                : 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10'
            }`}
          >
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-300">
              <Camera className="w-8 h-8" />
            </div>
            <div>
              <p className="font-extrabold text-sm sm:text-base text-zinc-800 dark:text-zinc-200">
                {isDragging
                  ? t('diagnosisDropActive')
                  : t('diagnosisDropPrompt')}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                {t('diagnosisDropHint')}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={openLiveCamera}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Camera className="w-4 h-4" />
                <span>{t('takePhoto')}</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Upload className="w-4 h-4 text-rose-600" />
                <span>{t('uploadPhoto')}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden max-h-80 w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
              <img
                src={selectedImage}
                alt={t('diagnosisResult')}
                referrerPolicy="no-referrer"
                className="w-full h-80 object-cover"
              />
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={openLiveCamera}
                  className="px-3 py-1.5 rounded-xl bg-black/70 text-white text-xs font-bold backdrop-blur-xs hover:bg-black/90 cursor-pointer flex items-center gap-1"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{t('identifyRetake')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImage(null);
                    setThumbnailPreview(undefined);
                    setDiagnosisResult(null);
                    setDiagnosisError(null);
                    setSavedCloudId(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-black/70 text-white text-xs font-bold backdrop-blur-xs hover:bg-black/90 cursor-pointer"
                >
                  {t('identifyChooseOther')}
                </button>
              </div>
            </div>

            {/* Optional Garden Plant Link & Farmer Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  {t('diagnosisLinkPlantLabel')}
                </label>
                <select
                  value={linkedPlantId}
                  onChange={e => setLinkedPlantId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-800 dark:text-zinc-200"
                >
                  <option value="">{t('diagnosisAutoDetectOption')}</option>
                  {plants.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.soilMoisturePercent ?? 50}%)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  {t('diagnosisNotesLabel')}
                </label>
                <input
                  type="text"
                  placeholder={t('diagnosisNotesPlaceholder')}
                  value={farmerNotes}
                  onChange={e => setFarmerNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-800 dark:text-zinc-200"
                />
              </div>
            </div>

            {diagnosisError && (
              <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 px-4 py-3 flex items-center justify-between gap-3 text-xs text-rose-800 dark:text-rose-200">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{diagnosisError}</span>
                </div>
                <button
                  type="button"
                  onClick={runDiagnosis}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold shrink-0 cursor-pointer"
                >
                  {t('identifyRetry')}
                </button>
              </div>
            )}

            <div className="flex justify-center">
              <button
                type="button"
                onClick={runDiagnosis}
                disabled={isDiagnosing}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-rose-600 text-white font-extrabold text-sm shadow-sm hover:bg-rose-700 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDiagnosing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t('diagnosisRunningBtn')}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{t('diagnosisRunBtn')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Samples */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <p className="text-xs font-bold text-zinc-500 mb-2 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{t('diagnosisSamplesLabel')}</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {SAMPLE_DISEASES.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSample(sample)}
                className="flex items-center gap-2.5 p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-rose-400 text-left transition-colors cursor-pointer group"
              >
                {!failedImages[`sample-${idx}`] ? (
                  <img
                    src={sample.url}
                    alt={sample.title}
                    referrerPolicy="no-referrer"
                    onError={() => setFailedImages(prev => ({ ...prev, [`sample-${idx}`]: true }))}
                    className="w-12 h-12 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <Leaf className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-rose-600">
                    {sample.title}
                  </div>
                  <div className="text-[10px] text-zinc-400">{sample.crop}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Diagnosis Output Card */}
      {diagnosisResult && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 sm:p-7 border border-zinc-200 dark:border-zinc-800 shadow-lg space-y-5">
          {/* Header of Result */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase ${
                    diagnosisResult.isHealthy
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}
                >
                  {diagnosisResult.pathogenType}
                </span>

                <span
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                    diagnosisResult.severity === 'Nghiêm trọng'
                      ? 'bg-rose-600 text-white'
                      : diagnosisResult.severity === 'Trung bình'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}
                >
                  Mức độ: {diagnosisResult.severity}
                </span>

                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Độ tin cậy:{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                    {diagnosisResult.confidence}%
                  </strong>
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-extrabold text-zinc-900 dark:text-zinc-100 pt-1">
                {diagnosisResult.diseaseName}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Cây trồng nhận diện: <strong className="text-zinc-700 dark:text-zinc-200">{diagnosisResult.plantName}</strong>
                {diagnosisResult.followUpDays ? ` · Kiểm tra lại sau ${diagnosisResult.followUpDays} ngày` : ''}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {user && !savedCloudId && (
                <button
                  type="button"
                  disabled={isSavingCloud}
                  onClick={() => handleSaveToCloud(diagnosisResult)}
                  className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {isSavingCloud ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Cloud className="w-3.5 h-3.5" />}
                  <span>Lưu Đám Mây</span>
                </button>
              )}

              {savedCloudId && (
                <span className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Đã lưu Firebase</span>
                </span>
              )}

              {linkedPlantId && (
                <button
                  type="button"
                  disabled={savedCareLogDone}
                  onClick={handleSaveTreatmentToGardenLog}
                  className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer ${
                    savedCareLogDone
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {savedCareLogDone ? <Check className="w-3.5 h-3.5" /> : <BookmarkCheck className="w-3.5 h-3.5" />}
                  <span>{savedCareLogDone ? 'Đã ghi nhật ký vườn' : 'Lưu vào Nhật Ký Cây'}</span>
                </button>
              )}

              {!diagnosisResult.isHealthy && (
                <button
                  type="button"
                  disabled={treatmentScheduled}
                  onClick={handleScheduleFollowUpTreatment}
                  className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer ${
                    treatmentScheduled
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-amber-600 text-white hover:bg-amber-700'
                  }`}
                >
                  <CalendarClock className="w-3.5 h-3.5" />
                  <span>{treatmentScheduled ? 'Đã lên lịch trị bệnh' : 'Lên Lịch Theo Dõi Trị Bệnh'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  onGoToChatbot(
                    `Cây ${diagnosisResult.plantName} của tôi bị ${diagnosisResult.diseaseName}. Xin bác sĩ tư vấn chi tiết cách chữa trị an toàn tại nhà!`
                  )
                }
                className="px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-700 cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Hỏi Bác Sĩ AI</span>
              </button>

              <button
                type="button"
                onClick={onGoToLibrary}
                className="px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs flex items-center gap-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Tra Thư Viện</span>
              </button>
            </div>
          </div>

          {/* Structured Step-by-Step Treatment Roadmap */}
          {diagnosisResult.treatmentSteps && diagnosisResult.treatmentSteps.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Lộ Trình Điều Trị Từng Bước Đề Xuất</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {diagnosisResult.treatmentSteps.map((step: TreatmentStep, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/70 space-y-2 flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs font-extrabold flex items-center justify-center">
                          {step.stepNumber || idx + 1}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                          {step.timing}
                        </span>
                      </div>
                      <h5 className="font-extrabold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">
                        {step.title}
                      </h5>
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                        {step.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Symptoms & Causes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-2">
              <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Triệu Chứng Lâm Sàng Nhận Diện</span>
              </h4>
              <ul className="space-y-1">
                {diagnosisResult.symptoms?.map((s: string, idx: number) => (
                  <li key={idx} className="text-xs text-zinc-600 dark:text-zinc-300 flex items-start gap-1.5">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-2">
              <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-500" />
                <span>Nguyên Nhân Phát Sinh Dịch Hại</span>
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                {diagnosisResult.causes}
              </p>
            </div>
          </div>

          {/* Organic Solution */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 space-y-2">
            <div className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-emerald-600" />
              <h4 className="font-extrabold text-sm text-emerald-950 dark:text-emerald-200">
                1. Phác Đồ Xử Lý Sinh Học & Hữu Cơ (Ưu Tiên Khuyên Dùng)
              </h4>
            </div>
            <ul className="space-y-1.5 pl-1">
              {diagnosisResult.organicTreatment?.map((step: string, idx: number) => (
                <li key={idx} className="text-xs text-emerald-900 dark:text-emerald-100 flex items-start gap-2">
                  <span className="font-bold text-emerald-600">✓</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Chemical Solution */}
          {diagnosisResult.chemicalTreatment?.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-2">
              <h4 className="font-bold text-xs text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>2. Thuốc Bảo Vệ Thực Vật An Toàn (Chỉ dùng khi bệnh lây lan nặng)</span>
              </h4>
              <ul className="space-y-1 pl-1">
                {diagnosisResult.chemicalTreatment.map((med: string, idx: number) => (
                  <li key={idx} className="text-xs text-amber-900 dark:text-amber-100 flex items-start gap-2">
                    <span className="font-bold text-amber-600">!</span>
                    <span>{med}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Prevention */}
          {diagnosisResult.prevention?.length > 0 && (
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-2">
              <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Biện Pháp Phòng Ngừa Tái Nhiễm Về Sau:
              </h4>
              <ul className="space-y-1">
                {diagnosisResult.prevention.map((prev: string, idx: number) => (
                  <li key={idx} className="text-xs text-zinc-600 dark:text-zinc-300 flex items-start gap-2">
                    <span className="text-zinc-400 font-bold">•</span>
                    <span>{prev}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Firebase Cloud Diagnosis History */}
      <section className="bg-white dark:bg-zinc-900 rounded-3xl p-5 sm:p-6 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Cloud className="w-5 h-5 text-sky-600" />
              <span>Hồ Sơ Chẩn Đoán Bệnh Đám Mây (Firebase)</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Theo dõi quá trình điều trị và lịch sử phát hiện bệnh qua các lần quét ảnh trên mọi thiết bị
            </p>
          </div>
          {user && (
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
              {cloudHistory.length} hồ sơ đã lưu
            </span>
          )}
        </div>

        {cloudError && (
          <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 px-3.5 py-2.5 text-xs text-rose-800 dark:text-rose-200 font-semibold">
            {cloudError}
          </div>
        )}

        {!user ? (
          <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="text-xs sm:text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                Đăng nhập Google để lưu & theo dõi phác đồ điều trị trên Firebase
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Mỗi lần quét bệnh sẽ tự động sao lưu kèm ảnh thu nhỏ, mức độ nặng và tiến độ hồi phục của cây.
              </p>
            </div>
            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={isSigningIn}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shrink-0 disabled:opacity-60"
            >
              {isSigningIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              <span>Đăng nhập Google</span>
            </button>
          </div>
        ) : cloudHistory.length === 0 ? (
          <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 p-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
            Chưa có hồ sơ bệnh nào được lưu trên Firebase. Hãy chụp hoặc tải ảnh cây trồng ở trên để bắt đầu chẩn đoán!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cloudHistory.map(item => (
              <div
                key={item.id}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 p-3.5 flex gap-3 justify-between"
              >
                <div
                  onClick={() => loadHistoryRecordIntoView(item)}
                  className="flex gap-3 min-w-0 flex-1 cursor-pointer"
                >
                  {item.thumbnailDataUrl ? (
                    <img
                      src={item.thumbnailDataUrl}
                      alt={item.diseaseName}
                      className="w-16 h-16 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                      <Sprout className="w-6 h-6" />
                    </div>
                  )}

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : item.status === 'treating'
                            ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {item.status === 'resolved'
                          ? 'Đã khỏi'
                          : item.status === 'treating'
                          ? 'Đang điều trị'
                          : 'Mới phát hiện'}
                      </span>
                      <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.createdAtMs).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    <div className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                      {item.diseaseName}
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                      {item.plantName} · {item.severity} ({item.confidence}%)
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between gap-1 shrink-0">
                  {item.status !== 'resolved' && (
                    <button
                      type="button"
                      onClick={() => handleCycleCloudStatus(item)}
                      className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold cursor-pointer"
                    >
                      {item.status === 'active' ? 'Bắt đầu trị' : 'Đã khỏi'}
                    </button>
                  )}

                  {confirmDeleteId === item.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDeleteCloudRecord(item.id)}
                        className="px-2 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-bold cursor-pointer"
                      >
                        Xóa
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-1.5 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-[10px] font-bold cursor-pointer"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(item.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 cursor-pointer"
                      title="Xóa hồ sơ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* LIVE CAMERA CAPTURE MODAL */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2 font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                <Camera className="w-4 h-4 text-rose-600" />
                <span>Chụp Ảnh Bệnh Cây Trực Tiếp</span>
              </div>
              <div className="flex items-center gap-1">
                {!cameraError && (
                  <button
                    type="button"
                    onClick={handleFlipCamera}
                    className="p-1.5 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                    title="Đổi camera trước/sau"
                  >
                    <SwitchCamera className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeLiveCamera}
                  className="p-1.5 rounded-xl text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {cameraError ? (
                <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-5 text-center space-y-3 text-xs text-rose-800 dark:text-rose-200">
                  <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
                  <p className="font-semibold">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      closeLiveCamera();
                      fileInputRef.current?.click();
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold cursor-pointer"
                  >
                    Chọn Ảnh Từ Thiết Bị
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3]">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={closeLiveCamera}
                      className="px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold cursor-pointer"
                    >
                      Đóng
                    </button>
                    <button
                      type="button"
                      onClick={captureFromCamera}
                      className="flex-1 py-2.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Aperture className="w-4 h-4" />
                      <span>Chụp Ảnh Ngay</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
