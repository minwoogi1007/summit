import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import app from './firebase';

// VAPID 키 (Firebase Console에서 확인 가능)
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

// FCM 토큰 가져오기
export async function requestNotificationPermission(userId: string): Promise<string | null> {
  try {
    // 브라우저 지원 확인
    const supported = await isSupported();
    if (!supported) {
      console.log('이 브라우저는 푸시 알림을 지원하지 않습니다.');
      return null;
    }

    // 알림 권한 요청
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('알림 권한이 거부되었습니다.');
      return null;
    }

    // FCM 토큰 가져오기
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    
    if (token) {
      // Firestore에 토큰 저장
      await saveTokenToFirestore(userId, token);
      console.log('FCM 토큰 저장됨:', token.substring(0, 20) + '...');
      return token;
    }
    
    return null;
  } catch (error) {
    console.error('푸시 알림 설정 실패:', error);
    return null;
  }
}

// Firestore에 FCM 토큰 저장
async function saveTokenToFirestore(userId: string, token: string) {
  const tokenRef = doc(db, 'users', userId, 'tokens', 'fcm');
  await setDoc(tokenRef, {
    token,
    updatedAt: serverTimestamp(),
    platform: 'web',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  });
}

// 알림 권한 상태 확인
export function getNotificationPermissionStatus(): 'granted' | 'denied' | 'default' | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

// 포그라운드 메시지 리스너 설정
export function setupForegroundMessageListener(callback: (payload: any) => void) {
  if (typeof window === 'undefined') return;
  
  isSupported().then((supported) => {
    if (!supported) return;
    
    const messaging = getMessaging(app);
    onMessage(messaging, (payload) => {
      console.log('포그라운드 메시지 수신:', payload);
      callback(payload);
    });
  });
}

// 로컬 알림 표시 (포그라운드용)
export function showLocalNotification(title: string, body: string, onClick?: () => void) {
  if (getNotificationPermissionStatus() !== 'granted') return;
  
  const notification = new Notification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'summit-local',
  });
  
  if (onClick) {
    notification.onclick = () => {
      onClick();
      notification.close();
    };
  }
}

// 알림 설정 저장/로드
export interface NotificationSettings {
  enabled: boolean;
  dailyReminder: boolean;
  reminderTime: string; // HH:mm 형식
  devotionAlert: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  dailyReminder: true,
  reminderTime: '21:00',
  devotionAlert: true,
};

export async function getNotificationSettings(userId: string): Promise<NotificationSettings> {
  try {
    const settingsRef = doc(db, 'users', userId, 'settings', 'notifications');
    const settingsSnap = await getDoc(settingsRef);
    
    if (settingsSnap.exists()) {
      return { ...DEFAULT_SETTINGS, ...settingsSnap.data() } as NotificationSettings;
    }
    
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('알림 설정 로드 실패:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function saveNotificationSettings(userId: string, settings: NotificationSettings): Promise<void> {
  const settingsRef = doc(db, 'users', userId, 'settings', 'notifications');
  await setDoc(settingsRef, {
    ...settings,
    updatedAt: serverTimestamp(),
  });
}

