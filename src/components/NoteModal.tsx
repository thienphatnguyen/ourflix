"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { MovieItem } from "@/types";
import { X, Heart, Sparkles, BookmarkPlus, Check } from "lucide-react";

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  movie: MovieItem | null;
  category: "couple_pick" | "favorite";
  onSuccess?: () => void;
}

export default function NoteModal({ isOpen, onClose, movie, category, onSuccess }: NoteModalProps) {
  const { currentProfile } = useAuth();
  const [note, setNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  if (!isOpen || !movie) return null;

  const isCouplePick = category === "couple_pick";
  const title = isCouplePick ? "Gợi ý vào Góc Couple 💖" : "Lưu vào Kho của Em 🔖";
  const defaultPlaceholder = isCouplePick
    ? "Ví dụ: Tối thứ 7 này cùng nằm xem phim này nha anh/em!"
    : "Ví dụ: Phim này xem để chữa lành tâm hồn...";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProfile) return;

    setIsSubmitting(true);
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from("couple_movies").upsert(
          {
            movie_slug: movie.slug,
            movie_name: movie.name,
            poster_url: movie.poster_url || movie.thumb_url,
            category,
            note: note.trim() || (isCouplePick ? "Hai đứa mình cùng xem nha ❤️" : "Phim em thích ✨"),
            added_by: currentProfile.name,
            created_at: new Date().toISOString(),
          },
          { onConflict: "movie_slug,category" }
        );

        if (error) {
          console.error("Lỗi lưu couple_movies:", error);
        }
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setNote("");
        onClose();
        if (onSuccess) onSuccess();
      }, 700);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#181818] border border-neutral-700 w-full max-w-md rounded-2xl p-6 shadow-2xl relative text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded-full hover:bg-neutral-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div
            className={`p-2.5 rounded-xl ${
              isCouplePick ? "bg-couple-pink/20 text-couple-pink" : "bg-blue-500/20 text-blue-400"
            }`}
          >
            {isCouplePick ? (
              <Heart className="w-6 h-6 fill-couple-pink" />
            ) : (
              <BookmarkPlus className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold">{title}</h3>
            <p className="text-xs text-neutral-400 line-clamp-1">
              Phim: <span className="text-white font-medium">{movie.name}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Lời nhắn gửi đính kèm (sẽ hiển thị cùng phim)
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={defaultPlaceholder}
              maxLength={120}
              className="w-full px-3 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-sm focus:outline-none focus:border-couple-pink transition resize-none placeholder:text-neutral-500"
            />
            <div className="text-right text-[11px] text-neutral-500 mt-0.5">
              {note.length}/120 ký tự
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-neutral-400 bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800">
            <Sparkles className="w-4 h-4 text-couple-pink flex-shrink-0" />
            <span>Phim sẽ xuất hiện ngay lập tức trên màn hình của người ấy nhờ Supabase Realtime!</span>
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
              disabled={isSubmitting}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-1.5 shadow-lg disabled:opacity-50 ${
                isCouplePick
                  ? "bg-couple-pink hover:bg-pink-600 shadow-couple-pink/20"
                  : "bg-blue-600 hover:bg-blue-500 shadow-blue-600/20"
              }`}
            >
              {success ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Đã lưu thành công!</span>
                </>
              ) : isSubmitting ? (
                <span>Đang lưu...</span>
              ) : (
                <span>Xác nhận thêm</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
