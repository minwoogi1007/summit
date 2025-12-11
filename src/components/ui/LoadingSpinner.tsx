"use client";

import { cn } from "@/lib/utils";
import { Mountain } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
  message?: string;
}

export function LoadingSpinner({ 
  size = "md", 
  fullScreen = false,
  message 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        {/* 회전 링 */}
        <div 
          className={cn(
            "rounded-full border-4 border-summit-200 border-t-summit-500 animate-spin",
            sizeClasses[size]
          )} 
        />
        {/* 중앙 아이콘 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Mountain 
            className={cn(
              "text-summit-500",
              size === "sm" ? "w-3 h-3" : size === "md" ? "w-4 h-4" : "w-6 h-6"
            )} 
          />
        </div>
      </div>
      {message && (
        <p className="text-summit-600 text-sm animate-pulse">{message}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-summit-50/80 backdrop-blur-sm z-50">
        {content}
      </div>
    );
  }

  return content;
}

