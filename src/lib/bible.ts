// 성경 책 이름 매핑 (한글 <-> 영문 <-> 약어)
export const BIBLE_BOOKS = [
  { ko: "창세기", en: "Genesis", abbr: "창" },
  { ko: "출애굽기", en: "Exodus", abbr: "출" },
  { ko: "레위기", en: "Leviticus", abbr: "레" },
  { ko: "민수기", en: "Numbers", abbr: "민" },
  { ko: "신명기", en: "Deuteronomy", abbr: "신" },
  { ko: "여호수아", en: "Joshua", abbr: "수" },
  { ko: "사사기", en: "Judges", abbr: "삿" },
  { ko: "룻기", en: "Ruth", abbr: "룻" },
  { ko: "사무엘상", en: "1 Samuel", abbr: "삼상" },
  { ko: "사무엘하", en: "2 Samuel", abbr: "삼하" },
  { ko: "열왕기상", en: "1 Kings", abbr: "왕상" },
  { ko: "열왕기하", en: "2 Kings", abbr: "왕하" },
  { ko: "역대상", en: "1 Chronicles", abbr: "대상" },
  { ko: "역대하", en: "2 Chronicles", abbr: "대하" },
  { ko: "에스라", en: "Ezra", abbr: "스" },
  { ko: "느헤미야", en: "Nehemiah", abbr: "느" },
  { ko: "에스더", en: "Esther", abbr: "에" },
  { ko: "욥기", en: "Job", abbr: "욥" },
  { ko: "시편", en: "Psalms", abbr: "시" },
  { ko: "잠언", en: "Proverbs", abbr: "잠" },
  { ko: "전도서", en: "Ecclesiastes", abbr: "전" },
  { ko: "아가", en: "Song of Solomon", abbr: "아" },
  { ko: "이사야", en: "Isaiah", abbr: "사" },
  { ko: "예레미야", en: "Jeremiah", abbr: "렘" },
  { ko: "예레미야애가", en: "Lamentations", abbr: "애" },
  { ko: "에스겔", en: "Ezekiel", abbr: "겔" },
  { ko: "다니엘", en: "Daniel", abbr: "단" },
  { ko: "호세아", en: "Hosea", abbr: "호" },
  { ko: "요엘", en: "Joel", abbr: "욜" },
  { ko: "아모스", en: "Amos", abbr: "암" },
  { ko: "오바댜", en: "Obadiah", abbr: "옵" },
  { ko: "요나", en: "Jonah", abbr: "욘" },
  { ko: "미가", en: "Micah", abbr: "미" },
  { ko: "나훔", en: "Nahum", abbr: "나" },
  { ko: "하박국", en: "Habakkuk", abbr: "합" },
  { ko: "스바냐", en: "Zephaniah", abbr: "습" },
  { ko: "학개", en: "Haggai", abbr: "학" },
  { ko: "스가랴", en: "Zechariah", abbr: "슥" },
  { ko: "말라기", en: "Malachi", abbr: "말" },
  { ko: "마태복음", en: "Matthew", abbr: "마" },
  { ko: "마가복음", en: "Mark", abbr: "막" },
  { ko: "누가복음", en: "Luke", abbr: "눅" },
  { ko: "요한복음", en: "John", abbr: "요" },
  { ko: "사도행전", en: "Acts", abbr: "행" },
  { ko: "로마서", en: "Romans", abbr: "롬" },
  { ko: "고린도전서", en: "1 Corinthians", abbr: "고전" },
  { ko: "고린도후서", en: "2 Corinthians", abbr: "고후" },
  { ko: "갈라디아서", en: "Galatians", abbr: "갈" },
  { ko: "에베소서", en: "Ephesians", abbr: "엡" },
  { ko: "빌립보서", en: "Philippians", abbr: "빌" },
  { ko: "골로새서", en: "Colossians", abbr: "골" },
  { ko: "데살로니가전서", en: "1 Thessalonians", abbr: "살전" },
  { ko: "데살로니가후서", en: "2 Thessalonians", abbr: "살후" },
  { ko: "디모데전서", en: "1 Timothy", abbr: "딤전" },
  { ko: "디모데후서", en: "2 Timothy", abbr: "딤후" },
  { ko: "디도서", en: "Titus", abbr: "딛" },
  { ko: "빌레몬서", en: "Philemon", abbr: "몬" },
  { ko: "히브리서", en: "Hebrews", abbr: "히" },
  { ko: "야고보서", en: "James", abbr: "약" },
  { ko: "베드로전서", en: "1 Peter", abbr: "벧전" },
  { ko: "베드로후서", en: "2 Peter", abbr: "벧후" },
  { ko: "요한일서", en: "1 John", abbr: "요일" },
  { ko: "요한이서", en: "2 John", abbr: "요이" },
  { ko: "요한삼서", en: "3 John", abbr: "요삼" },
  { ko: "유다서", en: "Jude", abbr: "유" },
  { ko: "요한계시록", en: "Revelation", abbr: "계" },
];

