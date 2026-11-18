"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { MovieDetail, MovieItem, EpisodeServer } from "@/types";
import { getMovieDetail } from "@/lib/movieApi";
import {
  X,
  Play,
  Heart,
  BookmarkPlus,
  Calendar,
  Clock,
  Sparkles,
  Film,
  Layers,
  ChevronRight,
} from "lucide-react";

interface MovieModalProps {
  movie: MovieItem | null;
  onClose: () => void;
  onAddToCouple?: (movie: MovieItem) => void;
  onAddToFavorite?: (movie: MovieItem) => void;
  isFavorite?: boolean;
  isCouplePick?: boolean;
}

export default function MovieModal({
  movie,
  onClose,
  onAddToCouple,
  onAddToFavorite,
  isFavorite = false,
  isCouplePick = false,
}: MovieModalProps) {
  const [detail, setDetail] = useState<MovieDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedServerIdx, setSelectedServerIdx] = useState<number>(0);

  useEffect(() => {
    if (!movie) return;

    let isMounted = true;
    setIsLoading(true);

    const slug = (movie as any).slug || (movie as any).movie_slug;
    getMovieDetail(slug)
      .then((data) => {
        if (isMounted) {
          setDetail(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Lỗi lấy chi tiết modal:", err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [movie]);

  // Đóng khi nhấn phím Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!movie) return null;

  const movieSlug = (movie as any).slug || (movie as any).movie_slug;
  const movieName = (movie as any).name || (movie as any).movie_name;
  const posterUrl = (movie as any).poster_url || (movie as any).thumb_url;

  const activeServer: EpisodeServer | undefined = detail?.episodes?.[selectedServerIdx];
  const firstEpisodeSlug = activeServer?.server_data?.[0]?.slug || "tap-01";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div
        className="relative w-full max-w-4xl bg-[#181818] border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng Modal */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition border border-white/20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Backdrop Banner Header */}
        <div className="relative h-64 sm:h-80 w-full overflow-hidden">
          <img
            src={posterUrl}
            alt={movieName}
            className="w-full h-full object-cover object-center filter brightness-90"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=1200&auto=format&fit=crop&q=80";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-[#181818]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#181818] via-transparent to-transparent" />

          {/* Tiêu đề & Nút CTA trong Banner */}
          <div className="absolute bottom-4 left-4 sm:left-6 right-4 sm:right-6">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-wide drop-shadow-md">
              {movieName}
            </h2>
            {detail?.origin_name && (
              <p className="text-sm text-neutral-300 italic mb-3">
                {detail.origin_name}
              </p>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href={`/watch/${movieSlug}/${firstEpisodeSlug}`}
                className="inline-flex items-center gap-2 bg-netflix-red hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-xl transition shadow-lg shadow-netflix-red/30 text-sm"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Xem ngay</span>
              </Link>

              {onAddToCouple && (
                <button
                  onClick={() => onAddToCouple(movie)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border transition ${
                    isCouplePick
                      ? "bg-couple-pink/20 border-couple-pink text-couple-pink"
                      : "bg-neutral-900/80 hover:bg-neutral-800 border-neutral-700 text-neutral-200"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isCouplePick ? "fill-couple-pink text-couple-pink" : ""}`} />
                  <span>{isCouplePick ? "Đã ở Góc Couple" : "Gợi ý vào Góc Couple"}</span>
                </button>
              )}

              {onAddToFavorite && (
                <button
                  onClick={() => onAddToFavorite(movie)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border transition ${
                    isFavorite
                      ? "bg-blue-600/20 border-blue-500 text-blue-400"
                      : "bg-neutral-900/80 hover:bg-neutral-800 border-neutral-700 text-neutral-200"
                  }`}
                >
                  <BookmarkPlus className="w-4 h-4" />
                  <span>{isFavorite ? "Đã trong Kho của Em" : "Kho của Em"}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Nội dung chi tiết & Danh sách tập */}
        <div className="p-4 sm:p-6 space-y-6 max-h-[55vh] overflow-y-auto">
          {/* Metadata tags */}
          <div className="flex items-center gap-4 text-xs sm:text-sm text-neutral-300 flex-wrap">
            <span className="text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
              98% Trùng khớp cho hai đứa
            </span>
            <span>Năm: {detail?.year || (movie as any).year}</span>
            {detail?.episode_current && (
              <span className="px-2 py-0.5 bg-neutral-800 rounded font-medium">
                {detail.episode_current}
              </span>
            )}
            {detail?.time && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                {detail.time}
              </span>
            )}
            {detail?.quality && (
              <span className="px-1.5 py-0.5 bg-netflix-red/30 text-red-300 rounded font-semibold text-xs">
                {detail.quality}
              </span>
            )}
          </div>

          {/* Synopsis */}
          <div>
            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
              Nội dung phim
            </h4>
            <p className="text-sm text-neutral-200 leading-relaxed">
              {detail?.content
                ? detail.content.replace(/<[^>]*>?/gm, "")
                : "Đang cập nhật nội dung phim..."}
            </p>
          </div>

          {/* Diễn viên & Thể loại */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {detail?.category && detail.category.length > 0 && (
              <div>
                <span className="text-neutral-400">Thể loại: </span>
                <span className="text-neutral-200 font-medium">
                  {detail.category.map((c) => c.name).join(", ")}
                </span>
              </div>
            )}
            {detail?.country && detail.country.length > 0 && (
              <div>
                <span className="text-neutral-400">Quốc gia: </span>
                <span className="text-neutral-200 font-medium">
                  {detail.country.map((c) => c.name).join(", ")}
                </span>
              </div>
            )}
            {detail?.director && detail.director.length > 0 && (
              <div>
                <span className="text-neutral-400">Đạo diễn: </span>
                <span className="text-neutral-200">
                  {detail.director.join(", ")}
                </span>
              </div>
            )}
            {detail?.actor && detail.actor.length > 0 && (
              <div>
                <span className="text-neutral-400">Diễn viên: </span>
                <span className="text-neutral-200">
                  {detail.actor.join(", ")}
                </span>
              </div>
            )}
          </div>

          {/* DANH SÁCH TẬP PHIM (EPISODES LIST) */}
          <div className="pt-2 border-t border-neutral-800">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-netflix-red" />
                <span>Danh sách tập phim</span>
              </h4>

              {/* Tabs chọn server nếu có nhiều server */}
              {detail?.episodes && detail.episodes.length > 1 && (
                <div className="flex items-center gap-1.5 bg-neutral-900 p-1 rounded-lg border border-neutral-800 text-xs">
                  {detail.episodes.map((srv, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedServerIdx(idx)}
                      className={`px-2.5 py-1 rounded-md transition ${
                        selectedServerIdx === idx
                          ? "bg-netflix-red text-white font-semibold"
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      {srv.server_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-neutral-500 text-xs animate-pulse">
                Đang tải danh sách tập phát...
              </div>
            ) : !activeServer || !activeServer.server_data || activeServer.server_data.length === 0 ? (
              <div className="py-6 text-center text-neutral-500 text-xs italic">
                Chưa có link tập phim cho phim này.
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {activeServer.server_data.map((ep) => (
                  <Link
                    key={ep.slug}
                    href={`/watch/${movieSlug}/${ep.slug}`}
                    className="p-2.5 rounded-xl bg-neutral-900/90 hover:bg-netflix-red border border-neutral-800 hover:border-netflix-red text-center text-xs font-semibold text-neutral-200 hover:text-white transition group shadow flex items-center justify-center gap-1"
                  >
                    <Play className="w-3 h-3 fill-current opacity-70 group-hover:opacity-100" />
                    <span className="truncate">{ep.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
