// Firebase Cloud Messaging Service Worker
// 이 파일은 푸시 알림을 받기 위해 필요합니다

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

// Firebase 설정 (환경변수를 사용할 수 없으므로 하드코딩 필요)
// 실제 배포 시 여기에 Firebase config 값을 넣어야 합니다
firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
});

const messaging = firebase.messaging();

// 백그라운드 메시지 핸들러
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'SUMMIT';
  const notificationOptions = {
    body: payload.notification?.body || '새로운 알림이 있습니다',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'summit-notification',
    data: payload.data,
    actions: [
      { action: 'open', title: '열기' },
      { action: 'close', title: '닫기' }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// 알림 클릭 핸들러
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // 앱 열기
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 이미 열린 창이 있으면 포커스
      for (const client of clientList) {
        if (client.url.includes('/diary') && 'focus' in client) {
          return client.focus();
        }
      }
      // 없으면 새 창 열기
      if (clients.openWindow) {
        return clients.openWindow('/diary');
      }
    })
  );
});