// 성경 구절 파싱
export interface ParsedReference {
  book: string;
  bookKo: string;
  chapter: number;
  startVerse: number;
  endVerse?: number;
}

export function parseBibleReference(reference: string): ParsedReference | null {
  // 다양한 형식 지원: "창세기 1:1-10", "창 1:1", "요한복음 3:16"
  const regex = /^(.+?)\s*(\d+):(\d+)(?:-(\d+))?$/;
  const match = reference.trim().match(regex);
  
  if (!match) return null;
  
  const bookName = match[1].trim();
  
  // 책 이름 찾기 (한글 전체, 약어 모두 지원)
  const book = BIBLE_BOOKS.find(
    b => b.ko === bookName || b.abbr === bookName || b.en.toLowerCase() === bookName.toLowerCase()
  );
  
  if (!book) return null;
  
  return {
    book: book.en,
    bookKo: book.ko,
    chapter: parseInt(match[2], 10),
    startVerse: parseInt(match[3], 10),
    endVerse: match[4] ? parseInt(match[4], 10) : undefined,
  };
}

// 성경 구절 검색 (외부 API 사용)
// 참고: 실제 운영에서는 API 키나 자체 성경 데이터베이스 사용 권장
export async function fetchBibleVerse(reference: string): Promise<string | null> {
  const parsed = parseBibleReference(reference);
  if (!parsed) return null;
  
  try {
    // Bible API 사용 (무료 API)
    // 참고: https://bible-api.com/ - 영문 성경
    // 한글 성경은 별도 API나 로컬 데이터 필요
    
    const verseRange = parsed.endVerse 
      ? `${parsed.chapter}:${parsed.startVerse}-${parsed.endVerse}`
      : `${parsed.chapter}:${parsed.startVerse}`;
    
    const url = `https://bible-api.com/${encodeURIComponent(parsed.book)}+${verseRange}?translation=kjv`;
    
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.text?.trim() || null;
  } catch (error) {
    console.error("성경 구절 검색 실패:", error);
    return null;
  }
}

// 텍스트에서 성경 구절 참조 추출
export function extractBibleReferences(text: string): string[] {
  const references: string[] = [];
  
  // 다양한 패턴 매칭
  const patterns = [
    // 한글 전체 이름: 창세기 1:1-10
    /(?:창세기|출애굽기|레위기|민수기|신명기|여호수아|사사기|룻기|사무엘상|사무엘하|열왕기상|열왕기하|역대상|역대하|에스라|느헤미야|에스더|욥기|시편|잠언|전도서|아가|이사야|예레미야|예레미야애가|에스겔|다니엘|호세아|요엘|아모스|오바댜|요나|미가|나훔|하박국|스바냐|학개|스가랴|말라기|마태복음|마가복음|누가복음|요한복음|사도행전|로마서|고린도전서|고린도후서|갈라디아서|에베소서|빌립보서|골로새서|데살로니가전서|데살로니가후서|디모데전서|디모데후서|디도서|빌레몬서|히브리서|야고보서|베드로전서|베드로후서|요한일서|요한이서|요한삼서|유다서|요한계시록)\s*\d+:\d+(?:-\d+)?/g,
    // 약어: 창 1:1-10
    /(?:창|출|레|민|신|수|삿|룻|삼상|삼하|왕상|왕하|대상|대하|스|느|에|욥|시|잠|전|아|사|렘|애|겔|단|호|욜|암|옵|욘|미|나|합|습|학|슥|말|마|막|눅|요|행|롬|고전|고후|갈|엡|빌|골|살전|살후|딤전|딤후|딛|몬|히|약|벧전|벧후|요일|요이|요삼|유|계)\s*\d+:\d+(?:-\d+)?/g,
  ];
  
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      references.push(...matches);
    }
  }
  
  // 중복 제거
  return [...new Set(references)];
}

// 성경 구절을 포맷팅
export function formatBibleReference(parsed: ParsedReference): string {
  const verseRange = parsed.endVerse 
    ? `${parsed.startVerse}-${parsed.endVerse}절`
    : `${parsed.startVerse}절`;
  
  return `${parsed.bookKo} ${parsed.chapter}장 ${verseRange}`;
}

