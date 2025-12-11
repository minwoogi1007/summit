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
  ChevronDown,
  ChevronUp,
  Edit3,
  X,
  Check
} from "lucide-react";
import { doc, setDoc, deleteDoc, collection, query, orderBy, getDocs, serverTimestamp, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Devotion } from "@/types";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { cn, formatDate } from "@/lib/utils";
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
  const [activeTab, setActiveTab] = useState<"register" | "list">("register");
  const [form, setForm] = useState<DevotionForm>(emptyDevotionForm());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
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

  // 목록 로드
  useEffect(() => {
    if (activeTab === "list") {
      loadDevotions();
    }
  }, [activeTab]);

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
      
      // 폼 초기화하지 않고 유지 (사용자가 확인할 수 있도록)
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
        <h1 className="text-2xl font-bold text-summit-900 flex items-center gap-2">
          <Shield className="w-6 h-6 text-spirit-600" />
          관리자
        </h1>
        <p className="text-summit-600 mt-1">기도수첩 및 콘텐츠 관리</p>
      </header>

      {/* 메시지 */}
      {message && (
        <div
          className={cn(
            "p-4 rounded-xl animate-fade-in",
            message.type === "success" 
              ? "bg-green-50 text-green-700 border border-green-200" 
              : "bg-red-50 text-red-700 border border-red-200"
          )}
        >
          {message.text}
        </div>
      )}

      {/* 탭 */}
      <div className="flex gap-2 bg-summit-100 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab("register")}
          className={cn(
            "flex items-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex-1 justify-center",
            activeTab === "register"
              ? "bg-white text-summit-800 shadow-sm"
              : "text-summit-600 hover:text-summit-800"
          )}
        >
          <Plus className="w-4 h-4" />
          등록하기
        </button>
        <button
          onClick={() => setActiveTab("list")}
          className={cn(
            "flex items-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex-1 justify-center",
            activeTab === "list"
              ? "bg-white text-summit-800 shadow-sm"
              : "text-summit-600 hover:text-summit-800"
          )}
        >
          <FileText className="w-4 h-4" />
          목록 관리
        </button>
      </div>

      {/* 등록 폼 */}
      {activeTab === "register" && (
        <div className="bg-white rounded-xl p-6 border border-summit-100 space-y-4">
          <h2 className="font-bold text-summit-800 mb-4">기도수첩 등록</h2>
          
          {/* 날짜 */}
          <div>
            <label className="block text-sm font-medium text-summit-700 mb-1">
              날짜 *
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => updateForm("date", e.target.value)}
              className="w-full px-4 py-2 border border-summit-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-summit-300"
            />
          </div>

          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-summit-700 mb-1">
              제목
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateForm("title", e.target.value)}
              placeholder="오늘의 말씀"
              className="w-full px-4 py-2 border border-summit-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-summit-300"
            />
          </div>

          {/* 성경 구절 */}
          <div>
            <label className="block text-sm font-medium text-summit-700 mb-1">
              성경 구절 (예: 창세기 1:1-10)
            </label>
            <input
              type="text"
              value={form.bibleVerse}
              onChange={(e) => updateForm("bibleVerse", e.target.value)}
              placeholder="창세기 1:1-10"
              className="w-full px-4 py-2 border border-summit-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-summit-300"
            />
          </div>

          {/* 성경 본문 */}
          <div>
            <label className="block text-sm font-medium text-summit-700 mb-1">
              성경 본문 내용
            </label>
            <textarea
              value={form.bibleText}
              onChange={(e) => updateForm("bibleText", e.target.value)}
              placeholder="성경 본문을 입력하세요..."
              rows={3}
              className="w-full px-4 py-2 border border-summit-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-summit-300 resize-none"
            />
          </div>

          {/* 기도수첩 본문 */}
          <div>
            <label className="block text-sm font-medium text-summit-700 mb-1">
              기도수첩 본문 *
            </label>
            <textarea
              value={form.content}
              onChange={(e) => updateForm("content", e.target.value)}
              placeholder="오늘의 묵상 내용을 입력하세요..."
              rows={6}
              className="w-full px-4 py-2 border border-summit-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-summit-300 resize-none"
            />
          </div>

          {/* 기도제목 */}
          <div>
            <label className="block text-sm font-medium text-summit-700 mb-1">
              기도제목
            </label>
            {form.prayerPoints.map((point, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={point}
                  onChange={(e) => updatePrayerPoint(index, e.target.value)}
                  placeholder={`기도제목 ${index + 1}`}
                  className="flex-1 px-4 py-2 border border-summit-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-summit-300"
                />
                {form.prayerPoints.length > 1 && (
                  <button
                    onClick={() => removePrayerPoint(index)}
                    className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addPrayerPoint}
              className="text-sm text-summit-600 hover:text-summit-800 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              기도제목 추가
            </button>
          </div>

          {/* 외부 링크 */}
          <div>
            <label className="block text-sm font-medium text-summit-700 mb-1">
              <LinkIcon className="w-4 h-4 inline mr-1" />
              외부 링크 (기도수첩 원문)
            </label>
            <input
              type="url"
              value={form.externalLink}
              onChange={(e) => updateForm("externalLink", e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2 border border-summit-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-summit-300"
            />
          </div>

          {/* 유튜브 링크 */}
          <div>
            <label className="block text-sm font-medium text-summit-700 mb-1">
              <Youtube className="w-4 h-4 inline mr-1 text-red-500" />
              유튜브 링크 (메시지 영상)
            </label>
            <input
              type="url"
              value={form.youtubeLink}
              onChange={(e) => updateForm("youtubeLink", e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-4 py-2 border border-summit-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-summit-300"
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
            <div className="text-center py-12 text-summit-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>등록된 기도수첩이 없습니다</p>
            </div>
          ) : (
            devotions.map((devotion) => (
              <div
                key={devotion.id}
                className="bg-white rounded-xl p-4 border border-summit-100 shadow-sm"
              >
                {editingId === devotion.id && editForm ? (
                  // 수정 모드
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-summit-800">수정 중</span>
                      <div className="flex gap-2">
                        <button
                          onClick={cancelEdit}
                          className="p-2 text-summit-500 hover:bg-summit-50 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          onClick={saveEdit}
                          disabled={saving}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
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
                      className="w-full px-3 py-2 border border-summit-200 rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      value={editForm.bibleVerse}
                      onChange={(e) => setEditForm({ ...editForm, bibleVerse: e.target.value })}
                      placeholder="성경 구절"
                      className="w-full px-3 py-2 border border-summit-200 rounded-lg text-sm"
                    />
                    <textarea
                      value={editForm.content}
                      onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                      placeholder="본문 내용"
                      rows={4}
                      className="w-full px-3 py-2 border border-summit-200 rounded-lg text-sm resize-none"
                    />
                    <input
                      type="url"
                      value={editForm.youtubeLink}
                      onChange={(e) => setEditForm({ ...editForm, youtubeLink: e.target.value })}
                      placeholder="유튜브 링크"
                      className="w-full px-3 py-2 border border-summit-200 rounded-lg text-sm"
                    />
                  </div>
                ) : (
                  // 보기 모드
                  <>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-summit-400" />
                          <span className="font-medium text-summit-700">
                            {formatDate(devotion.date)}
                          </span>
                        </div>
                        <h3 className="font-bold text-summit-800 mt-1">
                          {devotion.title || "오늘의 말씀"}
                        </h3>
                        {devotion.bibleVerse && (
                          <p className="text-sm text-spirit-600">{devotion.bibleVerse}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEdit(devotion)}
                          className="p-2 text-summit-500 hover:text-summit-700 hover:bg-summit-50 rounded-lg transition-colors"
                          title="수정"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {deleteConfirm === devotion.id ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => deleteDevotion(devotion.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="삭제 확인"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="p-2 text-summit-500 hover:bg-summit-50 rounded-lg"
                              title="취소"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(devotion.id)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-summit-600 line-clamp-2">
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
