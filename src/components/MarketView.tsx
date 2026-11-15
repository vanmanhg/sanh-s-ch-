import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { MarketItem, MarketOrder, ProductReview } from '../types';
import {
  ShoppingBag,
  ShoppingCart,
  Star,
  MapPin,
  CheckCircle2,
  Plus,
  Trash2,
  X,
  Phone,
  MessageCircle,
  Filter,
  Search,
  Truck,
  ShieldCheck,
  CreditCard,
  QrCode,
  DollarSign,
  Package,
  Clock,
  ChevronRight,
  Sparkles,
  Tag,
  ArrowRight,
  Store,
  ThumbsUp,
  Image as ImageIcon,
  Check,
  Percent,
  BadgeAlert
} from 'lucide-react';

export const MarketView: React.FC = () => {
  const {
    marketItems,
    addMarketItem,
    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    marketOrders,
    placeMarketOrder,
    updateOrderStatus,
    addProductReview,
    t
  } = useApp();

  // Navigation sub-tab inside Market
  const [activeMarketTab, setActiveMarketTab] = useState<'browse' | 'sell' | 'orders'>('browse');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'price_asc' | 'price_desc' | 'rating' | 'newest'>('popular');
  const [organicOnly, setOrganicOnly] = useState<boolean>(false);

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState<MarketItem | null>(null);
  const [showCartModal, setShowCartModal] = useState<boolean>(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  const [checkoutSuccessOrder, setCheckoutSuccessOrder] = useState<MarketOrder | null>(null);

  // Product Review Modal inside Product Detail
  const [showReviewForm, setShowReviewForm] = useState<boolean>(false);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewAuthor, setReviewAuthor] = useState<string>('');
  const [reviewContent, setReviewContent] = useState<string>('');

  // Cart detail product quantity selection
  const [itemDetailQty, setItemDetailQty] = useState<number>(1);

  // Checkout form state
  const [buyerName, setBuyerName] = useState<string>('David Khang');
  const [buyerPhone, setBuyerPhone] = useState<string>('0988.888.386');
  const [buyerAddress, setBuyerAddress] = useState<string>('Đường Song Hành, Huyện Hóc Môn, TP. Hồ Chí Minh');
  const [buyerNotes, setBuyerNotes] = useState<string>('Gọi trước khi giao 15 phút');
  const [selectedCarrier, setSelectedCarrier] = useState<'ghtk' | 'viettel' | 'express' | 'pickup'>('ghtk');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cod' | 'vietqr' | 'momo' | 'vnpay'>('cod');
  const [voucherCodeInput, setVoucherCodeInput] = useState<string>('');
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; discountPercent: number; maxDiscount: number; freeShip?: boolean } | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);

  // New Listing Form state
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCategory, setNewCategory] = useState<MarketItem['category']>('plant');
  const [newPrice, setNewPrice] = useState<number>(50000);
  const [newOriginalPrice, setNewOriginalPrice] = useState<number>(65000);
  const [newUnit, setNewUnit] = useState<string>('Chậu');
  const [newStock, setNewStock] = useState<number>(20);
  const [newSellerName, setNewSellerName] = useState<string>('Vườn Nhà Tôi');
  const [newSellerPhone, setNewSellerPhone] = useState<string>('0909.123.456');
  const [newSellerZalo, setNewSellerZalo] = useState<string>('0909123456');
  const [newLocation, setNewLocation] = useState<string>('TP. Hồ Chí Minh');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newIsOrganic, setNewIsOrganic] = useState<boolean>(true);
  const [newImageUrl, setNewImageUrl] = useState<string>('https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=600&q=80');
  const [listingSuccess, setListingSuccess] = useState<boolean>(false);

  // Carriers info
  const SHIPPING_CARRIERS = [
    {
      id: 'ghtk' as const,
      name: 'Giao Hàng Tiết Kiệm (GHTK)',
      subtitle: 'Chuyên vận chuyển cây giống & hạt giống',
      fee: 25000,
      estimateDays: '2 - 3 ngày',
      icon: '🚚'
    },
    {
      id: 'viettel' as const,
      name: 'Viettel Post Nông Nghiệp Hỏa Tốc',
      subtitle: 'Thùng xốp chống dập nát, bảo vệ cây sống 24h',
      fee: 35000,
      estimateDays: '24 giờ',
      icon: '⚡'
    },
    {
      id: 'express' as const,
      name: 'Giao Nhanh Nội Thành (Ahamove / Grab)',
      subtitle: 'Nhận ngay trong ngày (áp dụng nội tỉnh/thành phố)',
      fee: 45000,
      estimateDays: '2 - 4 giờ',
      icon: '🛵'
    },
    {
      id: 'pickup' as const,
      name: 'Tự Đến Vườn Lấy Hàng',
      subtitle: 'Giao lưu trực tiếp với nhà vườn, kiểm tra cây thoải mái',
      fee: 0,
      estimateDays: 'Nhận trong ngày',
      icon: '🏡'
    }
  ];

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return marketItems
      .filter(item => {
        if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
        if (organicOnly && !item.isOrganic) return false;
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchDesc = item.description.toLowerCase().includes(q);
          const matchSeller = item.sellerName.toLowerCase().includes(q);
          const matchLocation = item.location.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchSeller && !matchLocation) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.price - b.price;
        if (sortBy === 'price_desc') return b.price - a.price;
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'newest') return b.id.localeCompare(a.id);
        // Default popular
        return (b.soldCount || 0) - (a.soldCount || 0);
      });
  }, [marketItems, selectedCategory, organicOnly, searchQuery, sortBy]);

  // Cart totals calculation
  const cartSubtotal = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);
  const selectedCarrierInfo = SHIPPING_CARRIERS.find(c => c.id === selectedCarrier) || SHIPPING_CARRIERS[0];
  const baseShippingFee = appliedVoucher?.freeShip ? 0 : selectedCarrierInfo.fee;

  const voucherDiscount = useMemo(() => {
    if (!appliedVoucher) return 0;
    if (appliedVoucher.discountPercent) {
      const discount = Math.round((cartSubtotal * appliedVoucher.discountPercent) / 100);
      return Math.min(discount, appliedVoucher.maxDiscount);
    }
    return 0;
  }, [appliedVoucher, cartSubtotal]);

  const cartGrandTotal = Math.max(0, cartSubtotal - voucherDiscount + baseShippingFee);

  // Voucher apply handler
  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    setVoucherError(null);
    const code = voucherCodeInput.trim().toUpperCase();
    if (!code) return;

    if (code === 'VUONXANH10') {
      setAppliedVoucher({
        code: 'VUONXANH10',
        discountPercent: 10,
        maxDiscount: 50000
      });
    } else if (code === 'FREESHIP') {
      setAppliedVoucher({
        code: 'FREESHIP',
        discountPercent: 0,
        maxDiscount: 0,
        freeShip: true
      });
    } else if (code === 'NONGDAN20') {
      setAppliedVoucher({
        code: 'NONGDAN20',
        discountPercent: 20,
        maxDiscount: 80000
      });
    } else {
      setVoucherError('Mã giảm giá không hợp lệ hoặc đã hết hạn.');
    }
  };

  // Place order handler
  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!buyerName || !buyerPhone || !buyerAddress) {
      return;
    }

    const newOrder = placeMarketOrder({
      items: cart.map(c => ({
        item: c.item,
        quantity: c.quantity,
        selectedPrice: c.item.price
      })),
      buyerName,
      buyerPhone,
      buyerAddress,
      shippingCarrier: selectedCarrier,
      shippingFee: baseShippingFee,
      paymentMethod: selectedPaymentMethod,
      paymentStatus: selectedPaymentMethod === 'cod' ? 'pending' : 'escrow_holding',
      orderStatus: 'processing',
      subtotal: cartSubtotal,
      discountAmount: voucherDiscount,
      totalAmount: cartGrandTotal,
      voucherCode: appliedVoucher?.code,
      notes: buyerNotes,
      hasReviewed: false
    });

    setShowCheckoutModal(false);
    setShowCartModal(false);
    setCheckoutSuccessOrder(newOrder);
  };

  // Add review submission
  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !reviewContent.trim()) return;

    addProductReview(selectedProduct.id, {
      authorName: reviewAuthor.trim() || 'Người Mua Đã Xác Thực',
      rating: reviewRating,
      content: reviewContent.trim(),
      verifiedPurchase: true
    });

    // Refresh selectedProduct view
    const updated = marketItems.find(p => p.id === selectedProduct.id);
    if (updated) {
      setSelectedProduct(updated);
    }

    setReviewContent('');
    setShowReviewForm(false);
  };

  // Create new listing handler
  const handleCreateListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || newPrice <= 0) return;

    addMarketItem({
      title: newTitle.trim(),
      category: newCategory,
      price: newPrice,
      originalPrice: newOriginalPrice > newPrice ? newOriginalPrice : newPrice,
      unit: newUnit.trim() || 'Sản phẩm',
      stock: newStock || 1,
      sellerName: newSellerName.trim() || 'Nhà Vườn Tự Nhiên',
      sellerPhone: newSellerPhone.trim(),
      sellerZalo: newSellerZalo.trim() || newSellerPhone.trim(),
      sellerBadge: newIsOrganic ? 'Nhà Vườn Hữu Cơ' : 'Thành Viên Vườn Xanh',
      sellerResponseRate: 98,
      sellerJoinYear: 2026,
      location: newLocation.trim() || 'Toàn quốc',
      imageUrl: newImageUrl,
      description: newDescription.trim() || 'Sản phẩm chất lượng từ vườn nhà, được tuyển chọn kỹ càng.',
      isOrganic: newIsOrganic,
      shippingCarriers: ['ghtk', 'viettel', 'express', 'pickup']
    });

    setListingSuccess(true);
    setTimeout(() => {
      setListingSuccess(false);
      setActiveMarketTab('browse');
      // Reset form
      setNewTitle('');
      setNewDescription('');
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Top Banner & Escrow Guarantee Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-emerald-100 text-xs font-bold">
            <Store className="w-3.5 h-3.5 text-amber-300" />
            <span>Sàn Thương Mại Làm Vườn & Cây Giống Toàn Quốc</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-black tracking-tight">
            Chợ Hạt Giống, Cây Cảnh & Vật Tư Xanh
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl leading-relaxed">
            Hệ thống mua bán cây giống an toàn với <strong>bảo hiểm Escrow 48h</strong>: đổi trả 100% nếu cây héo úa hoặc hạt lép. Vận chuyển chuyên dụng giữ cây tươi sống.
          </p>
        </div>

        {/* Quick Tabs & Cart Action */}
        <div className="flex flex-wrap items-center gap-2 relative z-10 w-full md:w-auto">
          <button
            onClick={() => setActiveMarketTab('browse')}
            className={`flex-1 md:flex-initial px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeMarketTab === 'browse'
                ? 'bg-white text-emerald-900 shadow-md font-extrabold'
                : 'bg-white/15 text-white hover:bg-white/25'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Sàn Mua Sắm</span>
          </button>

          <button
            onClick={() => setActiveMarketTab('sell')}
            className={`flex-1 md:flex-initial px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeMarketTab === 'sell'
                ? 'bg-amber-400 text-amber-950 shadow-md font-extrabold'
                : 'bg-white/15 text-white hover:bg-white/25'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Đăng Bán Ngay</span>
          </button>

          <button
            onClick={() => setActiveMarketTab('orders')}
            className={`flex-1 md:flex-initial px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeMarketTab === 'orders'
                ? 'bg-white text-emerald-900 shadow-md font-extrabold'
                : 'bg-white/15 text-white hover:bg-white/25'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Đơn Mua Của Tôi ({marketOrders.length})</span>
          </button>

          {/* Cart Floating Button */}
          <button
            onClick={() => setShowCartModal(true)}
            className="flex-1 md:flex-initial relative flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs rounded-2xl shadow-lg transition-all cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Giỏ ({cart.reduce((s, c) => s + c.quantity, 0)})</span>
            {cart.length > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping absolute -top-1 -right-1" />
            )}
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: BROWSE MARKETPLACE */}
      {/* ============================================================== */}
      {activeMarketTab === 'browse' && (
        <div className="space-y-6">
          {/* Search, Filter & Sorters Bar */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row items-center gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm hạt giống F1, cây cảnh, sen đá, trầu bà, kéo cắt cành, đất sạch..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Sorter Selector */}
              <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                <span className="text-xs text-zinc-500 whitespace-nowrap">Sắp xếp:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="flex-1 md:flex-initial py-2 px-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 cursor-pointer focus:outline-none"
                >
                  <option value="popular">Bán Chạy Nhất</option>
                  <option value="rating">Đánh Giá Cao Nhất (⭐)</option>
                  <option value="newest">Hàng Mới Lên Kệ</option>
                  <option value="price_asc">Giá: Thấp đến Cao</option>
                  <option value="price_desc">Giá: Cao đến Thấp</option>
                </select>

                {/* Organic Filter Toggle */}
                <button
                  onClick={() => setOrganicOnly(!organicOnly)}
                  className={`px-3 py-2 rounded-2xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    organicOnly
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>VietGAP / Hữu Cơ</span>
                </button>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
              {[
                { id: 'all', label: 'Tất Cả Sản Phẩm', icon: '🌿' },
                { id: 'seed', label: 'Hạt Giống Thuần & F1', icon: '🌱' },
                { id: 'plant', label: 'Cây Cảnh & Bonsai', icon: '🪴' },
                { id: 'fertilizer', label: 'Phân Bón & Dinh Dưỡng', icon: '🧪' },
                { id: 'supplies', label: 'Đất Trồng & Giá Thể', icon: '🪵' },
                { id: 'tool', label: 'Dụng Cụ & Thiết Bị Tưới', icon: '✂️' },
                { id: 'produce', label: 'Nông Sản Chín Cây', icon: '🍈' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 font-extrabold'
                      : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700/80'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Escrow Guarantee Safety Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-sky-950/40 rounded-3xl border border-emerald-200 dark:border-emerald-800/60 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-zinc-900 dark:text-zinc-100 block">Thanh Toán Tạm Giữ Escrow</strong>
                <span className="text-zinc-600 dark:text-zinc-400">Tiền được giữ 48h cho tới khi bạn nhận cây khỏe</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-zinc-900 dark:text-zinc-100 block">Vận Chuyển Cây Sống Chuyên Biệt</strong>
                <span className="text-zinc-600 dark:text-zinc-400">Hộp xốp cố định gốc, bảo đảm không dập rễ</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Star className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-zinc-900 dark:text-zinc-100 block">Đánh Giá Người Bán Minh Bạch</strong>
                <span className="text-zinc-600 dark:text-zinc-400">100% review từ người mua đã xác thực đơn hàng</span>
              </div>
            </div>
          </div>

          {/* Product Items Grid */}
          {filteredItems.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-12 text-center border border-dashed border-zinc-300 dark:border-zinc-800 space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-base font-extrabold text-zinc-800 dark:text-zinc-200">
                Không tìm thấy sản phẩm phù hợp
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Hãy thử đổi từ khóa tìm kiếm hoặc chọn danh mục khác để xem thêm nhiều cây giống và vật tư hấp dẫn.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setOrganicOnly(false);
                }}
                className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700"
              >
                Xóa Bộ Lọc
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredItems.map(item => {
                const discountPercent = item.originalPrice && item.originalPrice > item.price
                  ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
                  : null;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedProduct(item);
                      setItemDetailQty(1);
                    }}
                    className="group bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs hover:shadow-xl hover:border-emerald-500/50 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      {/* Product Image & Badges */}
                      <div className="relative h-48 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />

                        {/* Top Badges */}
                        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
                          {item.isOrganic && (
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-emerald-600 text-white backdrop-blur-xs shadow-xs">
                              Hữu Cơ
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-black/60 text-white backdrop-blur-xs">
                            {item.unit}
                          </span>
                        </div>

                        {discountPercent && (
                          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg text-[11px] font-black bg-rose-500 text-white shadow-xs">
                            -{discountPercent}%
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-2.5">
                        {/* Title */}
                        <h4 className="font-extrabold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {item.title}
                        </h4>

                        {/* Price */}
                        <div className="flex items-baseline gap-2">
                          <span className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400">
                            {item.price.toLocaleString('vi-VN')} đ
                          </span>
                          {item.originalPrice && item.originalPrice > item.price && (
                            <span className="text-xs text-zinc-400 line-through">
                              {item.originalPrice.toLocaleString('vi-VN')} đ
                            </span>
                          )}
                        </div>

                        {/* Seller Rating & Sold count */}
                        <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                          <div className="flex items-center gap-1 font-bold text-amber-500">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{item.rating}</span>
                            <span className="text-zinc-400 font-normal">({item.reviewsCount})</span>
                          </div>
                          <span>Đã bán {item.soldCount || 10}+</span>
                        </div>

                        {/* Seller name & Location */}
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between truncate">
                          <span className="truncate font-medium">{item.sellerName}</span>
                          <span className="shrink-0 flex items-center gap-0.5 text-zinc-400 text-[10px]">
                            <MapPin className="w-3 h-3" />
                            {item.location.split(',')[0]}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Quick Action */}
                    <div className="p-3 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-800/30 flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(item, 1);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Thêm Vào Giỏ</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProduct(item);
                          setItemDetailQty(1);
                        }}
                        className="p-2 rounded-xl text-zinc-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-zinc-800 transition-colors"
                        title="Xem chi tiết & đánh giá"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: SELL / LIST ITEM (Đăng Bán Sản Phẩm) */}
      {/* ============================================================== */}
      {activeMarketTab === 'sell' && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm max-w-3xl mx-auto space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 text-xs font-bold mb-2">
              <Plus className="w-3.5 h-3.5" />
              <span>Gian Hàng Nông Dân & Nhà Vườn</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100">
              Niêm Yết Bán Cây Giống, Hạt Giống & Vật Tư
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">
              Đưa sản phẩm nhà vườn của bạn tiếp cận hàng ngàn người yêu cây cảnh trên toàn quốc. Hỗ trợ đơn vị vận chuyển lấy hàng tận nơi.
            </p>
          </div>

          {listingSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>🎉 Sản phẩm đã được niêm yết thành công lên Sàn Nông Trợ Xanh! Đang chuyển hướng...</span>
            </div>
          )}

          <form onSubmit={handleCreateListing} className="space-y-4 text-xs sm:text-sm">
            {/* Title */}
            <div className="space-y-1">
              <label className="font-bold text-zinc-700 dark:text-zinc-300">
                Tên Sản Phẩm / Giống Cây <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="VD: Cây Hoa Hồng Cổ Hải Phòng 2 Năm Tuổi, Hạt Giống Dưa Leo F1..."
                className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Category & Unit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-zinc-700 dark:text-zinc-300">
                  Danh Mục <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                >
                  <option value="plant">Cây Cảnh & Bonsai</option>
                  <option value="seed">Hạt Giống</option>
                  <option value="fertilizer">Phân Bón Hữu Cơ</option>
                  <option value="supplies">Đất Trồng & Giá Thể</option>
                  <option value="tool">Dụng Cụ Làm Vườn</option>
                  <option value="produce">Nông Sản Sạch</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-700 dark:text-zinc-300">
                  Đơn Vị Tính <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newUnit}
                  onChange={e => setNewUnit(e.target.value)}
                  placeholder="VD: Chậu, Gói 50 hạt, Bao 5kg, Cây..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>
            </div>

            {/* Price & Stock */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-zinc-700 dark:text-zinc-300">
                  Giá Bán (VNĐ) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  required
                  value={newPrice}
                  onChange={e => setNewPrice(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-700 dark:text-zinc-300">
                  Giá Niêm Yết Gốc (VNĐ)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={newOriginalPrice}
                  onChange={e => setNewOriginalPrice(parseInt(e.target.value, 10) || 0)}
                  placeholder="Để tạo thẻ giảm giá"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-700 dark:text-zinc-300">
                  Số Lượng Tồn Kho <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newStock}
                  onChange={e => setNewStock(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>
            </div>

            {/* Seller Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-zinc-700 dark:text-zinc-300">Tên Nhà Vườn / Người Bán</label>
                <input
                  type="text"
                  required
                  value={newSellerName}
                  onChange={e => setNewSellerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-zinc-700 dark:text-zinc-300">Hotline / Điện Thoại</label>
                <input
                  type="text"
                  required
                  value={newSellerPhone}
                  onChange={e => setNewSellerPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-zinc-700 dark:text-zinc-300">Khu Vực / Tỉnh Thành</label>
                <input
                  type="text"
                  required
                  value={newLocation}
                  onChange={e => setNewLocation(e.target.value)}
                  placeholder="VD: Củ Chi, TP.HCM hoặc Đà Lạt..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>
            </div>

            {/* Image Presets Selector */}
            <div className="space-y-1">
              <label className="font-bold text-zinc-700 dark:text-zinc-300">Hình Ảnh Sản Phẩm</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newImageUrl}
                  onChange={e => setNewImageUrl(e.target.value)}
                  placeholder="Nhập liên kết ảnh hoặc chọn mẫu bên dưới"
                  className="flex-1 px-3.5 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none"
                />
              </div>
              {/* Presets */}
              <div className="flex gap-2 pt-1 overflow-x-auto no-scrollbar">
                {[
                  { label: 'Cà Chua', url: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=600&q=80' },
                  { label: 'Trầu Bà', url: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=600&q=80' },
                  { label: 'Hoa Hồng', url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=600&q=80' },
                  { label: 'Dưa Lưới', url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80' },
                  { label: 'Phân Trùn', url: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=600&q=80' },
                  { label: 'Bonsai', url: 'https://images.unsplash.com/photo-1512428813834-c702c7702b78?auto=format&fit=crop&w=600&q=80' }
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setNewImageUrl(preset.url)}
                    className="px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-100 text-[11px] font-bold text-zinc-600 dark:text-zinc-300 whitespace-nowrap cursor-pointer transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="font-bold text-zinc-700 dark:text-zinc-300">
                Mô Tả Chi Tiết & Hướng Dẫn Chăm Sóc <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                placeholder="Ghi rõ tình trạng cây/hạt, tỷ lệ nảy mầm, quy cách đóng thùng, hướng dẫn tưới nước sau khi nhận..."
                className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none"
              />
            </div>

            {/* Organic Switch */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="organicSwitch"
                checked={newIsOrganic}
                onChange={e => setNewIsOrganic(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
              />
              <label htmlFor="organicSwitch" className="font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer">
                Sản phẩm đạt chuẩn hữu cơ sinh học / VietGAP (Gắn nhãn xanh)
              </label>
            </div>

            {/* Submit */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                Đăng Bán Lên Sàn Nông Trợ Xanh
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: MY ORDERS (Đơn Hàng Của Tôi) */}
      {/* ============================================================== */}
      {activeMarketTab === 'orders' && (
        <div className="space-y-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              <span>Đơn Mua Của Bạn ({marketOrders.length})</span>
            </h3>
            <span className="text-xs text-zinc-500">Được bảo vệ bởi Escrow 48h</span>
          </div>

          {marketOrders.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-800 space-y-3">
              <Package className="w-12 h-12 mx-auto text-zinc-400" />
              <h4 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">Bạn chưa có đơn đặt hàng nào</h4>
              <p className="text-xs text-zinc-500">Hãy ghé Sàn Mua Sắm để chọn các giống cây và vật tư chất lượng.</p>
              <button
                onClick={() => setActiveMarketTab('browse')}
                className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl"
              >
                Mua Sắm Ngay
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {marketOrders.map(order => {
                const carrier = SHIPPING_CARRIERS.find(c => c.id === order.shippingCarrier) || SHIPPING_CARRIERS[0];
                return (
                  <div
                    key={order.id}
                    className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4"
                  >
                    {/* Order Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800 text-xs">
                      <div className="flex items-center gap-2">
                        <strong className="font-black text-zinc-900 dark:text-zinc-100 text-sm">{order.id}</strong>
                        <span className="text-zinc-400">|</span>
                        <span className="text-zinc-500">{order.createdAt}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Escrow Badge */}
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>{order.escrowProtectionCode}</span>
                        </span>

                        {/* Status Badge */}
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                            order.orderStatus === 'delivered'
                              ? 'bg-emerald-600 text-white'
                              : order.orderStatus === 'shipping'
                              ? 'bg-sky-500 text-white'
                              : 'bg-amber-500 text-white'
                          }`}
                        >
                          {order.orderStatus === 'delivered'
                            ? 'Đã Giao Thành Công'
                            : order.orderStatus === 'shipping'
                            ? 'Đang Vận Chuyển'
                            : 'Đang Chuẩn Bị Hàng'}
                        </span>
                      </div>
                    </div>

                    {/* Progress Stepper Timeline */}
                    <div className="grid grid-cols-4 gap-1 text-center text-[10px] sm:text-xs font-bold pt-1 pb-2">
                      <div className="space-y-1">
                        <div className="h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-emerald-700 dark:text-emerald-400">1. Đã Đặt</span>
                      </div>
                      <div className="space-y-1">
                        <div className={`h-1.5 rounded-full ${['packing', 'shipping', 'delivered'].includes(order.orderStatus) ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700'}`} />
                        <span className={['packing', 'shipping', 'delivered'].includes(order.orderStatus) ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-400'}>
                          2. Đóng Gói
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className={`h-1.5 rounded-full ${['shipping', 'delivered'].includes(order.orderStatus) ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700'}`} />
                        <span className={['shipping', 'delivered'].includes(order.orderStatus) ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-400'}>
                          3. Đang Giao
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className={`h-1.5 rounded-full ${order.orderStatus === 'delivered' ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700'}`} />
                        <span className={order.orderStatus === 'delivered' ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-400'}>
                          4. Hoàn Tất
                        </span>
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="space-y-2.5">
                      {order.items.map((line, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3">
                            <img
                              src={line.item.imageUrl}
                              alt={line.item.title}
                              className="w-12 h-12 rounded-xl object-cover shrink-0 border border-zinc-200 dark:border-zinc-700"
                            />
                            <div>
                              <strong className="text-zinc-900 dark:text-zinc-100 font-extrabold line-clamp-1">
                                {line.item.title}
                              </strong>
                              <span className="text-zinc-500 text-[11px]">
                                {line.selectedPrice.toLocaleString('vi-VN')} đ × {line.quantity}
                              </span>
                            </div>
                          </div>
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 shrink-0">
                            {(line.selectedPrice * line.quantity).toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Shipping & Payment Summary */}
                    <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 text-xs flex flex-wrap items-center justify-between gap-3 border border-zinc-100 dark:border-zinc-800">
                      <div className="space-y-0.5">
                        <span className="text-zinc-500">Đơn vị vận chuyển:</span>
                        <div className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                          <span>{carrier.icon}</span>
                          <span>{carrier.name}</span>
                          <span className="text-emerald-700 dark:text-emerald-400">({order.trackingCode})</span>
                        </div>
                      </div>

                      <div className="space-y-0.5 text-right">
                        <span className="text-zinc-500">Tổng thanh toán:</span>
                        <div className="text-base font-black text-rose-600 dark:text-rose-400">
                          {order.totalAmount.toLocaleString('vi-VN')} đ
                        </div>
                      </div>
                    </div>

                    {/* Order Action Buttons */}
                    <div className="pt-2 flex items-center justify-between text-xs">
                      <span className="text-zinc-500 text-[11px]">
                        Thanh toán: <strong className="uppercase">{order.paymentMethod}</strong> ({order.paymentStatus === 'escrow_holding' ? 'Tạm giữ an toàn' : 'Đã thanh toán'})
                      </span>

                      <div className="flex items-center gap-2">
                        {order.orderStatus !== 'delivered' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'delivered')}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer transition-colors"
                          >
                            Đã Nhận Hàng Khỏe Mạnh
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSelectedProduct(order.items[0].item);
                            setShowReviewForm(true);
                          }}
                          className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold rounded-xl text-xs cursor-pointer transition-colors"
                        >
                          Đánh Giá Người Bán ⭐
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* PRODUCT DETAIL & REVIEWS MODAL */}
      {/* ============================================================== */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-2xl w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Image Header */}
            <div className="relative h-56 sm:h-72 w-full bg-zinc-950">
              <img
                src={selectedProduct.imageUrl}
                alt={selectedProduct.title}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                <div className="bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-2xl text-white">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                    {selectedProduct.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold">
                    <Star className="w-4 h-4 fill-amber-300" />
                    <span>{selectedProduct.rating}</span>
                    <span className="text-white/80">({selectedProduct.reviewsCount} đánh giá từ khách mua)</span>
                  </div>
                </div>

                <div className="bg-rose-600 px-3 py-1.5 rounded-2xl text-white font-black text-sm sm:text-base shadow-md">
                  {selectedProduct.price.toLocaleString('vi-VN')} đ / {selectedProduct.unit}
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-5 sm:p-6 space-y-5 max-h-[55vh] overflow-y-auto text-xs sm:text-sm">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100">
                  {selectedProduct.title}
                </h3>
                <p className="text-zinc-600 dark:text-zinc-300 mt-2 leading-relaxed">
                  {selectedProduct.description}
                </p>
              </div>

              {/* Verified Seller Profile Card */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedProduct.sellerAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'}
                      alt={selectedProduct.sellerName}
                      className="w-12 h-12 rounded-2xl object-cover border border-emerald-500/50"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-zinc-900 dark:text-zinc-100 font-extrabold text-sm">
                          {selectedProduct.sellerName}
                        </strong>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                          {selectedProduct.sellerBadge || 'Nhà Vườn Uy Tín'}
                        </span>
                        <span>•</span>
                        <span>Phản hồi: {selectedProduct.sellerResponseRate || 99}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${selectedProduct.sellerPhone}`}
                      className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200 transition-colors"
                      title="Gọi điện trực tiếp cho người bán"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                    <a
                      href={`https://zalo.me/${selectedProduct.sellerZalo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 hover:bg-blue-200 transition-colors"
                      title="Nhắn tin Zalo nhà vườn"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-zinc-200/60 dark:border-zinc-700/60 text-[11px]">
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Địa điểm</span>
                    <strong className="text-zinc-700 dark:text-zinc-300">{selectedProduct.location}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Đánh giá shop</span>
                    <strong className="text-amber-500 font-bold">{selectedProduct.rating} ⭐ ({selectedProduct.reviewsCount})</strong>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Kho còn</span>
                    <strong className="text-zinc-700 dark:text-zinc-300">{selectedProduct.stock} {selectedProduct.unit}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Bảo hiểm</span>
                    <strong className="text-emerald-600 font-bold">Escrow 48h</strong>
                  </div>
                </div>
              </div>

              {/* Specifications Table */}
              {selectedProduct.specifications && (
                <div className="space-y-2">
                  <h4 className="font-extrabold text-zinc-900 dark:text-zinc-100">
                    📋 Thông Số Kỹ Thuật & Giống
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(selectedProduct.specifications).map(([key, value]) => (
                      <div key={key} className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700/60">
                        <span className="text-zinc-400 block text-[10px]">{key}</span>
                        <strong className="text-zinc-800 dark:text-zinc-200">{value}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Customer Reviews Section */}
              <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span>Đánh Giá Từ Khách Mua Hàng ({selectedProduct.reviews?.length || 0})</span>
                    </h4>
                    <span className="text-xs text-zinc-500">100% hình ảnh và trải nghiệm thật</span>
                  </div>

                  <button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold rounded-xl text-xs cursor-pointer transition-colors"
                  >
                    {showReviewForm ? 'Đóng Form' : 'Viết Đánh Giá ⭐'}
                  </button>
                </div>

                {/* Review Form */}
                {showReviewForm && (
                  <form onSubmit={handleAddReview} className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-amber-950 dark:text-amber-200">
                        Đánh giá của bạn:
                      </span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="p-1 cursor-pointer"
                          >
                            <Star className={`w-5 h-5 ${star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-zinc-300'}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <input
                      type="text"
                      value={reviewAuthor}
                      onChange={e => setReviewAuthor(e.target.value)}
                      placeholder="Tên của bạn (VD: Anh Tuấn - Nhà vườn ban công)"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    />

                    <textarea
                      rows={2}
                      required
                      value={reviewContent}
                      onChange={e => setReviewContent(e.target.value)}
                      placeholder="Chia sẻ về chất lượng cây giống/hạt giống, cách đóng gói và độ uy tín của người bán..."
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    />

                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 cursor-pointer"
                    >
                      Gửi Đánh Giá Người Bán
                    </button>
                  </form>
                )}

                {/* Reviews List */}
                <div className="space-y-2.5">
                  {(selectedProduct.reviews && selectedProduct.reviews.length > 0) ? (
                    selectedProduct.reviews.map(rev => (
                      <div
                        key={rev.id}
                        className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <strong className="text-zinc-900 dark:text-zinc-100 font-bold">{rev.authorName}</strong>
                            <span className="text-[10px] text-emerald-600 font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950">
                              Đã mua hàng
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-400">{rev.date}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-300'}`}
                            />
                          ))}
                        </div>

                        <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                          {rev.content}
                        </p>

                        {rev.sellerReply && (
                          <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 text-[11px] text-emerald-800 dark:text-emerald-300 border border-zinc-200/60 dark:border-zinc-700">
                            <strong>Phản hồi từ người bán:</strong> {rev.sellerReply}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-zinc-400 text-xs italic">Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên để lại nhận xét!</p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer (Add to Cart / Buy Now) */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 font-semibold">Số lượng:</span>
                <div className="flex items-center border border-zinc-300 dark:border-zinc-700 rounded-xl overflow-hidden bg-white dark:bg-zinc-800">
                  <button
                    onClick={() => setItemDetailQty(Math.max(1, itemDetailQty - 1))}
                    className="px-2.5 py-1 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer font-bold"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {itemDetailQty}
                  </span>
                  <button
                    onClick={() => setItemDetailQty(itemDetailQty + 1)}
                    className="px-2.5 py-1 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    addToCart(selectedProduct, itemDetailQty);
                    setSelectedProduct(null);
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 hover:bg-zinc-300 text-xs font-bold cursor-pointer transition-colors"
                >
                  Thêm Vào Giỏ
                </button>

                <button
                  onClick={() => {
                    addToCart(selectedProduct, itemDetailQty);
                    setSelectedProduct(null);
                    setShowCheckoutModal(true);
                  }}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 cursor-pointer transition-colors"
                >
                  Mua Ngay Với Escrow
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SHOPPING CART MODAL */}
      {/* ============================================================== */}
      {showCartModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-base text-zinc-900 dark:text-zinc-100">
                  Giỏ Hàng Của Bạn ({cart.reduce((s, c) => s + c.quantity, 0)})
                </h3>
              </div>
              <button
                onClick={() => setShowCartModal(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="p-4 sm:p-5 max-h-[50vh] overflow-y-auto space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <ShoppingCart className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-600" />
                  <p className="text-xs text-zinc-500">Giỏ hàng của bạn đang trống.</p>
                </div>
              ) : (
                cart.map(c => (
                  <div
                    key={c.item.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={c.item.imageUrl}
                        alt={c.item.title}
                        className="w-14 h-14 rounded-xl object-cover shrink-0 border border-zinc-200 dark:border-zinc-700"
                      />
                      <div className="space-y-0.5">
                        <strong className="text-xs font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                          {c.item.title}
                        </strong>
                        <span className="text-xs font-black text-rose-600 dark:text-rose-400 block">
                          {c.item.price.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-zinc-300 dark:border-zinc-700 rounded-xl overflow-hidden bg-white dark:bg-zinc-800">
                        <button
                          onClick={() => updateCartQuantity(c.item.id, c.quantity - 1)}
                          className="px-2 py-0.5 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 font-bold"
                        >
                          -
                        </button>
                        <span className="px-2 py-0.5 text-xs font-bold">{c.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(c.item.id, c.quantity + 1)}
                          className="px-2 py-0.5 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 font-bold"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(c.item.id)}
                        className="text-zinc-400 hover:text-rose-500 p-1 cursor-pointer"
                        title="Xóa khỏi giỏ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/60 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-zinc-500 font-semibold">Tạm tính hàng hóa:</span>
                  <strong className="text-base font-black text-zinc-900 dark:text-zinc-100">
                    {cartSubtotal.toLocaleString('vi-VN')} đ
                  </strong>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => clearCart()}
                    className="py-2.5 px-3 rounded-2xl bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold text-xs hover:bg-zinc-300 cursor-pointer"
                  >
                    Xóa Hết
                  </button>

                  <button
                    onClick={() => {
                      setShowCartModal(false);
                      setShowCheckoutModal(true);
                    }}
                    className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Tiến Hành Đặt Hàng</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECURE CHECKOUT MODAL (Vận chuyển, Thanh toán Escrow, Giảm giá) */}
      {/* ============================================================== */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-xl w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-emerald-700 text-white">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-300" />
                <h3 className="font-black text-base text-white">
                  Thanh Toán An Toàn & Đặt Hàng Escrow
                </h3>
              </div>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="text-white/80 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePlaceOrder} className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
              {/* Buyer Information */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>1. Thông Tin Nhận Hàng</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    required
                    value={buyerName}
                    onChange={e => setBuyerName(e.target.value)}
                    placeholder="Họ và tên người nhận"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-none"
                  />
                  <input
                    type="tel"
                    required
                    value={buyerPhone}
                    onChange={e => setBuyerPhone(e.target.value)}
                    placeholder="Số điện thoại nhận hàng"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-none"
                  />
                </div>

                <input
                  type="text"
                  required
                  value={buyerAddress}
                  onChange={e => setBuyerAddress(e.target.value)}
                  placeholder="Địa chỉ nhận hàng chi tiết (Số nhà, ngõ/đường, Phường/Xã, Quận/Huyện)"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-none"
                />

                <input
                  type="text"
                  value={buyerNotes}
                  onChange={e => setBuyerNotes(e.target.value)}
                  placeholder="Ghi chú thêm cho người bán hoặc bưu tá (tùy chọn)"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-none"
                />
              </div>

              {/* Shipping Carriers Option */}
              <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <h4 className="font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  <span>2. Chọn Phương Thức Vận Chuyển Cây Sống</span>
                </h4>

                <div className="space-y-2">
                  {SHIPPING_CARRIERS.map(c => (
                    <label
                      key={c.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-colors ${
                        selectedCarrier === c.id
                          ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100'
                          : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shippingCarrier"
                          value={c.id}
                          checked={selectedCarrier === c.id}
                          onChange={() => setSelectedCarrier(c.id)}
                          className="text-emerald-600"
                        />
                        <div>
                          <div className="font-bold text-xs flex items-center gap-1.5">
                            <span>{c.icon}</span>
                            <span>{c.name}</span>
                          </div>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{c.subtitle}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-black text-xs text-rose-600 dark:text-rose-400">
                          {c.fee === 0 ? 'Miễn phí' : `${c.fee.toLocaleString('vi-VN')} đ`}
                        </span>
                        <span className="block text-[10px] text-zinc-400">{c.estimateDays}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Secure Payment Options */}
              <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <h4 className="font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>3. Phương Thức Thanh Toán An Toàn (Escrow 48h)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    {
                      id: 'cod' as const,
                      title: 'COD (Thanh toán khi nhận hàng)',
                      desc: 'Kiểm tra cây tươi xanh trước khi trả tiền',
                      icon: <DollarSign className="w-4 h-4 text-emerald-600" />
                    },
                    {
                      id: 'vietqr' as const,
                      title: 'Chuyển Khoản VietQR Napas 24/7',
                      desc: 'Mã QR tự động, tiền giữ tại tài khoản Escrow',
                      icon: <QrCode className="w-4 h-4 text-blue-600" />
                    },
                    {
                      id: 'momo' as const,
                      title: 'Ví Điện Tử MoMo',
                      desc: 'Bảo chứng giao dịch sinh học an toàn',
                      icon: <Sparkles className="w-4 h-4 text-pink-600" />
                    },
                    {
                      id: 'vnpay' as const,
                      title: 'Cổng VNPay-QR',
                      desc: 'Quét thẻ ATM nội địa / Visa / Master',
                      icon: <CreditCard className="w-4 h-4 text-indigo-600" />
                    }
                  ].map(pay => (
                    <label
                      key={pay.id}
                      className={`p-3 rounded-2xl border flex items-start gap-2.5 cursor-pointer transition-colors ${
                        selectedPaymentMethod === pay.id
                          ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40'
                          : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={pay.id}
                        checked={selectedPaymentMethod === pay.id}
                        onChange={() => setSelectedPaymentMethod(pay.id)}
                        className="mt-0.5 text-emerald-600"
                      />
                      <div className="space-y-0.5">
                        <div className="font-bold text-xs flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100">
                          {pay.icon}
                          <span>{pay.title}</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{pay.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* If VietQR selected, render dynamic VietQR generator preview */}
                {selectedPaymentMethod === 'vietqr' && (
                  <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-200">
                      <span>Mã Thanh Toán VietQR Tạm Giữ Escrow:</span>
                      <span>Napas 24/7</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-20 rounded-xl bg-white p-1 border border-blue-300 flex items-center justify-center shrink-0">
                        <QrCode className="w-16 h-16 text-blue-900" />
                      </div>
                      <div className="text-[11px] space-y-0.5 text-zinc-600 dark:text-zinc-300">
                        <p><strong>Ngân hàng:</strong> Vietcombank (Napas 24/7)</p>
                        <p><strong>Số tài khoản:</strong> 9988386123 (Escrow Nông Trợ Xanh)</p>
                        <p><strong>Số tiền:</strong> <span className="font-bold text-rose-600">{cartGrandTotal.toLocaleString('vi-VN')} đ</span></p>
                        <p><strong>Nội dung:</strong> <span className="font-mono bg-white dark:bg-zinc-800 px-1 rounded font-bold">NTX {buyerPhone.slice(-4)} MUA CAY</span></p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Voucher Code Section */}
              <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-amber-500" />
                    Mã Giảm Giá Nông Nghiệp:
                  </span>
                  <div className="flex gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setVoucherCodeInput('VUONXANH10')}
                      className="text-emerald-600 underline font-bold cursor-pointer"
                    >
                      VUONXANH10
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setVoucherCodeInput('FREESHIP')}
                      className="text-emerald-600 underline font-bold cursor-pointer"
                    >
                      FREESHIP
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={voucherCodeInput}
                    onChange={e => setVoucherCodeInput(e.target.value)}
                    placeholder="Nhập mã VUONXANH10 hoặc FREESHIP"
                    className="flex-1 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs uppercase font-bold focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyVoucher}
                    className="px-4 py-2 bg-zinc-800 dark:bg-zinc-700 hover:bg-zinc-900 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Áp Dụng
                  </button>
                </div>

                {voucherError && <p className="text-[11px] text-rose-500 font-bold">{voucherError}</p>}
                {appliedVoucher && (
                  <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Đã áp dụng mã {appliedVoucher.code} ({appliedVoucher.freeShip ? 'Miễn phí giao hàng' : `Giảm ${appliedVoucher.discountPercent}%`})
                  </p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 space-y-1.5 text-xs border border-zinc-100 dark:border-zinc-700/60">
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Tiền hàng ({cart.length} món):</span>
                  <span>{cartSubtotal.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Phí vận chuyển ({selectedCarrierInfo.name.split('(')[0]}):</span>
                  <span>{baseShippingFee === 0 ? 'Miễn phí' : `${baseShippingFee.toLocaleString('vi-VN')} đ`}</span>
                </div>
                {voucherDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Giảm giá voucher:</span>
                    <span>-{voucherDiscount.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 flex justify-between text-sm font-black text-zinc-900 dark:text-zinc-100">
                  <span>Tổng thanh toán:</span>
                  <span className="text-base text-rose-600 dark:text-rose-400">
                    {cartGrandTotal.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

              {/* Escrow Guarantee Statement */}
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-[11px] text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Bảo đảm Escrow Nông Trợ Xanh:</strong> Người bán chỉ nhận được tiền khi bạn bấm "Đã nhận hàng khỏe mạnh". Cam kết đền bù 100% nếu cây bị sốc nhiệt, gãy dập hoặc hạt không nảy mầm.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="px-4 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs cursor-pointer"
                >
                  Quay Lại Giỏ
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  Xác Nhận Đặt Hàng ({cartGrandTotal.toLocaleString('vi-VN')} đ)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* CHECKOUT SUCCESS MODAL (Hoá Đơn & Mã Vận Đơn) */}
      {/* ============================================================== */}
      {checkoutSuccessOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 text-center space-y-4 my-auto animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                Đặt Hàng Thành Công!
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Đơn hàng của bạn đã được tiếp nhận và kích hoạt bảo hiểm tạm giữ Escrow an toàn.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 text-left text-xs space-y-2 border border-zinc-100 dark:border-zinc-700">
              <div className="flex justify-between">
                <span className="text-zinc-400">Mã đơn hàng:</span>
                <strong className="text-zinc-900 dark:text-zinc-100">{checkoutSuccessOrder.id}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Mã vận đơn bưu cục:</span>
                <strong className="text-emerald-700 dark:text-emerald-400">{checkoutSuccessOrder.trackingCode}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Mã bảo hiểm Escrow:</span>
                <strong className="text-emerald-700 dark:text-emerald-400">{checkoutSuccessOrder.escrowProtectionCode}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Tổng thanh toán:</span>
                <strong className="text-rose-600 font-black">{checkoutSuccessOrder.totalAmount.toLocaleString('vi-VN')} đ</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Người nhận:</span>
                <span className="text-zinc-700 dark:text-zinc-300">{checkoutSuccessOrder.buyerName} - {checkoutSuccessOrder.buyerPhone}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => {
                  setCheckoutSuccessOrder(null);
                  setActiveMarketTab('orders');
                }}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-colors cursor-pointer"
              >
                Xem Lộ Trình Vận Chuyển Đơn Hàng →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
