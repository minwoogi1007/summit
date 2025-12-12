"use client";

import { useState, useEffect } from "react";
import { CalendarEvent } from "@/types";
import { cn } from "@/lib/utils";
import { X, Calendar, Clock, Palette, Trash2, Save } from "lucide-react";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<CalendarEvent, "id" | "userId" | "createdAt" | "updatedAt">) => Promise<void>;
  onDelete?: (eventId: string) => Promise<void>;
  date: string;
  existingEvent?: CalendarEvent;
}

const EVENT_COLORS = [
  { name: "오렌지", value: "#d5804a" },
  { name: "블루", value: "#0e8ee9" },
  { name: "그린", value: "#22c55e" },
  { name: "퍼플", value: "#8b5cf6" },
  { name: "핑크", value: "#ec4899" },
  { name: "레드", value: "#ef4444" },
];

export function EventModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  date,
  existingEvent,
}: EventModalProps) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(EVENT_COLORS[0].value);
  const [isAllDay, setIsAllDay] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 기존 이벤트 데이터 로드
  useEffect(() => {
    if (existingEvent) {
      setTitle(existingEvent.title);
      setTime(existingEvent.time || "");
      setDescription(existingEvent.description || "");
      setColor(existingEvent.color || EVENT_COLORS[0].value);
      setIsAllDay(existingEvent.isAllDay);
    } else {
      // 초기화
      setTitle("");
      setTime("");
      setDescription("");
      setColor(EVENT_COLORS[0].value);
      setIsAllDay(true);
    }
  }, [existingEvent, isOpen]);

  const handleSave = async () => {
    if (!title.trim()) return;

    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        date,
        time: isAllDay ? undefined : time,
        description: description.trim() || undefined,
        color,
        isAllDay,
      });
      onClose();
    } catch (error) {
      console.error("일정 저장 실패:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingEvent || !onDelete) return;

    setDeleting(true);
    try {
      await onDelete(existingEvent.id);
      onClose();
    } catch (error) {
      console.error("일정 삭제 실패:", error);
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-card rounded-2xl w-full max-w-md shadow-xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-summit-100 dark:border-border">
          <h2 className="text-lg font-bold text-summit-900 dark:text-foreground">
            {existingEvent ? "일정 수정" : "새 일정"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-summit-400 hover:text-summit-600 dark:text-muted-foreground dark:hover:text-foreground rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 */}
        <div className="p-4 space-y-4">
          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-summit-700 dark:text-foreground mb-2">
              제목 *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="일정 제목"
              className="w-full px-4 py-3 bg-summit-50 dark:bg-muted rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-primary text-summit-800 dark:text-foreground placeholder:text-summit-400 dark:placeholder:text-muted-foreground"
            />
          </div>

          {/* 날짜 */}
          <div className="flex items-center gap-2 text-summit-600 dark:text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{date}</span>
          </div>

          {/* 시간 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-summit-700 dark:text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                시간
              </label>
              <button
                onClick={() => setIsAllDay(!isAllDay)}
                className={cn(
                  "px-3 py-1 text-xs rounded-full transition-colors",
                  isAllDay
                    ? "bg-primary/20 text-primary"
                    : "bg-summit-100 dark:bg-muted text-summit-600 dark:text-muted-foreground"
                )}
              >
                종일
              </button>
            </div>
            {!isAllDay && (
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-3 bg-summit-50 dark:bg-muted rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-primary text-summit-800 dark:text-foreground"
              />
            )}
          </div>

          {/* 설명 */}
          <div>
            <label className="block text-sm font-medium text-summit-700 dark:text-foreground mb-2">
              메모
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="메모 (선택)"
              rows={3}
              className="w-full px-4 py-3 bg-summit-50 dark:bg-muted rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-primary text-summit-800 dark:text-foreground placeholder:text-summit-400 dark:placeholder:text-muted-foreground resize-none"
            />
          </div>

          {/* 색상 선택 */}
          <div>
            <label className="block text-sm font-medium text-summit-700 dark:text-foreground mb-2 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              색상
            </label>
            <div className="flex gap-2">
              {EVENT_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  className={cn(
                    "w-8 h-8 rounded-full transition-transform",
                    color === c.value && "scale-110 ring-2 ring-offset-2 ring-summit-300 dark:ring-offset-card"
                  )}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex items-center gap-2 p-4 border-t border-summit-100 dark:border-border">
          {existingEvent && onDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>{deleting ? "삭제 중..." : "삭제"}</span>
            </button>
          )}
          
          <div className="flex-1" />
          
          <button
            onClick={onClose}
            className="px-4 py-2 text-summit-600 dark:text-muted-foreground hover:bg-summit-50 dark:hover:bg-muted rounded-xl transition-colors"
          >
            취소
          </button>
          
          <button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "저장 중..." : "저장"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

