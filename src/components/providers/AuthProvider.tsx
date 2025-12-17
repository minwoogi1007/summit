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

  // Google 로그인 (iOS PWA 대응 - 항상 popup 시도)
  const signInWithGoogle = async () => {
    try {
      // iOS 감지
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      // Android 감지
      const isAndroid = /Android/i.test(navigator.userAgent);
      // WebView 감지 (인앱 브라우저)
      const isWebView = /FBAN|FBAV|Instagram|Line|KAKAOTALK|wv/i.test(navigator.userAgent);
      
      // WebView에서는 redirect 필수 (popup 안됨)
      if (isWebView) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      
      // iOS와 데스크탑: popup 방식 (세션 공유 문제 해결)
      // Android: redirect 방식 (popup이 불안정)
      if (isAndroid) {
        await signInWithRedirect(auth, googleProvider);
      } else {
        // iOS 및 데스크탑: popup 시도
        try {
          await signInWithPopup(auth, googleProvider);
        } catch (popupError: unknown) {
          const errorCode = (popupError as { code?: string })?.code;
          // 팝업이 차단되거나 취소된 경우 redirect로 폴백
          if (errorCode === 'auth/popup-blocked' || errorCode === 'auth/popup-closed-by-user') {
            console.log('Popup 실패, redirect로 전환');
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

