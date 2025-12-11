"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { DiaryEditor } from "@/components/diary/DiaryEditor";
import { TodaysDevotion } from "@/components/devotion/TodaysDevotion";
import { formatDate, getTodayString } from "@/lib/utils";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { encryptDiaryFields, decryptDiaryFields } from "@/lib/crypto";
import type { DiaryEntry, Devotion } from "@/types";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Calendar, ChevronLeft, ChevronRight, ArrowLeft, Lock } from "lucide-react";
import { format, addDays, subDays, parseISO } from "date-fns";
import Link from "next/link";

export default function DiaryDatePage() {
  const params = useParams();
  const router = useRouter();
  const { user, encryptionKey } = useAuth();
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [devotion, setDevotion] = useState<Devotion | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const dateStr = params.date as string;
  const today = getTodayString();
  const isToday = dateStr === today;

  useEffect(() => {
    if (user && dateStr && encryptionKey) {
      loadData();
    }
  }, [user, dateStr, encryptionKey]);

  const loadData = async () => {
    if (!user || !encryptionKey) return;
    
    setLoading(true);
    try {
      // 해당 날짜의 일기 로드
      const entryRef = doc(db, "users", user.uid, "entries", dateStr);
      const entrySnap = await getDoc(entryRef);
      
      if (entrySnap.exists()) {
        const data = entrySnap.data();
        
        // 암호화된 필드 복호화
        const decrypted = await decryptDiaryFields(
          {
            dailyEvents: data.dailyEvents || "",
            myHeart: data.myHeart || "",
            prayerResponse: data.prayerResponse || "",
          },
          encryptionKey
        );
        
        setEntry({
          ...data,
          ...decrypted,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as DiaryEntry);
      } else {
        // 새 일기 초기화
        setEntry({
          id: dateStr,
          userId: user.uid,
          date: dateStr,
          dailyEvents: "",
          myHeart: "",
          prayerResponse: "",
          customFields: [],
          isBookmarked: false,
          isShared: false,
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // 해당 날짜의 기도수첩 로드
      const devotionRef = doc(db, "devotions", dateStr);
      const devotionSnap = await getDoc(devotionRef);
      
      if (devotionSnap.exists()) {
        const data = devotionSnap.data();
        setDevotion({
          ...data,
          uploadedAt: data.uploadedAt?.toDate(),
        } as Devotion);
      } else {
        setDevotion(null);
      }
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveEntry = async (updatedEntry: Partial<DiaryEntry>) => {
    if (!user || !entry || !encryptionKey) return;
    
    setSaving(true);
    try {
      const entryRef = doc(db, "users", user.uid, "entries", dateStr);
      
      // 민감한 필드 암호화
      const fieldsToEncrypt = {
        dailyEvents: updatedEntry.dailyEvents ?? entry.dailyEvents,
        myHeart: updatedEntry.myHeart ?? entry.myHeart,
        prayerResponse: updatedEntry.prayerResponse ?? entry.prayerResponse,
      };
      
      const encrypted = await encryptDiaryFields(fieldsToEncrypt, encryptionKey);
      
      const newEntry = {
        ...entry,
        ...updatedEntry,
        ...encrypted,
        isEncrypted: true,
        updatedAt: serverTimestamp(),
      };
      
      await setDoc(entryRef, newEntry, { merge: true });
      setEntry({
        ...entry,
        ...updatedEntry,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error("저장 실패:", error);
    } finally {
      setSaving(false);
    }
  };

  const navigateToDate = (direction: "prev" | "next") => {
    const currentDate = parseISO(dateStr);
    const newDate = direction === "prev" 
      ? subDays(currentDate, 1) 
      : addDays(currentDate, 1);
    router.push(`/diary/${format(newDate, "yyyy-MM-dd")}`);
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="일기를 불러오는 중..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 헤더 */}
      <header className="space-y-4">
        <Link
          href="/calendar"
          className="inline-flex items-center gap-2 text-summit-600 hover:text-summit-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>캘린더로 돌아가기</span>
        </Link>

        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateToDate("prev")}
            className="p-2 rounded-lg hover:bg-summit-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-summit-600" />
          </button>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-summit-900">
              {isToday ? "오늘의 일기" : formatDate(dateStr, "M월 d일의 일기")}
            </h1>
            <p className="text-summit-600 flex items-center justify-center gap-2 mt-1">
              <Calendar className="w-4 h-4" />
              {formatDate(dateStr, "yyyy년 M월 d일 EEEE")}
            </p>
          </div>

          <button
            onClick={() => navigateToDate("next")}
            className="p-2 rounded-lg hover:bg-summit-100 transition-colors"
            disabled={dateStr >= today}
          >
            <ChevronRight className={`w-5 h-5 ${dateStr >= today ? "text-summit-300" : "text-summit-600"}`} />
          </button>
        </div>

        <div className="flex items-center justify-center gap-3">
          {saving && (
            <div className="text-sm text-summit-500">
              저장 중...
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <Lock className="w-3 h-3" />
            암호화
          </div>
        </div>
      </header>

      {/* 해당 날짜의 말씀 */}
      <TodaysDevotion devotion={devotion} />

      {/* 일기 작성 */}
      {entry && (
        <DiaryEditor 
          entry={entry} 
          onSave={saveEntry}
          saving={saving}
        />
      )}
    </div>
  );
}

