/**
 * 클라이언트 측 암호화 유틸리티
 * Web Crypto API를 사용한 AES-GCM 암호화
 */

// 암호화 키 길이 (256비트)
const KEY_LENGTH = 256;
const ALGORITHM = 'AES-GCM';

/**
 * 새로운 암호화 키 생성
 */
export async function generateEncryptionKey(): Promise<string> {
  const key = await crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true, // extractable
    ['encrypt', 'decrypt']
  );
  
  const exportedKey = await crypto.subtle.exportKey('raw', key);
  return bufferToBase64(exportedKey);
}

/**
 * Base64 문자열에서 CryptoKey 복원
 */
async function importKey(keyBase64: string): Promise<CryptoKey> {
  const keyBuffer = base64ToBuffer(keyBase64);
  return await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * 텍스트 암호화
 * @param plainText 암호화할 텍스트
 * @param keyBase64 Base64 인코딩된 암호화 키
 * @returns Base64 인코딩된 암호문 (IV 포함)
 */
export async function encrypt(plainText: string, keyBase64: string): Promise<string> {
  if (!plainText) return '';
  
  const key = await importKey(keyBase64);
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);
  
  // 랜덤 IV 생성 (12바이트)
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    data
  );
  
  // IV + 암호문을 합쳐서 반환
  const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedBuffer), iv.length);
  
  return bufferToBase64(combined.buffer);
}

/**
 * 텍스트 복호화
 * @param encryptedBase64 Base64 인코딩된 암호문 (IV 포함)
 * @param keyBase64 Base64 인코딩된 암호화 키
 * @returns 복호화된 텍스트
 */
export async function decrypt(encryptedBase64: string, keyBase64: string): Promise<string> {
  if (!encryptedBase64) return '';
  
  try {
    const key = await importKey(keyBase64);
    const combined = new Uint8Array(base64ToBuffer(encryptedBase64));
    
    // IV와 암호문 분리
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);
    
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      encryptedData
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('복호화 실패:', error);
    // 암호화되지 않은 레거시 데이터인 경우 원본 반환 시도
    return encryptedBase64;
  }
}

/**
 * 일기 엔트리의 민감한 필드들을 암호화
 */
export async function encryptDiaryFields(
  fields: { dailyEvents: string; myHeart: string; prayerResponse: string },
  keyBase64: string
): Promise<{ dailyEvents: string; myHeart: string; prayerResponse: string }> {
  const [dailyEvents, myHeart, prayerResponse] = await Promise.all([
    encrypt(fields.dailyEvents, keyBase64),
    encrypt(fields.myHeart, keyBase64),
    encrypt(fields.prayerResponse, keyBase64),
  ]);
  
  return { dailyEvents, myHeart, prayerResponse };
}

/**
 * 일기 엔트리의 민감한 필드들을 복호화
 */
export async function decryptDiaryFields(
  fields: { dailyEvents: string; myHeart: string; prayerResponse: string },
  keyBase64: string
): Promise<{ dailyEvents: string; myHeart: string; prayerResponse: string }> {
  const [dailyEvents, myHeart, prayerResponse] = await Promise.all([
    decrypt(fields.dailyEvents, keyBase64),
    decrypt(fields.myHeart, keyBase64),
    decrypt(fields.prayerResponse, keyBase64),
  ]);
  
  return { dailyEvents, myHeart, prayerResponse };
}

// 유틸리티 함수들
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

