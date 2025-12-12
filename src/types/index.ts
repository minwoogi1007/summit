// 사용자 타입
export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  isAdmin: boolean;
  createdAt: Date;
}

// 일기 첨부 이미지 타입
export interface DiaryImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  fileName: string;
  uploadedAt: Date;
}

// 일기 항목 타입
export interface DiaryEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD 형식
  
  // 핵심 필드 (3집중)
  dailyEvents: string;      // 오늘의 말씀 (망대)
  myHeart: string;          // 오늘의 기도 (여정)
  prayerResponse: string;   // 오늘의 전도 (이정표)
  
  // 확장 필드
  customFields?: CustomField[];
  mood?: MoodType;
  isBookmarked: boolean;
  images?: DiaryImage[];    // 첨부 이미지
  messageNotes?: string;    // 메시지 메모
  
  // 공유 설정
  isShared: boolean;
  sharedWith?: string[];    // 공유된 사용자 ID 목록
  isPublic: boolean;        // 전체 공개 여부
  
  createdAt: Date;
  updatedAt: Date;
}

// 커스텀 필드 타입
export interface CustomField {
  id: string;
  title: string;
  content: string;
}

// 감정 타입
export type MoodType = 
  | 'joyful'      // 기쁨
  | 'peaceful'    // 평안
  | 'grateful'    // 감사
  | 'hopeful'     // 소망
  | 'reflective'  // 묵상
  | 'struggling'  // 힘든
  | 'anxious'     // 불안
  | 'sad';        // 슬픔

export const MOOD_LABELS: Record<MoodType, { label: string; emoji: string }> = {
  joyful: { label: '기쁨', emoji: '😊' },
  peaceful: { label: '평안', emoji: '😌' },
  grateful: { label: '감사', emoji: '🙏' },
  hopeful: { label: '소망', emoji: '✨' },
  reflective: { label: '묵상', emoji: '🤔' },
  struggling: { label: '힘든', emoji: '😔' },
  anxious: { label: '불안', emoji: '😰' },
  sad: { label: '슬픔', emoji: '😢' },
};

// 기도수첩 (Devotion) 타입
export interface Devotion {
  id: string;
  date: string;           // YYYY-MM-DD 형식
  
  // 내용
  title: string;          // 제목
  bibleVerse: string;     // 본문 말씀 (예: "창세기 1:1-10")
  bibleText?: string;     // 성경 본문 내용
  content: string;        // 기도수첩 본문
  prayerPoints?: string[];// 기도제목
  
  // 링크
  externalLink?: string;  // 외부 링크
  youtubeLink?: string;   // 유튜브 링크
  
  // 메타
  uploadedBy: string;     // 업로드한 관리자 ID
  uploadedAt: Date;
  
  // 월별 업로드 지원
  month?: string;         // YYYY-MM 형식 (월별 업로드 시)
}

// 월별 기도수첩 업로드 타입
export interface MonthlyDevotion {
  id: string;
  month: string;          // YYYY-MM 형식
  devotions: Omit<Devotion, 'id' | 'uploadedBy' | 'uploadedAt'>[];
  uploadedBy: string;
  uploadedAt: Date;
}

// 성경 구절 타입
export interface BibleVerse {
  book: string;           // 책 이름 (예: "창세기")
  chapter: number;
  startVerse: number;
  endVerse?: number;
  text: string;           // 구절 내용
}

// 공유 타입
export interface SharedEntry {
  id: string;
  entryId: string;
  ownerId: string;
  ownerName: string;
  sharedAt: Date;
}

// 캘린더 개인 일정 타입
export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  date: string;           // YYYY-MM-DD 형식
  time?: string;          // HH:mm 형식 (선택)
  description?: string;
  color?: string;         // 색상 코드
  isAllDay: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 캘린더 마커 타입
export interface CalendarMarker {
  date: string;
  hasEntry: boolean;
  hasDevotion: boolean;
  mood?: MoodType;
  events?: CalendarEvent[];
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

