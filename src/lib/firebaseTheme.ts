import { User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Language, ThemeMode } from '../types';
import { db, handleFirestoreError, OperationType } from './firebase';
import { ensureUserProfile } from './firebaseDiagnoses';

const VALID_LANGUAGES: Language[] = ['vi', 'en', 'zh', 'km', 'ja'];

export interface UserDisplayPreferences {
  theme: ThemeMode | null;
  language: Language | null;
}

export async function getUserDisplayPreferences(uid: string): Promise<UserDisplayPreferences> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return { theme: null, language: null };
    const raw = snap.data();
    const theme: ThemeMode | null =
      raw.preferredTheme === 'dark' || raw.preferredTheme === 'light' ? raw.preferredTheme : null;
    const language: Language | null =
      typeof raw.preferredLanguage === 'string' && VALID_LANGUAGES.includes(raw.preferredLanguage as Language)
        ? (raw.preferredLanguage as Language)
        : null;
    return { theme, language };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function getUserThemePreference(uid: string): Promise<ThemeMode | null> {
  const prefs = await getUserDisplayPreferences(uid);
  return prefs.theme;
}

export async function saveUserThemePreference(user: User, theme: ThemeMode): Promise<void> {
  await ensureUserProfile(user);
  const path = `users/${user.uid}`;
  try {
    await updateDoc(doc(db, 'users', user.uid), {
      preferredTheme: theme,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveUserLanguagePreference(user: User, language: Language): Promise<void> {
  await ensureUserProfile(user);
  const path = `users/${user.uid}`;
  try {
    await updateDoc(doc(db, 'users', user.uid), {
      preferredLanguage: language,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
