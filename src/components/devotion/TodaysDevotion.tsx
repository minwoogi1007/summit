"use client";

import { useState, useCallback } from "react";
import { Devotion } from "@/types";
import { extractYoutubeVideoId, cn, debounce } from "@/lib/utils";
import { 
  BookOpen, 
  ExternalLink, 
  Youtube, 
  ChevronDown, 
  ChevronUp,
  Copy,
  Check,
  Pencil,
  Clock,
  Save
} from "lucide-react";

interface TodaysDevotionProps {
  devotion: Devotion | null;
  messageNotes?: string;
  onSaveNotes?: (notes: string) => Promise<void>;
}

export function TodaysDevotion({ devotion, messageNotes = "", onSaveNotes }: TodaysDevotionProps) {
  const [expanded, setExpanded] = useState(true);
  const [showVideoWithNotes, setShowVideoWithNotes] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notes, setNotes] = useState(messageNotes);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // 디바운스된 저장
  const debouncedSave = useCallback(
    debounce(async (text: string) => {
      if (!onSaveNotes) return;
      setSaving(true);
      try {
        await onSaveNotes(text);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } finally {
        setSaving(false);
      }
    }, 1500),
    [onSaveNotes]
  );

  if (!devotion) {
    return (
      <div className="bg-gradient-to-br from-spirit-50 to-white dark:from-accent/10 dark:to-card rounded-2xl p-6 border border-spirit-100 dark:border-border shadow-sm">
        <div className="flex items-center gap-3 text-spirit-600 dark:text-accent">
          <BookOpen className="w-6 h-6" />
          <span className="font-medium">오늘의 말씀이 아직 등록되지 않았습니다</span>
        </div>
        <p className="mt-2 text-sm text-spirit-500 dark:text-muted-foreground">
          관리자가 기도수첩을 업로드하면 여기에 표시됩니다.
        </p>
      </div>
    );
  }

  const youtubeVideoId = devotion.youtubeLink 
    ? extractYoutubeVideoId(devotion.youtubeLink) 
    : null;

  const copyVerse = async () => {
    const textToCopy = `${devotion.bibleVerse}\n${devotion.bibleText || ""}`;
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNotesChange = (text: string) => {
    setNotes(text);
    debouncedSave(text);
  };

  const addTimestamp = () => {
    const now = new Date();
    const timestamp = `[${now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}]`;
    const newNotes = notes ? `${notes}\n${timestamp} ` : `${timestamp} `;
    setNotes(newNotes);
    debouncedSave(newNotes);
  };

  const handleManualSave = async () => {
    if (!onSaveNotes) return;
    setSaving(true);
    try {
      await onSaveNotes(notes);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-spirit-50 via-white to-summit-50 dark:from-accent/10 dark:via-card dark:to-card rounded-2xl shadow-sm border border-spirit-100 dark:border-border overflow-hidden">
      {/* 헤더 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/50 dark:hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-spirit-500 to-spirit-600 flex items-center justify-center shadow-sm">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h2 className="font-bold text-spirit-900 dark:text-foreground">{devotion.title || "오늘의 말씀"}</h2>
            <p className="text-sm text-spirit-600 dark:text-muted-foreground">{devotion.bibleVerse}</p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-spirit-400 dark:text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-spirit-400 dark:text-muted-foreground" />
        )}
      </button>

      {/* 본문 */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 animate-fade-in">
          {/* 성경 본문 */}
          {devotion.bibleText && (
            <div className="relative bg-white dark:bg-muted rounded-xl p-4 border border-spirit-100 dark:border-border">
              <p className="text-spirit-800 dark:text-foreground leading-relaxed font-diary text-lg">
                "{devotion.bibleText}"
              </p>
              <button
                onClick={copyVerse}
                className="absolute top-2 right-2 p-2 text-spirit-400 hover:text-spirit-600 dark:text-muted-foreground dark:hover:text-foreground hover:bg-spirit-50 dark:hover:bg-muted rounded-lg transition-colors"
                title="복사하기"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          )}

          {/* 기도수첩 본문 */}
          <div className="prose prose-sm max-w-none text-summit-700 dark:text-foreground">
            <p className="whitespace-pre-wrap">{devotion.content}</p>
          </div>

          {/* 기도제목 */}
          {devotion.prayerPoints && devotion.prayerPoints.length > 0 && (
            <div className="bg-summit-50 dark:bg-muted rounded-xl p-4">
              <h3 className="font-semibold text-summit-800 dark:text-foreground mb-2">🙏 오늘의 기도제목</h3>
              <ul className="space-y-2">
                {devotion.prayerPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-2 text-summit-700 dark:text-muted-foreground">
                    <span className="text-summit-400">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 링크 영역 */}
          <div className="flex flex-wrap gap-2">
            {/* 외부 링크 */}
            {devotion.externalLink && (
              <a
                href={devotion.externalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-summit-100 dark:bg-muted text-summit-700 dark:text-muted-foreground rounded-lg hover:bg-summit-200 dark:hover:bg-muted/80 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="text-sm">기도수첩 원문 보기</span>
              </a>
            )}

            {/* 유튜브 링크 - 메모와 함께 보기 */}
            {youtubeVideoId && (
              <button
                onClick={() => setShowVideoWithNotes(!showVideoWithNotes)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                  showVideoWithNotes 
                    ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" 
                    : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                )}
              >
                <Youtube className="w-4 h-4" />
                <span className="text-sm">
                  {showVideoWithNotes ? "영상 닫기" : "메시지 듣기 + 메모"}
                </span>
              </button>
            )}
          </div>

          {/* 영상 + 메모 분할 화면 */}
          {showVideoWithNotes && youtubeVideoId && (
            <div className="bg-white dark:bg-card rounded-xl border border-summit-100 dark:border-border overflow-hidden animate-scale-in">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                {/* 비디오 영역 */}
                <div className="relative">
                  <div className="youtube-container">
                    <iframe
                      src={`https://www.youtube.com/embed/${youtubeVideoId}?enablejsapi=1`}
                      title="YouTube video player"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>

                {/* 메모 영역 */}
                <div className="flex flex-col border-l-0 lg:border-l border-summit-100 dark:border-border">
                  {/* 메모 헤더 */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-summit-100 dark:border-border bg-summit-50 dark:bg-muted">
                    <h3 className="font-medium text-summit-800 dark:text-foreground flex items-center gap-2">
                      <Pencil className="w-4 h-4" />
                      메시지 메모
                      {saved && (
                        <span className="text-xs text-green-500 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          저장됨
                        </span>
                      )}
                    </h3>
                    <button
                      onClick={addTimestamp}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-summit-600 dark:text-muted-foreground hover:bg-summit-100 dark:hover:bg-muted/80 rounded-lg transition-colors"
                      title="타임스탬프 추가"
                    >
                      <Clock className="w-3 h-3" />
                      시간
                    </button>
                  </div>

                  {/* 메모 입력 */}
                  <div className="flex-1 p-4">
                    <textarea
                      value={notes}
                      onChange={(e) => handleNotesChange(e.target.value)}
                      placeholder={`메시지를 들으면서 메모하세요...

💡 팁:
• '시간' 버튼으로 타임스탬프 추가
• 자동 저장됩니다`}
                      className="w-full h-48 p-3 bg-summit-50 dark:bg-muted rounded-xl border-0 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-summit-800 dark:text-foreground placeholder:text-summit-400 dark:placeholder:text-muted-foreground font-diary text-base leading-relaxed"
                    />
                  </div>

                  {/* 메모 푸터 */}
                  <div className="flex items-center justify-between px-4 py-3 border-t border-summit-100 dark:border-border">
                    <p className="text-xs text-summit-400 dark:text-muted-foreground">
                      {notes.length}자
                    </p>
                    <button
                      onClick={handleManualSave}
                      disabled={saving || !onSaveNotes}
                      className={cn(
                        "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50",
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
          )}
        </div>
      )}
    </div>
  );
}
