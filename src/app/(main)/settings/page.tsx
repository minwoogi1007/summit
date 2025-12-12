"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { 
  Settings, 
  User, 
  Bell, 
  Moon, 
  Sun, 
  Monitor, 
  LogOut, 
  Shield,
  BellRing,
  BellOff,
  Clock,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  requestNotificationPermission, 
  getNotificationPermissionStatus,
  getNotificationSettings,
  saveNotificationSettings,
  NotificationSettings
} from "@/lib/notifications";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  // 알림 상태
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    enabled: false,
    dailyReminder: true,
    reminderTime: "21:00",
    devotionAlert: true,
  });
  const [permissionStatus, setPermissionStatus] = useState<string>("default");
  const [settingUpNotifications, setSettingUpNotifications] = useState(false);

  // 알림 설정 로드
  useEffect(() => {
    if (user) {
      loadSettings();
    }
    // 권한 상태 확인
    setPermissionStatus(getNotificationPermissionStatus());
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    const settings = await getNotificationSettings(user.uid);
    setNotificationSettings(settings);
  };

  // 알림 활성화
  const handleEnableNotifications = async () => {
    if (!user) return;
    
    setSettingUpNotifications(true);
    try {
      const token = await requestNotificationPermission(user.uid);
      
      if (token) {
        const newSettings = { ...notificationSettings, enabled: true };
        setNotificationSettings(newSettings);
        await saveNotificationSettings(user.uid, newSettings);
        setPermissionStatus("granted");
      } else {
        setPermissionStatus(getNotificationPermissionStatus());
      }
    } catch (error) {
      console.error("알림 설정 실패:", error);
    } finally {
      setSettingUpNotifications(false);
    }
  };

  // 알림 설정 변경
  const updateNotificationSetting = async (key: keyof NotificationSettings, value: unknown) => {
    if (!user) return;
    
    const newSettings = { ...notificationSettings, [key]: value };
    setNotificationSettings(newSettings);
    await saveNotificationSettings(user.uid, newSettings);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 헤더 */}
      <header>
        <h1 className="text-2xl font-bold text-summit-900 dark:text-foreground flex items-center gap-2">
          <Settings className="w-6 h-6" />
          설정
        </h1>
      </header>

      {/* 프로필 섹션 */}
      <div className="bg-white dark:bg-card rounded-xl p-6 border border-summit-100 dark:border-border">
        <h2 className="font-bold text-summit-800 dark:text-foreground mb-4 flex items-center gap-2">
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
            <div className="w-16 h-16 rounded-full bg-summit-200 dark:bg-muted flex items-center justify-center">
              <span className="text-summit-600 dark:text-muted-foreground text-2xl font-medium">
                {user?.displayName?.[0] || user?.email?.[0] || "U"}
              </span>
            </div>
          )}
          <div>
            <p className="font-semibold text-summit-800 dark:text-foreground text-lg">
              {user?.displayName || "사용자"}
            </p>
            <p className="text-summit-500 dark:text-muted-foreground">{user?.email}</p>
            {user?.isAdmin && (
              <span className="inline-flex items-center gap-1 mt-1 text-xs bg-spirit-100 dark:bg-accent/20 text-spirit-700 dark:text-accent px-2 py-1 rounded-full">
                <Shield className="w-3 h-3" />
                관리자
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 알림 설정 */}
      <div className="bg-white dark:bg-card rounded-xl p-6 border border-summit-100 dark:border-border">
        <h2 className="font-bold text-summit-800 dark:text-foreground mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          알림
        </h2>
        
        {/* 알림 권한 상태 */}
        {permissionStatus === "unsupported" ? (
          <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl text-yellow-700 dark:text-yellow-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">이 브라우저는 푸시 알림을 지원하지 않습니다.</p>
          </div>
        ) : permissionStatus === "denied" ? (
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-700 dark:text-red-400">
            <BellOff className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">알림이 차단되었습니다</p>
              <p className="text-xs mt-1">브라우저 설정에서 알림을 허용해주세요.</p>
            </div>
          </div>
        ) : !notificationSettings.enabled ? (
          <button
            onClick={handleEnableNotifications}
            disabled={settingUpNotifications}
            className="w-full flex items-center justify-center gap-2 p-4 bg-primary/10 dark:bg-primary/20 text-primary rounded-xl hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors disabled:opacity-50"
          >
            <BellRing className="w-5 h-5" />
            <span className="font-medium">
              {settingUpNotifications ? "설정 중..." : "알림 받기"}
            </span>
          </button>
        ) : (
          <div className="space-y-4">
            {/* 알림 활성화 상태 */}
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-green-700 dark:text-green-400">
              <BellRing className="w-5 h-5" />
              <span className="text-sm font-medium">알림이 활성화되었습니다</span>
            </div>
            
            {/* 일기 작성 알림 */}
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-summit-700 dark:text-foreground">일기 작성 알림</p>
                <p className="text-sm text-summit-500 dark:text-muted-foreground">매일 저녁 일기를 쓰도록 알려드려요</p>
              </div>
              <button
                onClick={() => updateNotificationSetting("dailyReminder", !notificationSettings.dailyReminder)}
                className={cn(
                  "relative w-12 h-6 rounded-full transition-colors",
                  notificationSettings.dailyReminder ? "bg-primary" : "bg-summit-300 dark:bg-muted"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                    notificationSettings.dailyReminder ? "left-7" : "left-1"
                  )}
                />
              </button>
            </div>
            
            {/* 알림 시간 */}
            {notificationSettings.dailyReminder && (
              <div className="flex items-center justify-between py-2 pl-4 border-l-2 border-summit-200 dark:border-border">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-summit-400 dark:text-muted-foreground" />
                  <span className="text-sm text-summit-600 dark:text-muted-foreground">알림 시간</span>
                </div>
                <input
                  type="time"
                  value={notificationSettings.reminderTime}
                  onChange={(e) => updateNotificationSetting("reminderTime", e.target.value)}
                  className="px-3 py-1 bg-summit-50 dark:bg-muted rounded-lg border-0 text-summit-700 dark:text-foreground text-sm"
                />
              </div>
            )}
            
            {/* 기도수첩 알림 */}
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-summit-700 dark:text-foreground">기도수첩 알림</p>
                <p className="text-sm text-summit-500 dark:text-muted-foreground">새 기도수첩이 등록되면 알려드려요</p>
              </div>
              <button
                onClick={() => updateNotificationSetting("devotionAlert", !notificationSettings.devotionAlert)}
                className={cn(
                  "relative w-12 h-6 rounded-full transition-colors",
                  notificationSettings.devotionAlert ? "bg-primary" : "bg-summit-300 dark:bg-muted"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                    notificationSettings.devotionAlert ? "left-7" : "left-1"
                  )}
                />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 테마 설정 */}
      <div className="bg-white dark:bg-card rounded-xl p-6 border border-summit-100 dark:border-border">
        <h2 className="font-bold text-summit-800 dark:text-foreground mb-4 flex items-center gap-2">
          {resolvedTheme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          테마
        </h2>
        
        <div className="grid grid-cols-3 gap-2">
          {/* 라이트 모드 */}
          <button
            onClick={() => setTheme("light")}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
              theme === "light"
                ? "border-primary bg-primary/10"
                : "border-summit-200 dark:border-border hover:border-summit-300 dark:hover:border-muted"
            )}
          >
            <Sun className={cn(
              "w-6 h-6",
              theme === "light" ? "text-primary" : "text-summit-400 dark:text-muted-foreground"
            )} />
            <span className={cn(
              "text-sm font-medium",
              theme === "light" ? "text-primary" : "text-summit-600 dark:text-muted-foreground"
            )}>
              라이트
            </span>
          </button>

          {/* 다크 모드 */}
          <button
            onClick={() => setTheme("dark")}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
              theme === "dark"
                ? "border-primary bg-primary/10"
                : "border-summit-200 dark:border-border hover:border-summit-300 dark:hover:border-muted"
            )}
          >
            <Moon className={cn(
              "w-6 h-6",
              theme === "dark" ? "text-primary" : "text-summit-400 dark:text-muted-foreground"
            )} />
            <span className={cn(
              "text-sm font-medium",
              theme === "dark" ? "text-primary" : "text-summit-600 dark:text-muted-foreground"
            )}>
              다크
            </span>
          </button>

          {/* 시스템 */}
          <button
            onClick={() => setTheme("system")}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
              theme === "system"
                ? "border-primary bg-primary/10"
                : "border-summit-200 dark:border-border hover:border-summit-300 dark:hover:border-muted"
            )}
          >
            <Monitor className={cn(
              "w-6 h-6",
              theme === "system" ? "text-primary" : "text-summit-400 dark:text-muted-foreground"
            )} />
            <span className={cn(
              "text-sm font-medium",
              theme === "system" ? "text-primary" : "text-summit-600 dark:text-muted-foreground"
            )}>
              시스템
            </span>
          </button>
        </div>

        <p className="text-xs text-summit-400 dark:text-muted-foreground mt-3 text-center">
          현재: {resolvedTheme === "dark" ? "🌙 다크 모드" : "☀️ 라이트 모드"}
        </p>
      </div>

      {/* 로그아웃 */}
      <button
        onClick={signOut}
        className="w-full py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center gap-2"
      >
        <LogOut className="w-5 h-5" />
        로그아웃
      </button>

      {/* 앱 정보 */}
      <div className="text-center text-sm text-summit-400 dark:text-muted-foreground py-4">
        <p>SUMMIT v0.2.0</p>
        <p>3집중 속에 찾는 나의 망대 여정</p>
      </div>
    </div>
  );
}
