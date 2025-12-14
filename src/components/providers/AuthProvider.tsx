"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  onAuthStateChanged, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  User as FirebaseUser 
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import { generateEncryptionKey } from "@/lib/crypto";
import type { User } from "@/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  encryptionKey: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 관리자 이메일 목록 (환경변수에서 로드)
const ADMIN_EMAILS = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);

  useEffect(() => {
    // Redirect 결과 처리 (모바일 로그인 후)
    getRedirectResult(auth).catch((error) => {
      console.error("Redirect 결과 처리 실패:", error);
    });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const { userData, key } = await getOrCreateUser(firebaseUser);
        setUser(userData);
        setEncryptionKey(key);
      } else {
        setUser(null);
        setEncryptionKey(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Firestore에서 사용자 정보 가져오기 또는 생성
  const getOrCreateUser = async (firebaseUser: FirebaseUser): Promise<{ userData: User; key: string }> => {
    const userRef = doc(db, "users", firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      
      // 기존 사용자: 암호화 키가 없으면 생성
      let key = data.encryptionKey;
      const isAdminFromEnv = ADMIN_EMAILS.includes(firebaseUser.email || "");
      const shouldBeAdmin = data.isAdmin || isAdminFromEnv;
      
      // 암호화 키가 없거나 관리자 상태가 변경된 경우 업데이트
      if (!key || data.isAdmin !== shouldBeAdmin) {
        if (!key) {
          key = await generateEncryptionKey();
        }
        await setDoc(userRef, { 
          encryptionKey: key,
          isAdmin: shouldBeAdmin,
        }, { merge: true });
      }
      
      return {
        userData: {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: data.displayName || firebaseUser.displayName,
          photoURL: data.photoURL || firebaseUser.photoURL,
          isAdmin: shouldBeAdmin,
          createdAt: data.createdAt?.toDate() || new Date(),
        },
        key,
      };
    }

    // 새 사용자 생성 + 암호화 키 생성
    const isAdmin = ADMIN_EMAILS.includes(firebaseUser.email || "");
    const newEncryptionKey = await generateEncryptionKey();
    
    const newUserData = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || "",
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      isAdmin,
      encryptionKey: newEncryptionKey,
      createdAt: serverTimestamp(),
    };

    await setDoc(userRef, newUserData);

    return {
      userData: {
        uid: firebaseUser.uid,
        email: firebaseUser.email || "",
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        isAdmin,
        createdAt: new Date(),
      } as User,
      key: newEncryptionKey,
    };
  };

  // Google 로그인 (PWA standalone 모드 대응)
  const signInWithGoogle = async () => {
    try {
      // PWA standalone 모드 감지
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
        || (window.navigator as { standalone?: boolean }).standalone === true
        || document.referrer.includes('android-app://');
      
      // 모바일 또는 WebView 감지
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const isWebView = /FBAN|FBAV|Instagram|Line|KAKAOTALK/i.test(navigator.userAgent);
      
      // PWA standalone 모드에서는 새 창으로 열기 (팝업/리다이렉트 모두 문제)
      if (isStandalone) {
        // PWA에서는 시스템 브라우저로 로그인 페이지 열기
        // redirect 방식 사용 - 인증 후 PWA로 돌아옴
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      
      if (isMobile || isWebView) {
        // 모바일/WebView에서는 redirect 방식 사용
        await signInWithRedirect(auth, googleProvider);
      } else {
        // 데스크탑에서는 popup 방식 사용
        try {
          await signInWithPopup(auth, googleProvider);
        } catch (popupError: unknown) {
          // 팝업이 차단된 경우 redirect로 폴백
          if ((popupError as { code?: string })?.code === 'auth/popup-blocked') {
            await signInWithRedirect(auth, googleProvider);
          } else {
            throw popupError;
          }
        }
      }
    } catch (error) {
      console.error("Google 로그인 실패:", error);
      throw error;
    }
  };

  // 로그아웃
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("로그아웃 실패:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, encryptionKey, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

