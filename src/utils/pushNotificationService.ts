import { WeatherAlert, WeatherCondition, WeatherPestRiskAlert } from '../types';

const STORAGE_KEY_ENABLED = 'nongtro_pest_push_enabled';
const STORAGE_KEY_WEATHER_ENABLED = 'nongtro_weather_push_enabled';
const STORAGE_KEY_HISTORY = 'nongtro_pest_notif_history';
const STORAGE_KEY_WEATHER_HISTORY = 'nongtro_weather_notif_history';

/**
 * Check if the browser environment supports Notifications API
 */
export function isPushNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Get current browser notification permission
 */
export function getPushNotificationPermission(): NotificationPermission {
  if (!isPushNotificationSupported()) return 'denied';
  return Notification.permission;
}

/**
 * Request notification permission from the user
 */
export async function requestPushNotificationPermission(): Promise<boolean> {
  if (!isPushNotificationSupported()) return false;
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

/**
 * Check if pest push notifications are enabled by user in settings
 */
export function isPestPushEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem(STORAGE_KEY_ENABLED);
  return val === null ? true : val === 'true';
}

/**
 * Set pest push notification preference
 */
export function setPestPushEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_ENABLED, String(enabled));
}

/**
 * Check if extreme weather push notifications are enabled
 */
export function isWeatherPushEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem(STORAGE_KEY_WEATHER_ENABLED);
  return val === null ? true : val === 'true';
}

/**
 * Set extreme weather push notification preference
 */
export function setWeatherPushEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_WEATHER_ENABLED, String(enabled));
}

/**
 * Play gentle notification chime via Web Audio API (Zero audio file dependencies)
 */
function playNotificationChime(urgent: boolean = false): void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = urgent ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(urgent ? 659.25 : 587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(urgent ? 987.77 : 880, ctx.currentTime + 0.16);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.42);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.42);
  } catch {
    // Ignore audio autoplay restrictions
  }
}

async function dispatchBrowserPush(
  title: string,
  body: string,
  tag: string,
  icon: string = '/pwa-192x192.png',
  data: Record<string, unknown> = {}
): Promise<boolean> {
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body,
          icon,
          badge: '/favicon.ico',
          tag,
          vibrate: [220, 100, 220],
          data,
        } as any);
        return true;
      }
    } catch (err) {
      console.warn('Service worker showNotification fallback to window.Notification:', err);
    }
  }

  try {
    new Notification(title, {
      body,
      icon: icon || '/favicon.ico',
      tag,
    });
    return true;
  } catch (err) {
    console.error('Error firing window Notification:', err);
    return false;
  }
}

/**
 * Dispatch an individual pest risk early warning notification
 */
export async function sendPestRiskNotification(
  alert: WeatherPestRiskAlert,
  options: { force?: boolean } = {}
): Promise<boolean> {
  if (!isPushNotificationSupported()) return false;
  if (!isPestPushEnabled() && !options.force) return false;

  const permission = Notification.permission;
  if (permission !== 'granted') {
    if (options.force) {
      const requested = await requestPushNotificationPermission();
      if (!requested) return false;
    } else {
      return false;
    }
  }

  // Rate-limiting: Don't repeat the exact same alert within 2 hours unless forced
  const now = Date.now();
  const historyKey = `${STORAGE_KEY_HISTORY}_${alert.id}`;
  if (!options.force) {
    const lastSentStr = localStorage.getItem(historyKey);
    if (lastSentStr) {
      const lastSent = parseInt(lastSentStr, 10);
      if (now - lastSent < 2 * 60 * 60 * 1000) {
        return false;
      }
    }
  }

  const title = `⚠️ [CẢNH BÁO SÂU BỆNH DO THỜI TIẾT] ${alert.plantName}`;
  const body = `Nguy cơ ${alert.riskScore}%: ${alert.pestDiseaseName}.\nThời tiết ${alert.weatherCondition.temp}°C, ẩm ${alert.weatherCondition.humidity}%. Hành động: ${alert.immediateAction}`;

  playNotificationChime(alert.riskLevel === 'critical');

  const sent = await dispatchBrowserPush(
    title,
    body,
    alert.id,
    alert.plantImage || '/pwa-192x192.png',
    {
      url: '/',
      plantId: alert.plantId,
      pestAlertId: alert.id,
    }
  );
  if (sent) {
    localStorage.setItem(historyKey, String(now));
  }
  return sent;
}

/**
 * Dispatch a combined summary notification for multiple pest risks
 */
export async function sendBatchPestRiskSummary(
  alerts: WeatherPestRiskAlert[],
  options: { force?: boolean } = {}
): Promise<boolean> {
  if (alerts.length === 0) return false;
  if (alerts.length === 1) return sendPestRiskNotification(alerts[0], options);

  if (!isPushNotificationSupported()) return false;
  if (!isPestPushEnabled() && !options.force) return false;

  const permission = Notification.permission;
  if (permission !== 'granted') {
    if (options.force) {
      const granted = await requestPushNotificationPermission();
      if (!granted) return false;
    } else {
      return false;
    }
  }

  const criticalCount = alerts.filter(a => a.riskLevel === 'critical').length;
  const topAlert = alerts[0];
  const title = `🌾 [NÔNG TRỢ XANH] Cảnh Báo ${alerts.length} Nguy Cơ Sâu Bệnh Do Thời Tiết`;
  const body = `Phát hiện ${criticalCount > 0 ? `${criticalCount} nguy cơ khẩn cấp` : 'nguy cơ cao'} trên vườn cây của bạn! Đáng chú ý nhất: ${topAlert.pestDiseaseName} trên ${topAlert.plantName} (Độ ẩm ${topAlert.weatherCondition.humidity}%).`;

  playNotificationChime(criticalCount > 0);
  return dispatchBrowserPush(title, body, 'batch-pest-summary');
}

