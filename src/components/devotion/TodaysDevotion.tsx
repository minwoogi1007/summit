"use client";

import { useState } from "react";
import { Devotion } from "@/types";
import { extractYoutubeVideoId, getYoutubeEmbedUrl } from "@/lib/utils";
import { 
  BookOpen, 
  ExternalLink, 
  Youtube, 
  ChevronDown, 
  ChevronUp,
  Copy,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TodaysDevotionProps {
  devotion: Devotion | null;
}

export function TodaysDevotion({ devotion }: TodaysDevotionProps) {
  const [expanded, setExpanded] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!devotion) {
    return (
      <div className="bg-gradient-to-br from-spirit-50 to-white rounded-2xl p-6 border border-spirit-100 shadow-sm">
        <div className="flex items-center gap-3 text-spirit-600">
          <BookOpen className="w-6 h-6" />
          <span className="font-medium">오늘의 말씀이 아직 등록되지 않았습니다</span>
        </div>
        <p className="mt-2 text-sm text-spirit-500">
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

  return (
    <div className="bg-gradient-to-br from-spirit-50 via-white to-summit-50 rounded-2xl shadow-sm border border-spirit-100 overflow-hidden">
      {/* 헤더 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-spirit-500 to-spirit-600 flex items-center justify-center shadow-sm">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h2 className="font-bold text-spirit-900">{devotion.title || "오늘의 말씀"}</h2>
            <p className="text-sm text-spirit-600">{devotion.bibleVerse}</p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-spirit-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-spirit-400" />
        )}
      </button>

      {/* 본문 */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 animate-fade-in">
          {/* 성경 본문 */}
          {devotion.bibleText && (
            <div className="relative bg-white rounded-xl p-4 border border-spirit-100">
              <p className="text-spirit-800 leading-relaxed font-diary text-lg">
                "{devotion.bibleText}"
              </p>
              <button
                onClick={copyVerse}
                className="absolute top-2 right-2 p-2 text-spirit-400 hover:text-spirit-600 hover:bg-spirit-50 rounded-lg transition-colors"
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
          <div className="prose prose-sm max-w-none text-summit-700">
            <p className="whitespace-pre-wrap">{devotion.content}</p>
          </div>

          {/* 기도제목 */}
          {devotion.prayerPoints && devotion.prayerPoints.length > 0 && (
            <div className="bg-summit-50 rounded-xl p-4">
              <h3 className="font-semibold text-summit-800 mb-2">🙏 오늘의 기도제목</h3>
              <ul className="space-y-2">
                {devotion.prayerPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-2 text-summit-700">
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
                className="flex items-center gap-2 px-4 py-2 bg-summit-100 text-summit-700 rounded-lg hover:bg-summit-200 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="text-sm">기도수첩 원문 보기</span>
              </a>
            )}

            {/* 유튜브 링크 */}
            {youtubeVideoId && (
              <button
                onClick={() => setShowVideo(!showVideo)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                  showVideo 
                    ? "bg-red-100 text-red-700" 
                    : "bg-red-50 text-red-600 hover:bg-red-100"
                )}
              >
                <Youtube className="w-4 h-4" />
                <span className="text-sm">
                  {showVideo ? "영상 닫기" : "메시지 듣기"}
                </span>
              </button>
            )}
          </div>

          {/* 유튜브 임베드 */}
          {showVideo && youtubeVideoId && (
            <div className="youtube-container animate-scale-in">
              <iframe
                src={getYoutubeEmbedUrl(youtubeVideoId)}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

