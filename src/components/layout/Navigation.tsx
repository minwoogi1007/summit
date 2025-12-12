"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { cn } from "@/lib/utils";
import { 
  Mountain, 
  BookOpen, 
  Calendar, 
  Search, 
  Users, 
  Settings,
  LogOut,
  Shield,
  BarChart3
} from "lucide-react";

const navItems = [
  { href: "/diary", label: "오늘의 3집중", icon: BookOpen },
  { href: "/calendar", label: "캘린더", icon: Calendar },
  { href: "/stats", label: "통계", icon: BarChart3 },
  { href: "/search", label: "검색", icon: Search },
  { href: "/shared", label: "공유", icon: Users },
];

export function Navigation() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <>
      {/* 데스크탑 사이드바 */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 flex-col bg-white/80 dark:bg-card/90 backdrop-blur-lg border-r border-summit-200 dark:border-border z-40">
        {/* 로고 */}
        <div className="p-6 border-b border-summit-100 dark:border-border">
          <Link href="/diary" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-summit-500 to-summit-600 dark:from-primary dark:to-primary/80 flex items-center justify-center">
              <Mountain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-summit-900 dark:text-foreground">SUMMIT</span>
          </Link>
        </div>

        {/* 네비게이션 링크 */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  isActive 
                    ? "bg-summit-100 dark:bg-primary/20 text-summit-700 dark:text-primary font-medium" 
                    : "text-summit-600 dark:text-muted-foreground hover:bg-summit-50 dark:hover:bg-muted hover:text-summit-700 dark:hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* 관리자 메뉴 */}
          {user?.isAdmin && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mt-4 border-t border-summit-100 dark:border-border pt-5",
                pathname.startsWith("/admin")
                  ? "bg-spirit-100 dark:bg-accent/20 text-spirit-700 dark:text-accent font-medium"
                  : "text-spirit-600 dark:text-accent/70 hover:bg-spirit-50 dark:hover:bg-accent/10 hover:text-spirit-700 dark:hover:text-accent"
              )}
            >
              <Shield className="w-5 h-5" />
              <span>관리자</span>
            </Link>
          )}
        </nav>

        {/* 사용자 정보 */}
        <div className="p-4 border-t border-summit-100 dark:border-border">
          <div className="flex items-center gap-3 mb-3">
            {user?.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={user.displayName || "프로필"} 
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-summit-200 dark:bg-muted flex items-center justify-center">
                <span className="text-summit-600 dark:text-muted-foreground font-medium">
                  {user?.displayName?.[0] || user?.email?.[0] || "U"}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-summit-800 dark:text-foreground truncate">
                {user?.displayName || "사용자"}
              </p>
              <p className="text-xs text-summit-500 dark:text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Link
              href="/settings"
              className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-summit-600 dark:text-muted-foreground hover:text-summit-800 dark:hover:text-foreground hover:bg-summit-50 dark:hover:bg-muted rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>설정</span>
            </Link>
            <button
              onClick={signOut}
              className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-red-500 dark:text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>로그아웃</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 모바일 하단 네비게이션 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-card/95 backdrop-blur-lg border-t border-summit-200 dark:border-border z-40 safe-area-pb">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all",
                  isActive 
                    ? "text-summit-600 dark:text-primary" 
                    : "text-summit-400 dark:text-muted-foreground hover:text-summit-600 dark:hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive && "scale-110")} />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
          
          {user?.isAdmin && (
            <Link
              href="/admin"
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all",
                pathname.startsWith("/admin")
                  ? "text-spirit-600 dark:text-accent"
                  : "text-spirit-400 dark:text-accent/60 hover:text-spirit-600 dark:hover:text-accent"
              )}
            >
              <Shield className="w-5 h-5" />
              <span className="text-xs">관리</span>
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}
