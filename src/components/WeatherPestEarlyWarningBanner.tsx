import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { WeatherPestRiskAlert } from '../types';
import {
  AlertTriangle,
  Bug,
  Droplets,
  CloudRain,
  Sun,
  Wind,
  Bell,
  BellOff,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Bot,
  ShieldAlert,
  Sparkles,
  Info,
  X,
  ExternalLink
} from 'lucide-react';

interface WeatherPestEarlyWarningBannerProps {
  onAskChatbot?: (prompt: string) => void;
  onNavigateToDiagnosis?: () => void;
}

export const WeatherPestEarlyWarningBanner: React.FC<WeatherPestEarlyWarningBannerProps> = ({
  onAskChatbot,
  onNavigateToDiagnosis
}) => {
  const {
    weatherPestAlerts,
    weather,
    isPestPushEnabled,
    togglePestPushNotifications,
    triggerPestPushCheck,
    requestPushPermission,
    pushNotificationPermission,
    t
  } = useApp();

  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [selectedAlertForModal, setSelectedAlertForModal] = useState<WeatherPestRiskAlert | null>(null);
  const [testNotificationSent, setTestNotificationSent] = useState<boolean>(false);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>([]);
  const [handledAlertIds, setHandledAlertIds] = useState<string[]>([]);

  const activeAlerts = weatherPestAlerts.filter(a => !dismissedAlertIds.includes(a.id));

  if (activeAlerts.length === 0) {
    return null;
  }

  const criticalCount = activeAlerts.filter(a => a.riskLevel === 'critical').length;
  const topAlert = activeAlerts[0];

  const handleTestPush = async () => {
    setTestNotificationSent(true);
    await triggerPestPushCheck(true);
    setTimeout(() => setTestNotificationSent(false), 3500);
  };

  const handleConsultAI = (alert: WeatherPestRiskAlert) => {
    const prompt = `Thời tiết hiện tại ${alert.weatherCondition.temp}°C, độ ẩm ${alert.weatherCondition.humidity}%, mưa ${alert.weatherCondition.rainfallMm}mm tại ${weather.city.split('/')[0]}. Cây ${alert.plantName} trong vườn của tôi đang có nguy cơ ${alert.riskScore}% mắc ${alert.pestDiseaseName}. Xin Bác Sĩ Cây Trồng hướng dẫn phác đồ phòng trị sinh học khẩn cấp để bảo vệ cây!`;
    if (onAskChatbot) {
      onAskChatbot(prompt);
    }
  };

  const toggleHandled = (alertId: string) => {
    setHandledAlertIds(prev =>
      prev.includes(alertId) ? prev.filter(id => id !== alertId) : [...prev, alertId]
    );
  };

  const dismissAlert = (alertId: string) => {
    setDismissedAlertIds(prev => [...prev, alertId]);
  };

  return (
    <>
      <div className="bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-orange-500/15 dark:from-amber-950/40 dark:via-rose-950/40 dark:to-orange-950/40 border-b border-amber-300 dark:border-amber-900/60 transition-all shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
          {/* Main Banner Header Line */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/20 animate-pulse">
                <Bug className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    Cảnh Báo Sớm Sâu Bệnh Theo Thời Tiết
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white animate-bounce shadow-xs">
                    {criticalCount > 0 ? `${criticalCount} khẩn cấp` : `${activeAlerts.length} cây có rủi ro`}
                  </span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden lg:inline">
                    • Khí hậu: {weather.temp}°C | Ẩm: {weather.humidity}% | Mưa: {weather.rainfallMm}mm
                  </span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-300 line-clamp-1 max-w-2xl mt-0.5">
                  <strong className="text-rose-700 dark:text-rose-400">{topAlert.plantName}</strong>: {topAlert.triggerReason}
                </p>
              </div>
            </div>

            {/* Right Quick Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Push Notification Toggle Button */}
              <button
                onClick={handleTestPush}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                title="Gửi thử thông báo đẩy sâu bệnh ra thanh thông báo thiết bị"
              >
                <Bell className="w-3.5 h-3.5 animate-ring" />
                <span className="hidden sm:inline">
                  {testNotificationSent ? 'Đã Gửi Đẩy!' : 'Phát Thông Báo Đẩy'}
                </span>
              </button>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                title={isExpanded ? 'Thu gọn' : 'Xem chi tiết rủi ro'}
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Expanded Cards View */}
          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-amber-200/80 dark:border-amber-900/60 space-y-3">
              {/* Push Permission & Settings Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xs border border-amber-200 dark:border-zinc-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-amber-600" />
                    Tự động gửi thông báo đẩy khi có rủi ro:
                  </span>
                  <button
                    onClick={togglePestPushNotifications}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold cursor-pointer transition-colors ${
                      isPestPushEnabled
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                        : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}
                  >
                    {isPestPushEnabled ? 'Đang Bật' : 'Đang Tắt'}
                  </button>
                </div>

                <div className="flex items-center gap-2 text-zinc-500 text-[11px]">
                  <span>
                    Quyền trình duyệt:{' '}
                    <strong className={pushNotificationPermission === 'granted' ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                      {pushNotificationPermission === 'granted'
                        ? 'Đã Cho Phép (Sẵn sàng)'
                        : pushNotificationPermission === 'denied'
                        ? 'Bị Chặn'
                        : 'Chưa Cấp Quyền'}
                    </strong>
                  </span>
                  {pushNotificationPermission !== 'granted' && (
                    <button
                      onClick={() => requestPushPermission()}
                      className="text-emerald-700 dark:text-emerald-400 underline font-bold cursor-pointer hover:text-emerald-800"
                    >
                      Bật Ngay
                    </button>
                  )}
                </div>
              </div>

              {/* Plant Alert Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeAlerts.map(alert => {
                  const isHandled = handledAlertIds.includes(alert.id);
                  return (
                    <div
                      key={alert.id}
                      className={`relative rounded-2xl p-3.5 border transition-all flex flex-col justify-between space-y-3 ${
                        isHandled
                          ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50 opacity-90'
                          : alert.riskLevel === 'critical'
                          ? 'bg-white dark:bg-zinc-900 border-rose-300 dark:border-rose-900/60 shadow-xs'
                          : 'bg-white dark:bg-zinc-900 border-amber-300 dark:border-amber-900/60 shadow-xs'
                      }`}
                    >
                      {/* Header */}
                      <div className="space-y-2">
                        <div className="flex items-start gap-3">
                          <img
                            src={alert.plantImage}
                            alt={alert.plantName}
                            className="w-14 h-14 rounded-xl object-cover shrink-0 border border-zinc-200 dark:border-zinc-700"
                          />
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-extrabold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 truncate">
                                {alert.plantName}
                              </span>
                              <button
                                onClick={() => dismissAlert(alert.id)}
                                className="text-zinc-400 hover:text-zinc-600 p-0.5"
                                title="Bỏ qua cảnh báo này"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 line-clamp-1">
                              ⚠️ {alert.pestDiseaseName}
                            </p>
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <span
                                className={`px-2 py-0.2 rounded text-[10px] font-extrabold ${
                                  alert.riskScore >= 80
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                                }`}
                              >
                                Nguy cơ {alert.riskScore}%
                              </span>
                              <span className="text-[10px] text-zinc-400">
                                {alert.pathogenType}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Weather Trigger Bar */}
                        <div className="grid grid-cols-3 gap-1.5 bg-zinc-50 dark:bg-zinc-800/60 p-2 rounded-xl text-[11px] text-zinc-600 dark:text-zinc-300">
                          <div className="flex items-center gap-1">
                            <Sun className="w-3 h-3 text-amber-500 shrink-0" />
                            <span>{alert.weatherCondition.temp}°C</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Droplets className="w-3 h-3 text-sky-500 shrink-0" />
                            <span>Ẩm {alert.weatherCondition.humidity}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CloudRain className="w-3 h-3 text-indigo-500 shrink-0" />
                            <span>Mưa {alert.weatherCondition.rainfallMm}mm</span>
                          </div>
                        </div>

                        {/* Immediate Action Advice */}
                        <div className="text-xs text-zinc-700 dark:text-zinc-300 bg-amber-50/60 dark:bg-amber-950/30 p-2 rounded-xl border border-amber-200/50 dark:border-amber-900/30">
                          <p className="font-semibold text-amber-900 dark:text-amber-300 text-[11px]">
                            💡 Cần làm ngay:
                          </p>
                          <p className="text-[11px] mt-0.5 line-clamp-2">{alert.immediateAction}</p>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-1.5 text-xs">
                        <button
                          onClick={() => setSelectedAlertForModal(alert)}
                          className="px-2.5 py-1 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg font-bold text-[11px] cursor-pointer transition-colors"
                        >
                          Xem toa thuốc & triệu chứng →
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleConsultAI(alert)}
                            className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 hover:bg-purple-200 transition-colors cursor-pointer"
                            title="Hỏi Bác Sĩ Cây Trồng AI về cách trị bệnh này"
                          >
                            <Bot className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => toggleHandled(alert.id)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isHandled
                                ? 'bg-emerald-600 text-white'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-emerald-100 hover:text-emerald-700'
                            }`}
                            title={isHandled ? 'Đã đánh dấu xử lý xong' : 'Đánh dấu đã thực hiện phòng ngừa'}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DETAILED PEST & DISEASE MODAL */}
      {selectedAlertForModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-xl w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="relative h-44 w-full">
              <img
                src={selectedAlertForModal.plantImage}
                alt={selectedAlertForModal.plantName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex items-end p-4">
                <div className="text-white space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-600 uppercase tracking-wider">
                      Nguy cơ {selectedAlertForModal.riskScore}%
                    </span>
                    <span className="text-xs text-zinc-300">
                      Tác nhân: {selectedAlertForModal.pathogenType}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-lg sm:text-xl text-white">
                    {selectedAlertForModal.pestDiseaseName}
                  </h3>
                  <p className="text-xs text-zinc-300 italic">
                    Trên cây: {selectedAlertForModal.plantName} ({selectedAlertForModal.plantScientificName})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedAlertForModal(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto text-xs sm:text-sm">
              {/* Weather Mechanism Explanation */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-900/40 space-y-1">
                <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Cơ chế kích hoạt do thời tiết hôm nay:</span>
                </div>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-xs">
                  {selectedAlertForModal.weatherCondition.description}
                </p>
              </div>

              {/* Early Symptoms to Scout */}
              <div className="space-y-1.5">
                <h4 className="font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  🔍 Triệu chứng ban đầu cần soi kỹ trên lá/thân:
                </h4>
                <ul className="space-y-1 text-xs text-zinc-600 dark:text-zinc-300 pl-4 list-disc">
                  {selectedAlertForModal.symptomsToWatch.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>

              {/* Action & Organic Remedies */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  🌿 Phác đồ phòng ngừa & điều trị sinh học hữu cơ:
                </h4>
                <div className="space-y-1.5">
                  {selectedAlertForModal.organicRemedies.map((remedy, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 text-xs flex items-start gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{remedy}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preventive Measures */}
              <div className="space-y-1.5">
                <h4 className="font-extrabold text-zinc-900 dark:text-zinc-100">
                  🛡️ Biện pháp canh tác lâu dài:
                </h4>
                <ul className="space-y-1 text-xs text-zinc-600 dark:text-zinc-300 pl-4 list-disc">
                  {selectedAlertForModal.preventionAdvice.map((advice, idx) => (
                    <li key={idx}>{advice}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  const alert = selectedAlertForModal;
                  setSelectedAlertForModal(null);
                  handleConsultAI(alert);
                }}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
              >
                <Bot className="w-4 h-4" />
                <span>Hỏi Bác Sĩ AI Về Bệnh Này</span>
              </button>

              <button
                onClick={() => setSelectedAlertForModal(null)}
                className="px-4 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-bold hover:bg-zinc-300 transition-colors cursor-pointer"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
