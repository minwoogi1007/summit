"use client";

import { useState, useEffect } from "react";
import { parseBibleReference, fetchBibleVerse, formatBibleReference } from "@/lib/bible";
import { BookOpen, ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BibleVerseCardProps {
  reference: string;
  className?: string;
}

export function BibleVerseCard({ reference, className }: BibleVerseCardProps) {
  const [verseText, setVerseText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const parsed = parseBibleReference(reference);

  useEffect(() => {
    if (parsed && expanded && !verseText) {
      loadVerse();
    }
  }, [expanded, parsed]);

  const loadVerse = async () => {
    setLoading(true);
    try {
      const text = await fetchBibleVerse(reference);
      setVerseText(text);
    } catch (error) {
      console.error("성경 구절 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!parsed) {
    return null;
  }

  const formattedRef = formatBibleReference(parsed);

  return (
    <div 
      className={cn(
        "border border-spirit-200 rounded-lg overflow-hidden bg-spirit-50/50",
        className
      )}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-spirit-100 transition-colors"
      >
        <div className="flex items-center gap-2 text-spirit-700">
          <BookOpen className="w-4 h-4" />
          <span className="text-sm font-medium">{formattedRef}</span>
        </div>
        <span className="text-xs text-spirit-500">
          {expanded ? "접기" : "펼치기"}
        </span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 animate-fade-in">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-spirit-500" />
            </div>
          ) : verseText ? (
            <div className="text-sm text-spirit-800 leading-relaxed bg-white rounded p-3 border border-spirit-100">
              <p className="font-diary text-base italic">"{verseText}"</p>
            </div>
          ) : (
            <div className="text-sm text-spirit-500 py-2">
              <p>성경 구절을 불러올 수 없습니다.</p>
              <a
                href={`https://www.biblegateway.com/passage/?search=${encodeURIComponent(reference)}&version=NKRV`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-spirit-600 hover:text-spirit-700 mt-2"
              >
                <ExternalLink className="w-3 h-3" />
                외부에서 보기
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

