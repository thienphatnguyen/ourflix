"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Profile, CoupleStatus } from "@/types";
import { PROFILES, PIN_CODES, calculateLoveDays, DEFAULT_ANNIVERSARY_DATE } from "@/config/couple";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface AuthContextType {
  isAuthenticated: boolean;
  currentProfile: Profile | null;
  anniversaryDate: string;
  loveDays: number;
  bannerMessage: string;
  featuredSlug: string;
  isUnlocked: boolean;
  unlockWithPin: (pin: string, profile: Profile) => boolean;
  switchProfile: () => void;
  lockApp: () => void;
  updateBannerMessage: (message: string) => Promise<boolean>;
  setAnniversaryDateDirectly: (dateStr: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_AUTH = "ourflix_pin_unlocked";
const STORAGE_KEY_PROFILE = "ourflix_active_profile";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [anniversaryDate, setAnniversaryDate] = useState<string>(DEFAULT_ANNIVERSARY_DATE);
  const [bannerMessage, setBannerMessage] = useState<string>("Tối nay 9h lên kèo cày phim cùng nhau nhé ❤️");
  const [featuredSlug, setFeaturedSlug] = useState<string>("hen-ho-chon-cong-so");
  const [hasLoadedStorage, setHasLoadedStorage] = useState<boolean>(false);

  // Khởi tạo trạng thái từ sessionStorage / localStorage
  useEffect(() => {
    try {
      const unlocked = sessionStorage.getItem(STORAGE_KEY_AUTH) === "true";
      const savedProfileId = sessionStorage.getItem(STORAGE_KEY_PROFILE) || localStorage.getItem(STORAGE_KEY_PROFILE);
      
      if (unlocked && savedProfileId) {
        const found = PROFILES.find((p) => p.id === savedProfileId);
        if (found) {
          setIsUnlocked(true);
          setCurrentProfile(found);
        }
      }
    } catch (err) {
      console.error("Lỗi đọc storage auth:", err);
    } finally {
      setHasLoadedStorage(true);
    }
  }, []);

  // Tải dữ liệu couple_status từ Supabase & đăng ký Realtime
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    async function fetchCoupleStatus() {
      try {
        const { data, error } = await supabase
          .from("couple_status")
          .select("*")
          .eq("id", 1)
          .single();

        if (data && !error) {
          if (data.anniversary_date) setAnniversaryDate(data.anniversary_date);
          if (data.banner_message) setBannerMessage(data.banner_message);
          if (data.featured_slug) setFeaturedSlug(data.featured_slug);
        }
      } catch (err) {
        console.error("Lỗi lấy couple_status:", err);
      }
    }

    fetchCoupleStatus();

    // Lắng nghe thay đổi thời gian thực của bảng couple_status
    const statusChannel = supabase
      .channel("realtime:couple_status")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "couple_status",
          filter: "id=eq.1",
        },
        (payload) => {
          const updated = payload.new as CoupleStatus;
          if (updated) {
            if (updated.anniversary_date) setAnniversaryDate(updated.anniversary_date);
            if (updated.banner_message) setBannerMessage(updated.banner_message);
            if (updated.featured_slug) setFeaturedSlug(updated.featured_slug);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(statusChannel);
    };
  }, []);

  const unlockWithPin = (pin: string, profile: Profile): boolean => {
    const expectedPin = profile.pin || PIN_CODES[profile.id];
    if (pin === expectedPin) {
      setIsUnlocked(true);
      setCurrentProfile(profile);
      try {
        sessionStorage.setItem(STORAGE_KEY_AUTH, "true");
        sessionStorage.setItem(STORAGE_KEY_PROFILE, profile.id);
        localStorage.setItem(STORAGE_KEY_PROFILE, profile.id);
      } catch (err) {
        console.error("Lỗi lưu auth:", err);
      }
      return true;
    }
    return false;
  };

  const switchProfile = () => {
    setIsUnlocked(false);
    setCurrentProfile(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY_AUTH);
      sessionStorage.removeItem(STORAGE_KEY_PROFILE);
    } catch (err) {
      console.error("Lỗi xóa auth:", err);
    }
  };

  const lockApp = () => {
    switchProfile();
  };

  const updateBannerMessage = async (message: string): Promise<boolean> => {
    setBannerMessage(message);
    if (!isSupabaseConfigured) return true;

    try {
      const { error } = await supabase
        .from("couple_status")
        .upsert({
          id: 1,
          banner_message: message,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error("Lỗi cập nhật banner_message:", error);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Lỗi upsert banner:", err);
      return false;
    }
  };

  const setAnniversaryDateDirectly = async (dateStr: string): Promise<boolean> => {
    setAnniversaryDate(dateStr);
    if (!isSupabaseConfigured) return true;

    try {
      const { error } = await supabase
        .from("couple_status")
        .upsert({
          id: 1,
          anniversary_date: dateStr,
          updated_at: new Date().toISOString(),
        });
      return !error;
    } catch {
      return false;
    }
  };

  const loveDays = calculateLoveDays(anniversaryDate);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: isUnlocked && currentProfile !== null,
        currentProfile,
        anniversaryDate,
        loveDays,
        bannerMessage,
        featuredSlug,
        isUnlocked,
        unlockWithPin,
        switchProfile,
        lockApp,
        updateBannerMessage,
        setAnniversaryDateDirectly,
      }}
    >
      {hasLoadedStorage ? children : null}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth phải được dùng bên trong AuthProvider");
  }
  return context;
}
