import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MarketItem } from '../types';
import {
  ShoppingBag,
  ShoppingCart,
  Star,
  MapPin,
  CheckCircle,
  Plus,
  Trash2,
  X,
  Phone,
  MessageCircle,
  Leaf,
  Filter
} from 'lucide-react';

export const MarketView: React.FC = () => {
  const { marketItems, cart, addToCart, removeFromCart, clearCart, t } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCartModal, setShowCartModal] = useState<boolean>(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState<boolean>(false);

  // Checkout form state
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');

  const filteredItems = marketItems.filter(item => {
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  });

  const cartTotal = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setCheckoutSuccess(true);
    setTimeout(() => {
      clearCart();
      setCheckoutSuccess(false);
      setShowCartModal(false);
      alert('🎉 Đặt đơn hàng thành công! Người bán sẽ liên hệ xác nhận và giao hàng tận nơi.');
    }, 1500);
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold mb-1">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Sàn Thương Mại Nông Sản & Cây Cảnh Trực Tuyến</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
            Chợ Nông Sản, Cây Giống & Vật Tư
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500">
            Mua bán trực tiếp từ nhà vườn uy tín • Nông sản sạch VietGAP • Đảm bảo chất lượng & bảo hành cây
          </p>
        </div>

        {/* Cart Trigger Button */}
        <button
          onClick={() => setShowCartModal(true)}
          className="relative flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-emerald-700 transition-colors cursor-pointer"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Giỏ Hàng</span>
          {cart.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-400 text-emerald-950 text-[10px] font-black flex items-center justify-center">
              {cart.reduce((s, c) => s + c.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      {/* Categories */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'all', label: 'Tất cả sản phẩm' },
          { id: 'plant', label: 'Cây Kiểng & Bonsai' },
          { id: 'produce', label: 'Nông Sản Chín Cây' },
          { id: 'fertilizer', label: 'Phân Hữu Cơ' },
          { id: 'tool', label: 'Dụng Cụ Làm Vườn' }
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

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredItems.map(item => (
          <div
            key={item.id}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="relative h-44 w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
                {item.isOrganic && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-600 text-white flex items-center gap-1 shadow-xs">
                    <Leaf className="w-3 h-3" />
                    Hữu Cơ 100%
                  </div>
                )}
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs flex items-center gap-0.5">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span>{item.rating}</span>
                </div>
              </div>

              <div className="p-3.5 space-y-2">
                <h4 className="font-extrabold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 line-clamp-2">
                  {item.title}
                </h4>
                <div className="text-[11px] text-zinc-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-zinc-400" />
                  <span className="truncate">{item.sellerName} ({item.location.split(',')[0]})</span>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                      {item.price.toLocaleString('vi-VN')} đ
                    </span>
                    <span className="text-[10px] text-zinc-400 ml-1">/ {item.unit}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400">Còn {item.stock}</span>
                </div>
              </div>
            </div>

            {/* Actions: Direct Zalo chat or Add to Cart */}
            <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 flex items-center gap-2">
              <a
                href={`https://zalo.me/${item.sellerZalo}`}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 font-bold text-xs"
                title="Nhắn Zalo trực tiếp với nhà vườn"
              >
                <MessageCircle className="w-4 h-4" />
              </a>

              <button
                onClick={() => addToCart(item)}
                className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Thêm Vào Giỏ</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* SHOPPING CART & CHECKOUT MODAL */}
      {showCartModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-lg w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-600" />
                <span>Giỏ Hàng Nông Sản & Cây Trồng ({cart.length} món)</span>
              </h3>
              <button onClick={() => setShowCartModal(false)}>
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-xs">
                Chưa có sản phẩm nào trong giỏ hàng. Hãy chọn nông sản hoặc cây cảnh yêu thích!
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {cart.map(c => (
                  <div
                    key={c.item.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={c.item.imageUrl}
                        alt={c.item.title}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div>
                        <div className="font-bold text-zinc-800 dark:text-zinc-200 line-clamp-1 max-w-[180px]">
                          {c.item.title}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          {c.item.price.toLocaleString('vi-VN')} đ × {c.quantity}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                        {(c.item.price * c.quantity).toLocaleString('vi-VN')} đ
                      </span>
                      <button
                        onClick={() => removeFromCart(c.item.id)}
                        className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {cart.length > 0 && (
              <>
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                  <span>Tổng tiền thanh toán:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 text-base">
                    {cartTotal.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                <form onSubmit={handleCheckout} className="space-y-2.5 text-xs pt-1">
                  <div>
                    <label className="font-semibold block mb-0.5 text-zinc-700 dark:text-zinc-300">
                      Họ và tên người nhận
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nguyễn Văn A"
                      value={buyerName}
                      onChange={e => setBuyerName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold block mb-0.5 text-zinc-700 dark:text-zinc-300">
                        Số điện thoại
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="09xx..."
                        value={buyerPhone}
                        onChange={e => setBuyerPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-0.5 text-zinc-700 dark:text-zinc-300">
                        Phương thức
                      </label>
                      <select className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                        <option>Thanh toán COD khi nhận hàng</option>
                        <option>Chuyển khoản VietQR</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold block mb-0.5 text-zinc-700 dark:text-zinc-300">
                      Địa chỉ nhận hàng
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Số nhà, đường, phường/xã, quận/huyện..."
                      value={buyerAddress}
                      onChange={e => setBuyerAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCartModal(false)}
                      className="flex-1 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold"
                    >
                      Tiếp tục xem hàng
                    </button>
                    <button
                      type="submit"
                      disabled={checkoutSuccess}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 cursor-pointer shadow-md"
                    >
                      {checkoutSuccess ? 'Đang xác nhận đơn...' : 'Xác Nhận Đặt Hàng'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
