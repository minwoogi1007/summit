import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';
import { DiaryImage } from '@/types';

// 이미지 최대 크기 (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// 허용된 이미지 형식
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic'];

// 이미지 압축 (Canvas 사용)
async function compressImage(file: File, maxWidth = 1920, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      
      // 최대 너비에 맞게 리사이즈
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        quality
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

// 썸네일 생성
async function createThumbnail(file: File, maxWidth = 300): Promise<Blob> {
  return compressImage(file, maxWidth, 0.6);
}

// 고유 파일명 생성
function generateFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop() || 'jpg';
  return `${timestamp}_${random}.${extension}`;
}

// 이미지 업로드
export async function uploadDiaryImage(
  userId: string,
  date: string,
  file: File
): Promise<DiaryImage> {
  // 파일 검증
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('지원하지 않는 이미지 형식입니다. (JPEG, PNG, GIF, WEBP 지원)');
  }
  
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('이미지 크기는 10MB 이하여야 합니다.');
  }
  
  const fileName = generateFileName(file.name);
  const imageId = Date.now().toString();
  
  // 이미지 압축
  const compressedBlob = await compressImage(file);
  const thumbnailBlob = await createThumbnail(file);
  
  // 메인 이미지 업로드
  const mainRef = ref(storage, `users/${userId}/diary/${date}/${fileName}`);
  await uploadBytes(mainRef, compressedBlob, { contentType: 'image/jpeg' });
  const url = await getDownloadURL(mainRef);
  
  // 썸네일 업로드
  const thumbFileName = `thumb_${fileName}`;
  const thumbRef = ref(storage, `users/${userId}/diary/${date}/${thumbFileName}`);
  await uploadBytes(thumbRef, thumbnailBlob, { contentType: 'image/jpeg' });
  const thumbnailUrl = await getDownloadURL(thumbRef);
  
  return {
    id: imageId,
    url,
    thumbnailUrl,
    fileName,
    uploadedAt: new Date(),
  };
}

// 이미지 삭제
export async function deleteDiaryImage(
  userId: string,
  date: string,
  fileName: string
): Promise<void> {
  try {
    // 메인 이미지 삭제
    const mainRef = ref(storage, `users/${userId}/diary/${date}/${fileName}`);
    await deleteObject(mainRef);
    
    // 썸네일 삭제
    const thumbRef = ref(storage, `users/${userId}/diary/${date}/thumb_${fileName}`);
    await deleteObject(thumbRef);
  } catch (error) {
    console.error('이미지 삭제 실패:', error);
    // 이미 삭제된 경우 무시
  }
}

// 이미지 유효성 검사
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { 
      valid: false, 
      error: '지원하지 않는 이미지 형식입니다. (JPEG, PNG, GIF, WEBP 지원)' 
    };
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: '이미지 크기는 10MB 이하여야 합니다.' 
    };
  }
  
  return { valid: true };
}

