"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  limit
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { MOOD_LABELS, MoodType } from "@/types";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { 
  BarChart3, 
  Calendar, 
  Heart, 
  PenLine,
  TrendingUp,
  Flame,
  Award
} from "lucide-react";

interface DailyEntry {
  date: string;
  hasEntry: boolean;
  mood?: MoodType;
  wordCount: number;
}

interface MoodCount {
  mood: MoodType;
  count: number;
}

export default function StatsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");

  // 기간별 날짜 범위
  const dateRange = useMemo(() => {
    const today = new Date();
    let startDate: Date;
    
    switch (period) {
      case "week":
        startDate = subDays(today, 7);
        break;
      case "month":
        startDate = startOfMonth(today);
        break;
      case "year":
        startDate = subMonths(today, 12);
        break;
    }
    
    return {
      start: format(startDate, "yyyy-MM-dd"),
      end: format(today, "yyyy-MM-dd"),
      startDate,
      endDate: today,
    };
  }, [period]);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user, period]);

  const loadStats = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const entriesRef = collection(db, "users", user.uid, "entries");
      const entriesQuery = query(
        entriesRef,
        where("date", ">=", dateRange.start),
        where("date", "<=", dateRange.end),
        orderBy("date", "desc")
      );
      
      const snapshot = await getDocs(entriesQuery);
      const loadedEntries: DailyEntry[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const content = `${data.dailyEvents || ""} ${data.myHeart || ""} ${data.prayerResponse || ""}`;
        loadedEntries.push({
          date: data.date,
          hasEntry: !!(data.dailyEvents || data.myHeart || data.prayerResponse),
          mood: data.mood,
          wordCount: content.trim().length,
        });
      });
      
      setEntries(loadedEntries);
    } catch (error) {
      console.error("통계 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  // 통계 계산
  const stats = useMemo(() => {
    const totalDays = eachDayOfInterval({ 
      start: dateRange.startDate, 
      end: dateRange.endDate 
    }).length;
    
    const writtenDays = entries.filter(e => e.hasEntry).length;
    const writingRate = totalDays > 0 ? Math.round((writtenDays / totalDays) * 100) : 0;
    
    // 감정 통계
    const moodCounts: Record<string, number> = {};
    entries.forEach(e => {
      if (e.mood) {
        moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
      }
    });
    
    const topMoods: MoodCount[] = Object.entries(moodCounts)
      .map(([mood, count]) => ({ mood: mood as MoodType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    
    // 연속 기록 계산
    let currentStreak = 0;
    let maxStreak = 0;
    let streak = 0;
    
    const sortedDates = [...entries]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const today = format(new Date(), "yyyy-MM-dd");
    const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
    
    for (let i = 0; i < sortedDates.length; i++) {
      if (sortedDates[i].hasEntry) {
        streak++;
        maxStreak = Math.max(maxStreak, streak);
        
        // 오늘 또는 어제 기록이 있으면 현재 연속 기록
        if (i === 0 && (sortedDates[i].date === today || sortedDates[i].date === yesterday)) {
          currentStreak = streak;
        }
      } else {
        if (currentStreak === 0 && streak > 0) {
          currentStreak = streak;
        }
        streak = 0;
      }
    }
    
    // 총 글자수
    const totalWords = entries.reduce((sum, e) => sum + e.wordCount, 0);
    
    return {
      totalDays,
      writtenDays,
      writingRate,
      topMoods,
      currentStreak,
      maxStreak,
      totalWords,
    };
  }, [entries, dateRange]);

  // 히트맵 데이터
  const heatmapData = useMemo(() => {
    const days = eachDayOfInterval({ 
      start: dateRange.startDate, 
      end: dateRange.endDate 
    });
    
    return days.map(day => {
      const dateStr = format(day, "yyyy-MM-dd");
      const entry = entries.find(e => e.date === dateStr);
      return {
        date: day,
        dateStr,
        hasEntry: entry?.hasEntry || false,
        mood: entry?.mood,
        wordCount: entry?.wordCount || 0,
      };
    });
  }, [entries, dateRange]);

  if (loading) {
    return (
      <div className="py-20">
        <LoadingSpinner message="통계를 분석하는 중..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 헤더 */}
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-summit-900 dark:text-foreground flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          통계
        </h1>
        
        {/* 기간 선택 */}
        <div className="flex gap-1 bg-summit-100 dark:bg-muted p-1 rounded-lg">
          {[
            { value: "week", label: "주간" },
            { value: "month", label: "월간" },
            { value: "year", label: "연간" },
          ].map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value as typeof period)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                period === p.value
                  ? "bg-white dark:bg-card text-summit-800 dark:text-foreground shadow-sm"
                  : "text-summit-600 dark:text-muted-foreground hover:text-summit-800 dark:hover:text-foreground"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>

      {/* 통계 카드 그리드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 작성률 */}
        <StatCard
          icon={<PenLine className="w-5 h-5" />}
          label="작성률"
          value={`${stats.writingRate}%`}
          subtext={`${stats.writtenDays}/${stats.totalDays}일`}
          color="primary"
        />
        
        {/* 현재 연속 */}
        <StatCard
          icon={<Flame className="w-5 h-5" />}
          label="현재 연속"
          value={`${stats.currentStreak}일`}
          subtext={`최고 ${stats.maxStreak}일`}
          color="orange"
        />
        
        {/* 총 글자수 */}
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="총 글자수"
          value={stats.totalWords.toLocaleString()}
          subtext="자"
          color="green"
        />
        
        {/* 작성 일수 */}
        <StatCard
          icon={<Calendar className="w-5 h-5" />}
          label="작성 일수"
          value={`${stats.writtenDays}일`}
          subtext={`${period === "week" ? "이번 주" : period === "month" ? "이번 달" : "올해"}`}
          color="blue"
        />
      </div>

      {/* 감정 통계 */}
      {stats.topMoods.length > 0 && (
        <div className="bg-white dark:bg-card rounded-xl p-6 border border-summit-100 dark:border-border">
          <h2 className="font-bold text-summit-800 dark:text-foreground mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500" />
            자주 느낀 감정
          </h2>
          
          <div className="space-y-3">
            {stats.topMoods.map((item, index) => {
              const moodInfo = MOOD_LABELS[item.mood];
              const percentage = Math.round((item.count / stats.writtenDays) * 100);
              
              return (
                <div key={item.mood} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 w-24">
                    <span className="text-2xl">{moodInfo.emoji}</span>
                    <span className="text-sm text-summit-600 dark:text-muted-foreground">
                      {moodInfo.label}
                    </span>
                  </div>
                  <div className="flex-1 h-6 bg-summit-100 dark:bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        index === 0 ? "bg-rose-400" : index === 1 ? "bg-rose-300" : "bg-rose-200"
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-summit-600 dark:text-muted-foreground w-12 text-right">
                    {item.count}회
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 히트맵 */}
      <div className="bg-white dark:bg-card rounded-xl p-6 border border-summit-100 dark:border-border">
        <h2 className="font-bold text-summit-800 dark:text-foreground mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-spirit-500" />
          일기 작성 히트맵
        </h2>
        
        <div className="flex flex-wrap gap-1">
          {heatmapData.map((day) => (
            <div
              key={day.dateStr}
              className={cn(
                "w-4 h-4 rounded-sm transition-colors",
                day.hasEntry
                  ? day.mood 
                    ? "bg-primary" 
                    : "bg-summit-400"
                  : "bg-summit-100 dark:bg-muted"
              )}
              title={`${format(day.date, "M월 d일", { locale: ko })} - ${
                day.hasEntry ? `${day.wordCount}자 작성` : "작성 안 함"
              }`}
            />
          ))}
        </div>
        
        <div className="flex items-center justify-end gap-2 mt-4 text-xs text-summit-500 dark:text-muted-foreground">
          <span>작성 안 함</span>
          <div className="w-3 h-3 rounded-sm bg-summit-100 dark:bg-muted" />
          <div className="w-3 h-3 rounded-sm bg-summit-400" />
          <div className="w-3 h-3 rounded-sm bg-primary" />
          <span>작성함</span>
        </div>
      </div>

      {/* 업적 */}
      {(stats.maxStreak >= 7 || stats.writtenDays >= 30) && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
          <h2 className="font-bold text-summit-800 dark:text-foreground mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-600" />
            획득한 업적
          </h2>
          
          <div className="flex flex-wrap gap-3">
            {stats.maxStreak >= 7 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-card rounded-lg shadow-sm">
                <span className="text-xl">🔥</span>
                <span className="text-sm font-medium text-summit-700 dark:text-foreground">
                  일주일 연속 작성
                </span>
              </div>
            )}
            {stats.maxStreak >= 30 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-card rounded-lg shadow-sm">
                <span className="text-xl">💪</span>
                <span className="text-sm font-medium text-summit-700 dark:text-foreground">
                  한 달 연속 작성
                </span>
              </div>
            )}
            {stats.writtenDays >= 30 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-card rounded-lg shadow-sm">
                <span className="text-xl">📚</span>
                <span className="text-sm font-medium text-summit-700 dark:text-foreground">
                  30일 일기 달성
                </span>
              </div>
            )}
            {stats.totalWords >= 10000 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-card rounded-lg shadow-sm">
                <span className="text-xl">✍️</span>
                <span className="text-sm font-medium text-summit-700 dark:text-foreground">
                  만자 작가
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// 통계 카드 컴포넌트
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
  color: "primary" | "orange" | "green" | "blue";
}

function StatCard({ icon, label, value, subtext, color }: StatCardProps) {
  const colorClasses = {
    primary: "bg-primary/10 text-primary dark:bg-primary/20",
    orange: "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
    green: "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400",
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
  };

  return (
    <div className="bg-white dark:bg-card rounded-xl p-4 border border-summit-100 dark:border-border">
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-3", colorClasses[color])}>
        {icon}
      </div>
      <p className="text-sm text-summit-500 dark:text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-summit-900 dark:text-foreground">
        {value}
      </p>
      <p className="text-xs text-summit-400 dark:text-muted-foreground">{subtext}</p>
    </div>
  );
}

