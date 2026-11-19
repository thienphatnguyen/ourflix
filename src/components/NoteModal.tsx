"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { MovieItem } from "@/types";
import { X, Heart, Sparkles, BookmarkPlus, Check, Trash2 } from "lucide-react";

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  movie: MovieItem | null;
  category: "couple_pick" | "favorite";
  isAlreadySaved?: boolean;
  onSuccess?: () => void;
}

export default function NoteModal({
  isOpen,
  onClose,
  movie,
  category,
  isAlreadySaved = false,
  onSuccess,
}: NoteModalProps) {
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
    if (!currentProfile || !movie) return;

    setIsSubmitting(true);
    const newItem = {
      movie_slug: movie.slug,
      movie_name: movie.name,
      poster_url: movie.poster_url || movie.thumb_url,
      category,
      note: note.trim() || (isCouplePick ? "Hai đứa mình cùng xem nha ❤️" : "Phim em thích ✨"),
      added_by: currentProfile.name,
      created_at: new Date().toISOString(),
    };

    // 1. Lưu ngay vào localStorage (Đảm bảo xuất hiện tức thì 0ms, không bao giờ mất)
    try {
      const localData = JSON.parse(localStorage.getItem("ourflix_couple_movies") || "[]");
      const filtered = Array.isArray(localData)
        ? localData.filter(
            (m: any) => !(m.movie_slug === newItem.movie_slug && m.category === newItem.category)
          )
        : [];
      filtered.unshift(newItem);
      localStorage.setItem("ourflix_couple_movies", JSON.stringify(filtered));
    } catch (e) {
      console.error("Lỗi lưu localStorage:", e);
    }

    // 2. Ghi song song lên Supabase
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from("couple_movies").upsert(
          newItem,
          { onConflict: "movie_slug,category" }
        );

        if (error) {
          console.error("Lỗi lưu couple_movies Supabase:", error);
        }
      }
    } catch (err) {
      console.error("Lỗi gọi Supabase:", err);
    } finally {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setNote("");
        setIsSubmitting(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 600);
    }
  };

  const handleDelete = async () => {
    if (!movie) return;
    setIsSubmitting(true);
    try {
      // 1. Xóa khỏi localStorage
      try {
        const localData = JSON.parse(localStorage.getItem("ourflix_couple_movies") || "[]");
        if (Array.isArray(localData)) {
          const filtered = localData.filter(
            (m: any) => !(m.movie_slug === movie.slug && m.category === category)
          );
          localStorage.setItem("ourflix_couple_movies", JSON.stringify(filtered));
        }
      } catch (e) {
        console.error("Lỗi xóa localStorage:", e);
      }

      // 2. Xóa khỏi Supabase
      if (isSupabaseConfigured) {
        try {
          await supabase
            .from("couple_movies")
            .delete()
            .eq("movie_slug", movie.slug)
            .eq("category", category);
        } catch (e) {
          console.error("Lỗi xóa Supabase:", e);
        }
      }

      onClose();
      if (onSuccess) onSuccess();
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

          <div className="pt-2 flex items-center justify-between gap-2.5">
            <div>
              {isAlreadySaved && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-white hover:bg-red-600/30 border border-red-500/30 transition flex items-center gap-1.5"
                  title="Xóa phim này khỏi danh sách"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa khỏi {isCouplePick ? "Góc Couple" : "Kho"}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
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
                  <span>{isAlreadySaved ? "Cập nhật ghi chú" : "Xác nhận thêm"}</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
