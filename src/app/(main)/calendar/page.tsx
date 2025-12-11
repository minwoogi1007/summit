"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek,
  parseISO
} from "date-fns";
import { ko } from "date-fns/locale";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cn, getTodayString } from "@/lib/utils";
import { CalendarMarker, MOOD_LABELS, MoodType } from "@/types";
import { 
  ChevronLeft, 
  ChevronRight, 
  BookOpen,
  Calendar as CalendarIcon
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function CalendarPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [markers, setMarkers] = useState<Map<string, CalendarMarker>>(new Map());
  const [loading, setLoading] = useState(true);

  const today = getTodayString();

  // 현재 월의 날짜들 계산
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  useEffect(() => {
    if (user) {
      loadMarkers();
    }
  }, [user, currentDate]);

  const loadMarkers = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const startStr = format(monthStart, "yyyy-MM-dd");
      const endStr = format(monthEnd, "yyyy-MM-dd");

      // 사용자의 일기 항목 로드
      const entriesRef = collection(db, "users", user.uid, "entries");
      const entriesQuery = query(
        entriesRef,
        where("date", ">=", startStr),
        where("date", "<=", endStr)
      );
      const entriesSnap = await getDocs(entriesQuery);

      // 기도수첩 로드
      const devotionsRef = collection(db, "devotions");
      const devotionsQuery = query(
        devotionsRef,
        where("date", ">=", startStr),
        where("date", "<=", endStr)
      );
      const devotionsSnap = await getDocs(devotionsQuery);

      // 마커 맵 생성
      const newMarkers = new Map<string, CalendarMarker>();

      // 일기 마커 추가
      entriesSnap.forEach((doc) => {
        const data = doc.data();
        const date = data.date;
        const hasContent = data.dailyEvents || data.myHeart || data.prayerResponse;
        
        if (hasContent) {
          newMarkers.set(date, {
            date,
            hasEntry: true,
            hasDevotion: false,
            mood: data.mood,
          });
        }
      });

      // 기도수첩 마커 추가
      devotionsSnap.forEach((doc) => {
        const data = doc.data();
        const date = data.date;
        const existing = newMarkers.get(date);
        
        if (existing) {
          existing.hasDevotion = true;
        } else {
          newMarkers.set(date, {
            date,
            hasEntry: false,
            hasDevotion: true,
          });
        }
      });

      setMarkers(newMarkers);
    } catch (error) {
      console.error("마커 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const navigateToDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    router.push(`/diary/${dateStr}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 헤더 */}
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-summit-900 flex items-center gap-2">
          <CalendarIcon className="w-6 h-6" />
          캘린더
        </h1>
        <button
          onClick={goToToday}
          className="px-4 py-2 text-sm font-medium text-summit-600 bg-summit-100 rounded-lg hover:bg-summit-200 transition-colors"
        >
          오늘
        </button>
      </header>

      {/* 캘린더 카드 */}
      <div className="bg-white rounded-2xl shadow-sm border border-summit-100 overflow-hidden">
        {/* 월 네비게이션 */}
        <div className="flex items-center justify-between p-4 border-b border-summit-100">
          <button
            onClick={goToPreviousMonth}
            className="p-2 rounded-lg hover:bg-summit-50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-summit-600" />
          </button>
          <h2 className="text-lg font-bold text-summit-900">
            {format(currentDate, "yyyy년 M월", { locale: ko })}
          </h2>
          <button
            onClick={goToNextMonth}
            className="p-2 rounded-lg hover:bg-summit-50 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-summit-600" />
          </button>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b border-summit-100">
          {WEEKDAYS.map((day, index) => (
            <div
              key={day}
              className={cn(
                "py-3 text-center text-sm font-medium",
                index === 0 ? "text-red-500" : index === 6 ? "text-blue-500" : "text-summit-600"
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        {loading ? (
          <div className="py-20">
            <LoadingSpinner message="일정을 불러오는 중..." />
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = dateStr === today;
              const marker = markers.get(dateStr);
              const dayOfWeek = day.getDay();

              return (
                <button
                  key={dateStr}
                  onClick={() => navigateToDate(day)}
                  disabled={!isCurrentMonth}
                  className={cn(
                    "relative aspect-square p-1 border-b border-r border-summit-50 transition-all",
                    isCurrentMonth 
                      ? "hover:bg-summit-50" 
                      : "opacity-30 cursor-not-allowed",
                    isToday && "bg-spirit-50"
                  )}
                >
                  {/* 날짜 숫자 */}
                  <div
                    className={cn(
                      "w-7 h-7 mx-auto flex items-center justify-center rounded-full text-sm font-medium",
                      isToday && "bg-spirit-500 text-white",
                      !isToday && dayOfWeek === 0 && "text-red-500",
                      !isToday && dayOfWeek === 6 && "text-blue-500",
                      !isToday && dayOfWeek !== 0 && dayOfWeek !== 6 && "text-summit-700"
                    )}
                  >
                    {format(day, "d")}
                  </div>

                  {/* 마커들 */}
                  {marker && isCurrentMonth && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-0.5">
                      {/* 기도수첩 마커 */}
                      {marker.hasDevotion && (
                        <BookOpen className="w-3 h-3 text-spirit-500" />
                      )}
                      {/* 일기 마커 - 감정 이모지 또는 점 */}
                      {marker.hasEntry && (
                        marker.mood ? (
                          <span className="text-xs">
                            {MOOD_LABELS[marker.mood as MoodType]?.emoji}
                          </span>
                        ) : (
                          <div className="w-1.5 h-1.5 bg-summit-500 rounded-full" />
                        )
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 범례 */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-summit-600">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-spirit-500" />
          <span>기도수첩</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-summit-500 rounded-full" />
          <span>일기 작성</span>
        </div>
        <div className="flex items-center gap-2">
          <span>😊</span>
          <span>감정 기록</span>
        </div>
      </div>
    </div>
  );
}

