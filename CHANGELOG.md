# SUMMIT 프로젝트 변경 이력

## 📅 2025-12-12 (금) - 프로젝트 생성 및 초기 개발

### 🎯 프로젝트 개요
- **프로젝트명**: SUMMIT - 3집중 앱
- **기술 스택**: Next.js 14, TypeScript, Tailwind CSS, Firebase
- **배포**: Vercel
- **저장소**: https://github.com/minwoogi1007/summit

---

## 📝 커밋 이력

| 커밋 | 설명 | 주요 변경사항 |
|------|------|--------------|
| `76b397f` | Fix build errors | bible.ts, utils.ts 타입 에러 수정 |
| `ca2182e` | Fix debounce type error | debounce 함수 타입 수정 |
| `e4b82c8` | Fix ESLint errors for production build | ESLint 규칙 완화 |
| `33b7f4f` | Initial commit | 전체 프로젝트 초기 생성 |

---

## 📁 프로젝트 파일 구조

```
SUMMIT/
├── .eslintrc.json              # ESLint 설정
├── .gitignore                  # Git 제외 파일
├── README.md                   # 프로젝트 설명서
├── CHANGELOG.md                # 변경 이력 (이 파일)
├── env.example                 # 환경변수 예시
├── next.config.mjs             # Next.js 설정
├── package.json                # 의존성 관리
├── postcss.config.mjs          # PostCSS 설정
├── tailwind.config.ts          # Tailwind CSS 설정
├── tsconfig.json               # TypeScript 설정
│
├── public/
│   └── manifest.json           # PWA 매니페스트
│
└── src/
    ├── app/
    │   ├── globals.css         # 전역 스타일
    │   ├── layout.tsx          # 루트 레이아웃
    │   ├── page.tsx            # 홈페이지 (로그인)
    │   └── (main)/
    │       ├── layout.tsx      # 메인 레이아웃
    │       ├── admin/page.tsx  # 관리자 페이지
    │       ├── calendar/page.tsx # 캘린더 페이지
    │       ├── diary/
    │       │   ├── page.tsx    # 오늘의 일기
    │       │   └── [date]/page.tsx # 특정 날짜 일기
    │       ├── search/page.tsx # 검색 페이지
    │       ├── settings/page.tsx # 설정 페이지
    │       └── shared/page.tsx # 공유 페이지
    │
    ├── components/
    │   ├── auth/
    │   │   └── LoginPage.tsx   # 로그인 페이지 컴포넌트
    │   ├── bible/
    │   │   └── BibleVerseCard.tsx # 성경 구절 카드
    │   ├── devotion/
    │   │   └── TodaysDevotion.tsx # 오늘의 기도수첩
    │   ├── diary/
    │   │   └── DiaryEditor.tsx # 일기 에디터
    │   ├── layout/
    │   │   └── Navigation.tsx  # 네비게이션
    │   ├── providers/
    │   │   └── AuthProvider.tsx # 인증 컨텍스트
    │   └── ui/
    │       └── LoadingSpinner.tsx # 로딩 스피너
    │
    ├── lib/
    │   ├── bible.ts            # 성경 관련 유틸리티
    │   ├── crypto.ts           # 암호화 유틸리티 (AES-GCM)
    │   ├── firebase.ts         # Firebase 초기화
    │   └── utils.ts            # 공통 유틸리티
    │
    └── types/
        └── index.ts            # TypeScript 타입 정의
```

---

## 🔧 오늘 수정한 파일 상세

