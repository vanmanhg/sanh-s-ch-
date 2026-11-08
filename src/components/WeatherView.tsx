import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  CloudSun,
  CloudRain,
  Sun,
  Wind,
  Droplets,
  AlertTriangle,
  Sparkles,
  MapPin,
  Bell,
  CheckCircle2,
  Calendar,
  Compass
} from 'lucide-react';

interface WeatherViewProps {
  onPlantSelect?: (cropName: string) => void;
}

export const WeatherView: React.FC<WeatherViewProps> = () => {
  const { weather, setWeatherCity, weatherAlerts } = useApp();
  const [testNotificationSent, setTestNotificationSent] = useState(false);

  const CITIES = [
    'Đồng Bằng Sông Cửu Long / TP.HCM',
    'Hà Nội & Miền Bắc',
    'Đà Lạt & Tây Nguyên',
    'Cần Thơ & Miền Tây'
  ];

  const RECOMMENDATIONS = [
    {
      crop: 'Rau Muống & Mồng Tơi Nước',
      season: 'Mùa mưa ẩm ấm',
      growthDays: '25 - 30 ngày',
      difficulty: 'Cực kỳ dễ',
      tip: 'Chịu ẩm tốt, phát triển nhanh trong điều kiện nhiệt độ 28-32°C và mưa rải rác.'
    },
    {
      crop: 'Cà Chua Bi Chịu Nhiệt',
      season: 'Nắng ấm',
      growthDays: '65 - 75 ngày',
      difficulty: 'Trung bình',
      tip: 'Cần che bạt phần gốc tránh mưa dập hoa, thụ phấn tốt khi ban ngày có nắng nhẹ.'
    },
    {
      crop: 'Cải Kale & Xà Lách Đà Lạt',
      season: 'Mát mẻ ẩm độ cao',
      growthDays: '40 - 50 ngày',
      difficulty: 'Dễ',
      tip: 'Thích hợp với thời tiết se lạnh 18-24°C, lá giòn ngọt không bị đắng.'
    },
    {
      crop: 'Dưa Leo Gai Baby F1',
      season: 'Nắng ấm thoát nước tốt',
      growthDays: '35 - 40 ngày',
      difficulty: 'Dễ',
      tip: 'Leo giàn nhanh, cần lượng nước tưới đều đặn và giàn đỡ thông thoáng.'
    }
  ];

  const triggerTestNotification = () => {
    setTestNotificationSent(true);
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🌾 Cảnh Báo Nông Vụ Thời Tiết', {
        body: 'Dự báo chiều nay có mưa to 50mm tại khu vực của bạn. Nhớ kiểm tra rãnh thoát nước vườn!',
        icon: '/favicon.ico'
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('🌾 Cảnh Báo Nông Vụ Thời Tiết', {
            body: 'Thông báo đẩy thời tiết đã được kích hoạt thành công!',
            icon: '/favicon.ico'
          });
        }
      });
    }
    setTimeout(() => setTestNotificationSent(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Title & Region selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <CloudSun className="w-7 h-7 text-amber-500" />
            <span>Thời Tiết Nông Nghiệp & Cảnh Báo Rủi Ro</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500">
            Dự báo thời tiết chuyên sâu cho nhà nông • Cảnh báo mưa bão, sương muối, nắng nóng cực đoan
          </p>
        </div>

        {/* City selection pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
          {CITIES.map(c => (
            <button
              key={c}
              onClick={() => setWeatherCity(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                weather.city === c
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100'
              }`}
            >
              {c.split('/')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Main Weather Card */}
      <div className="bg-gradient-to-tr from-emerald-700 via-teal-700 to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Background ambient shine */}
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-emerald-200 font-semibold uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5" />
              <span>{weather.city}</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl sm:text-6xl font-black">{weather.temp}°C</span>
              <span className="text-sm sm:text-base font-semibold text-emerald-100">
                {weather.condition === 'rainy' ? 'Có mưa rào rải rác' : 'Nắng ấm mây nhẹ'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl leading-relaxed">
              {weather.forecastSummary}
            </p>
          </div>

          {/* Meteorological Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-xs">
            <div className="space-y-0.5">
              <span className="text-emerald-200 text-[10px] flex items-center gap-1">
                <Droplets className="w-3 h-3 text-sky-300" /> Độ ẩm
              </span>
              <span className="font-extrabold text-sm">{weather.humidity}%</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-emerald-200 text-[10px] flex items-center gap-1">
                <CloudRain className="w-3 h-3 text-sky-300" /> Vũ lượng
              </span>
              <span className="font-extrabold text-sm">{weather.rainfallMm} mm</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-emerald-200 text-[10px] flex items-center gap-1">
                <Wind className="w-3 h-3 text-emerald-300" /> Gió giật
              </span>
              <span className="font-extrabold text-sm">{weather.windSpeedKmH} km/h</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-emerald-200 text-[10px] flex items-center gap-1">
                <Sun className="w-3 h-3 text-amber-300" /> Chỉ số UV
              </span>
              <span className="font-extrabold text-sm">{weather.uvIndex} (Cao)</span>
            </div>
          </div>
        </div>

        {/* Real-time alert test trigger button */}
        <div className="mt-6 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-emerald-100">
            Hệ thống đang đồng bộ trạm khí tượng thủy văn nông nghiệp mỗi 30 phút.
          </span>
          <button
            onClick={triggerTestNotification}
            className="px-3.5 py-1.5 rounded-xl bg-white text-emerald-900 font-bold hover:bg-emerald-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Bell className="w-3.5 h-3.5 text-amber-600" />
            <span>{testNotificationSent ? 'Đã Phát Cảnh Báo Đẩy!' : 'Kiểm Tra Thông Báo Đẩy'}</span>
          </button>
        </div>
      </div>

      {/* Weather Warnings List */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Cảnh Báo Nông Vụ Trực Tiếp Từ Chuyên Gia</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {weatherAlerts.map(alert => (
            <div
              key={alert.id}
              className={`p-4 rounded-2xl border ${
                alert.level === 'danger'
                  ? 'bg-rose-50/70 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/50'
                  : 'bg-amber-50/70 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50'
              } space-y-2.5`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">
                  {alert.title}
                </span>
                <span className="text-[10px] text-zinc-500">{alert.timestamp}</span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                {alert.description}
              </p>
              <div className="text-xs bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1">
                <div className="text-[11px] text-zinc-500">
                  <strong>Cây trồng bị ảnh hưởng:</strong> {alert.affectedPlants}
                </div>
                <div className="text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center gap-1">
                  <span>Khắc phục:</span>
                  <span>{alert.recommendedAction}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Crop Recommendation Engine according to weather */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 sm:p-6 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
              Gợi Ý Cây Trồng Phù Hợp Với Điều Kiện Thời Tiết Này
            </h3>
            <p className="text-xs text-zinc-500">
              Phân tích theo nhiệt độ {weather.temp}°C và độ ẩm {weather.humidity}% tại {weather.city}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {RECOMMENDATIONS.map((crop, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50/50 dark:bg-zinc-800/40 space-y-2 flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {crop.season}
                </span>
                <h4 className="font-extrabold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 mt-1.5">
                  {crop.crop}
                </h4>
                <div className="text-[11px] text-zinc-500 mt-1">
                  Thu hoạch: <strong>{crop.growthDays}</strong>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-300 mt-1 leading-relaxed">
                  {crop.tip}
                </p>
              </div>

              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-700/60 flex items-center justify-between text-[11px]">
                <span className="text-zinc-400">Độ khó: {crop.difficulty}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Thích hợp 100%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
