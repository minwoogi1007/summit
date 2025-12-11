"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { decryptDiaryFields } from "@/lib/crypto";
import { DiaryEntry, MOOD_LABELS, MoodType } from "@/types";
import { formatDate, truncateText } from "@/lib/utils";
import { Search as SearchIcon, Calendar, Bookmark, Lock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function SearchPage() {
  const { user, encryptionKey } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [filterBookmarked, setFilterBookmarked] = useState(false);

  const searchEntries = async () => {
    if (!user || !encryptionKey) return;

    setLoading(true);
    setHasSearched(true);

    try {
      const entriesRef = collection(db, "users", user.uid, "entries");
      const q = query(entriesRef, orderBy("date", "desc"));
      const snapshot = await getDocs(q);

      const allEntries: DiaryEntry[] = [];
      
      // 모든 엔트리 복호화
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        
        // 암호화된 필드 복호화
        const decrypted = await decryptDiaryFields(
          {
            dailyEvents: data.dailyEvents || "",
            myHeart: data.myHeart || "",
            prayerResponse: data.prayerResponse || "",
          },
          encryptionKey
        );
        
        allEntries.push({
          ...data,
          ...decrypted,
          id: docSnap.id,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as DiaryEntry);
      }

      // 클라이언트 측 필터링
      let filtered = allEntries;

      // 텍스트 검색
      if (searchQuery.trim()) {
        const lowerQuery = searchQuery.toLowerCase();
        filtered = filtered.filter((entry) => {
          const searchableText = [
            entry.dailyEvents,
            entry.myHeart,
            entry.prayerResponse,
            ...(entry.customFields?.map((f) => `${f.title} ${f.content}`) || []),
          ]
            .join(" ")
            .toLowerCase();
          return searchableText.includes(lowerQuery);
        });
      }

      // 즐겨찾기 필터
      if (filterBookmarked) {
        filtered = filtered.filter((entry) => entry.isBookmarked);
      }

      setEntries(filtered);
    } catch (error) {
      console.error("검색 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchEntries();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 헤더 */}
      <header>
        <h1 className="text-2xl font-bold text-summit-900 flex items-center gap-2">
          <SearchIcon className="w-6 h-6" />
          검색
        </h1>
        <p className="text-summit-600 mt-1">과거의 일기를 검색해보세요</p>
      </header>

      {/* 검색 폼 */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-summit-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="키워드로 검색..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-summit-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-summit-300 focus:border-transparent transition-all"
          />
        </div>

        {/* 필터 옵션 */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setFilterBookmarked(!filterBookmarked)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
              filterBookmarked
                ? "bg-yellow-100 text-yellow-700 border border-yellow-300"
                : "bg-summit-50 text-summit-600 border border-summit-200 hover:bg-summit-100"
            )}
          >
            <Bookmark className="w-4 h-4" />
            <span>즐겨찾기만</span>
          </button>

          <button
            type="submit"
            disabled={loading}
            className="flex-1 md:flex-none px-6 py-2 bg-summit-600 text-white rounded-lg hover:bg-summit-700 transition-colors disabled:opacity-50"
          >
            {loading ? "검색 중..." : "검색"}
          </button>
        </div>
      </form>

      {/* 검색 결과 */}
      {hasSearched && (
        <div className="space-y-4">
          <p className="text-sm text-summit-500">
            {entries.length}개의 결과를 찾았습니다
          </p>

          {entries.length === 0 ? (
            <div className="text-center py-12 text-summit-500">
              <SearchIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>검색 결과가 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <Link
                  key={entry.id}
                  href={`/diary/${entry.date}`}
                  className="block bg-white rounded-xl p-4 border border-summit-100 hover:shadow-md hover:border-summit-200 transition-all card-hover"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-summit-400" />
                      <span className="text-sm font-medium text-summit-700">
                        {formatDate(entry.date)}
                      </span>
                      {entry.mood && (
                        <span className="text-lg">
                          {MOOD_LABELS[entry.mood as MoodType]?.emoji}
                        </span>
                      )}
                    </div>
                    {entry.isBookmarked && (
                      <Bookmark className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>

                  {/* 미리보기 */}
                  <div className="space-y-1 text-sm text-summit-600">
                    {entry.dailyEvents && (
                      <p>{truncateText(entry.dailyEvents, 100)}</p>
                    )}
                    {entry.myHeart && (
                      <p className="text-rose-600">
                        💗 {truncateText(entry.myHeart, 80)}
                      </p>
                    )}
                    {entry.prayerResponse && (
                      <p className="text-spirit-600">
                        🙏 {truncateText(entry.prayerResponse, 80)}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 초기 상태 */}
      {!hasSearched && (
        <div className="text-center py-16 text-summit-400">
          <SearchIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p>검색어를 입력하고 검색 버튼을 눌러주세요</p>
        </div>
      )}
    </div>
  );
}

