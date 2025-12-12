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
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { ko } from "date-fns/locale";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cn, getTodayString } from "@/lib/utils";
import { CalendarMarker, CalendarEvent, MOOD_LABELS, MoodType } from "@/types";
import { EventModal } from "@/components/calendar/EventModal";
import { 
  ChevronLeft, 
  ChevronRight, 
  BookOpen,
  Calendar as CalendarIcon,
  Plus,
  X
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function CalendarPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [markers, setMarkers] = useState<Map<string, CalendarMarker>>(new Map());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 일정 모달 상태
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>();
  
  // 선택된 날짜의 일정 보기
  const [showingEventsDate, setShowingEventsDate] = useState<string | null>(null);

  const today = getTodayString();

  // 현재 월의 날짜들 계산
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  // 선택된 날짜의 일정들
  const selectedDateEvents = useMemo(() => {
    if (!showingEventsDate) return [];
    return events.filter(e => e.date === showingEventsDate);
  }, [events, showingEventsDate]);

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

      // 사용자의 일정 로드
      const eventsRef = collection(db, "users", user.uid, "events");
      const eventsQuery = query(
        eventsRef,
        where("date", ">=", startStr),
        where("date", "<=", endStr)
      );
      const eventsSnap = await getDocs(eventsQuery);

      // 일정 데이터 저장
      const loadedEvents: CalendarEvent[] = [];
      eventsSnap.forEach((doc) => {
        const data = doc.data();
        loadedEvents.push({
          id: doc.id,
          userId: user.uid,
          title: data.title,
          date: data.date,
          time: data.time,
          description: data.description,
          color: data.color,
          isAllDay: data.isAllDay,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        });
      });
      setEvents(loadedEvents);

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
            events: loadedEvents.filter(e => e.date === date),
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
            events: loadedEvents.filter(e => e.date === date),
          });
        }
      });

      // 일정만 있는 날짜 추가
      loadedEvents.forEach((event) => {
        if (!newMarkers.has(event.date)) {
          newMarkers.set(event.date, {
            date: event.date,
            hasEntry: false,
            hasDevotion: false,
            events: [event],
          });
        } else {
          const existing = newMarkers.get(event.date);
          if (existing && !existing.events?.find(e => e.id === event.id)) {
            existing.events = [...(existing.events || []), event];
          }
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

  const handleDateClick = (dateStr: string, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return;
    
    // 이미 선택된 날짜면 일정 보기/숨기기 토글
    if (showingEventsDate === dateStr) {
      setShowingEventsDate(null);
    } else {
      setShowingEventsDate(dateStr);
    }
  };

  const handleDateDoubleClick = (dateStr: string, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return;
    router.push(`/diary/${dateStr}`);
  };

  const openAddEventModal = (dateStr: string) => {
    setSelectedDate(dateStr);
    setEditingEvent(undefined);
    setModalOpen(true);
  };

  const openEditEventModal = (event: CalendarEvent) => {
    setSelectedDate(event.date);
    setEditingEvent(event);
    setModalOpen(true);
  };

  const handleSaveEvent = async (eventData: Omit<CalendarEvent, "id" | "userId" | "createdAt" | "updatedAt">) => {
    if (!user) return;

    try {
      if (editingEvent) {
        // 수정
        const eventRef = doc(db, "users", user.uid, "events", editingEvent.id);
        await updateDoc(eventRef, {
          ...eventData,
          updatedAt: serverTimestamp(),
        });
      } else {
        // 추가
        const eventsRef = collection(db, "users", user.uid, "events");
        await addDoc(eventsRef, {
          ...eventData,
          userId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      
      // 리로드
      await loadMarkers();
    } catch (error) {
      console.error("일정 저장 실패:", error);
      throw error;
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!user) return;

    try {
      const eventRef = doc(db, "users", user.uid, "events", eventId);
      await deleteDoc(eventRef);
      await loadMarkers();
    } catch (error) {
      console.error("일정 삭제 실패:", error);
      throw error;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 헤더 */}
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-summit-900 dark:text-foreground flex items-center gap-2">
          <CalendarIcon className="w-6 h-6" />
          캘린더
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openAddEventModal(today)}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            일정
          </button>
          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm font-medium text-summit-600 dark:text-muted-foreground bg-summit-100 dark:bg-muted rounded-lg hover:bg-summit-200 dark:hover:bg-muted/80 transition-colors"
          >
            오늘
          </button>
        </div>
      </header>

      {/* 캘린더 카드 */}
      <div className="bg-white dark:bg-card rounded-2xl shadow-sm border border-summit-100 dark:border-border overflow-hidden">
        {/* 월 네비게이션 */}
        <div className="flex items-center justify-between p-4 border-b border-summit-100 dark:border-border">
          <button
            onClick={goToPreviousMonth}
            className="p-2 rounded-lg hover:bg-summit-50 dark:hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-summit-600 dark:text-muted-foreground" />
          </button>
          <h2 className="text-lg font-bold text-summit-900 dark:text-foreground">
            {format(currentDate, "yyyy년 M월", { locale: ko })}
          </h2>
          <button
            onClick={goToNextMonth}
            className="p-2 rounded-lg hover:bg-summit-50 dark:hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-summit-600 dark:text-muted-foreground" />
          </button>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b border-summit-100 dark:border-border">
          {WEEKDAYS.map((day, index) => (
            <div
              key={day}
              className={cn(
                "py-3 text-center text-sm font-medium",
                index === 0 ? "text-red-500" : index === 6 ? "text-blue-500" : "text-summit-600 dark:text-muted-foreground"
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
            {calendarDays.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = dateStr === today;
              const marker = markers.get(dateStr);
              const dayOfWeek = day.getDay();
              const dateEvents = events.filter(e => e.date === dateStr);
              const isSelected = showingEventsDate === dateStr;

              return (
                <button
                  key={dateStr}
                  onClick={() => handleDateClick(dateStr, isCurrentMonth)}
                  onDoubleClick={() => handleDateDoubleClick(dateStr, isCurrentMonth)}
                  disabled={!isCurrentMonth}
                  className={cn(
                    "relative aspect-square p-1 border-b border-r border-summit-50 dark:border-border/50 transition-all",
                    isCurrentMonth 
                      ? "hover:bg-summit-50 dark:hover:bg-muted" 
                      : "opacity-30 cursor-not-allowed",
                    isToday && "bg-spirit-50 dark:bg-accent/10",
                    isSelected && "bg-primary/10 dark:bg-primary/20"
                  )}
                >
                  {/* 날짜 숫자 */}
                  <div
                    className={cn(
                      "w-7 h-7 mx-auto flex items-center justify-center rounded-full text-sm font-medium",
                      isToday && "bg-spirit-500 text-white",
                      !isToday && dayOfWeek === 0 && "text-red-500",
                      !isToday && dayOfWeek === 6 && "text-blue-500",
                      !isToday && dayOfWeek !== 0 && dayOfWeek !== 6 && "text-summit-700 dark:text-foreground"
                    )}
                  >
                    {format(day, "d")}
                  </div>

                  {/* 마커들 */}
                  {isCurrentMonth && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-0.5">
                      {/* 기도수첩 마커 */}
                      {marker?.hasDevotion && (
                        <BookOpen className="w-3 h-3 text-spirit-500" />
                      )}
                      {/* 일기 마커 */}
                      {marker?.hasEntry && (
                        marker.mood ? (
                          <span className="text-xs">
                            {MOOD_LABELS[marker.mood as MoodType]?.emoji}
                          </span>
                        ) : (
                          <div className="w-1.5 h-1.5 bg-summit-500 rounded-full" />
                        )
                      )}
                      {/* 일정 마커 */}
                      {dateEvents.length > 0 && (
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: dateEvents[0].color }}
                        />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 선택된 날짜의 일정 목록 */}
      {showingEventsDate && (
        <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-summit-100 dark:border-border p-4 animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-summit-800 dark:text-foreground">
              {format(new Date(showingEventsDate), "M월 d일 (EEEE)", { locale: ko })}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAddEventModal(showingEventsDate)}
                className="flex items-center gap-1 px-2 py-1 text-xs text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
              >
                <Plus className="w-3 h-3" />
                일정 추가
              </button>
              <button
                onClick={() => router.push(`/diary/${showingEventsDate}`)}
                className="px-2 py-1 text-xs text-summit-600 dark:text-muted-foreground bg-summit-100 dark:bg-muted rounded-lg hover:bg-summit-200 dark:hover:bg-muted/80 transition-colors"
              >
                일기 보기
              </button>
              <button
                onClick={() => setShowingEventsDate(null)}
                className="p-1 text-summit-400 hover:text-summit-600 dark:text-muted-foreground dark:hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {selectedDateEvents.length === 0 ? (
            <p className="text-sm text-summit-400 dark:text-muted-foreground text-center py-4">
              일정이 없습니다
            </p>
          ) : (
            <div className="space-y-2">
              {selectedDateEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => openEditEventModal(event)}
                  className="w-full flex items-center gap-3 p-3 bg-summit-50 dark:bg-muted rounded-lg hover:bg-summit-100 dark:hover:bg-muted/80 transition-colors text-left"
                >
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: event.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-summit-800 dark:text-foreground truncate">
                      {event.title}
                    </p>
                    <p className="text-xs text-summit-500 dark:text-muted-foreground">
                      {event.isAllDay ? "종일" : event.time}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 범례 */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-summit-600 dark:text-muted-foreground">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-spirit-500" />
          <span>기도수첩</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-summit-500 rounded-full" />
          <span>일기</span>
        </div>
        <div className="flex items-center gap-2">
          <span>😊</span>
          <span>감정</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-primary rounded-full" />
          <span>일정</span>
        </div>
      </div>

      {/* 일정 추가/수정 모달 */}
      {selectedDate && (
        <EventModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingEvent(undefined);
          }}
          onSave={handleSaveEvent}
          onDelete={editingEvent ? handleDeleteEvent : undefined}
          date={selectedDate}
          existingEvent={editingEvent}
        />
      )}
    </div>
  );
}
