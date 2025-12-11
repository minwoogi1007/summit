"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Navigation } from "@/components/layout/Navigation";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return <LoadingSpinner fullScreen message="로딩 중..." />;
  }

  if (!user) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pl-64">
      <Navigation />
      <main className="p-4 md:p-6 max-w-4xl mx-auto">
        {children}
      </main>
    </div>
  );
}

