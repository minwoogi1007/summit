"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn, debounce } from "@/lib/utils";
import { 
  Play, 
  Pause, 
  Minimize2, 
  Maximize2, 
  X,
  Clock,
  Save,
  Check
} from "lucide-react";

interface VideoNotepadProps {
  videoId: string;
  date: string;
  initialNotes?: string;
  onSaveNotes: (notes: string) => Promise<void>;
}

interface TimestampNote {
  time: string;
  text: string;
}

export function VideoNotepad({ 
  videoId, 
  date, 
  initialNotes = "",
  onSaveNotes 
}: VideoNotepadProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [isMinimized, setIsMinimized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef<HTMLIFrameElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 디바운스된 저장
  const debouncedSave = useCallback(
    debounce(async (text: string) => {
      setSaving(true);
      try {
        await onSaveNotes(text);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (error) {
        console.error("메모 저장 실패:", error);
      } finally {
        setSaving(false);
      }
    }, 1500),
    [onSaveNotes]
  );

  // 메모 변경 핸들러
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    debouncedSave(newNotes);
  };

  // 타임스탬프 추가
  const addTimestamp = () => {
    // 현재 시간을 가상으로 추가 (실제로는 YouTube IFrame API 필요)
    const now = new Date();
    const timestamp = `[${now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}]`;
    
    if (textareaRef.current) {
      const cursorPos = textareaRef.current.selectionStart;
      const textBefore = notes.substring(0, cursorPos);
      const textAfter = notes.substring(cursorPos);
      const newNotes = `${textBefore}\n${timestamp} `;
      setNotes(newNotes + textAfter);
      
      // 커서 위치 조정
      setTimeout(() => {
        if (textareaRef.current) {
          const newPos = newNotes.length;
          textareaRef.current.setSelectionRange(newPos, newPos);
          textareaRef.current.focus();
        }
      }, 0);
    }
  };

  // 수동 저장
  const handleManualSave = async () => {
    setSaving(true);
    try {
      await onSaveNotes(notes);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("메모 저장 실패:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cn(
      "bg-white dark:bg-card rounded-xl shadow-lg border border-summit-100 dark:border-border overflow-hidden transition-all",
      isMinimized ? "h-auto" : "h-auto"
    )}>
      {/* 영상 + 메모 분할 레이아웃 */}
      <div className={cn(
        "grid gap-0",
        isMinimized ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
      )}>
        {/* 비디오 영역 */}
        <div className={cn(
          "relative",
          isMinimized && "hidden lg:block"
        )}>
          <div className="youtube-container">
            <iframe
              ref={playerRef}
              src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1`}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>

        {/* 메모 영역 */}
        <div className="flex flex-col h-full">
          {/* 메모 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-summit-100 dark:border-border bg-summit-50 dark:bg-muted">
            <h3 className="font-medium text-summit-800 dark:text-foreground flex items-center gap-2">
              📝 메시지 메모
              {saved && (
                <span className="text-xs text-green-500 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  저장됨
                </span>
              )}
              {saving && !saved && (
                <span className="text-xs text-summit-400 dark:text-muted-foreground">
                  저장 중...
                </span>
              )}
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={addTimestamp}
                className="flex items-center gap-1 px-2 py-1 text-xs text-summit-600 dark:text-muted-foreground hover:bg-summit-100 dark:hover:bg-muted/80 rounded-lg transition-colors"
                title="타임스탬프 추가"
              >
                <Clock className="w-3 h-3" />
                시간
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 text-summit-400 hover:text-summit-600 dark:text-muted-foreground dark:hover:text-foreground rounded-lg transition-colors"
                title={isMinimized ? "확장" : "축소"}
              >
                {isMinimized ? (
                  <Maximize2 className="w-4 h-4" />
                ) : (
                  <Minimize2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* 메모 입력 */}
          <div className="flex-1 p-4">
            <textarea
              ref={textareaRef}
              value={notes}
              onChange={handleNotesChange}
              placeholder="메시지를 들으면서 메모하세요...

💡 팁:
• '시간' 버튼을 눌러 타임스탬프 추가
• 메모는 자동 저장됩니다
• 나중에 일기에서 확인할 수 있어요"
              className="w-full h-48 lg:h-64 p-3 bg-summit-50 dark:bg-muted rounded-xl border-0 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-summit-800 dark:text-foreground placeholder:text-summit-400 dark:placeholder:text-muted-foreground font-diary text-base leading-relaxed"
            />
          </div>

          {/* 메모 푸터 */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-summit-100 dark:border-border">
            <p className="text-xs text-summit-400 dark:text-muted-foreground">
              {notes.length}자
            </p>
            <button
              onClick={handleManualSave}
              disabled={saving}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                saved
                  ? "bg-green-500 text-white"
                  : "bg-primary text-white hover:bg-primary/90"
              )}
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" />
                  저장됨
                </>
              ) : saving ? (
                <>
                  <Save className="w-4 h-4 animate-pulse" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  저장
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

