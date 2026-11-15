import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { DiseaseEncyclopediaItem, VideoGuideItem } from '../types';
import {
  getCachedDiseases,
  getCachedVideos,
  matchOfflineSymptoms
} from '../utils/offlineCache';
import {
  BookOpen,
  Video,
  Search,
  CheckCircle2,
  AlertTriangle,
  Play,
  Leaf,
  Layers,
  ShieldCheck,
  ChevronRight,
  X,
  HardDriveDownload,
  Wifi,
  WifiOff,
  Bookmark,
  RefreshCw,
  Sparkles,
  Filter,
  Check,
  Share2
} from 'lucide-react';

interface LibraryGuidesViewProps {
  onGoToDiagnosis: () => void;
}

export const LibraryGuidesView: React.FC<LibraryGuidesViewProps> = ({ onGoToDiagnosis }) => {
  const {
    isOffline,
    cacheMetadata,
    syncCache,
    bookmarkedDiseases,
    toggleBookmarkDisease
  } = useApp();

  const [activeTab, setActiveTab] = useState<'diseases' | 'videos'>('diseases');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCrop, setSelectedCrop] = useState<string>('all');
  const [selectedPathogen, setSelectedPathogen] = useState<string>('all');
  const [onlyBookmarked, setOnlyBookmarked] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Detail Modal states
  const [selectedDisease, setSelectedDisease] = useState<DiseaseEncyclopediaItem | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoGuideItem | null>(null);

  // Offline Quick Symptom Selector Modal
  const [showSymptomFinder, setShowSymptomFinder] = useState<boolean>(false);
  const [selectedSymptomTags, setSelectedSymptomTags] = useState<string[]>([]);

  // Load from persistent offline cache
  const cachedDiseases = useMemo(() => getCachedDiseases(), [cacheMetadata.lastUpdated]);
  const cachedVideos = useMemo(() => getCachedVideos(), [cacheMetadata.lastUpdated]);

  const COMMON_SYMPTOMS = [
    'Vàng lá gân xanh',
    'Đốm nâu viền vàng',
    'Xì mủ thân rễ',
    'Cháy khô mép lá',
    'Bột trắng nách lá / đọt non',
    'Héo xanh rũ lá',
    'Thối nhũn lá đốm nước',
    'Lá co quắp xoăn lại'
  ];

  const CROPS_LIST = ['all', 'Cà chua', 'Sầu riêng', 'Ớt', 'Dưa leo', 'Phong lan', 'Cây có múi'];
  const PATHOGENS_LIST = ['all', 'Nấm', 'Vi khuẩn', 'Côn trùng', 'Thiếu chất'];

  // Filtered diseases
  const filteredDiseases = useMemo(() => {
    return cachedDiseases.filter(d => {
      // Bookmark filter
      if (onlyBookmarked && !bookmarkedDiseases.includes(d.id)) {
        return false;
      }

      // Crop filter
      if (selectedCrop !== 'all' && !d.cropType.toLowerCase().includes(selectedCrop.toLowerCase())) {
        return false;
      }

      // Pathogen filter
      if (selectedPathogen !== 'all' && d.pathogenType !== selectedPathogen) {
        return false;
      }

      // Symptom finder tags
      if (selectedSymptomTags.length > 0) {
        const matchesAnyTag = selectedSymptomTags.some(tag =>
          d.symptoms.some(s => s.toLowerCase().includes(tag.toLowerCase())) ||
          d.diseaseName.toLowerCase().includes(tag.toLowerCase())
        );
        if (!matchesAnyTag) return false;
      }

      // Text query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inName = d.diseaseName.toLowerCase().includes(q);
        const inCrop = d.cropType.toLowerCase().includes(q);
        const inPathogen = d.pathogenType.toLowerCase().includes(q);
        const inSymptoms = d.symptoms.some(s => s.toLowerCase().includes(q));
        const inOrganic = d.organicSolution.some(s => s.toLowerCase().includes(q));
        if (!inName && !inCrop && !inPathogen && !inSymptoms && !inOrganic) {
          return false;
        }
      }

      return true;
    });
  }, [
    cachedDiseases,
    onlyBookmarked,
    bookmarkedDiseases,
    selectedCrop,
    selectedPathogen,
    selectedSymptomTags,
    searchQuery
  ]);

  const filteredVideos = useMemo(() => {
    return cachedVideos.filter(v =>
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [cachedVideos, searchQuery]);

  const handleSyncCache = () => {
    setIsSyncing(true);
    syncCache();
    setTimeout(() => {
      setIsSyncing(false);
    }, 600);
  };

  const toggleSymptomTag = (tag: string) => {
    setSelectedSymptomTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* OFFLINE CACHE STATUS BANNER */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-zinc-900 rounded-3xl p-4 sm:p-5 text-white shadow-md border border-emerald-700/40 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
              <HardDriveDownload className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm sm:text-base tracking-tight">
                  Bộ Nhớ Đệm Ngoại Tuyến (Offline Storage Cache)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 text-[10px] font-bold border border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Sẵn Sàng Tra Cứu Khi Mất Mạng</span>
                </span>
              </div>
              <p className="text-xs text-zinc-300">
                Toàn bộ bách khoa toàn thư bệnh hại, triệu chứng và phác đồ điều trị đã được lưu cục bộ ({cacheMetadata.cacheSizeKb} KB).
              </p>
            </div>
          </div>

          {/* Sync Button & Connection Status */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <button
              onClick={handleSyncCache}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all cursor-pointer disabled:opacity-50"
              title="Cập nhật và nạp lại toàn bộ dữ liệu vào bộ nhớ đệm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{isSyncing ? 'Đang cập nhật cache...' : 'Đồng Bộ Cache'}</span>
            </button>
          </div>
        </div>

        {/* Quick Cache Info Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10 text-xs text-zinc-300">
          <div>
            <span className="text-[11px] text-zinc-400 block">Dữ liệu bệnh đã đệm:</span>
            <span className="font-bold text-emerald-300">{cacheMetadata.totalDiseases} Bệnh cây</span>
          </div>
          <div>
            <span className="text-[11px] text-zinc-400 block">Kỹ thuật & Video:</span>
            <span className="font-bold text-emerald-300">{cacheMetadata.totalVideos} Hướng dẫn</span>
          </div>
          <div>
            <span className="text-[11px] text-zinc-400 block">Trạng thái kết nối:</span>
            <span className="font-bold flex items-center gap-1 text-amber-300">
              {isOffline ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-rose-300">Chế độ Ngoại Tuyến (Offline)</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Đang có Internet (Online)</span>
                </>
              )}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-zinc-400 block">Lưu ưu tiên (Bookmark):</span>
            <span className="font-bold text-amber-300">{bookmarkedDiseases.length} Bệnh đã ghim</span>
          </div>
        </div>
      </div>

      {/* Header & Sub-tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-emerald-600" />
            <span>Thư Viện Bệnh Cây Trồng & Kỹ Thuật Canh Tác</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500">
            Tra cứu bách khoa toàn thư bệnh hại • Hướng dẫn kỹ thuật thực tế bằng hình ảnh và video
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('diseases')}
            className={`px-3.5 py-1.5 rounded-xl cursor-pointer transition-colors ${
              activeTab === 'diseases'
                ? 'bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400'
            }`}
          >
            Bách Khoa Bệnh ({cachedDiseases.length})
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-3.5 py-1.5 rounded-xl cursor-pointer transition-colors ${
              activeTab === 'videos'
                ? 'bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400'
            }`}
          >
            Video & Kỹ Thuật ({cachedVideos.length})
          </button>
        </div>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={
                activeTab === 'diseases'
                  ? 'Tra nhanh theo tên bệnh, cây trồng hoặc triệu chứng (vàng lá, thán thư, xì mủ...)'
                  : 'Tìm video hướng dẫn kỹ thuật nông nghiệp...'
              }
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {activeTab === 'diseases' && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowSymptomFinder(!showSymptomFinder)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  showSymptomFinder || selectedSymptomTags.length > 0
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Lọc Triệu Chứng Ngoại Tuyến</span>
                {selectedSymptomTags.length > 0 && (
                  <span className="ml-1 w-4 h-4 rounded-full bg-white text-amber-700 text-[10px] flex items-center justify-center font-black">
                    {selectedSymptomTags.length}
                  </span>
                )}
              </button>

              <button
                onClick={onGoToDiagnosis}
                className="px-3.5 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Chẩn Đoán Bằng AI</span>
              </button>
            </div>
          )}
        </div>

        {/* Offline Symptom Selector Drawer */}
        {showSymptomFinder && (
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-amber-950 dark:text-amber-200 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Chọn các triệu chứng quan sát thấy trên cây (Tìm kiếm ngoại tuyến tức thì):</span>
              </span>
              {selectedSymptomTags.length > 0 && (
                <button
                  onClick={() => setSelectedSymptomTags([])}
                  className="text-[11px] text-amber-700 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                >
                  Xóa lọc
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {COMMON_SYMPTOMS.map(s => {
                const active = selectedSymptomTags.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => toggleSymptomTag(s)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                      active
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100'
                    }`}
                  >
                    {active ? '✓ ' : '+ '}
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters: Crop types, Pathogen, Bookmarked only */}
        {activeTab === 'diseases' && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-zinc-400 font-semibold mr-1">Cây trồng:</span>
              {CROPS_LIST.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedCrop(c)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                    selectedCrop === c
                      ? 'bg-emerald-600 text-white font-black'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                  }`}
                >
                  {c === 'all' ? 'Tất cả' : c}
                </button>
              ))}
            </div>

            <button
              onClick={() => setOnlyBookmarked(!onlyBookmarked)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer flex items-center gap-1 transition-colors ${
                onlyBookmarked
                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 font-black'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
              }`}
            >
              <Bookmark className={`w-3 h-3 ${onlyBookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
              <span>Chỉ xem bệnh đã ghim ({bookmarkedDiseases.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: BÁCH KHOA BỆNH HẠI THỰC VẬT (OFFLINE CACHED) */}
      {activeTab === 'diseases' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>
              Hiển thị <strong>{filteredDiseases.length}</strong> kết quả bệnh hại sẵn sàng tra cứu ngoại tuyến
            </span>
            {isOffline && (
              <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                <HardDriveDownload className="w-3.5 h-3.5" />
                <span>Đang chạy hoàn toàn từ bộ nhớ đệm cục bộ</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDiseases.map(dis => {
              const isBookmarked = bookmarkedDiseases.includes(dis.id);
              return (
                <div
                  key={dis.id}
                  onClick={() => setSelectedDisease(dis)}
                  className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-xs hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3.5">
                        <img
                          src={dis.imageUrl}
                          alt={dis.diseaseName}
                          className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-zinc-100 dark:border-zinc-800 group-hover:scale-102 transition-transform"
                        />
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                              {dis.pathogenType}
                            </span>
                            <span className="text-[10px] text-zinc-400">Mức độ: {dis.severity}</span>
                          </div>
                          <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 mt-1 line-clamp-1 group-hover:text-emerald-600 transition-colors">
                            {dis.diseaseName}
                          </h3>
                          <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">
                            Cây thường gặp: {dis.cropType}
                          </p>
                        </div>
                      </div>

                      {/* Bookmark Button */}
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          toggleBookmarkDisease(dis.id);
                        }}
                        className={`p-2 rounded-xl transition-colors cursor-pointer ${
                          isBookmarked
                            ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                            : 'text-zinc-400 hover:text-amber-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                        title={isBookmarked ? 'Bỏ ghim bệnh' : 'Ghim bệnh để tra cứu ưu tiên ngoại tuyến'}
                      >
                        <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : ''}`} />
                      </button>
                    </div>

                    <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
                      <div className="font-bold text-zinc-800 dark:text-zinc-200">Dấu hiệu nhận biết:</div>
                      <ul className="space-y-0.5 pl-1">
                        {dis.symptoms.slice(0, 2).map((s, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                            <span className="text-rose-500 font-bold">•</span>
                            <span className="line-clamp-1">{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                    <span className="text-emerald-600 font-bold flex items-center gap-1 text-[11px]">
                      <Leaf className="w-3.5 h-3.5" /> Phác đồ sinh học offline
                    </span>
                    <span className="font-bold text-zinc-500 hover:text-emerald-600 flex items-center gap-0.5 text-[11px]">
                      Xem hướng dẫn điều trị →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: VIDEO & HƯỚNG DẪN KỸ THUẬT (OFFLINE CACHED) */}
      {activeTab === 'videos' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {filteredVideos.map(vid => (
            <div
              key={vid.id}
              onClick={() => setSelectedVideo(vid)}
              className="bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="relative h-44 w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <img
                    src={vid.thumbnailUrl}
                    alt={vid.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 ml-1 fill-white" />
                    </div>
                  </div>
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-bold">
                    {vid.duration}
                  </span>
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold">
                    {vid.category}
                  </span>
                </div>

                <div className="p-4 space-y-2">
                  <h4 className="font-extrabold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                    {vid.title}
                  </h4>
                  <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">
                    {vid.summary}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0 text-[11px] font-bold text-emerald-600 flex items-center justify-between">
                <span>{vid.steps.length} bước kỹ thuật</span>
                <span>Xem chi tiết →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DETAIL MODAL: BỆNH CÂY TRỒNG & PHÁC ĐỒ ĐIỀU TRỊ OFFLINE */}
      {selectedDisease && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 sm:p-7 max-w-2xl w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-5 my-8">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <img
                  src={selectedDisease.imageUrl}
                  alt={selectedDisease.diseaseName}
                  className="w-16 h-16 rounded-2xl object-cover shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                      {selectedDisease.pathogenType}
                    </span>
                    <span className="text-[10px] text-zinc-400">Mức độ: {selectedDisease.severity}</span>
                  </div>
                  <h3 className="font-black text-base sm:text-lg text-zinc-900 dark:text-zinc-100 mt-1">
                    {selectedDisease.diseaseName}
                  </h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                    Cây trồng bị ảnh hưởng: {selectedDisease.cropType}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => toggleBookmarkDisease(selectedDisease.id)}
                  className={`p-2 rounded-xl transition-colors cursor-pointer ${
                    bookmarkedDiseases.includes(selectedDisease.id)
                      ? 'text-amber-500 bg-amber-50 dark:bg-amber-950'
                      : 'text-zinc-400 hover:text-zinc-600'
                  }`}
                  title="Ghim bệnh ngoại tuyến"
                >
                  <Bookmark className={`w-4 h-4 ${bookmarkedDiseases.includes(selectedDisease.id) ? 'fill-amber-500' : ''}`} />
                </button>
                <button
                  onClick={() => setSelectedDisease(null)}
                  className="p-2 text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Tabs: Symptoms, Organic, Chemical, Prevention */}
            <div className="space-y-4 text-xs">
              {/* Symptoms */}
              <div className="bg-rose-50/70 dark:bg-rose-950/30 p-3.5 rounded-2xl border border-rose-200 dark:border-rose-900/50 space-y-1.5">
                <div className="font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Dấu Hiệu & Triệu Chứng Chi Tiết</span>
                </div>
                <ul className="space-y-1 pl-1 text-zinc-700 dark:text-zinc-300">
                  {selectedDisease.symptoms.map((s, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                      <span className="text-rose-500 font-bold">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Organic Solutions */}
              <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 space-y-1.5">
                <div className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <Leaf className="w-4 h-4 text-emerald-600" />
                  <span>Giải Pháp Xử Lý Sinh Học & Hữu Cơ (Ưu Tiên)</span>
                </div>
                <ul className="space-y-1 pl-1 text-zinc-700 dark:text-zinc-300">
                  {selectedDisease.organicSolution.map((sol, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>{sol}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Chemical Solutions */}
              <div className="bg-amber-50/70 dark:bg-amber-950/30 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/50 space-y-1.5">
                <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Biện Pháp Hóa Học Khi Bệnh Lây Lan Nặng</span>
                </div>
                <ul className="space-y-1 pl-1 text-zinc-700 dark:text-zinc-300">
                  {selectedDisease.chemicalSolution.map((chem, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                      <span className="text-amber-600 font-bold">•</span>
                      <span>{chem}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Prevention */}
              <div className="bg-zinc-50 dark:bg-zinc-800/60 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 space-y-1.5">
                <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>Biện Pháp Phòng Ngừa Lâu Dài</span>
                </div>
                <ul className="space-y-1 pl-1 text-zinc-700 dark:text-zinc-300">
                  {selectedDisease.prevention.map((prev, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                      <span className="text-teal-600 font-bold">•</span>
                      <span>{prev}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelectedDisease(null)}
                className="w-full py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL: VIDEO KỸ THUẬT */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 sm:p-6 max-w-lg w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold">
                {selectedVideo.category} • {selectedVideo.duration}
              </span>
              <button onClick={() => setSelectedVideo(null)}>
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden aspect-video relative bg-black">
              <img
                src={selectedVideo.thumbnailUrl}
                alt={selectedVideo.title}
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-2xl">
                  <Play className="w-6 h-6 ml-1 fill-white" />
                </div>
              </div>
            </div>

            <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
              {selectedVideo.title}
            </h3>

            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              {selectedVideo.summary}
            </p>

            <div className="space-y-2 pt-1 text-xs">
              <span className="font-bold text-zinc-800 dark:text-zinc-200 block">
                Các bước thực hành kỹ thuật:
              </span>
              <div className="space-y-1.5 pl-1">
                {selectedVideo.steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-zinc-700 dark:text-zinc-300 text-[11px]">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setSelectedVideo(null)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
            >
              Đã hiểu kỹ thuật
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
