import React, { useState } from 'react';
import { CARE_SERVICES, AGRI_EXPERTS } from '../data/mockData';
import { CareBookingService, AgriculturalExpert } from '../types';
import {
  CalendarCheck,
  UserCheck,
  Scissors,
  Stethoscope,
  Droplets,
  Star,
  Phone,
  MessageCircle,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  X,
  Sparkles
} from 'lucide-react';

export const ServicesView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'booking' | 'experts'>('booking');
  const [selectedService, setSelectedService] = useState<CareBookingService | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);

  // Booking form state
  const [bookDate, setBookDate] = useState<string>('');
  const [bookTime, setBookTime] = useState<string>('08:30');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [customerNotes, setCustomerNotes] = useState<string>('');

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    setBookingSuccess(true);
    setTimeout(() => {
      alert(
        `🎉 Đặt lịch chăm sóc thành công cho dịch vụ: "${selectedService.title}". Kỹ thuật viên sẽ liên hệ số ${customerPhone} trước khi đến!`
      );
      setBookingSuccess(false);
      setSelectedService(null);
    }, 1200);
  };

  const getServiceIcon = (name: string) => {
    switch (name) {
      case 'Scissors':
        return <Scissors className="w-6 h-6 text-emerald-600" />;
      case 'Stethoscope':
        return <Stethoscope className="w-6 h-6 text-rose-500" />;
      default:
        return <Droplets className="w-6 h-6 text-sky-500" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Header & Sub-tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <CalendarCheck className="w-7 h-7 text-emerald-600" />
            <span>Đặt Lịch Chăm Sóc Cây & Tư Vấn Chuyên Gia</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500">
            Dịch vụ thợ lành nghề chăm cây tận nhà • Kết nối trực tiếp cùng các kỹ sư & tiến sĩ nông nghiệp hàng đầu
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('booking')}
            className={`px-3.5 py-1.5 rounded-xl cursor-pointer transition-colors ${
              activeTab === 'booking'
                ? 'bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400'
            }`}
          >
            Chăm Sóc Cây Tại Nhà
          </button>
          <button
            onClick={() => setActiveTab('experts')}
            className={`px-3.5 py-1.5 rounded-xl cursor-pointer transition-colors ${
              activeTab === 'experts'
                ? 'bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400'
            }`}
          >
            Đội Ngũ Chuyên Gia Nông Nghiệp
          </button>
        </div>
      </div>

      {/* TAB 1: HOME CARE BOOKING SERVICES */}
      {activeTab === 'booking' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {CARE_SERVICES.map(svc => (
              <div
                key={svc.id}
                className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-xs hover:border-emerald-500/50 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    {getServiceIcon(svc.iconName)}
                  </div>

                  <div>
                    <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
                      {svc.title}
                    </h3>
                    <div className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-1">
                      {svc.pricePerSession.toLocaleString('vi-VN')} đ{' '}
                      <span className="text-xs font-normal text-zinc-400">/ {svc.unit}</span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    {svc.description}
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    {svc.highlights.map((hl, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{hl}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-5">
                  <button
                    onClick={() => setSelectedService(svc)}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors cursor-pointer shadow-xs"
                  >
                    Đặt Lịch Định Kỳ Ngay
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: AGRICULTURAL EXPERTS DIRECTORY */}
      {activeTab === 'experts' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {AGRI_EXPERTS.map(exp => (
            <div
              key={exp.id}
              className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <img
                      src={exp.avatar}
                      alt={exp.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500"
                    />
                    {exp.isOnline && (
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900" />
                    )}
                  </div>

                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
                      {exp.name}
                    </h3>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">{exp.title}</p>
                    <p className="text-[11px] text-zinc-400">{exp.organization}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs bg-zinc-50 dark:bg-zinc-800/60 p-2.5 rounded-xl">
                  <div className="flex items-center gap-1 text-amber-500 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                    <span>{exp.rating} ({exp.reviewsCount})</span>
                  </div>
                  <span className="text-zinc-500">{exp.experienceYears} năm kinh nghiệm</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-zinc-500">Chuyên môn tư vấn:</span>
                  <div className="flex flex-wrap gap-1">
                    {exp.specialty.map((sp, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-semibold"
                      >
                        {sp}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Consultation actions */}
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                <a
                  href={`https://zalo.me/${exp.zalo}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 px-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 font-bold text-xs flex items-center justify-center gap-1"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Chat Zalo</span>
                </a>

                <a
                  href={`tel:${exp.phone}`}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs flex items-center justify-center gap-1"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Gọi Tư Vấn</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BOOKING MODAL */}
      {selectedService && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-lg w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Đặt Lịch Định Kỳ</span>
                <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
                  {selectedService.title}
                </h3>
              </div>
              <button onClick={() => setSelectedService(null)}>
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1 text-zinc-700 dark:text-zinc-300">
                    Ngày hẹn mong muốn
                  </label>
                  <input
                    type="date"
                    required
                    value={bookDate}
                    onChange={e => setBookDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-zinc-700 dark:text-zinc-300">
                    Khung giờ thợ đến
                  </label>
                  <select
                    value={bookTime}
                    onChange={e => setBookTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                  >
                    <option value="08:00 - 10:00">Buổi sáng: 08:00 - 10:00</option>
                    <option value="10:00 - 12:00">Buổi sáng: 10:00 - 12:00</option>
                    <option value="14:00 - 16:00">Buổi chiều: 14:00 - 16:00</option>
                    <option value="16:00 - 18:00">Buổi chiều: 16:00 - 18:00</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-zinc-700 dark:text-zinc-300">
                  Họ và tên khách hàng
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Lê Thị Ngọc"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-zinc-700 dark:text-zinc-300">
                  Số điện thoại liên hệ
                </label>
                <input
                  type="text"
                  required
                  placeholder="09xx..."
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-zinc-700 dark:text-zinc-300">
                  Địa chỉ nhà / vườn (Khu vực kỹ thuật viên đến)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Số nhà, đường, phường, quận..."
                  value={customerAddress}
                  onChange={e => setCustomerAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-zinc-700 dark:text-zinc-300">
                  Yêu cầu thêm (Số lượng cây, hiện trạng cây...)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: 5 chậu Monstera cần thay đất mới và xử lý vàng lá..."
                  value={customerNotes}
                  onChange={e => setCustomerNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedService(null)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={bookingSuccess}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 cursor-pointer shadow-md"
                >
                  {bookingSuccess ? 'Đang gửi thông tin...' : 'Xác Nhận Đặt Lịch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
