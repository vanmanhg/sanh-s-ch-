import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Gift,
  Plus,
  MapPin,
  Phone,
  Package,
  CheckCircle2,
  Filter,
  Sparkles,
  X
} from 'lucide-react';

export const SeedExchangeView: React.FC = () => {
  const { seedItems, addSeedItem, claimSeedItem } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showDonateModal, setShowDonateModal] = useState<boolean>(false);
  const [claimedNotice, setClaimedNotice] = useState<string | null>(null);

  // Donate Form state
  const [title, setTitle] = useState('');
  const [variety, setVariety] = useState('');
  const [category, setCategory] = useState<'vegetable' | 'flower' | 'fruit' | 'herb'>('vegetable');
  const [giverName, setGiverName] = useState('');
  const [giverPhone, setGiverPhone] = useState('');
  const [location, setLocation] = useState('');
  const [quantity, setQuantity] = useState('20 túi hạt');
  const [shippingOption, setShippingOption] = useState<'direct' | 'post' | 'both'>('both');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const filteredSeeds = seedItems.filter(s => {
    if (selectedCategory === 'all') return true;
    return s.category === selectedCategory;
  });

  const handleDonateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !giverName) return;

    addSeedItem({
      title,
      variety: variety || title,
      category,
      giverName,
      giverPhone: giverPhone || '0900.000.000',
      location: location || 'Toàn quốc',
      quantity,
      shippingOption,
      imageUrl:
        imageUrl ||
        'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=500&q=80',
      description
    });

    setShowDonateModal(false);
    setTitle('');
    setVariety('');
    setGiverName('');
    setGiverPhone('');
    setDescription('');
  };

  const handleClaim = (id: string, seedTitle: string) => {
    claimSeedItem(id);
    setClaimedNotice(seedTitle);
    setTimeout(() => setClaimedNotice(null), 3500);
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold mb-1">
            <Gift className="w-3.5 h-3.5" />
            <span>Chương Trình Lan Tỏa Màu Xanh • Phi Lợi Nhuận</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
            Cộng Đồng Trao Đổi Hạt Giống Miễn Phí
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500">
            Chia sẻ hạt giống bản địa, cây con quý giá và nhận hạt giống miễn phí từ những người yêu vườn trên khắp cả nước.
          </p>
        </div>

        <button
          onClick={() => setShowDonateModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-emerald-700 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tặng Hạt Giống Của Bạn</span>
        </button>
      </div>

      {/* Claimed Notification Toast */}
      {claimedNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-500 text-white shadow-lg flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>
              Bạn đã đăng ký nhận thành công phần hạt: <strong>{claimedNotice}</strong>! Vui lòng liên hệ người tặng để nhận hàng.
            </span>
          </div>
          <button onClick={() => setClaimedNotice(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {[
          { id: 'all', label: 'Tất cả hạt giống' },
          { id: 'vegetable', label: 'Hạt rau củ quả' },
          { id: 'flower', label: 'Hoa kiểng' },
          { id: 'fruit', label: 'Cây giống ăn trái' },
          { id: 'herb', label: 'Thảo dược & gia vị' }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
              selectedCategory === cat.id
                ? 'bg-emerald-700 text-white font-bold'
                : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Seed Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSeeds.map(seed => {
          const isClaimed = seed.status === 'claimed';

          return (
            <div
              key={seed.id}
              className={`bg-white dark:bg-zinc-900 rounded-3xl border ${
                isClaimed
                  ? 'border-zinc-200 dark:border-zinc-800 opacity-70'
                  : 'border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 hover:shadow-md'
              } overflow-hidden shadow-xs transition-all flex flex-col justify-between`}
            >
              <div>
                {/* Image */}
                <div className="relative h-44 w-full bg-zinc-100 dark:bg-zinc-800">
                  <img
                    src={seed.imageUrl}
                    alt={seed.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-emerald-600 text-white shadow-sm">
                      Miễn Phí 100%
                    </span>
                  </div>
                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold backdrop-blur-xs ${
                        isClaimed ? 'bg-zinc-800/80 text-white' : 'bg-black/60 text-white'
                      }`}
                    >
                      {isClaimed ? 'Đã tặng hết' : seed.quantity}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-2.5">
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 line-clamp-1">
                      {seed.title}
                    </h3>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                      Giống: {seed.variety}
                    </p>
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    {seed.description}
                  </p>

                  <div className="space-y-1 text-xs text-zinc-500 pt-1">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate">{seed.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span>
                        Vận chuyển:{' '}
                        {seed.shippingOption === 'both'
                          ? 'Gặp trực tiếp hoặc bưu điện gửi'
                          : seed.shippingOption === 'post'
                          ? 'Gửi bưu điện toàn quốc'
                          : 'Nhận trực tiếp tại nhà'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="p-3.5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex items-center justify-between gap-2">
                <a
                  href={`tel:${seed.giverPhone}`}
                  className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs hover:bg-zinc-100 flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{seed.giverName.split(' ')[0]}</span>
                </a>

                <button
                  disabled={isClaimed}
                  onClick={() => handleClaim(seed.id, seed.title)}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    isClaimed
                      ? 'bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500 cursor-not-allowed'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                  }`}
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>{isClaimed ? 'Đã Nhận' : 'Đăng Ký Nhận Hạt'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* DONATE SEED MODAL */}
      {showDonateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-lg w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-emerald-600" />
                <span>Đăng Tặng Hạt Giống Miễn Phí</span>
              </h3>
              <button onClick={() => setShowDonateModal(false)}>
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <form onSubmit={handleDonateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1 text-zinc-700 dark:text-zinc-300">
                  Tên loại hạt giống / cây con
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hạt ớt xiêm rừng, Hạt mướp khía ngọt..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1 text-zinc-700 dark:text-zinc-300">
                    Phân loại
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                  >
                    <option value="vegetable">Rau củ quả</option>
                    <option value="flower">Hoa kiểng</option>
                    <option value="fruit">Cây ăn trái</option>
                    <option value="herb">Thảo dược & gia vị</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-zinc-700 dark:text-zinc-300">
                    Số lượng tặng
                  </label>
                  <input
                    type="text"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    placeholder="Ví dụ: 30 gói, 15 bầu cây"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1 text-zinc-700 dark:text-zinc-300">
                    Tên người tặng
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Anh Nam / Cô Hoa"
                    value={giverName}
                    onChange={e => setGiverName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-zinc-700 dark:text-zinc-300">
                    Số điện thoại / Zalo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="0912..."
                    value={giverPhone}
                    onChange={e => setGiverPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-zinc-700 dark:text-zinc-300">
                  Địa điểm tặng
                </label>
                <input
                  type="text"
                  placeholder="Quận Bình Thạnh, TP.HCM / Đà Lạt..."
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-zinc-700 dark:text-zinc-300">
                  Mô tả thêm về giống cây & tỷ lệ nảy mầm
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Tỷ lệ nảy mầm >90%, thu hoạch từ quả vụ mùa này, cây thuần chủng..."
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDonateModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700"
                >
                  Xác Nhận Đăng Tặng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
