"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Mountain, BookOpen, Heart, Sparkles } from "lucide-react";

export function LoginPage() {
  const { signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError("로그인에 실패했습니다. 다시 시도해주세요.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-summit-50 via-white to-spirit-50">
      {/* 배경 장식 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-summit-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-spirit-200/30 rounded-full blur-3xl" />
      </div>

      {/* 메인 카드 */}
      <div className="relative z-10 w-full max-w-md animate-fade-in">
        {/* 로고 및 타이틀 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-summit-500 to-summit-600 shadow-lg shadow-summit-500/30 mb-6">
            <Mountain className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-summit-900 mb-2 tracking-tight">
            SUMMIT
          </h1>
          <p className="text-summit-600 text-lg">
            3집중 속에 찾는 나의 망대 여정 이정표
          </p>
        </div>

        {/* 기능 소개 */}
        <div className="glass rounded-2xl p-6 mb-6 space-y-4">
          <FeatureItem 
            icon={<BookOpen className="w-5 h-5" />}
            title="오늘의 말씀"
            description="매일 말씀속에서 하나님의 망대를"
          />
          <FeatureItem 
            icon={<Heart className="w-5 h-5" />}
            title="오늘의 기도"
            description="나의 하루가 하나님과 함께하는 여정으로"
          />
          <FeatureItem 
            icon={<Sparkles className="w-5 h-5" />}
            title="오늘의 전도"
            description="나의 삶이 하나님의 이정표를 따라"
          />
        </div>

        {/* 로그인 버튼 */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-white border-2 border-summit-200 rounded-xl hover:border-summit-400 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="text-summit-800 font-medium group-hover:text-summit-900">
            {isLoading ? "로그인 중..." : "Google로 시작하기"}
          </span>
        </button>

        {/* 에러 메시지 */}
        {error && (
          <p className="mt-4 text-center text-red-500 text-sm animate-fade-in">
            {error}
          </p>
        )}

        {/* 안내 문구 */}
        <p className="mt-6 text-center text-sm text-summit-500">
          로그인하면 서비스 이용약관에 동의하게 됩니다
        </p>
      </div>
    </div>
  );
}

function FeatureItem({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-summit-100 flex items-center justify-center text-summit-600">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-summit-800">{title}</h3>
        <p className="text-sm text-summit-500">{description}</p>
      </div>
    </div>
  );
}

