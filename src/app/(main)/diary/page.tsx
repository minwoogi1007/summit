"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { DiaryEditor } from "@/components/diary/DiaryEditor";
import { TodaysDevotion } from "@/components/devotion/TodaysDevotion";
import { getTodayString, formatDate } from "@/lib/utils";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { encryptDiaryFields, decryptDiaryFields } from "@/lib/crypto";
import type { DiaryEntry, Devotion } from "@/types";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Calendar, Sparkles, Lock } from "lucide-react";

export default function DiaryPage() {
  const { user, encryptionKey } = useAuth();
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [devotion, setDevotion] = useState<Devotion | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const today = getTodayString();

  useEffect(() => {
    if (user && encryptionKey) {
      loadData();
    }
  }, [user, encryptionKey]);

  const loadData = async () => {
    if (!user || !encryptionKey) return;
    
    setLoading(true);
    try {
      // 오늘의 일기 로드
      const entryRef = doc(db, "users", user.uid, "entries", today);
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
          id: today,
          userId: user.uid,
          date: today,
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

      // 오늘의 기도수첩 로드
      const devotionRef = doc(db, "devotions", today);
      const devotionSnap = await getDoc(devotionRef);
      
      if (devotionSnap.exists()) {
        const data = devotionSnap.data();
        setDevotion({
          ...data,
          uploadedAt: data.uploadedAt?.toDate(),
        } as Devotion);
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
      const entryRef = doc(db, "users", user.uid, "entries", today);
      
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
        ...encrypted, // 암호화된 필드로 덮어쓰기
        isEncrypted: true, // 암호화 여부 표시
        updatedAt: serverTimestamp(),
      };
      
      await setDoc(entryRef, newEntry, { merge: true });
      
      // 로컬 상태는 복호화된 원본 유지
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

  if (loading) {
    return <LoadingSpinner fullScreen message="일기를 불러오는 중..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 헤더 */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-summit-900">오늘의 일기</h1>
          <p className="text-summit-600 flex items-center gap-2 mt-1">
            <Calendar className="w-4 h-4" />
            {formatDate(today, "yyyy년 M월 d일 EEEE")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saving && (
            <div className="flex items-center gap-2 text-sm text-summit-500">
              <Sparkles className="w-4 h-4 animate-spin" />
              저장 중...
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <Lock className="w-3 h-3" />
            암호화
          </div>
        </div>
      </header>

      {/* 오늘의 말씀 */}
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

