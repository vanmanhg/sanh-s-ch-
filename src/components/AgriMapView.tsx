import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AGRI_STATIONS } from '../data/mockData';
import { AgriStation } from '../types';
import {
  MapPin,
  Navigation as NavIcon,
  Phone,
  Clock,
  Star,
  Search,
  CheckCircle2,
  Compass,
  Layers,
  Store,
  Leaf,
  Sprout,
  ExternalLink,
  Edit3
} from 'lucide-react';

export const AgriMapView: React.FC = () => {
  const { farmLocation, setFarmLocation } = useApp();
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStation, setSelectedStation] = useState<AgriStation>(AGRI_STATIONS[0]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showEditLocationModal, setShowEditLocationModal] = useState<boolean>(false);

  // Edit location state
  const [fieldName, setFieldName] = useState(farmLocation.name);
  const [fieldAddress, setFieldAddress] = useState(farmLocation.address);

  const filteredStations = AGRI_STATIONS.filter(st => {
    const matchType = selectedType === 'all' || st.type === selectedType;
    const matchSearch =
      st.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.province.toLowerCase().includes(searchTerm.toLowerCase());
    return matchType && matchSearch;
  });

  const handleSaveFarmLocation = (e: React.FormEvent) => {
    e.preventDefault();
    setFarmLocation({
      ...farmLocation,
      name: fieldName,
      address: fieldAddress
    });
    setShowEditLocationModal(false);
  };

  const getStationBadge = (type: string) => {
    switch (type) {
      case 'organic_station':
        return { label: 'Trạm Canh Tác Hữu Cơ', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' };
      case 'supply':
        return { label: 'Vật Tư Nông Nghiệp', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' };
      case 'nursery':
        return { label: 'Vườn Ươm Cây Giống', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' };
      default:
        return { label: 'Hợp Tác Xã', color: 'bg-zinc-100 text-zinc-800' };
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Header & User Farm Location Box */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Compass className="w-7 h-7 text-emerald-600" />
            <span>Bản Đồ Nông Nghiệp, Vật Tư & Trạm Hữu Cơ</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500">
            Định vị cửa hàng phân bón, thuốc BVTV sinh học, vườn ươm và trạm vi sinh IMO gần nhất
          </p>
        </div>

        {/* Current Farm Location Tag */}
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 p-2.5 rounded-2xl">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300">
              Khu Vực Canh Tác Của Bạn
            </div>
            <div className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 truncate max-w-[200px]">
              {farmLocation.name}
            </div>
          </div>
          <button
            onClick={() => setShowEditLocationModal(true)}
            className="p-1 text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 cursor-pointer ml-1"
            title="Đổi địa chỉ khu vực canh tác"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive Map Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Map Canvas Simulation */}
        <div className="lg:col-span-2 space-y-3">
          <div className="relative rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-slate-900 h-[380px] sm:h-[450px] shadow-lg flex flex-col justify-between p-4">
            {/* Map Background Grid & Roads Visual */}
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="absolute inset-0 pointer-events-none">
              {/* Simulated river & agricultural canal paths */}
              <svg className="w-full h-full opacity-40" viewBox="0 0 600 400" preserveAspectRatio="none">
                <path d="M 0 120 Q 200 180 400 90 T 600 220" fill="none" stroke="#0284c7" strokeWidth="14" />
                <path d="M 120 0 Q 180 200 240 400" fill="none" stroke="#475569" strokeWidth="6" />
                <path d="M 0 280 Q 300 320 600 270" fill="none" stroke="#475569" strokeWidth="6" />
                <path d="M 380 0 Q 360 220 500 400" fill="none" stroke="#475569" strokeWidth="5" />
              </svg>
            </div>

            {/* Top Overlay Tools */}
            <div className="relative z-10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-xs font-semibold">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Bản Đồ Vệ Tinh Nông Vụ</span>
              </div>

              <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-xl text-xs text-white">
                <span className="px-2 py-0.5 rounded-md bg-emerald-600 font-bold">2.5D</span>
                <span className="px-2 py-0.5 opacity-70">GPS</span>
              </div>
            </div>

            {/* Interactive Pins on Map */}
            <div className="relative z-10 w-full h-full flex items-center justify-center">
              {/* User's Farm Pin */}
              <div
                style={{ top: '48%', left: '46%' }}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer"
              >
                <div className="px-2 py-0.5 rounded-md bg-emerald-500 text-white font-extrabold text-[10px] shadow-lg mb-1 whitespace-nowrap animate-pulse">
                  📍 {farmLocation.name.split('-')[0]}
                </div>
                <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg border-2 border-white ring-4 ring-emerald-500/30">
                  <Sprout className="w-4 h-4" />
                </div>
              </div>

              {/* Station 1: Hóc Môn */}
              <div
                onClick={() => setSelectedStation(AGRI_STATIONS[0])}
                style={{ top: '35%', left: '32%' }}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer hover:scale-110 transition-transform"
              >
                <div className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-bold text-[9px] shadow-md mb-1 whitespace-nowrap">
                  Vật Tư Hóc Môn (2.4km)
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white ${selectedStation.id === AGRI_STATIONS[0].id ? 'bg-amber-400 text-zinc-950 scale-125' : 'bg-blue-600 text-white'}`}>
                  <Store className="w-4 h-4" />
                </div>
              </div>

              {/* Station 2: Trạm Hữu Cơ Củ Chi */}
              <div
                onClick={() => setSelectedStation(AGRI_STATIONS[1])}
                style={{ top: '22%', left: '60%' }}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer hover:scale-110 transition-transform"
              >
                <div className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-bold text-[9px] shadow-md mb-1 whitespace-nowrap">
                  Trạm Hữu Cơ IMO Củ Chi (8.7km)
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white ${selectedStation.id === AGRI_STATIONS[1].id ? 'bg-amber-400 text-zinc-950 scale-125' : 'bg-emerald-600 text-white'}`}>
                  <Leaf className="w-4 h-4" />
                </div>
              </div>

              {/* Station 3: Vườn Ươm Long Khánh */}
              <div
                onClick={() => setSelectedStation(AGRI_STATIONS[2])}
                style={{ top: '68%', left: '75%' }}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer hover:scale-110 transition-transform"
              >
                <div className="px-2 py-0.5 rounded-md bg-amber-600 text-white font-bold text-[9px] shadow-md mb-1 whitespace-nowrap">
                  Vườn Ươm Cây Giống (28km)
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white ${selectedStation.id === AGRI_STATIONS[2].id ? 'bg-amber-400 text-zinc-950 scale-125' : 'bg-amber-600 text-white'}`}>
                  <Sprout className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Bottom floating helper */}
            <div className="relative z-10 bg-black/60 backdrop-blur-md p-3 rounded-2xl text-white text-xs flex items-center justify-between">
              <span className="text-[11px] opacity-90">
                Chạm vào các biểu tượng trạm trên bản đồ để xem chi tiết sản phẩm và chỉ đường.
              </span>
              <a
                href={`https://www.google.com/maps/search/vat+tu+nong+nghiep+gan+day`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1 bg-white text-emerald-950 font-bold rounded-xl text-xs flex items-center gap-1 hover:bg-emerald-50 shrink-0"
              >
                <span>Mở Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Station Selected Details Card */}
          {selectedStation && (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-md space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${getStationBadge(selectedStation.type).color}`}>
                      {getStationBadge(selectedStation.type).label}
                    </span>
                    <span className="text-xs text-zinc-400">Cách bạn ~{selectedStation.distanceKm} km</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-zinc-100 mt-1">
                    {selectedStation.name}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${selectedStation.phone}`}
                    className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-700 shadow-xs"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Gọi Ngay ({selectedStation.phone})</span>
                  </a>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedStation.lat},${selectedStation.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <NavIcon className="w-3.5 h-3.5 text-blue-600" />
                    <span>Chỉ Đường</span>
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{selectedStation.address}, {selectedStation.province}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Giờ mở cửa: {selectedStation.openingHours}</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Dịch vụ & Vật tư cung cấp tại trạm:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedStation.services.map((svc, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium"
                    >
                      ✓ {svc}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Search & Stations Directory List */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
            <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Store className="w-4 h-4 text-emerald-600" />
              <span>Danh Sách Cơ Sở Trong Khu Vực</span>
            </h3>

            {/* Filter tags */}
            <div className="flex flex-wrap gap-1">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'supply', label: 'Vật tư' },
                { id: 'organic_station', label: 'Trạm hữu cơ' },
                { id: 'nursery', label: 'Vườn ươm' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedType(t.id)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                    selectedType === t.id
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm cửa hàng, vật tư..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-800 dark:text-zinc-200"
              />
            </div>
          </div>

          {/* List items */}
          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {filteredStations.map(st => {
              const isSelected = selectedStation?.id === st.id;
              return (
                <div
                  key={st.id}
                  onClick={() => setSelectedStation(st)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-xs'
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.2 rounded-md text-[9px] font-bold ${getStationBadge(st.type).color}`}>
                      {getStationBadge(st.type).label}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                      {st.distanceKm} km
                    </span>
                  </div>

                  <h4 className="font-extrabold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 mt-1 line-clamp-1">
                    {st.name}
                  </h4>
                  <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">{st.address}</p>

                  <div className="pt-2 flex items-center justify-between text-[11px] text-zinc-400">
                    <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
                      <Star className="w-3 h-3 fill-amber-500" />
                      {st.rating}
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
                      Xem chỉ đường →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* EDIT FARM LOCATION MODAL */}
      {showEditLocationModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-md w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Cập Nhật Khu Vực Canh Tác Của Bạn</span>
            </h3>

            <form onSubmit={handleSaveFarmLocation} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1 text-zinc-700 dark:text-zinc-300">
                  Tên Vườn / Nông Trại
                </label>
                <input
                  type="text"
                  required
                  value={fieldName}
                  onChange={e => setFieldName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-zinc-700 dark:text-zinc-300">
                  Địa chỉ cụ thể
                </label>
                <input
                  type="text"
                  required
                  value={fieldAddress}
                  onChange={e => setFieldAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditLocationModal(false)}
                  className="flex-1 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700"
                >
                  Lưu Vị Trí Vườn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
