"use client";

import { useState, useCallback } from "react";
import { DiaryEntry, CustomField, MoodType, MOOD_LABELS } from "@/types";
import { cn, debounce } from "@/lib/utils";
import { 
  Pencil, 
  Heart, 
  MessageCircle, 
  Plus, 
  Trash2, 
  Bookmark,
  BookmarkCheck,
  Share2,
  ChevronDown,
  ChevronUp,
  Save,
  Check
} from "lucide-react";

interface DiaryEditorProps {
  entry: DiaryEntry;
  onSave: (entry: Partial<DiaryEntry>) => Promise<void>;
  saving?: boolean;
}

export function DiaryEditor({ entry, onSave, saving = false }: DiaryEditorProps) {
  const [localEntry, setLocalEntry] = useState(entry);
  const [expandedSections, setExpandedSections] = useState({
    dailyEvents: true,
    myHeart: true,
    prayerResponse: true,
    customFields: true,
  });
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // 디바운스된 저장 함수
  const debouncedSave = useCallback(
    debounce((updates: Partial<DiaryEntry>) => {
      onSave(updates);
    }, 1000),
    [onSave]
  );

  const updateField = (field: keyof DiaryEntry, value: unknown) => {
    const updates = { [field]: value };
    setLocalEntry(prev => ({ ...prev, ...updates }));
    debouncedSave(updates);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const addCustomField = () => {
    const newField: CustomField = {
      id: Date.now().toString(),
      title: "",
      content: "",
    };
    const customFields = [...(localEntry.customFields || []), newField];
    updateField("customFields", customFields);
  };

  const updateCustomField = (id: string, updates: Partial<CustomField>) => {
    const customFields = (localEntry.customFields || []).map(field =>
      field.id === id ? { ...field, ...updates } : field
    );
    updateField("customFields", customFields);
  };

  const removeCustomField = (id: string) => {
    const customFields = (localEntry.customFields || []).filter(
      field => field.id !== id
    );
    updateField("customFields", customFields);
  };

  const toggleBookmark = () => {
    updateField("isBookmarked", !localEntry.isBookmarked);
  };

  const selectMood = (mood: MoodType) => {
    updateField("mood", mood);
    setShowMoodPicker(false);
  };

  // 수동 저장
  const handleManualSave = async () => {
    await onSave({
      dailyEvents: localEntry.dailyEvents,
      myHeart: localEntry.myHeart,
      prayerResponse: localEntry.prayerResponse,
      customFields: localEntry.customFields,
      mood: localEntry.mood,
      isBookmarked: localEntry.isBookmarked,
      isShared: localEntry.isShared,
    });
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* 상단 액션 바 */}
      <div className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm border border-summit-100">
        {/* 감정 선택 */}
        <div className="relative">
          <button
            onClick={() => setShowMoodPicker(!showMoodPicker)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-summit-50 transition-colors"
          >
            {localEntry.mood ? (
              <>
                <span className="text-xl">{MOOD_LABELS[localEntry.mood].emoji}</span>
                <span className="text-sm text-summit-600">
                  {MOOD_LABELS[localEntry.mood].label}
                </span>
              </>
            ) : (
              <>
                <Heart className="w-5 h-5 text-summit-400" />
                <span className="text-sm text-summit-400">오늘의 기분</span>
              </>
            )}
          </button>

          {/* 감정 선택 드롭다운 */}
          {showMoodPicker && (
            <div className="absolute top-full left-0 mt-2 p-2 bg-white rounded-xl shadow-lg border border-summit-100 z-10 animate-scale-in">
              <div className="grid grid-cols-4 gap-1">
                {(Object.entries(MOOD_LABELS) as [MoodType, { label: string; emoji: string }][]).map(
                  ([key, { label, emoji }]) => (
                    <button
                      key={key}
                      onClick={() => selectMood(key)}
                      className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-summit-50 transition-colors",
                        localEntry.mood === key && "bg-summit-100"
                      )}
                    >
                      <span className="text-2xl">{emoji}</span>
                      <span className="text-xs text-summit-600">{label}</span>
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* 우측 액션 */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleBookmark}
            className={cn(
              "p-2 rounded-lg transition-colors",
              localEntry.isBookmarked
                ? "text-yellow-500 bg-yellow-50"
                : "text-summit-400 hover:bg-summit-50"
            )}
            title={localEntry.isBookmarked ? "즐겨찾기 해제" : "즐겨찾기"}
          >
            {localEntry.isBookmarked ? (
              <BookmarkCheck className="w-5 h-5" />
            ) : (
              <Bookmark className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={() => updateField("isShared", !localEntry.isShared)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              localEntry.isShared
                ? "text-spirit-500 bg-spirit-50"
                : "text-summit-400 hover:bg-summit-50"
            )}
            title={localEntry.isShared ? "공유 해제" : "공유하기"}
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 오늘 있었던 일 */}
      <DiarySection
        title="오늘 있었던 일"
        icon={<Pencil className="w-4 h-4" />}
        expanded={expandedSections.dailyEvents}
        onToggle={() => toggleSection("dailyEvents")}
      >
        <textarea
          value={localEntry.dailyEvents}
          onChange={(e) => updateField("dailyEvents", e.target.value)}
          placeholder="오늘 하루 어떤 일이 있었나요?"
          className="diary-input w-full min-h-[120px] p-4 bg-transparent border-0 resize-none focus:outline-none focus:ring-0"
        />
      </DiarySection>

      {/* 내 마음 */}
      <DiarySection
        title="내 마음"
        icon={<Heart className="w-4 h-4" />}
        expanded={expandedSections.myHeart}
        onToggle={() => toggleSection("myHeart")}
        accentColor="rose"
      >
        <textarea
          value={localEntry.myHeart}
          onChange={(e) => updateField("myHeart", e.target.value)}
          placeholder="오늘 느낀 감정과 생각을 적어보세요..."
          className="diary-input w-full min-h-[120px] p-4 bg-transparent border-0 resize-none focus:outline-none focus:ring-0"
        />
      </DiarySection>

      {/* 응답 */}
      <DiarySection
        title="응답"
        icon={<MessageCircle className="w-4 h-4" />}
        expanded={expandedSections.prayerResponse}
        onToggle={() => toggleSection("prayerResponse")}
        accentColor="spirit"
      >
        <textarea
          value={localEntry.prayerResponse}
          onChange={(e) => updateField("prayerResponse", e.target.value)}
          placeholder="기도 응답이나 하나님께서 주신 메시지가 있나요?"
          className="diary-input w-full min-h-[120px] p-4 bg-transparent border-0 resize-none focus:outline-none focus:ring-0"
        />
      </DiarySection>

      {/* 커스텀 필드 */}
      {localEntry.customFields && localEntry.customFields.length > 0 && (
        <DiarySection
          title="추가 기록"
          icon={<Plus className="w-4 h-4" />}
          expanded={expandedSections.customFields}
          onToggle={() => toggleSection("customFields")}
        >
          <div className="space-y-4 p-4">
            {localEntry.customFields.map((field) => (
              <div key={field.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={field.title}
                    onChange={(e) =>
                      updateCustomField(field.id, { title: e.target.value })
                    }
                    placeholder="제목"
                    className="flex-1 px-3 py-2 bg-summit-50 rounded-lg border-0 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-summit-300"
                  />
                  <button
                    onClick={() => removeCustomField(field.id)}
                    className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  value={field.content}
                  onChange={(e) =>
                    updateCustomField(field.id, { content: e.target.value })
                  }
                  placeholder="내용을 입력하세요..."
                  className="diary-input w-full min-h-[80px] p-3 bg-transparent border-0 resize-none focus:outline-none focus:ring-0"
                />
              </div>
            ))}
          </div>
        </DiarySection>
      )}

      {/* 필드 추가 버튼 */}
      <button
        onClick={addCustomField}
        className="w-full py-4 border-2 border-dashed border-summit-200 rounded-xl text-summit-500 hover:border-summit-400 hover:text-summit-600 hover:bg-summit-50 transition-all flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        <span>항목 추가</span>
      </button>

      {/* 저장 버튼 */}
      <button
        onClick={handleManualSave}
        disabled={saving}
        className={cn(
          "w-full py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
          justSaved
            ? "bg-green-500 text-white"
            : saving
            ? "bg-summit-300 text-white cursor-not-allowed"
            : "bg-summit-600 text-white hover:bg-summit-700 active:scale-[0.98]"
        )}
      >
        {justSaved ? (
          <>
            <Check className="w-5 h-5" />
            <span>저장 완료!</span>
          </>
        ) : saving ? (
          <>
            <Save className="w-5 h-5 animate-pulse" />
            <span>저장 중...</span>
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            <span>저장하기</span>
          </>
        )}
      </button>
    </div>
  );
}

// 섹션 컴포넌트
interface DiarySectionProps {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  accentColor?: "summit" | "rose" | "spirit";
}

function DiarySection({
  title,
  icon,
  expanded,
  onToggle,
  children,
  accentColor = "summit",
}: DiarySectionProps) {
  const accentClasses = {
    summit: "border-l-summit-500",
    rose: "border-l-rose-400",
    spirit: "border-l-spirit-500",
  };

  return (
    <div
      className={cn(
        "bg-white rounded-xl shadow-sm border border-summit-100 overflow-hidden transition-all",
        "border-l-4",
        accentClasses[accentColor]
      )}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-summit-50 transition-colors"
      >
        <div className="flex items-center gap-2 text-summit-700 font-medium">
          {icon}
          <span>{title}</span>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-summit-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-summit-400" />
        )}
      </button>
      {expanded && <div className="border-t border-summit-100">{children}</div>}
    </div>
  );
}