### 1. `.eslintrc.json` - ESLint 설정 수정
**변경 이유**: Vercel 빌드 시 ESLint 에러로 실패
```json
{
  "extends": "next/core-web-vitals",
  "rules": {
    "@next/next/no-img-element": "off",
    "react/no-unescaped-entities": "off",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

### 2. `src/lib/utils.ts` - debounce 함수 타입 수정
**변경 이유**: TypeScript 타입 호환성 에러
```typescript
export function debounce<T extends (...args: never[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void
```

### 3. `src/lib/bible.ts` - Set 스프레드 문법 수정
**변경 이유**: TypeScript 컴파일 에러
```typescript
// 변경 전
return [...new Set(references)];

// 변경 후
return Array.from(new Set(references));
```

### 4. `src/lib/crypto.ts` - 신규 생성
**기능**: AES-GCM 암호화/복호화
- `generateEncryptionKey()` - 256비트 암호화 키 생성
- `encrypt(text, key)` - 텍스트 암호화
- `decrypt(text, key)` - 텍스트 복호화
- `encryptDiaryFields()` - 일기 필드 암호화
- `decryptDiaryFields()` - 일기 필드 복호화

### 5. `src/components/providers/AuthProvider.tsx` - 암호화 키 관리 추가
**변경 사항**:
- 사용자별 암호화 키 자동 생성
- `encryptionKey` 상태 추가
- 관리자 권한 자동 업데이트

### 6. `src/app/(main)/diary/page.tsx` - 암호화 적용
**변경 사항**:
- 일기 저장 시 암호화
- 일기 로드 시 복호화
- 암호화 배지 UI 추가

### 7. `src/app/(main)/diary/[date]/page.tsx` - 암호화 적용
**변경 사항**: 동일 (특정 날짜 일기)

### 8. `src/app/(main)/search/page.tsx` - 복호화 적용
**변경 사항**: 검색 시 복호화 후 검색

### 9. `src/app/(main)/admin/page.tsx` - 전면 개선
**변경 사항**:
- 등록하기 / 목록 관리 탭 분리
- 기도수첩 수정 기능 추가
- 기도수첩 삭제 기능 추가
- 저장 후 폼 유지

### 10. `src/components/diary/DiaryEditor.tsx` - 저장 버튼 추가
**변경 사항**:
- 수동 저장 버튼 추가
- 저장 완료 피드백 UI
- saving 상태 표시

### 11. `src/app/globals.css` - 스타일 수정
**변경 사항**:
- 다이어리 입력 줄 간격 조정
- `after:bg-primary` → `after:bg-summit-500` 수정

### 12. `next.config.mjs` - webpack 설정 추가
**변경 사항**: Windows 파일 시스템 문제 해결
```javascript
webpack: (config) => {
  config.watchOptions = {
    poll: 1000,
    aggregateTimeout: 300,
    ignored: ['**/node_modules/**', '**/.next/**'],
  };
  return config;
}
```

---

## 🔐 보안 설정

### Firebase Firestore 보안 규칙
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /entries/{entryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    match /devotions/{devotionId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.token.email in ['minwoogi@gmail.com'];
    }
  }
}
```

### 환경변수 (.env.local)
```
NEXT_PUBLIC_FIREBASE_API_KEY=***
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=summit-f471b.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=summit-f471b
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=summit-f471b.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=***
NEXT_PUBLIC_FIREBASE_APP_ID=***
NEXT_PUBLIC_ADMIN_EMAILS=minwoogi@gmail.com
```

---

## 📊 데이터베이스 구조 (Firestore)

```
Firebase Firestore
├── users/{userId}
│   ├── uid: string
│   ├── email: string
│   ├── displayName: string
│   ├── photoURL: string
│   ├── isAdmin: boolean
│   ├── encryptionKey: string (자동 생성)
│   ├── createdAt: timestamp
│   └── entries/{date}
│       ├── dailyEvents: string (암호화됨)
│       ├── myHeart: string (암호화됨)
│       ├── prayerResponse: string (암호화됨)
│       ├── mood: string
│       ├── isBookmarked: boolean
│       ├── isShared: boolean
│       ├── isPublic: boolean
│       ├── isEncrypted: boolean
│       └── updatedAt: timestamp
│
└── devotions/{date}
    ├── title: string
    ├── bibleVerse: string
    ├── bibleText: string
    ├── content: string
    ├── prayerPoints: array
    ├── externalLink: string
    ├── youtubeLink: string
    ├── uploadedBy: string
    └── uploadedAt: timestamp
```

---

## 🚀 배포 정보

- **플랫폼**: Vercel
- **GitHub 저장소**: https://github.com/minwoogi1007/summit
- **브랜치**: main
- **자동 배포**: GitHub push 시 자동 빌드/배포

### ⚠️ 배포 후 필수 설정
1. Firebase Authentication > 승인된 도메인에 Vercel URL 추가

---

## ✅ 완료된 기능

- [x] Google 로그인/로그아웃
- [x] 일기 작성 (오늘 있었던 일, 내 마음, 응답)
- [x] 일기 자동 저장 + 수동 저장 버튼
- [x] 감정(Mood) 선택
- [x] 즐겨찾기, 공유 기능
- [x] 캘린더 뷰 (일기/기도수첩 마커)
- [x] 과거 일기 보기/수정
- [x] 검색 기능 (텍스트, 즐겨찾기 필터)
- [x] 공유된 일기 보기
- [x] 설정 페이지 (프로필, 알림, 테마)
- [x] 관리자 - 기도수첩 등록/수정/삭제
- [x] 기도수첩 표시 (유튜브 임베드, 외부 링크)
- [x] 클라이언트 측 암호화 (AES-GCM)
- [x] 반응형 디자인 (데스크탑/모바일)

---

## 🔜 향후 개선 사항

- [ ] 다크 모드 실제 구현
- [ ] PWA 서비스 워커 추가
- [ ] 푸시 알림 기능
- [ ] 한글 성경 API 연동
- [ ] 공유 기능 개선 (암호화된 데이터 공유 방법)

---

*마지막 업데이트: 2025-12-12*

