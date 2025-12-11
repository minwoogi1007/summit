"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Settings, User, Bell, Moon, LogOut, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 헤더 */}
      <header>
        <h1 className="text-2xl font-bold text-summit-900 flex items-center gap-2">
          <Settings className="w-6 h-6" />
          설정
        </h1>
      </header>

      {/* 프로필 섹션 */}
      <div className="bg-white rounded-xl p-6 border border-summit-100">
        <h2 className="font-bold text-summit-800 mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          프로필
        </h2>
        
        <div className="flex items-center gap-4">
          {user?.photoURL ? (
            <img 
              src={user.photoURL} 
              alt={user.displayName || "프로필"} 
              className="w-16 h-16 rounded-full"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-summit-200 flex items-center justify-center">
              <span className="text-summit-600 text-2xl font-medium">
                {user?.displayName?.[0] || user?.email?.[0] || "U"}
              </span>
            </div>
          )}
          <div>
            <p className="font-semibold text-summit-800 text-lg">
              {user?.displayName || "사용자"}
            </p>
            <p className="text-summit-500">{user?.email}</p>
            {user?.isAdmin && (
              <span className="inline-flex items-center gap-1 mt-1 text-xs bg-spirit-100 text-spirit-700 px-2 py-1 rounded-full">
                <Shield className="w-3 h-3" />
                관리자
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 알림 설정 */}
      <div className="bg-white rounded-xl p-6 border border-summit-100">
        <h2 className="font-bold text-summit-800 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          알림
        </h2>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-summit-700">일기 작성 알림</p>
            <p className="text-sm text-summit-500">매일 저녁 알림을 받습니다</p>
          </div>
          <button
            onClick={() => setNotifications(!notifications)}
            className={cn(
              "relative w-12 h-6 rounded-full transition-colors",
              notifications ? "bg-spirit-500" : "bg-summit-300"
            )}
          >
            <span
              className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                notifications ? "left-7" : "left-1"
              )}
            />
          </button>
        </div>
      </div>

      {/* 테마 설정 */}
      <div className="bg-white rounded-xl p-6 border border-summit-100">
        <h2 className="font-bold text-summit-800 mb-4 flex items-center gap-2">
          <Moon className="w-5 h-5" />
          테마
        </h2>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-summit-700">다크 모드</p>
            <p className="text-sm text-summit-500">어두운 테마를 사용합니다</p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={cn(
              "relative w-12 h-6 rounded-full transition-colors",
              darkMode ? "bg-spirit-500" : "bg-summit-300"
            )}
          >
            <span
              className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                darkMode ? "left-7" : "left-1"
              )}
            />
          </button>
        </div>
        <p className="text-xs text-summit-400 mt-2">* 다크 모드는 준비 중입니다</p>
      </div>

      {/* 로그아웃 */}
      <button
        onClick={signOut}
        className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
      >
        <LogOut className="w-5 h-5" />
        로그아웃
      </button>

      {/* 앱 정보 */}
      <div className="text-center text-sm text-summit-400 py-4">
        <p>SUMMIT v0.1.0</p>
        <p>영적 성장을 위한 일기 앱</p>
      </div>
    </div>
  );
}

