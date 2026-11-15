import { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

export interface TreatmentStep {
  stepNumber: number;
  title: string;
  detail: string;
  timing: string;
}

export interface DiagnosisPayload {
  plantId?: string;
  plantName: string;
  diseaseName: string;
  pathogenType: string;
  severity: 'Nhẹ' | 'Trung bình' | 'Nghiêm trọng' | 'Khỏe mạnh';
  confidence: number;
  isHealthy: boolean;
  causes: string;
  symptoms: string[];
  treatmentSteps?: TreatmentStep[];
  organicTreatment: string[];
  chemicalTreatment: string[];
  prevention: string[];
  farmerNotes?: string;
  thumbnailDataUrl?: string;
  followUpDays?: number;
}

export interface SavedDiseaseDiagnosis extends DiagnosisPayload {
  id: string;
  ownerId: string;
  status: 'active' | 'treating' | 'resolved';
  createdAtMs: number;
  updatedAtMs: number;
}

const sanitizeText = (val: unknown, fallback: string, maxLen: number): string => {
  const str = typeof val === 'string' ? val.trim() : '';
  const finalStr = str || fallback;
  return finalStr.slice(0, maxLen);
};

const sanitizeStringList = (arr: unknown, maxItems: number, maxLen: number): string[] => {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .slice(0, maxItems)
    .map(item => item.trim().slice(0, maxLen));
};

const normalizeSeverity = (val: unknown): SavedDiseaseDiagnosis['severity'] => {
  if (val === 'Nhẹ' || val === 'Trung bình' || val === 'Nghiêm trọng' || val === 'Khỏe mạnh') {
    return val;
  }
  return 'Trung bình';
};

export async function ensureUserProfile(user: User): Promise<void> {
  const path = `users/${user.uid}`;
  const userRef = doc(db, 'users', user.uid);
  const safeName = sanitizeText(user.displayName, 'Nhà Nông Xanh', 100);
  const safePhoto =
    typeof user.photoURL === 'string' && user.photoURL.length <= 500
      ? user.photoURL
      : undefined;

  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      const createPayload: Record<string, unknown> = {
        uid: user.uid,
        displayName: safeName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (safePhoto) {
        createPayload.photoURL = safePhoto;
      }
      await setDoc(userRef, createPayload);
    } else {
      const updatePayload: Record<string, unknown> = {
        displayName: safeName,
        updatedAt: serverTimestamp(),
      };
      if (safePhoto) {
        updatePayload.photoURL = safePhoto;
      }
      await updateDoc(userRef, updatePayload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveDiagnosisToFirestore(
  user: User,
  input: DiagnosisPayload
): Promise<string> {
  await ensureUserProfile(user);

  const diagId = `diag_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const path = `diagnoses/${diagId}`;

  const steps = Array.isArray(input.treatmentSteps)
    ? input.treatmentSteps.slice(0, 10).map((s, idx) => ({
        stepNumber: Math.max(1, Math.min(20, Math.round(Number(s?.stepNumber) || idx + 1))),
        title: sanitizeText(s?.title, `Bước ${idx + 1}`, 160),
        detail: sanitizeText(s?.detail, 'Theo dõi và chăm sóc theo hướng dẫn.', 600),
        timing: sanitizeText(s?.timing, 'Trong ngày', 100),
      }))
    : undefined;

  const docData: Record<string, unknown> = {
    ownerId: user.uid,
    plantName: sanitizeText(input.plantName, 'Cây trồng chưa xác định', 120),
    diseaseName: sanitizeText(input.diseaseName, 'Cần theo dõi thêm', 160),
    pathogenType: sanitizeText(input.pathogenType, 'Nấm bệnh', 60),
    severity: normalizeSeverity(input.severity),
    confidence: Math.max(0, Math.min(100, Math.round(Number(input.confidence) || 85))),
    isHealthy: Boolean(input.isHealthy),
    causes: sanitizeText(input.causes, '', 1000),
    symptoms: sanitizeStringList(input.symptoms, 10, 300),
    organicTreatment: sanitizeStringList(input.organicTreatment, 10, 400),
    chemicalTreatment: sanitizeStringList(input.chemicalTreatment, 10, 400),
    prevention: sanitizeStringList(input.prevention, 10, 300),
    status: input.isHealthy ? 'resolved' : 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (input.plantId && /^[a-zA-Z0-9_\-]+$/.test(input.plantId)) {
    docData.plantId = input.plantId.slice(0, 128);
  }
  if (steps && steps.length > 0) {
    docData.treatmentSteps = steps;
  }
  if (input.farmerNotes && input.farmerNotes.trim()) {
    docData.farmerNotes = input.farmerNotes.trim().slice(0, 500);
  }
  if (input.thumbnailDataUrl && input.thumbnailDataUrl.length <= 150000) {
    docData.thumbnailDataUrl = input.thumbnailDataUrl;
  }
  if (typeof input.followUpDays === 'number' && Number.isFinite(input.followUpDays)) {
    docData.followUpDays = Math.max(0, Math.min(365, Math.round(input.followUpDays)));
  }

  try {
    await setDoc(doc(db, 'diagnoses', diagId), docData);
    return diagId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeUserDiagnoses(
  uid: string,
  onData: (records: SavedDiseaseDiagnosis[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'diagnoses';
  const q = query(collection(db, 'diagnoses'), where('ownerId', '==', uid));

  return onSnapshot(
    q,
    snapshot => {
      const items: SavedDiseaseDiagnosis[] = snapshot.docs.map(d => {
        const raw = d.data();
        const createdTs = raw.createdAt instanceof Timestamp ? raw.createdAt.toMillis() : Date.now();
        const updatedTs = raw.updatedAt instanceof Timestamp ? raw.updatedAt.toMillis() : createdTs;
        return {
          id: d.id,
          ownerId: String(raw.ownerId || uid),
          plantId: typeof raw.plantId === 'string' ? raw.plantId : undefined,
          plantName: String(raw.plantName || ''),
          diseaseName: String(raw.diseaseName || ''),
          pathogenType: String(raw.pathogenType || ''),
          severity: normalizeSeverity(raw.severity),
          confidence: Number(raw.confidence || 0),
          isHealthy: Boolean(raw.isHealthy),
          causes: String(raw.causes || ''),
          symptoms: Array.isArray(raw.symptoms) ? raw.symptoms : [],
          treatmentSteps: Array.isArray(raw.treatmentSteps) ? raw.treatmentSteps : undefined,
          organicTreatment: Array.isArray(raw.organicTreatment) ? raw.organicTreatment : [],
          chemicalTreatment: Array.isArray(raw.chemicalTreatment) ? raw.chemicalTreatment : [],
          prevention: Array.isArray(raw.prevention) ? raw.prevention : [],
          farmerNotes: typeof raw.farmerNotes === 'string' ? raw.farmerNotes : undefined,
          thumbnailDataUrl:
            typeof raw.thumbnailDataUrl === 'string' ? raw.thumbnailDataUrl : undefined,
          followUpDays:
            typeof raw.followUpDays === 'number' ? raw.followUpDays : undefined,
          status:
            raw.status === 'treating' || raw.status === 'resolved' ? raw.status : 'active',
          createdAtMs: createdTs,
          updatedAtMs: updatedTs,
        };
      });
      items.sort((a, b) => b.createdAtMs - a.createdAtMs);
      onData(items);
    },
    error => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function updateDiagnosisStatusInFirestore(
  diagnosisId: string,
  status: 'active' | 'treating' | 'resolved',
  farmerNotes?: string
): Promise<void> {
  const path = `diagnoses/${diagnosisId}`;
  const payload: Record<string, unknown> = {
    status,
    updatedAt: serverTimestamp(),
  };
  if (typeof farmerNotes === 'string') {
    payload.farmerNotes = farmerNotes.trim().slice(0, 500);
  }
  try {
    await updateDoc(doc(db, 'diagnoses', diagnosisId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteDiagnosisFromFirestore(diagnosisId: string): Promise<void> {
  const path = `diagnoses/${diagnosisId}`;
  try {
    await deleteDoc(doc(db, 'diagnoses', diagnosisId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
