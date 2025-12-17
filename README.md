# SUMMIT - 3집중 ⛰️

3집중 속에 찾는 나의 망대 여정 이정표 앱입니다.

## ✨ 주요 기능

### 사용자 기능
- 📝 **일기 작성**: 오늘 있었던 일, 내 마음, 기도 응답 기록
- 📖 **오늘의 말씀**: 매일 업데이트되는 기도수첩 확인
- 🎬 **메시지 영상**: 유튜브 링크를 통한 설교 영상 시청
- 📅 **캘린더 뷰**: 월별 일기 및 기도수첩 확인
- 🔍 **검색**: 과거 일기 검색
- 🔖 **즐겨찾기**: 중요한 날의 기록 북마크
- 👥 **공유**: 다른 사용자와 일기 공유
- 📴 **오프라인 지원**: 인터넷 없이도 작성 가능 (PWA)

### 관리자 기능
- 📤 **기도수첩 업로드**: 개별/월별 등록
- 🔗 **링크 등록**: 외부 링크, 유튜브 링크 관리
- 📊 **콘텐츠 관리**: 기도수첩 및 성경 구절 관리

## 🛠️ 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication (Google)
- **Storage**: Firebase Storage
- **Deploy**: Vercel

## 🚀 시작하기

### 1. 저장소 클론
```bash
git clone https://github.com/your-username/summit.git
cd summit
```

### 2. 의존성 설치
```bash
npm install
```

### 3. Firebase 프로젝트 설정

1. [Firebase 콘솔](https://console.firebase.google.com)에서 새 프로젝트 생성
2. Authentication에서 Google 로그인 활성화
3. Firestore Database 생성
4. Storage 설정

### 4. 환경변수 설정
```bash
cp .env.example .env.local
```

`.env.local` 파일을 열고 Firebase 설정값을 입력합니다.

### 5. Firestore 보안 규칙 설정

Firebase 콘솔 > Firestore > 규칙에서 다음 규칙을 설정합니다:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 문서
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // 사용자의 일기 항목
      match /entries/{entryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // 기도수첩 (모든 인증된 사용자가 읽기 가능)
    match /devotions/{devotionId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
```

### 6. 개발 서버 실행
```bash
npm run dev
```

http://localhost:3000 에서 앱을 확인할 수 있습니다.

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── (main)/            # 메인 레이아웃 그룹
│   │   ├── admin/         # 관리자 페이지
│   │   ├── calendar/      # 캘린더 페이지
│   │   ├── diary/         # 일기 작성 페이지
│   │   ├── search/        # 검색 페이지
│   │   ├── settings/      # 설정 페이지
│   │   └── shared/        # 공유 페이지
│   ├── layout.tsx         # 루트 레이아웃
│   └── page.tsx           # 홈 (로그인) 페이지
├── components/
│   ├── auth/              # 인증 관련 컴포넌트
│   ├── devotion/          # 기도수첩 컴포넌트
│   ├── diary/             # 일기 컴포넌트
│   ├── layout/            # 레이아웃 컴포넌트
│   ├── providers/         # Context Providers
│   └── ui/                # 공통 UI 컴포넌트
├── lib/                   # 유틸리티 및 설정
│   ├── firebase.ts        # Firebase 초기화
│   └── utils.ts           # 헬퍼 함수
├── types/                 # TypeScript 타입 정의
│   └── index.ts
└── public/                # 정적 파일
```

## 🎨 커스터마이징

### 색상 테마
`tailwind.config.ts`에서 색상을 수정할 수 있습니다:
- `summit`: 메인 따뜻한 색상 (갈색/주황)
- `spirit`: 보조 영적 색상 (파란색)

### 관리자 지정
`.env.local`의 `NEXT_PUBLIC_ADMIN_EMAILS`에 관리자 이메일을 추가합니다.

## 📱 PWA 설치

1. 모바일 브라우저에서 사이트 접속
2. 브라우저 메뉴에서 "홈 화면에 추가" 선택
3. 앱처럼 사용 가능!

## 📄 라이센스

MIT License

---

Made with ❤️ for spiritual growth