/**
 * Dispatch an extreme weather push notification (Storm, Heatwave, Frost, Wind)
 */
export async function sendExtremeWeatherNotification(
  alert: WeatherAlert,
  weather: WeatherCondition,
  options: { force?: boolean } = {}
): Promise<boolean> {
  if (!isPushNotificationSupported()) return false;
  if (!isWeatherPushEnabled() && !options.force) return false;

  const permission = Notification.permission;
  if (permission !== 'granted') {
    if (options.force) {
      const requested = await requestPushNotificationPermission();
      if (!requested) return false;
    } else {
      return false;
    }
  }

  const now = Date.now();
  const historyKey = `${STORAGE_KEY_WEATHER_HISTORY}_${alert.id}_${weather.city}`;
  if (!options.force) {
    const lastSentStr = localStorage.getItem(historyKey);
    if (lastSentStr) {
      const lastSent = parseInt(lastSentStr, 10);
      if (now - lastSent < 90 * 60 * 1000) {
        return false;
      }
    }
  }

  const prefix = alert.level === 'danger' ? '🚨 [KHẨN CẤP THỜI TIẾT]' : '⛈️ [CẢNH BÁO THỜI TIẾT]';
  const title = `${prefix} ${alert.title}`;
  const body = `Khu vực: ${weather.city.split('/')[0].trim()} (${weather.temp}°C, ẩm ${weather.humidity}%).\nCây cần bảo vệ: ${alert.affectedPlants}.\nHành động ngay: ${alert.recommendedAction}`;

  playNotificationChime(alert.level === 'danger');

  const sent = await dispatchBrowserPush(title, body, `weather-${alert.id}`, '/pwa-192x192.png', {
    url: '/',
    weatherAlertId: alert.id,
    hazardType: alert.hazardType,
  });

  if (sent) {
    localStorage.setItem(historyKey, String(now));
  }
  return sent;
}

/**
 * Dispatch a combined push notification for active extreme weather hazards
 */
export async function sendBatchExtremeWeatherNotification(
  alerts: WeatherAlert[],
  weather: WeatherCondition,
  options: { force?: boolean } = {}
): Promise<boolean> {
  const activeHazards = alerts.filter(a => a.level === 'danger' || a.level === 'warning');
  const targetList = activeHazards.length > 0 ? activeHazards : alerts;
  if (targetList.length === 0) return false;
  if (targetList.length === 1) {
    return sendExtremeWeatherNotification(targetList[0], weather, options);
  }

  if (!isPushNotificationSupported()) return false;
  if (!isWeatherPushEnabled() && !options.force) return false;

  const permission = Notification.permission;
  if (permission !== 'granted') {
    if (options.force) {
      const granted = await requestPushNotificationPermission();
      if (!granted) return false;
    } else {
      return false;
    }
  }

  const dangerCount = targetList.filter(a => a.level === 'danger').length;
  const top = targetList[0];
  const title = `🚨 [NÔNG TRỢ XANH] ${targetList.length} Cảnh Báo Thời Tiết Khắc Nghiệt Tại Vườn`;
  const body = `${dangerCount > 0 ? `${dangerCount} nguy cơ khẩn cấp` : `${targetList.length} cảnh báo`} tại ${weather.city.split('/')[0].trim()} (${weather.temp}°C). Ưu tiên: ${top.title} — ${top.recommendedAction}`;

  playNotificationChime(dangerCount > 0);
  return dispatchBrowserPush(title, body, 'batch-weather-extreme-summary');
}

const STORAGE_KEY_DAILY_WATER_DATE = 'nongtro_daily_water_last_date';

export interface DailyWaterPlantBrief {
  id: string;
  name: string;
  soilMoisturePercent?: number;
  recommendedWaterAmount?: string;
}

/**
 * Dispatch daily watering reminder push notification for plants due today
 */
export async function sendDailyWateringReminderNotification(
  duePlants: DailyWaterPlantBrief[],
  options: { force?: boolean } = {}
): Promise<boolean> {
  if (duePlants.length === 0) return false;
  if (!isPushNotificationSupported()) return false;

  const permission = Notification.permission;
  if (permission !== 'granted') {
    if (options.force) {
      const granted = await requestPushNotificationPermission();
      if (!granted) return false;
    } else {
      return false;
    }
  }

  const todayIso = new Date().toISOString().split('T')[0];
  if (!options.force) {
    const lastDate = localStorage.getItem(STORAGE_KEY_DAILY_WATER_DATE);
    if (lastDate === todayIso) {
      return false;
    }
  }

  const previewNames = duePlants
    .slice(0, 3)
    .map(p => p.name)
    .join(', ');
  const extraCount = duePlants.length > 3 ? ` và ${duePlants.length - 3} cây khác` : '';
  const title = `💧 [NHẮC LỊCH TƯỚI HÀNG NGÀY] ${duePlants.length} cây cần tưới hôm nay`;
  const body = `Cần tưới: ${previewNames}${extraCount}. Tưới vào sáng sớm hoặc chiều mát để giữ ẩm rễ tốt nhất.`;

  playNotificationChime(false);
  const sent = await dispatchBrowserPush(title, body, `daily-watering-${todayIso}`, '/pwa-192x192.png', {
    url: '/',
    type: 'daily-watering',
  });
  if (sent) {
    localStorage.setItem(STORAGE_KEY_DAILY_WATER_DATE, todayIso);
  }
  return sent;
}

