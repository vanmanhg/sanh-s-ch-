import React, { useState } from 'react';
import { DISEASE_ENCYCLOPEDIA, VIDEO_GUIDES } from '../data/mockData';
import { DiseaseEncyclopediaItem, VideoGuideItem } from '../types';
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
  X
} from 'lucide-react';

interface LibraryGuidesViewProps {
  onGoToDiagnosis: () => void;
}

export const LibraryGuidesView: React.FC<LibraryGuidesViewProps> = ({ onGoToDiagnosis }) => {
  const [activeTab, setActiveTab] = useState<'diseases' | 'videos'>('diseases');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDisease, setSelectedDisease] = useState<DiseaseEncyclopediaItem | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoGuideItem | null>(null);

  const filteredDiseases = DISEASE_ENCYCLOPEDIA.filter(d =>
    d.diseaseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.cropType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.pathogenType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredVideos = VIDEO_GUIDES.filter(v =>
    v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Header & Sub-tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-emerald-600" />
            <span>Thư Viện Bệnh Cây Trồng & Video Hướng Dẫn</span>
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
            Bách Khoa Bệnh ({DISEASE_ENCYCLOPEDIA.length})
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-3.5 py-1.5 rounded-xl cursor-pointer transition-colors ${
              activeTab === 'videos'
                ? 'bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400'
            }`}
          >
            Video & Kỹ Thuật ({VIDEO_GUIDES.length})
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-zinc-900 p-3 sm:p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder={
              activeTab === 'diseases'
                ? 'Tra theo tên bệnh hoặc loại cây (Thán thư, xì mủ, sầu riêng, cà chua...)'
                : 'Tìm video hướng dẫn kỹ thuật nông nghiệp...'
            }
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-800 dark:text-zinc-200"
          />
        </div>

        {activeTab === 'diseases' && (
          <button
            onClick={onGoToDiagnosis}
            className="w-full sm:w-auto px-4 py-2 bg-rose-500 text-white rounded-xl text-xs font-bold hover:bg-rose-600 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Chụp Ảnh Bắt Bệnh Trực Tiếp Bằng AI</span>
          </button>
        )}
      </div>

      {/* TAB 1: BÁCH KHOA BỆNH HẠI THỰC VẬT */}
      {activeTab === 'diseases' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDiseases.map(dis => (
            <div
              key={dis.id}
              onClick={() => setSelectedDisease(dis)}
              className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-xs hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3.5">
                  <img
                    src={dis.imageUrl}
                    alt={dis.diseaseName}
                    className="w-20 h-20 rounded-2xl object-cover shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                        {dis.pathogenType}
                      </span>
                      <span className="text-[10px] text-zinc-400">Mức độ: {dis.severity}</span>
                    </div>
                    <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 mt-1">
                      {dis.diseaseName}
                    </h3>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">
                      Thường gặp trên: {dis.cropType}
                    </p>
                  </div>
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

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <Leaf className="w-3.5 h-3.5" /> Có hướng dẫn sinh học
                </span>
                <span className="font-bold text-zinc-500 hover:text-emerald-600 flex items-center gap-0.5">
                  Chi tiết phác đồ →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: VIDEO HƯỚNG DẪN KỸ THUẬT NÔNG NGHIỆP */}
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

              <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                <span>{vid.steps.length} bước thực hiện chi tiết</span>
                <span>Xem hướng dẫn →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DISEASE DETAIL MODAL */}
      {selectedDisease && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-xl w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
                  {selectedDisease.pathogenType}
                </span>
                <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100 mt-1">
                  {selectedDisease.diseaseName}
                </h3>
                <p className="text-xs text-zinc-500">Cây trồng: {selectedDisease.cropType}</p>
              </div>
              <button onClick={() => setSelectedDisease(null)}>
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            {/* Symptoms */}
            <div className="space-y-1.5 text-xs">
              <h4 className="font-bold text-zinc-800 dark:text-zinc-200">Triệu chứng lâm sàng:</h4>
              <ul className="space-y-1 pl-1">
                {selectedDisease.symptoms.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 text-zinc-600 dark:text-zinc-300">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Organic solutions */}
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-1.5 text-xs">
              <h4 className="font-extrabold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                <Leaf className="w-4 h-4 text-emerald-600" />
                <span>Giải pháp sinh học & hữu cơ an toàn:</span>
              </h4>
              <ul className="space-y-1 pl-1 text-emerald-950 dark:text-emerald-100">
                {selectedDisease.organicSolution.map((sol, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>{sol}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Chemical solutions */}
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-1.5 text-xs">
              <h4 className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Thuốc BVTV khuyến cáo nếu bệnh nặng:</span>
              </h4>
              <ul className="space-y-1 pl-1 text-amber-950 dark:text-amber-100">
                {selectedDisease.chemicalSolution.map((chem, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold">!</span>
                    <span>{chem}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedDisease(null)}
                className="px-4 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIDEO DETAIL MODAL */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-xl w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                  {selectedVideo.category} • {selectedVideo.duration}
                </span>
                <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100 mt-1">
                  {selectedVideo.title}
                </h3>
              </div>
              <button onClick={() => setSelectedVideo(null)}>
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            {/* Video Player Mockup with Cover */}
            <div className="relative rounded-2xl overflow-hidden h-52 bg-slate-950 flex items-center justify-center">
              <img
                src={selectedVideo.thumbnailUrl}
                alt={selectedVideo.title}
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute flex flex-col items-center gap-2 text-white">
                <div className="w-14 h-14 rounded-full bg-emerald-600 flex items-center justify-center shadow-2xl cursor-pointer hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 ml-1 fill-white" />
                </div>
                <span className="text-xs font-semibold">Video thực tế độ nét cao (Full HD)</span>
              </div>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="space-y-2 text-xs">
              <h4 className="font-extrabold text-zinc-900 dark:text-zinc-100">
                Các bước thực hành kỹ thuật chuẩn:
              </h4>
              <div className="space-y-2">
                {selectedVideo.steps.map((st, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60"
                  >
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-extrabold text-[10px] flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-zinc-700 dark:text-zinc-300 leading-relaxed">{st}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedVideo(null)}
                className="px-4 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
