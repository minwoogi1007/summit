"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { 
  Shield, 
  Calendar, 
  Link as LinkIcon, 
  Youtube,
  FileText,
  Save,
  Plus,
  Trash2,
  Edit3,
  X,
  Check,
  Users,
  BookOpen,
  PenLine,
  TrendingUp,
  Clock
} from "lucide-react";
import { 
  doc, 
  setDoc, 
  deleteDoc, 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  serverTimestamp, 
  limit,
  where,
  getCountFromServer
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Devotion, MOOD_LABELS, MoodType } from "@/types";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { cn, formatDate, getTodayString } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface DevotionForm {
  date: string;
  title: string;
  bibleVerse: string;
  bibleText: string;
  content: string;
  prayerPoints: string[];
  externalLink: string;
  youtubeLink: string;
}

interface AdminStats {
  totalUsers: number;
  totalDevotions: number;
  todayEntries: number;
  recentUsers: { uid: string; displayName: string; email: string; createdAt: Date }[];
  moodStats: { mood: MoodType; count: number }[];
}

const emptyDevotionForm = (): DevotionForm => ({
  date: format(new Date(), "yyyy-MM-dd"),
  title: "",
  bibleVerse: "",
  bibleText: "",
  content: "",
  prayerPoints: [""],
  externalLink: "",
  youtubeLink: "",
});

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"dashboard" | "register" | "list">("dashboard");
  const [form, setForm] = useState<DevotionForm>(emptyDevotionForm());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // 대시보드 상태
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  
  // 목록 관련 상태
  const [devotions, setDevotions] = useState<Devotion[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<DevotionForm | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // 관리자 권한 확인
  useEffect(() => {
    if (user && !user.isAdmin) {
      router.push("/diary");
    }
  }, [user, router]);

  // 탭 변경 시 데이터 로드
  useEffect(() => {
    if (activeTab === "list") {
      loadDevotions();
    } else if (activeTab === "dashboard") {
      loadStats();
    }
  }, [activeTab]);

  // 대시보드 통계 로드
  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const today = getTodayString();
      
      // 전체 사용자 수
      const usersRef = collection(db, "users");
      const usersSnapshot = await getCountFromServer(usersRef);
      const totalUsers = usersSnapshot.data().count;
      
      // 전체 기도수첩 수
      const devotionsRef = collection(db, "devotions");
      const devotionsSnapshot = await getCountFromServer(devotionsRef);
      const totalDevotions = devotionsSnapshot.data().count;
      
      // 최근 가입 사용자 (최근 10명)
      const recentUsersQuery = query(usersRef, orderBy("createdAt", "desc"), limit(10));
      const recentUsersSnapshot = await getDocs(recentUsersQuery);
      const recentUsers: AdminStats["recentUsers"] = [];
      recentUsersSnapshot.forEach((doc) => {
        const data = doc.data();
        recentUsers.push({
          uid: doc.id,
          displayName: data.displayName || "익명",
          email: data.email || "",
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      });
      
      // 오늘 작성된 일기 수 및 감정 통계 (샘플링)
      let todayEntries = 0;
      const moodCounts: Record<string, number> = {};
      
      // 각 사용자의 entries를 확인 (최대 50명까지만)
      const usersQuery = query(usersRef, limit(50));
      const usersDocsSnapshot = await getDocs(usersQuery);
      
      for (const userDoc of usersDocsSnapshot.docs) {
        const entriesRef = collection(db, "users", userDoc.id, "entries");
        
        // 오늘 일기
        const todayQuery = query(entriesRef, where("date", "==", today));
        const todaySnapshot = await getDocs(todayQuery);
        todayEntries += todaySnapshot.size;
        
        // 감정 통계 (최근 30일)
        const thirtyDaysAgo = format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd");
        const recentEntriesQuery = query(
          entriesRef, 
          where("date", ">=", thirtyDaysAgo),
          limit(100)
        );
        const recentEntriesSnapshot = await getDocs(recentEntriesQuery);
        
        recentEntriesSnapshot.forEach((entryDoc) => {
          const mood = entryDoc.data().mood;
          if (mood) {
            moodCounts[mood] = (moodCounts[mood] || 0) + 1;
          }
        });
      }
      
      // 감정 통계 정렬
      const moodStats: AdminStats["moodStats"] = Object.entries(moodCounts)
        .map(([mood, count]) => ({ mood: mood as MoodType, count }))
        .sort((a, b) => b.count - a.count);
      
      setStats({
        totalUsers,
        totalDevotions,
        todayEntries,
        recentUsers,
        moodStats,
      });
    } catch (error) {
      console.error("통계 로드 실패:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadDevotions = async () => {
    setLoadingList(true);
    try {
      const devotionsRef = collection(db, "devotions");
      const q = query(devotionsRef, orderBy("date", "desc"), limit(50));
      const snapshot = await getDocs(q);
      
      const list: Devotion[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          ...data,
          id: doc.id,
          uploadedAt: data.uploadedAt?.toDate(),
        } as Devotion);
      });
      
      setDevotions(list);
    } catch (error) {
      console.error("목록 로드 실패:", error);
    } finally {
      setLoadingList(false);
    }
  };

  if (!user?.isAdmin) {
    return <LoadingSpinner fullScreen />;
  }

  const updateForm = (field: keyof DevotionForm, value: unknown) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const addPrayerPoint = () => {
    updateForm("prayerPoints", [...form.prayerPoints, ""]);
  };

  const updatePrayerPoint = (index: number, value: string) => {
    const newPoints = [...form.prayerPoints];
    newPoints[index] = value;
    updateForm("prayerPoints", newPoints);
  };

  const removePrayerPoint = (index: number) => {
    updateForm("prayerPoints", form.prayerPoints.filter((_, i) => i !== index));
  };

  const saveDevotion = async () => {
    if (!form.date || !form.content) {
      setMessage({ type: "error", text: "날짜와 본문 내용은 필수입니다." });
      return;
    }

    setSaving(true);
    try {
      const devotionData: Partial<Devotion> = {
        id: form.date,
        date: form.date,
        title: form.title || "오늘의 말씀",
        bibleVerse: form.bibleVerse,
        bibleText: form.bibleText,
        content: form.content,
        prayerPoints: form.prayerPoints.filter(p => p.trim()),
        externalLink: form.externalLink,
        youtubeLink: form.youtubeLink,
        uploadedBy: user.uid,
        uploadedAt: serverTimestamp() as unknown as Date,
      };

      await setDoc(doc(db, "devotions", form.date), devotionData);
      setMessage({ type: "success", text: "기도수첩이 저장되었습니다!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("저장 실패:", error);
      setMessage({ type: "error", text: "저장에 실패했습니다. 다시 시도해주세요." });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (devotion: Devotion) => {
    setEditingId(devotion.id);
    setEditForm({
      date: devotion.date,
      title: devotion.title || "",
      bibleVerse: devotion.bibleVerse || "",
      bibleText: devotion.bibleText || "",
      content: devotion.content || "",
      prayerPoints: devotion.prayerPoints || [""],
      externalLink: devotion.externalLink || "",
      youtubeLink: devotion.youtubeLink || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const saveEdit = async () => {
    if (!editForm || !editingId) return;

    setSaving(true);
    try {
      const devotionData: Partial<Devotion> = {
        id: editForm.date,
        date: editForm.date,
        title: editForm.title || "오늘의 말씀",
        bibleVerse: editForm.bibleVerse,
        bibleText: editForm.bibleText,
        content: editForm.content,
        prayerPoints: editForm.prayerPoints.filter(p => p.trim()),
        externalLink: editForm.externalLink,
        youtubeLink: editForm.youtubeLink,
        uploadedBy: user.uid,
        uploadedAt: serverTimestamp() as unknown as Date,
      };

      await setDoc(doc(db, "devotions", editForm.date), devotionData);
      setMessage({ type: "success", text: "수정되었습니다!" });
      
      cancelEdit();
      loadDevotions();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("수정 실패:", error);
      setMessage({ type: "error", text: "수정에 실패했습니다." });
    } finally {
      setSaving(false);
    }
  };

  const deleteDevotion = async (id: string) => {
    try {
      await deleteDoc(doc(db, "devotions", id));
      setMessage({ type: "success", text: "삭제되었습니다!" });
      setDeleteConfirm(null);
      loadDevotions();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("삭제 실패:", error);
      setMessage({ type: "error", text: "삭제에 실패했습니다." });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 헤더 */}
      <header>
        <h1 className="text-2xl font-bold text-summit-900 dark:text-foreground flex items-center gap-2">
          <Shield className="w-6 h-6 text-spirit-600" />
          관리자
        </h1>
        <p className="text-summit-600 dark:text-muted-foreground mt-1">대시보드 및 콘텐츠 관리</p>
      </header>

      {/* 메시지 */}
      {message && (
        <div
          className={cn(
            "p-4 rounded-xl animate-fade-in",
            message.type === "success" 
              ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800" 
              : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
          )}
        >
          {message.text}
        </div>
      )}

      {/* 탭 */}
      <div className="flex gap-1 bg-summit-100 dark:bg-muted p-1 rounded-xl overflow-x-auto">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={cn(
            "flex items-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
            activeTab === "dashboard"
              ? "bg-white dark:bg-card text-summit-800 dark:text-foreground shadow-sm"
              : "text-summit-600 dark:text-muted-foreground hover:text-summit-800 dark:hover:text-foreground"
          )}
        >
          <TrendingUp className="w-4 h-4" />
          대시보드
        </button>
        <button
          onClick={() => setActiveTab("register")}
          className={cn(
            "flex items-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
            activeTab === "register"
              ? "bg-white dark:bg-card text-summit-800 dark:text-foreground shadow-sm"
              : "text-summit-600 dark:text-muted-foreground hover:text-summit-800 dark:hover:text-foreground"
          )}
        >
          <Plus className="w-4 h-4" />
          등록
        </button>
        <button
          onClick={() => setActiveTab("list")}
          className={cn(
            "flex items-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
            activeTab === "list"
              ? "bg-white dark:bg-card text-summit-800 dark:text-foreground shadow-sm"
              : "text-summit-600 dark:text-muted-foreground hover:text-summit-800 dark:hover:text-foreground"
          )}
        >
          <FileText className="w-4 h-4" />
          목록
        </button>
      </div>

      {/* 대시보드 */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {loadingStats ? (
            <LoadingSpinner message="통계를 불러오는 중..." />
          ) : stats ? (
            <>
              {/* 통계 카드 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={<Users className="w-5 h-5" />}
                  label="총 사용자"
                  value={stats.totalUsers}
                  color="blue"
                />
                <StatCard
                  icon={<BookOpen className="w-5 h-5" />}
                  label="기도수첩"
                  value={stats.totalDevotions}
                  color="purple"
                />
                <StatCard
                  icon={<PenLine className="w-5 h-5" />}
                  label="오늘 일기"
                  value={stats.todayEntries}
                  color="green"
                />
                <StatCard
                  icon={<TrendingUp className="w-5 h-5" />}
                  label="감정 기록"
                  value={stats.moodStats.reduce((sum, m) => sum + m.count, 0)}
                  color="orange"
                />
              </div>

              {/* 최근 가입 사용자 */}
              <div className="bg-white dark:bg-card rounded-xl p-6 border border-summit-100 dark:border-border">
                <h2 className="font-bold text-summit-800 dark:text-foreground mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-spirit-500" />
                  최근 가입 사용자
                </h2>
                
                {stats.recentUsers.length === 0 ? (
                  <p className="text-summit-400 dark:text-muted-foreground text-center py-4">
                    아직 가입한 사용자가 없습니다
                  </p>
                ) : (
                  <div className="space-y-3">
                    {stats.recentUsers.map((u) => (
                      <div
                        key={u.uid}
                        className="flex items-center gap-3 p-3 bg-summit-50 dark:bg-muted rounded-lg"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-primary font-medium">
                            {u.displayName[0] || "U"}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-summit-800 dark:text-foreground truncate">
                            {u.displayName}
                          </p>
                          <p className="text-xs text-summit-500 dark:text-muted-foreground truncate">
                            {u.email}
                          </p>
                        </div>
                        <div className="text-xs text-summit-400 dark:text-muted-foreground">
                          {format(u.createdAt, "M/d HH:mm", { locale: ko })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 전체 감정 통계 */}
              {stats.moodStats.length > 0 && (
                <div className="bg-white dark:bg-card rounded-xl p-6 border border-summit-100 dark:border-border">
                  <h2 className="font-bold text-summit-800 dark:text-foreground mb-4 flex items-center gap-2">
                    😊 전체 감정 분포 (최근 30일)
                  </h2>
                  
                  <div className="space-y-3">
                    {stats.moodStats.slice(0, 5).map((item) => {
                      const moodInfo = MOOD_LABELS[item.mood];
                      const total = stats.moodStats.reduce((sum, m) => sum + m.count, 0);
                      const percentage = Math.round((item.count / total) * 100);
                      
                      return (
                        <div key={item.mood} className="flex items-center gap-3">
                          <div className="flex items-center gap-2 w-24">
                            <span className="text-xl">{moodInfo?.emoji || "😊"}</span>
                            <span className="text-sm text-summit-600 dark:text-muted-foreground">
                              {moodInfo?.label || item.mood}
                            </span>
                          </div>
                          <div className="flex-1 h-4 bg-summit-100 dark:bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-summit-600 dark:text-muted-foreground w-16 text-right">
                            {item.count}회 ({percentage}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-summit-400 dark:text-muted-foreground py-8">
              통계를 불러올 수 없습니다
            </p>
          )}
        </div>
      )}

      {/* 등록 폼 */}
      {activeTab === "register" && (
        <div className="bg-white dark:bg-card rounded-xl p-6 border border-summit-100 dark:border-border space-y-4">
          <h2 className="font-bold text-summit-800 dark:text-foreground mb-4">기도수첩 등록</h2>
          
          {/* 날짜 */}
          <div>
            <label className="block text-sm font-medium text-summit-700 dark:text-foreground mb-1">
              날짜 *
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => updateForm("date", e.target.value)}
              className="w-full px-4 py-2 border border-summit-200 dark:border-border bg-white dark:bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-summit-300 dark:text-foreground"
            />
          </div>

          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-summit-700 dark:text-foreground mb-1">
              제목
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateForm("title", e.target.value)}
              placeholder="오늘의 말씀"
              className="w-full px-4 py-2 border border-summit-200 dark:border-border bg-white dark:bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-summit-300 dark:text-foreground dark:placeholder:text-muted-foreground"
            />
          </div>

          {/* 성경 구절 */}
          <div>
            <label className="block text-sm font-medium text-summit-700 dark:text-foreground mb-1">
              성경 구절 (예: 창세기 1:1-10)
            </label>
            <input
              type="text"
              value={form.bibleVerse}
              onChange={(e) => updateForm("bibleVerse", e.target.value)}
              placeholder="창세기 1:1-10"
              className="w-full px-4 py-2 border border-summit-200 dark:border-border bg-white dark:bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-summit-300 dark:text-foreground dark:placeholder:text-muted-foreground"
            />
          </div>

          {/* 성경 본문 */}
          <div>
            <label className="block text-sm font-medium text-summit-700 dark:text-foreground mb-1">
              성경 본문 내용
            </label>
            <textarea
              value={form.bibleText}
              onChange={(e) => updateForm("bibleText", e.target.value)}
              placeholder="성경 본문을 입력하세요..."
              rows={3}
              className="w-full px-4 py-2 border border-summit-200 dark:border-border bg-white dark:bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-summit-300 resize-none dark:text-foreground dark:placeholder:text-muted-foreground"
            />
          </div>

          {/* 기도수첩 본문 */}
          <div>
            <label className="block text-sm font-medium text-summit-700 dark:text-foreground mb-1">
              기도수첩 본문 *
            </label>
            <textarea
              value={form.content}
              onChange={(e) => updateForm("content", e.target.value)}
              placeholder="오늘의 묵상 내용을 입력하세요..."
              rows={6}
              className="w-full px-4 py-2 border border-summit-200 dark:border-border bg-white dark:bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-summit-300 resize-none dark:text-foreground dark:placeholder:text-muted-foreground"
            />
          </div>

          {/* 기도제목 */}
          <div>
            <label className="block text-sm font-medium text-summit-700 dark:text-foreground mb-1">
              기도제목
            </label>
            {form.prayerPoints.map((point, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={point}
                  onChange={(e) => updatePrayerPoint(index, e.target.value)}
                  placeholder={`기도제목 ${index + 1}`}
                  className="flex-1 px-4 py-2 border border-summit-200 dark:border-border bg-white dark:bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-summit-300 dark:text-foreground dark:placeholder:text-muted-foreground"
                />
                {form.prayerPoints.length > 1 && (
                  <button
                    onClick={() => removePrayerPoint(index)}
                    className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addPrayerPoint}
              className="text-sm text-summit-600 dark:text-muted-foreground hover:text-summit-800 dark:hover:text-foreground flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              기도제목 추가
            </button>
          </div>

          {/* 외부 링크 */}
          <div>
            <label className="block text-sm font-medium text-summit-700 dark:text-foreground mb-1">
              <LinkIcon className="w-4 h-4 inline mr-1" />
              외부 링크 (기도수첩 원문)
            </label>
            <input
              type="url"
              value={form.externalLink}
              onChange={(e) => updateForm("externalLink", e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2 border border-summit-200 dark:border-border bg-white dark:bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-summit-300 dark:text-foreground dark:placeholder:text-muted-foreground"
            />
          </div>

          {/* 유튜브 링크 */}
          <div>
            <label className="block text-sm font-medium text-summit-700 dark:text-foreground mb-1">
              <Youtube className="w-4 h-4 inline mr-1 text-red-500" />
              유튜브 링크 (메시지 영상)
            </label>
            <input
              type="url"
              value={form.youtubeLink}
              onChange={(e) => updateForm("youtubeLink", e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-4 py-2 border border-summit-200 dark:border-border bg-white dark:bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-summit-300 dark:text-foreground dark:placeholder:text-muted-foreground"
            />
          </div>

          {/* 저장 버튼 */}
          <button
            onClick={saveDevotion}
            disabled={saving}
            className="w-full py-3 bg-spirit-600 text-white rounded-xl font-medium hover:bg-spirit-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>저장 중...</>
            ) : (
              <>
                <Save className="w-5 h-5" />
                저장하기
              </>
            )}
          </button>
        </div>
      )}

      {/* 목록 관리 */}
      {activeTab === "list" && (
        <div className="space-y-4">
          {loadingList ? (
            <LoadingSpinner message="목록을 불러오는 중..." />
          ) : devotions.length === 0 ? (
            <div className="text-center py-12 text-summit-500 dark:text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>등록된 기도수첩이 없습니다</p>
            </div>
          ) : (
            devotions.map((devotion) => (
              <div
                key={devotion.id}
                className="bg-white dark:bg-card rounded-xl p-4 border border-summit-100 dark:border-border shadow-sm"
              >
                {editingId === devotion.id && editForm ? (
                  // 수정 모드
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-summit-800 dark:text-foreground">수정 중</span>
                      <div className="flex gap-2">
                        <button
                          onClick={cancelEdit}
                          className="p-2 text-summit-500 hover:bg-summit-50 dark:hover:bg-muted rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          onClick={saveEdit}
                          disabled={saving}
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      placeholder="제목"
                      className="w-full px-3 py-2 border border-summit-200 dark:border-border bg-white dark:bg-muted rounded-lg text-sm dark:text-foreground"
                    />
                    <input
                      type="text"
                      value={editForm.bibleVerse}
                      onChange={(e) => setEditForm({ ...editForm, bibleVerse: e.target.value })}
                      placeholder="성경 구절"
                      className="w-full px-3 py-2 border border-summit-200 dark:border-border bg-white dark:bg-muted rounded-lg text-sm dark:text-foreground"
                    />
                    <textarea
                      value={editForm.content}
                      onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                      placeholder="본문 내용"
                      rows={4}
                      className="w-full px-3 py-2 border border-summit-200 dark:border-border bg-white dark:bg-muted rounded-lg text-sm resize-none dark:text-foreground"
                    />
                    <input
                      type="url"
                      value={editForm.youtubeLink}
                      onChange={(e) => setEditForm({ ...editForm, youtubeLink: e.target.value })}
                      placeholder="유튜브 링크"
                      className="w-full px-3 py-2 border border-summit-200 dark:border-border bg-white dark:bg-muted rounded-lg text-sm dark:text-foreground"
                    />
                  </div>
                ) : (
                  // 보기 모드
                  <>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-summit-400 dark:text-muted-foreground" />
                          <span className="font-medium text-summit-700 dark:text-foreground">
                            {formatDate(devotion.date)}
                          </span>
                        </div>
                        <h3 className="font-bold text-summit-800 dark:text-foreground mt-1">
                          {devotion.title || "오늘의 말씀"}
                        </h3>
                        {devotion.bibleVerse && (
                          <p className="text-sm text-spirit-600 dark:text-accent">{devotion.bibleVerse}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEdit(devotion)}
                          className="p-2 text-summit-500 hover:text-summit-700 hover:bg-summit-50 dark:hover:bg-muted rounded-lg transition-colors"
                          title="수정"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {deleteConfirm === devotion.id ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => deleteDevotion(devotion.id)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                              title="삭제 확인"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="p-2 text-summit-500 hover:bg-summit-50 dark:hover:bg-muted rounded-lg"
                              title="취소"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(devotion.id)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-summit-600 dark:text-muted-foreground line-clamp-2">
                      {devotion.content}
                    </p>
                    {devotion.youtubeLink && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-red-500">
                        <Youtube className="w-3 h-3" />
                        <span>영상 포함</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// 통계 카드 컴포넌트
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "blue" | "purple" | "green" | "orange";
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    purple: "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
    green: "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400",
    orange: "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
  };

  return (
    <div className="bg-white dark:bg-card rounded-xl p-4 border border-summit-100 dark:border-border">
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-3", colorClasses[color])}>
        {icon}
      </div>
      <p className="text-sm text-summit-500 dark:text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-summit-900 dark:text-foreground">
        {value.toLocaleString()}
      </p>
    </div>
  );
}
