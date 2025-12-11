"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { LoginPage } from "@/components/auth/LoginPage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/diary");
    }
  }, [user, loading, router]);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!user) {
    return <LoginPage />;
  }

  return <LoadingSpinner fullScreen />;
}

