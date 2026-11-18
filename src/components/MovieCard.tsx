"use client";

import React from "react";
import Link from "next/link";
import { MovieItem, WatchHistoryItem, CoupleMovie } from "@/types";
import { Play, Heart, BookmarkPlus, Clock, Sparkles } from "lucide-react";

interface MovieCardProps {
  movie: MovieItem | (WatchHistoryItem & { thumb_url?: string }) | (CoupleMovie & { thumb_url?: string });
  layoutType?: "portrait" | "landscape";
  progress?: {
    current_time_sec: number;
    duration_sec: number;
    episode_name: string;
    episode_slug: string;
    updated_by: string;
  };
  note?: string;
  onSelect?: () => void;
  onAddToCouple?: () => void;
  onAddToFavorite?: () => void;
  isFavorite?: boolean;
  isCouplePick?: boolean;
}

export default function MovieCard({
  movie,
  layoutType = "portrait",
  progress,
  note,
  onSelect,
  onAddToCouple,
  onAddToFavorite,
  isFavorite = false,
  isCouplePick = false,
}: MovieCardProps) {
  const isLandscape = layoutType === "landscape" || Boolean(progress);

  // Tính phần trăm xem dở
  let progressPercent = 0;
  if (progress && progress.duration_sec > 0) {
    progressPercent = Math.min(
      100,
      Math.round((progress.current_time_sec / progress.duration_sec) * 100)
    );
  }

  const posterUrl =
    (movie as any).poster_url ||
    (movie as any).thumb_url ||
    "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80";

  const movieName = (movie as any).name || (movie as any).movie_name || "Phim";
  const movieSlug = (movie as any).slug || (movie as any).movie_slug || "";

  return (
    <div className="group relative flex-shrink-0 select-none">
      <div
        onClick={onSelect}
        className={`relative overflow-hidden rounded-xl bg-neutral-900 border border-neutral-800/80 hover:border-neutral-500 transition-all duration-300 cursor-pointer shadow-lg group-hover:shadow-2xl group-hover:scale-[1.03] ${
          isLandscape
            ? "w-64 sm:w-72 md:w-80 aspect-[16/9]"
            : "w-36 sm:w-44 md:w-48 aspect-[2/3]"
        }`}
      >
        {/* Hình ảnh poster / thumbnail */}
        <img
          src={posterUrl}
          alt={movieName}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80";
          }}
        />

        {/* Lớp phủ Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

        {/* Nút yêu thích ở góc trên bên phải */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
          {onAddToCouple && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToCouple();
              }}
              title="Gợi ý vào Góc Couple 💕"
              className={`p-1.5 rounded-full backdrop-blur-md transition ${
                isCouplePick
                  ? "bg-couple-pink text-white"
                  : "bg-black/60 text-white/70 hover:text-couple-pink hover:bg-black/90"
              }`}
            >
              <Heart
                className={`w-3.5 h-3.5 ${
                  isCouplePick ? "fill-white" : "hover:fill-couple-pink"
                }`}
              />
            </button>
          )}

          {onAddToFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToFavorite();
              }}
              title="Lưu vào Kho của Em 🔖"
              className={`p-1.5 rounded-full backdrop-blur-md transition ${
                isFavorite
                  ? "bg-blue-600 text-white"
                  : "bg-black/60 text-white/70 hover:text-blue-400 hover:bg-black/90"
              }`}
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Badge "NEW" hoặc chất lượng */}
        {(movie as any).quality && (
          <div className="absolute top-2 left-2 z-10">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-netflix-red text-white uppercase shadow">
              {(movie as any).quality || "NEW"}
            </span>
          </div>
        )}

        {/* Lớp thông tin bên dưới Card */}
        <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-3 text-left">
          {/* Nút Play nhỏ khi hover */}
          <div className="flex items-center gap-2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
              <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
            </div>
            <span className="text-[11px] font-semibold text-white drop-shadow">
              {progress ? "Xem tiếp" : "Xem ngay"}
            </span>
          </div>

          <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-1 drop-shadow-md">
            {movieName}
          </h3>

          {/* Nếu là mục "Xem tiếp" -> hiển thị tập và người vừa xem */}
          {progress ? (
            <div className="mt-1 space-y-1">
              <div className="flex items-center justify-between text-[11px] text-neutral-300">
                <span className="font-medium text-couple-pink truncate max-w-[140px]">
                  {progress.episode_name}
                </span>
                <span className="text-[10px] text-neutral-400">
                  {progressPercent}% đã xem
                </span>
              </div>

              {/* Progress Bar đỏ */}
              <div className="w-full bg-neutral-700/80 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-netflix-red h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <p className="text-[10px] text-neutral-400 truncate flex items-center gap-1 pt-0.5">
                <Clock className="w-2.5 h-2.5 text-neutral-500" />
                <span>Vừa xem bởi: <strong className="text-neutral-200">{progress.updated_by}</strong></span>
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
              {(movie as any).year && <span>{(movie as any).year}</span>}
              {(movie as any).episode_current && (
                <>
                  <span>&bull;</span>
                  <span className="text-neutral-300 font-medium">
                    {(movie as any).episode_current}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Ghi chú tình yêu đính kèm nếu có */}
          {note && (
            <div className="mt-1.5 p-1 px-2 rounded-md bg-couple-pink/20 border border-couple-pink/40 text-[10px] text-pink-200 line-clamp-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-couple-pink flex-shrink-0" />
              <span className="italic truncate">&ldquo;{note}&rdquo;</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
