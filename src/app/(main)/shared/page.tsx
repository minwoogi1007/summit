"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  doc,
  getDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DiaryEntry, MOOD_LABELS, MoodType } from "@/types";
import { formatDate, truncateText } from "@/lib/utils";
import { Users, Calendar, Heart, MessageCircle, Pencil } from "lucide-react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface SharedEntryWithUser extends DiaryEntry {
  ownerName: string;
  ownerPhoto?: string;
}

export default function SharedPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<SharedEntryWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"received" | "public">("public");

  useEffect(() => {
    if (user) {
      loadSharedEntries();
    }
  }, [user, activeTab]);

  const loadSharedEntries = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // 공개된 일기들 가져오기 (전체 공개)
      // 참고: 실제 구현에서는 더 효율적인 쿼리 구조 필요
      const usersRef = collection(db, "users");
      const usersSnap = await getDocs(usersRef);

      const allSharedEntries: SharedEntryWithUser[] = [];

      for (const userDoc of usersSnap.docs) {
        if (userDoc.id === user.uid) continue; // 본인 제외

        const userData = userDoc.data();
        const entriesRef = collection(db, "users", userDoc.id, "entries");
        
        let entriesQuery;
        if (activeTab === "public") {
          entriesQuery = query(
            entriesRef,
            where("isPublic", "==", true),
            orderBy("date", "desc")
          );
        } else {
          entriesQuery = query(
            entriesRef,
            where("sharedWith", "array-contains", user.uid),
            orderBy("date", "desc")
          );
        }

        try {
          const entriesSnap = await getDocs(entriesQuery);
          entriesSnap.forEach((entryDoc) => {
            const entryData = entryDoc.data();
            allSharedEntries.push({
              ...entryData,
              id: entryDoc.id,
              ownerName: userData.displayName || "익명",
              ownerPhoto: userData.photoURL,
              createdAt: entryData.createdAt?.toDate(),
              updatedAt: entryData.updatedAt?.toDate(),
            } as SharedEntryWithUser);
          });
        } catch (e) {
          // 인덱스 없는 경우 스킵
          console.log("Query skipped for user:", userDoc.id);
        }
      }

      // 날짜순 정렬
      allSharedEntries.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setEntries(allSharedEntries);
    } catch (error) {
      console.error("공유된 일기 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 헤더 */}
      <header>
        <h1 className="text-2xl font-bold text-summit-900 flex items-center gap-2">
          <Users className="w-6 h-6" />
          공유
        </h1>
        <p className="text-summit-600 mt-1">다른 사람들의 은혜로운 이야기</p>
      </header>

      {/* 탭 */}
      <div className="flex gap-2 bg-summit-100 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab("public")}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "public"
              ? "bg-white text-summit-800 shadow-sm"
              : "text-summit-600 hover:text-summit-800"
          }`}
        >
          전체 공개
        </button>
        <button
          onClick={() => setActiveTab("received")}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "received"
              ? "bg-white text-summit-800 shadow-sm"
              : "text-summit-600 hover:text-summit-800"
          }`}
        >
          나에게 공유됨
        </button>
      </div>

      {/* 목록 */}
      {loading ? (
        <LoadingSpinner message="공유된 일기를 불러오는 중..." />
      ) : entries.length === 0 ? (
        <div className="text-center py-16 text-summit-400">
          <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p>
            {activeTab === "public"
              ? "아직 공개된 일기가 없습니다"
              : "나에게 공유된 일기가 없습니다"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div
              key={`${entry.userId}-${entry.id}`}
              className="bg-white rounded-xl p-4 border border-summit-100 shadow-sm"
            >
              {/* 작성자 정보 */}
              <div className="flex items-center gap-3 mb-3">
                {entry.ownerPhoto ? (
                  <img
                    src={entry.ownerPhoto}
                    alt={entry.ownerName}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-summit-200 flex items-center justify-center">
                    <span className="text-summit-600 font-medium">
                      {entry.ownerName[0]}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-medium text-summit-800">{entry.ownerName}</p>
                  <p className="text-xs text-summit-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(entry.date)}
                    {entry.mood && (
                      <span className="ml-1">
                        {MOOD_LABELS[entry.mood as MoodType]?.emoji}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* 내용 */}
              <div className="space-y-3">
                {entry.dailyEvents && (
                  <div className="flex items-start gap-2">
                    <Pencil className="w-4 h-4 text-summit-400 mt-0.5 flex-shrink-0" />
                    <p className="text-summit-700 text-sm">
                      {truncateText(entry.dailyEvents, 200)}
                    </p>
                  </div>
                )}

                {entry.myHeart && (
                  <div className="flex items-start gap-2">
                    <Heart className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                    <p className="text-rose-700 text-sm">
                      {truncateText(entry.myHeart, 200)}
                    </p>
                  </div>
                )}

                {entry.prayerResponse && (
                  <div className="flex items-start gap-2">
                    <MessageCircle className="w-4 h-4 text-spirit-400 mt-0.5 flex-shrink-0" />
                    <p className="text-spirit-700 text-sm">
                      {truncateText(entry.prayerResponse, 200)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

