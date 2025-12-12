"use client";

import { useState, useRef } from "react";
import { DiaryImage } from "@/types";
import { uploadDiaryImage, deleteDiaryImage, validateImageFile } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { 
  Image as ImageIcon, 
  Plus, 
  X, 
  Loader2, 
  ZoomIn,
  Trash2 
} from "lucide-react";

interface ImageUploaderProps {
  userId: string;
  date: string;
  images: DiaryImage[];
  onImagesChange: (images: DiaryImage[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export function ImageUploader({
  userId,
  date,
  images,
  onImagesChange,
  maxImages = 5,
  disabled = false,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // 최대 이미지 수 확인
    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      setError(`최대 ${maxImages}장까지 업로드할 수 있습니다.`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    
    setUploading(true);
    setError(null);

    try {
      const newImages: DiaryImage[] = [];
      
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        setUploadProgress(`업로드 중... (${i + 1}/${filesToUpload.length})`);
        
        // 유효성 검사
        const validation = validateImageFile(file);
        if (!validation.valid) {
          setError(validation.error || '이미지 업로드 실패');
          continue;
        }
        
        // 업로드
        const uploadedImage = await uploadDiaryImage(userId, date, file);
        newImages.push(uploadedImage);
      }
      
      if (newImages.length > 0) {
        onImagesChange([...images, ...newImages]);
      }
    } catch (err) {
      console.error('이미지 업로드 실패:', err);
      setError(err instanceof Error ? err.message : '이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
      setUploadProgress(null);
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (image: DiaryImage) => {
    if (deletingId) return;
    
    setDeletingId(image.id);
    
    try {
      await deleteDiaryImage(userId, date, image.fileName);
      onImagesChange(images.filter((img) => img.id !== image.id));
    } catch (err) {
      console.error('이미지 삭제 실패:', err);
      setError('이미지 삭제에 실패했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  const canAddMore = images.length < maxImages && !disabled;

  return (
    <div className="space-y-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-summit-600 dark:text-muted-foreground">
          <ImageIcon className="w-4 h-4" />
          <span className="text-sm font-medium">사진</span>
          <span className="text-xs text-summit-400 dark:text-muted-foreground">
            ({images.length}/{maxImages})
          </span>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm px-3 py-2 rounded-lg">
          {error}
          <button 
            onClick={() => setError(null)}
            className="ml-2 text-red-400 hover:text-red-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* 이미지 그리드 */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {/* 기존 이미지들 */}
        {images.map((image) => (
          <div
            key={image.id}
            className="relative aspect-square rounded-lg overflow-hidden group"
          >
            <img
              src={image.thumbnailUrl || image.url}
              alt="첨부 이미지"
              className="w-full h-full object-cover"
              onClick={() => setPreviewImage(image.url)}
            />
            
            {/* 오버레이 */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <button
                onClick={() => setPreviewImage(image.url)}
                className="p-2 bg-white/90 rounded-full text-summit-700 hover:bg-white transition-colors"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(image)}
                disabled={deletingId === image.id}
                className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deletingId === image.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        ))}

        {/* 추가 버튼 */}
        {canAddMore && (
          <label
            className={cn(
              "aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors",
              uploading
                ? "border-summit-300 dark:border-border bg-summit-50 dark:bg-muted cursor-not-allowed"
                : "border-summit-300 dark:border-border hover:border-summit-400 dark:hover:border-muted-foreground hover:bg-summit-50 dark:hover:bg-muted"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              disabled={uploading || disabled}
              className="hidden"
            />
            
            {uploading ? (
              <>
                <Loader2 className="w-6 h-6 text-summit-400 animate-spin" />
                <span className="text-xs text-summit-400 dark:text-muted-foreground text-center px-1">
                  {uploadProgress || '업로드 중...'}
                </span>
              </>
            ) : (
              <>
                <Plus className="w-6 h-6 text-summit-400 dark:text-muted-foreground" />
                <span className="text-xs text-summit-400 dark:text-muted-foreground">추가</span>
              </>
            )}
          </label>
        )}
      </div>

      {/* 이미지 미리보기 모달 */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors"
            onClick={() => setPreviewImage(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={previewImage}
            alt="미리보기"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

