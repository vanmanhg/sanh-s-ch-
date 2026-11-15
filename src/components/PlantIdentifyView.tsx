import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  Droplets,
  Sun,
  ShieldAlert,
  RefreshCw,
  Plus,
  HelpCircle,
  AlertTriangle,
  Thermometer,
  Sprout,
  CalendarClock,
  X,
  Aperture,
  SwitchCamera
} from 'lucide-react';

interface PlantIdentifyViewProps {
  onAddedToGarden: () => void;
}

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

export const PlantIdentifyView: React.FC<PlantIdentifyViewProps> = ({ onAddedToGarden }) => {
  const { addPlant, isOffline, t } = useApp();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [identifyResult, setIdentifyResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successAdded, setSuccessAdded] = useState<boolean>(false);
  const [scheduleCreated, setScheduleCreated] = useState<boolean>(false);
  const [isCreatingSchedule, setIsCreatingSchedule] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Live Camera Modal state
  const [showCameraModal, setShowCameraModal] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const SAMPLE_PLANTS = [
    {
      name: 'Cây Sầu Riêng Ri6',
      url: 'https://images.unsplash.com/photo-1546548970-71785318a17b?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Cây Trầu Bà Lỗ (Monstera)',
      url: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Cây Cà Chua Bi F1',
      url: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Cây Ớt Cay Hiểm',
      url: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=600&q=80'
    }
  ];

  const stopCameraStream = (stream?: MediaStream | null) => {
    const target = stream ?? cameraStream;
    if (target) {
      target.getTracks().forEach(track => track.stop());
    }
    setCameraStream(null);
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

  const startCameraStream = async (facing: 'environment' | 'user') => {
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
        audio: false
      });
      setCameraStream(stream);
    } catch {
      setCameraError(
        'Không thể mở camera (chưa cấp quyền hoặc không tìm thấy camera). Vui lòng dùng nút Chọn Ảnh Từ Thư Viện.'
      );
    }
  };

  const openLiveCamera = async () => {
    setShowCameraModal(true);
    await startCameraStream(cameraFacing);
  };

  const handleFlipCamera = async () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    await startCameraStream(nextFacing);
  };

  const closeLiveCamera = () => {
    stopCameraStream();
    setShowCameraModal(false);
    setCameraError(null);
  };

  const handlePreparedImage = async (rawDataUrl: string) => {
    const compressed = await compressImageDataUrl(rawDataUrl, 1200, 0.85);
    setSelectedImage(compressed);
    setIdentifyResult(null);
    setErrorMsg(null);
    setSuccessAdded(false);
    setScheduleCreated(false);
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

  const processSelectedFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WebP...).');
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

  const handleSelectSample = (url: string) => {
    setSelectedImage(url);
    setIdentifyResult(null);
    setErrorMsg(null);
    setSuccessAdded(false);
    setScheduleCreated(false);
  };

  const runIdentification = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setErrorMsg(null);

    try {
      if (isOffline) {
        setIdentifyResult({
          name: 'Cây Cà Chua Bi F1 Cherry (Ngoại tuyến)',
          scientificName: 'Solanum lycopersicum var. cerasiforme',
          family: 'Họ Cà (Solanaceae)',
          description:
            'Đang ở chế độ ngoại tuyến — hiển thị hồ sơ hướng dẫn mẫu. Hãy kết nối Internet để AI phân tích chính xác ảnh vừa chụp.',
          lightRequirement: 'Ưa nắng trực tiếp từ 6 đến 8 tiếng mỗi ngày để ra hoa sai trái.',
          waterRequirement: 'Tưới đều đặn 1 lần/ngày vào sáng sớm khi đất mặt se khô.',
          wateringFrequencyDays: 1,
          soilType: 'Đất thịt nhẹ tơi xốp, giàu mùn hữu cơ, trộn 30% phân trùn quế.',
          temperature: '22°C - 32°C',
          humidity: '65% - 75%',
          fertilizerSchedule: 'Bón phân hữu cơ vi sinh 10 ngày/lần, bổ sung Canxi Bo khi trổ hoa.',
          careLevel: 'Dễ',
          toxicity: 'Lá và thân xanh có chứa solanine nhẹ, quả chín an toàn tuyệt đối.',
          quickTips: [
            'Tỉa bỏ chồi nách phụ phía dưới để cây tập trung nuôi thân chính và nuôi chùm quả.',
            'Lót rơm hoặc trấu quanh gốc giữ ẩm và chống đất bẩn bắn lên lá khi tưới.',
            'Khi cây cao trên 40cm, cắm cọc tre hoặc giăng dây đỡ để thân không bị ngã đổ.'
          ]
        });
        return;
      }

      let base64Data = selectedImage;
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
      }

      const response = await fetch('/api/gemini/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data
        })
      });

      const data = await response.json();
      if (!response.ok || !data?.result) {
        throw new Error(data?.error || 'Không thể nhận diện ảnh qua máy chủ AI.');
      }

      setIdentifyResult(data.result);
    } catch (err: any) {
      setErrorMsg(
        err?.message || 'Không thể phân tích hình ảnh lúc này. Vui lòng thử chụp hoặc tải lại ảnh rõ nét hơn.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const inferCategory = (name: string): 'indoor' | 'vegetable' | 'fruit' | 'flower' | 'herb' | 'bonsai' => {
    const lower = name.toLowerCase();
    if (lower.includes('cà chua') || lower.includes('ớt') || lower.includes('rau') || lower.includes('cải')) {
      return 'vegetable';
    }
    if (lower.includes('sầu riêng') || lower.includes('xoài') || lower.includes('bưởi') || lower.includes('cam')) {
      return 'fruit';
    }
    if (lower.includes('hoa') || lower.includes('hồng') || lower.includes('lan')) {
      return 'flower';
    }
    if (lower.includes('bạc hà') || lower.includes('húng') || lower.includes('sả')) {
      return 'herb';
    }
    if (lower.includes('bonsai') || lower.includes('mai')) {
      return 'bonsai';
    }
    return 'indoor';
  };

  const handleAddIdentifiedPlant = () => {
    if (!identifyResult || successAdded) return;

    addPlant({
      name: identifyResult.name || 'Cây Trồng Mới',
      scientificName: identifyResult.scientificName || 'Plantae',
      category: inferCategory(String(identifyResult.name || '')),
      imageUrl:
        selectedImage ||
        'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=600&q=80',
      wateringFrequencyDays: Math.max(1, Number(identifyResult.wateringFrequencyDays) || 2),
      lastWatered: new Date().toISOString(),
      sunlight: identifyResult.lightRequirement?.toLowerCase().includes('trực tiếp') ? 'full_sun' : 'partial_sun',
      soilType: identifyResult.soilType || 'Đất dinh dưỡng hữu cơ',
      difficulty:
        identifyResult.careLevel === 'Khó'
          ? 'hard'
          : identifyResult.careLevel === 'Trung bình'
          ? 'medium'
          : 'easy',
      healthScore: 95,
      soilMoisturePercent: 65,
      minMoistureThreshold: 45,
      maxMoistureThreshold: 78,
      location: 'Vườn chính',
      notes: identifyResult.description || 'Được nhận diện bằng AI.'
    });

    setSuccessAdded(true);
    setTimeout(() => {
      onAddedToGarden();
    }, 1100);
  };

  const handleCreatePeriodicSchedule = async () => {
    if (!identifyResult || isCreatingSchedule || scheduleCreated) return;
    setIsCreatingSchedule(true);

    const payload = {
      plantName: identifyResult.name || 'Cây Trồng Mới',
      scientificName: identifyResult.scientificName || '',
      plantCategory: inferCategory(String(identifyResult.name || '')),
      location: 'Vườn chính',
      sunlight: identifyResult.lightRequirement?.toLowerCase().includes('trực tiếp') ? 'full_sun' : 'partial_sun',
      environmentNotes: identifyResult.soilType || '',
      temperatureRange: identifyResult.temperature || '22°C - 32°C',
      humidityLevel: identifyResult.humidity || '60% - 80%',
      wateringFrequencyDays: Math.max(1, Number(identifyResult.wateringFrequencyDays) || 2),
      fertilizingFrequencyDays: 14,
      pruningFrequencyDays: 30,
      pestCheckFrequencyDays: 7,
      recommendedWaterAmount: identifyResult.waterRequirement || '500ml tưới đẫm gốc',
      recommendedFertilizer: identifyResult.fertilizerSchedule || 'Phân hữu cơ trùn quế',
      pruningInstructions: 'Cắt tỉa lá già vàng và tạo tán thông thoáng',
      specialCareNotes: (identifyResult.quickTips || [])[0] || identifyResult.description || '',
      notificationEnabled: true,
      notificationTime: '07:00'
    };

    try {
      const res = await fetch('/api/care-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'current_farmer'
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Cloud SQL fallback');
    } catch {
      try {
        const existing = JSON.parse(localStorage.getItem('nongtro_care_plans') || '[]');
        const nextPlan = { ...payload, id: Date.now(), userId: 'current_farmer', isActive: true };
        localStorage.setItem('nongtro_care_plans', JSON.stringify([nextPlan, ...existing]));
      } catch {}
    } finally {
      setIsCreatingSchedule(false);
      setScheduleCreated(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Title & Introduction */}
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t('identifyBadge')}</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
          {t('identifyTitle')}
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto">
          {t('identifySubtitle')}
        </p>
      </div>

      {/* Upload & Camera Box */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 sm:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-5">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {!selectedImage ? (
          <div
            onDragOver={e => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={e => {
              e.preventDefault();
              setIsDragging(false);
            }}
            onDrop={e => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) processSelectedFile(file);
            }}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-colors space-y-4 ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                : 'border-emerald-300 dark:border-emerald-800/60 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20'
            }`}
          >
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
              <Camera className="w-8 h-8" />
            </div>
            <div>
              <p className="font-extrabold text-sm sm:text-base text-zinc-800 dark:text-zinc-200">
                {isDragging ? t('identifyDropActive') : t('identifyDropPrompt')}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                {t('identifySupportedFormats')}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={openLiveCamera}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Camera className="w-4 h-4" />
                <span>{t('identifyOpenCamera')}</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>{t('identifyChooseGallery')}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden max-h-80 w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
              <img
                src={selectedImage}
                alt={t('identifyResult')}
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
                    setIdentifyResult(null);
                    setErrorMsg(null);
                    setSuccessAdded(false);
                    setScheduleCreated(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-black/70 text-white text-xs font-bold backdrop-blur-xs hover:bg-black/90 cursor-pointer"
                >
                  {t('identifyChooseOther')}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 px-4 py-3 flex items-center justify-between gap-3 text-xs text-rose-800 dark:text-rose-200">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={runIdentification}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold shrink-0 cursor-pointer"
                >
                  {t('identifyRetry')}
                </button>
              </div>
            )}

            <div className="flex justify-center">
              <button
                type="button"
                onClick={runIdentification}
                disabled={isAnalyzing}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-emerald-600 text-white font-extrabold text-sm shadow-md hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t('analyzingAI')}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{t('identifyRunBtn')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Quick Sample Presets */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <p className="text-xs font-bold text-zinc-500 mb-2 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{t('identifySamplesLabel')}</span>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SAMPLE_PLANTS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSample(sample.url)}
                className="flex items-center gap-2 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-emerald-500 text-left transition-colors cursor-pointer group"
              >
                <img
                  src={sample.url}
                  alt={sample.name}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-emerald-600 line-clamp-1">
                  {sample.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Identification Result Box */}
      {identifyResult && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 sm:p-7 border border-emerald-200 dark:border-emerald-900/60 shadow-lg space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-extrabold text-zinc-900 dark:text-zinc-100">
                  {identifyResult.name}
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold">
                  {identifyResult.careLevel || 'Dễ trồng'}
                </span>
              </div>
              <p className="text-xs sm:text-sm italic text-zinc-500">
                {identifyResult.scientificName} · {identifyResult.family}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCreatePeriodicSchedule}
                disabled={isCreatingSchedule || scheduleCreated}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-colors cursor-pointer ${
                  scheduleCreated
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                    : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                }`}
              >
                <CalendarClock className="w-4 h-4 text-emerald-600" />
                <span>{scheduleCreated ? t('identifyScheduleDone') : t('identifyCreateSchedule')}</span>
              </button>

              <button
                type="button"
                onClick={handleAddIdentifiedPlant}
                disabled={successAdded}
                className={`px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer ${
                  successAdded
                    ? 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {successAdded ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Đã Thêm Vào Vườn!</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>{t('addToGarden')}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
            {identifyResult.description}
          </p>

          {/* Key Care Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-800 dark:text-sky-300">
                <Droplets className="w-4 h-4 text-sky-500" />
                <span>Nhu Cầu Nước & Lịch Tưới</span>
              </div>
              <p className="text-xs text-sky-900 dark:text-sky-200">
                {identifyResult.waterRequirement} (Tưới {identifyResult.wateringFrequencyDays || 2} ngày/lần)
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Ánh Sáng & Nhiệt Độ</span>
              </div>
              <p className="text-xs text-amber-900 dark:text-amber-200">
                {identifyResult.lightRequirement}
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-300 flex items-center gap-1">
                <Thermometer className="w-3 h-3" />
                <span>{identifyResult.temperature || '22°C - 32°C'} · Ẩm {identifyResult.humidity || '60% - 80%'}</span>
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <Sprout className="w-4 h-4 text-emerald-600" />
                <span>Bón Phân Định Kỳ</span>
              </div>
              <p className="text-xs text-emerald-900 dark:text-emerald-200">
                {identifyResult.fertilizerSchedule || 'Bón phân hữu cơ trùn quế định kỳ 14 ngày/lần'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                <ShieldAlert className="w-4 h-4 text-emerald-600" />
                <span>Đất Trồng & Độ An Toàn</span>
              </div>
              <p className="text-xs text-zinc-700 dark:text-zinc-300">
                {identifyResult.soilType} · {identifyResult.toxicity}
              </p>
            </div>
          </div>

          {/* Quick Tips */}
          {identifyResult.quickTips && identifyResult.quickTips.length > 0 && (
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-2">
              <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Hướng Dẫn Chăm Sóc Cơ Bản Từ Kỹ Sư Nông Nghiệp:
              </h4>
              <ul className="space-y-1.5">
                {identifyResult.quickTips.map((tip: string, idx: number) => (
                  <li key={idx} className="text-xs text-zinc-600 dark:text-zinc-300 flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* LIVE CAMERA MODAL */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2 font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                <Camera className="w-4 h-4 text-emerald-600" />
                <span>Chụp Ảnh Nhận Diện Cây Trồng</span>
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
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold cursor-pointer"
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
                      className="flex-1 py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer"
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
