"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { PROFILES } from "@/config/couple";
import { Profile } from "@/types";
import { Lock, Heart, ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";

export default function PinGate() {
  const { unlockWithPin } = useAuth();
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [pin, setPin] = useState<string>("");
  const [error, setError] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSelectProfile = (profile: Profile) => {
    setSelectedProfile(profile);
    setPin("");
    setError(false);
  };

  const handleDigitClick = (digit: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError(false);

    if (newPin.length === 4 && selectedProfile) {
      verifyPin(newPin, selectedProfile);
    }
  };

  const handleDeleteDigit = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const verifyPin = (inputPin: string, profile: Profile) => {
    setIsSubmitting(true);
    setTimeout(() => {
      const success = unlockWithPin(inputPin, profile);
      if (!success) {
        setError(true);
        setPin("");
      }
      setIsSubmitting(false);
    }, 250);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && pin.length === 4 && selectedProfile) {
      verifyPin(pin, selectedProfile);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#141414] text-white flex flex-col items-center justify-center p-4 select-none">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-netflix-red/10 via-[#141414] to-[#0a0a0a] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md mx-auto text-center flex flex-col items-center">
        {/* Brand Logo */}
        <div className="flex items-center gap-2 mb-10">
          <span className="text-3xl md:text-4xl font-extrabold tracking-wider text-netflix-red font-sans">
            OURFLIX
          </span>
          <Heart className="w-7 h-7 text-couple-pink fill-couple-pink animate-pulse" />
        </div>

        {!selectedProfile ? (
          /* MÀN HÌNH CHỌN PROFILE */
          <div className="w-full animate-fade-in">
            <h1 className="text-2xl md:text-3xl font-medium text-slate-100 mb-2">
              Ai đang xem?
            </h1>
            <p className="text-sm text-neutral-400 mb-8">
              Chọn hồ sơ của bạn để tiếp tục vào thế giới phim của hai đứa
            </p>

            <div className="flex items-center justify-center gap-8 md:gap-12 mt-4">
              {PROFILES.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => handleSelectProfile(profile)}
                  className="group flex flex-col items-center focus:outline-none transition-transform duration-200 hover:scale-105"
                >
                  <div
                    className="w-24 h-24 md:w-28 md:h-28 rounded-xl flex items-center justify-center text-3xl font-bold shadow-xl border-2 border-transparent group-hover:border-white transition-all relative overflow-hidden"
                    style={{ backgroundColor: profile.avatarColor }}
                  >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span>{profile.name.charAt(0)}</span>
                    <div className="absolute bottom-1 right-1">
                      {profile.id === "tra-my" ? (
                        <Heart className="w-5 h-5 text-pink-200 fill-pink-200 drop-shadow" />
                      ) : (
                        <Sparkles className="w-5 h-5 text-blue-200 fill-blue-200 drop-shadow" />
                      )}
                    </div>
                  </div>
                  <span className="mt-3 text-base md:text-lg font-medium text-neutral-300 group-hover:text-white transition-colors">
                    {profile.name}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-12 text-xs text-neutral-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Cổng bảo mật nội bộ &bull; Mã hóa kết nối Supabase</span>
            </div>
          </div>
        ) : (
          /* MÀN HÌNH NHẬP MÃ PIN CẶP ĐÔI */
          <div className="w-full max-w-xs animate-fade-in flex flex-col items-center">
            {/* Nút quay lại chọn profile */}
            <button
              onClick={() => setSelectedProfile(null)}
              className="self-start text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 mb-6 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Đổi người xem</span>
            </button>

            {/* Avatar người được chọn */}
            <div
              className="w-20 h-20 rounded-xl flex items-center justify-center text-2xl font-bold mb-4 shadow-lg border-2 border-white/20"
              style={{ backgroundColor: selectedProfile.avatarColor }}
            >
              {selectedProfile.name.charAt(0)}
            </div>

            <h2 className="text-xl font-medium text-white mb-1">
              Chào {selectedProfile.name}!
            </h2>
            <p className="text-xs text-neutral-400 mb-6 flex items-center gap-1">
              <Lock className="w-3 h-3 text-couple-pink" />
              <span>Nhập mã PIN riêng của {selectedProfile.name}</span>
            </p>

            {/* Các ô tròn hiển thị PIN (Dots) */}
            <div
              className={`flex justify-center gap-4 mb-6 ${
                error ? "animate-shake" : ""
              }`}
            >
              {[0, 1, 2, 3].map((index) => {
                const filled = pin.length > index;
                return (
                  <div
                    key={index}
                    className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                      error
                        ? "border-red-500 bg-red-500"
                        : filled
                        ? "border-netflix-red bg-netflix-red scale-110 shadow-[0_0_10px_rgba(229,9,20,0.5)]"
                        : "border-neutral-600 bg-neutral-800"
                    }`}
                  />
                );
              })}
            </div>

            {error && (
              <p className="text-xs text-red-500 mb-4 font-medium animate-fade-in">
                Mã PIN của {selectedProfile.name} chưa đúng, thử lại nhé!
              </p>
            )}

            {/* Bàn phím số cảm ứng & hỗ trợ gõ phím vật lý */}
            <div className="grid grid-cols-3 gap-3 w-full mb-4">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleDigitClick(num)}
                  disabled={isSubmitting}
                  className="h-14 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 active:bg-neutral-600 active:scale-95 text-xl font-semibold transition-all border border-neutral-700/60 shadow"
                >
                  {num}
                </button>
              ))}
              <div />
              <button
                type="button"
                onClick={() => handleDigitClick("0")}
                disabled={isSubmitting}
                className="h-14 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 active:bg-neutral-600 active:scale-95 text-xl font-semibold transition-all border border-neutral-700/60 shadow"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleDeleteDigit}
                disabled={isSubmitting || pin.length === 0}
                className="h-14 rounded-xl bg-neutral-800/50 hover:bg-neutral-700 active:scale-95 text-sm font-medium transition-all border border-neutral-700/40 text-neutral-400 hover:text-white flex items-center justify-center"
              >
                Xóa
              </button>
            </div>

            {/* Ẩn input để hỗ trợ bàn phím thật trên laptop */}
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pin}
              autoFocus
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                setPin(val);
                setError(false);
                if (val.length === 4 && selectedProfile) {
                  verifyPin(val, selectedProfile);
                }
              }}
              onKeyDown={handleKeyDown}
              className="opacity-0 absolute -z-10 w-0 h-0"
            />
          </div>
        )}
      </div>
    </div>
  );
}
