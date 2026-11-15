import { User } from 'firebase/auth';
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { WeatherAlertThresholds } from '../types';
import { db, handleFirestoreError, OperationType } from './firebase';
import { ensureUserProfile } from './firebaseDiagnoses';

export interface WeatherAlertPreferenceRecord extends WeatherAlertThresholds {
  uid: string;
  autoPushEnabled: boolean;
  city: string;
  lat: number;
  lng: number;
}

export const DEFAULT_WEATHER_THRESHOLDS: WeatherAlertThresholds = {
  heatThresholdC: 35,
  rainThresholdMm: 25,
  windThresholdKmH: 40,
  coldThresholdC: 13,
};

export const sanitizeWeatherThresholds = (
  input?: Partial<WeatherAlertThresholds>
): WeatherAlertThresholds => ({
  heatThresholdC: Math.max(30, Math.min(45, Math.round(Number(input?.heatThresholdC ?? DEFAULT_WEATHER_THRESHOLDS.heatThresholdC)))),
  rainThresholdMm: Math.max(5, Math.min(200, Math.round(Number(input?.rainThresholdMm ?? DEFAULT_WEATHER_THRESHOLDS.rainThresholdMm)))),
  windThresholdKmH: Math.max(15, Math.min(120, Math.round(Number(input?.windThresholdKmH ?? DEFAULT_WEATHER_THRESHOLDS.windThresholdKmH)))),
  coldThresholdC: Math.max(0, Math.min(20, Math.round(Number(input?.coldThresholdC ?? DEFAULT_WEATHER_THRESHOLDS.coldThresholdC)))),
});

export async function getWeatherPreferences(
  uid: string
): Promise<WeatherAlertPreferenceRecord | null> {
  const path = `weatherPreferences/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'weatherPreferences', uid));
    if (!snap.exists()) return null;
    const raw = snap.data();
    const safeThresholds = sanitizeWeatherThresholds(raw);
    return {
      uid: String(raw.uid || uid),
      autoPushEnabled: Boolean(raw.autoPushEnabled),
      ...safeThresholds,
      city: String(raw.city || 'Đồng Bằng Sông Cửu Long / TP.HCM').slice(0, 120),
      lat: typeof raw.lat === 'number' ? Math.max(-90, Math.min(90, raw.lat)) : 10.8872,
      lng: typeof raw.lng === 'number' ? Math.max(-180, Math.min(180, raw.lng)) : 106.5921,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeWeatherPreferences(
  uid: string,
  onData: (pref: WeatherAlertPreferenceRecord | null) => void,
  onError?: (err: Error) => void
): () => void {
  const path = `weatherPreferences/${uid}`;
  return onSnapshot(
    doc(db, 'weatherPreferences', uid),
    snap => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      const raw = snap.data();
      const safeThresholds = sanitizeWeatherThresholds(raw);
      onData({
        uid: String(raw.uid || uid),
        autoPushEnabled: Boolean(raw.autoPushEnabled),
        ...safeThresholds,
        city: String(raw.city || 'Đồng Bằng Sông Cửu Long / TP.HCM').slice(0, 120),
        lat: typeof raw.lat === 'number' ? Math.max(-90, Math.min(90, raw.lat)) : 10.8872,
        lng: typeof raw.lng === 'number' ? Math.max(-180, Math.min(180, raw.lng)) : 106.5921,
      });
    },
    error => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function saveWeatherPreferences(
  user: User,
  prefs: Omit<WeatherAlertPreferenceRecord, 'uid'>
): Promise<void> {
  await ensureUserProfile(user);
  const path = `weatherPreferences/${user.uid}`;
  const ref = doc(db, 'weatherPreferences', user.uid);
  const safeThresholds = sanitizeWeatherThresholds(prefs);
  const safeCity = (prefs.city || 'Đồng Bằng Sông Cửu Long / TP.HCM').trim().slice(0, 120) || 'Việt Nam';
  const safeLat = Number.isFinite(prefs.lat) ? Math.max(-90, Math.min(90, prefs.lat)) : 10.8872;
  const safeLng = Number.isFinite(prefs.lng) ? Math.max(-180, Math.min(180, prefs.lng)) : 106.5921;

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: user.uid,
        autoPushEnabled: Boolean(prefs.autoPushEnabled),
        ...safeThresholds,
        city: safeCity,
        lat: safeLat,
        lng: safeLng,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        autoPushEnabled: Boolean(prefs.autoPushEnabled),
        ...safeThresholds,
        city: safeCity,
        lat: safeLat,
        lng: safeLng,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
