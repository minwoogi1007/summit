import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase 설정 - 환경변수에서 로드
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Firebase 앱 초기화 (중복 방지)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Firebase 서비스
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Auth persistence 설정 (iOS PWA 대응)
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('Auth persistence 설정 실패:', err);
  });
}

// 오프라인 지원 활성화 (클라이언트에서만)
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // 여러 탭이 열려있을 때
      console.warn('오프라인 지속성을 활성화할 수 없습니다. 여러 탭이 열려있습니다.');
    } else if (err.code === 'unimplemented') {
      // 브라우저가 지원하지 않을 때
      console.warn('현재 브라우저가 오프라인 지속성을 지원하지 않습니다.');
    }
  });
}

export default app;

