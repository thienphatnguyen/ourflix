"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { X, Heart, Calendar, Sparkles, Check } from "lucide-react";

interface BannerEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BannerEditModal({ isOpen, onClose }: BannerEditModalProps) {
  const { bannerMessage, updateBannerMessage, anniversaryDate, setAnniversaryDateDirectly, currentProfile } = useAuth();
  const [message, setMessage] = useState<string>(bannerMessage);
  const [date, setDate] = useState<string>(anniversaryDate);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateBannerMessage(message.trim() || "Tối nay cày phim nhé ❤️");
      if (date) {
        await setAnniversaryDateDirectly(date);
      }
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 700);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#181818] border border-neutral-700 w-full max-w-md rounded-2xl p-6 shadow-2xl relative text-white">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded-full hover:bg-neutral-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-couple-pink/20 text-couple-pink">
            <Heart className="w-5 h-5 fill-couple-pink" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Ghim lời nhắn lên Hero Banner</h3>
            <p className="text-xs text-neutral-400">
              Đồng bộ tức thì lên màn hình của {currentProfile?.id === "tra-my" ? "Thiên Phát" : "Trà My"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Lời nhắn tình yêu hiển thị trên đầu trang
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Nhập lời nhắn, hẹn giờ cày phim, lời chúc..."
              maxLength={150}
              className="w-full px-3 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-sm focus:outline-none focus:border-couple-pink transition resize-none placeholder:text-neutral-500"
            />
            <div className="text-right text-[11px] text-neutral-500 mt-0.5">
              {message.length}/150 ký tự
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-couple-pink" />
              <span>Ngày bắt đầu yêu nhau (để tính số ngày)</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-sm focus:outline-none focus:border-couple-pink transition text-white"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-neutral-800 hover:bg-neutral-700 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-netflix-red hover:bg-red-700 active:scale-95 transition flex items-center gap-1.5 shadow-lg shadow-netflix-red/20 disabled:opacity-50"
            >
              {success ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Đã lưu & đồng bộ!</span>
                </>
              ) : isSaving ? (
                <span>Đang lưu...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Lưu & Ghim ngay</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
