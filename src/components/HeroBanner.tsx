"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { MovieDetail, MovieItem } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  Play,
  Info,
  Heart,
  MessageSquareHeart,
  Edit3,
  ChevronLeft,
  ChevronRight,
  Pin,
  Check,
  Sparkles,
} from "lucide-react";
import BannerEditModal from "./BannerEditModal";

interface HeroBannerProps {
  movies: (MovieDetail | MovieItem)[];
  onOpenDetail?: (movie: MovieItem | MovieDetail) => void;
}

export default function HeroBanner({ movies = [], onOpenDetail }: HeroBannerProps) {
  const { bannerMessage, featuredSlug } = useAuth();
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState<boolean>(false);
  const [pinnedSuccess, setPinnedSuccess] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const bannerList = movies.length > 0 ? movies : [];
  const currentMovie = bannerList[currentIndex] || bannerList[0];

  // Tự động xoay tua banner mỗi 7 giây (tạm dừng khi người dùng rê chuột vào)
  useEffect(() => {
    if (bannerList.length <= 1 || isHovered) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % bannerList.length);
    }, 7000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [bannerList.length, isHovered]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? bannerList.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % bannerList.length);
  };

  // Nút ghim phim hiện tại làm phim ưu tiên trên Supabase
  const handlePinCurrentMovie = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentMovie || !isSupabaseConfigured) return;

    try {
      const slug = currentMovie.slug || (currentMovie as any).movie_slug;
      await supabase.from("couple_status").upsert({
        id: 1,
        featured_slug: slug,
        updated_at: new Date().toISOString(),
      });
      setPinnedSuccess(true);
      setTimeout(() => setPinnedSuccess(false), 2000);
    } catch (err) {
      console.error("Lỗi ghim phim:", err);
    }
  };

  if (!currentMovie) {
    return (
      <div className="relative w-full h-[65vh] md:h-[78vh] bg-[#141414] animate-pulse flex items-center justify-center">
        <span className="text-neutral-600 text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-couple-pink animate-spin" />
          Đang cập nhật các phim nổi bật liên tục...
        </span>
      </div>
    );
  }

  const movieSlug = currentMovie.slug || (currentMovie as any).movie_slug;
  const firstEpisodeSlug =
    (currentMovie as MovieDetail).episodes?.[0]?.server_data?.[0]?.slug || "tap-01";
  
  // Ưu tiên thumb_url vì đây là ảnh ngang 16:9 độ phân giải 2K-4K UHD (3840x2160, 3100x1744) của KKPhim
  // Tuyệt đối không dùng poster_url trước vì poster_url là ảnh đứng 2:3, kéo giãn ngang sẽ bị phóng to vỡ hạt!
  const backdropUrl = currentMovie.thumb_url || currentMovie.poster_url;

  return (
    <>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative w-full h-[70vh] md:h-[84vh] text-white overflow-hidden select-none group/banner"
      >
        {/* Background Backdrop Image 4K với hiệu ứng chuyển đổi mượt mà */}
        <div className="absolute inset-0">
          <img
            key={currentMovie._id || movieSlug}
            src={backdropUrl}
            alt={currentMovie.name}
            className="w-full h-full object-cover object-top md:object-center filter contrast-[1.03] brightness-[0.92] transition-all duration-700 animate-fade-in"
            style={{ imageRendering: "-webkit-optimize-contrast" }}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=1600&auto=format&fit=crop&q=80";
            }}
          />
          {/* Lớp phủ Gradients chuẩn Dark Cinema: Giữ trọn độ nét và ánh sáng của phần hình ảnh bên phải */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/65 to-transparent w-full md:w-3/5" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/25 to-transparent" />
        </div>

        {/* NÚT CHUYỂN BANNER TRÁI / PHẢI */}
        {bannerList.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/50 hover:bg-black/90 text-white flex items-center justify-center opacity-0 group-hover/banner:opacity-100 transition-all duration-300 backdrop-blur-md border border-neutral-700/80 shadow-2xl hover:scale-110 active:scale-95"
              aria-label="Phim trước"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/50 hover:bg-black/90 text-white flex items-center justify-center opacity-0 group-hover/banner:opacity-100 transition-all duration-300 backdrop-blur-md border border-neutral-700/80 shadow-2xl hover:scale-110 active:scale-95"
              aria-label="Phim kế tiếp"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* NỘI DUNG THÔNG TIN PHIM TRÊN BANNER */}
        <div className="relative z-10 max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12 sm:pb-16 md:pb-20">
          <div className="max-w-2xl space-y-3.5 animate-fade-in">
            {/* Tag Trùng khớp cho hai đứa & Metadata */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                <span>98% Trùng khớp cho hai đứa</span>
                <Heart className="w-3.5 h-3.5 text-couple-pink fill-couple-pink" />
              </span>
              <span className="text-[11px] font-extrabold px-2 py-0.5 rounded bg-blue-600/40 border border-blue-400/50 text-blue-200 uppercase tracking-wider shadow">
                4K Ultra HD
              </span>
              <span className="text-xs text-neutral-300 font-medium">
                {currentMovie.year || new Date().getFullYear()}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-neutral-800/80 border border-neutral-700 text-neutral-200 font-semibold">
                12+
              </span>
              {currentMovie.episode_current && (
                <span className="text-xs px-2 py-0.5 rounded bg-netflix-red/40 border border-netflix-red/50 text-red-300 font-semibold">
                  {currentMovie.episode_current}
                </span>
              )}

              {/* Nút ghim phim nhanh lên Supabase */}
              <button
                onClick={handlePinCurrentMovie}
                title="Ghim phim này làm phim ưu tiên trên Banner"
                className={`text-[11px] px-2.5 py-0.5 rounded-full border transition flex items-center gap-1 ${
                  pinnedSuccess
                    ? "bg-emerald-600/30 border-emerald-500 text-emerald-300"
                    : "bg-black/50 hover:bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white"
                }`}
              >
                {pinnedSuccess ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Đã ghim!</span>
                  </>
                ) : (
                  <>
                    <Pin className="w-3 h-3 text-couple-pink" />
                    <span>Ghim phim này</span>
                  </>
                )}
              </button>
            </div>

            {/* Tên phim (Title) */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight drop-shadow-lg uppercase text-white leading-tight">
              {currentMovie.name}
            </h1>

            {currentMovie.origin_name && (
              <p className="text-sm sm:text-base text-neutral-300 font-medium italic drop-shadow line-clamp-1">
                {currentMovie.origin_name}
              </p>
            )}

            {/* Synopsis / Tóm tắt phim */}
            {currentMovie.content && (
              <p className="text-xs sm:text-sm text-neutral-300 line-clamp-2 md:line-clamp-3 leading-relaxed drop-shadow max-w-xl">
                {currentMovie.content.replace(/<[^>]*>?/gm, "")}
              </p>
            )}

            {/* CTA Buttons */}
            <div className="flex items-center gap-3 sm:gap-4 pt-2">
              <Link
                href={`/watch/${movieSlug}/${firstEpisodeSlug}`}
                className="inline-flex items-center gap-2 bg-netflix-red hover:bg-red-700 active:scale-95 text-white font-bold px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl transition duration-200 shadow-xl shadow-netflix-red/30 text-sm sm:text-base"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>Xem ngay</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  if (onOpenDetail) onOpenDetail(currentMovie);
                }}
                className="inline-flex items-center gap-2 bg-neutral-800/80 hover:bg-neutral-700/80 active:scale-95 text-white font-semibold px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl backdrop-blur-md transition duration-200 border border-neutral-700 text-sm sm:text-base"
              >
                <Info className="w-5 h-5" />
                <span>Chi tiết & Chọn tập</span>
              </button>
            </div>
          </div>
        </div>

        {/* THANH ĐIỀU HƯỚNG CÁC PHIM (INDICATOR DOTS / PILLS Ở GÓC DƯỚI BÊN PHẢI) */}
        {bannerList.length > 1 && (
          <div className="absolute bottom-5 right-4 sm:right-8 z-20 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-neutral-800">
            {bannerList.map((m, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={m._id || m.slug || idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`transition-all duration-300 rounded-full ${
                    isActive
                      ? "w-7 h-2 bg-netflix-red shadow-[0_0_8px_rgba(229,9,20,0.8)]"
                      : "w-2 h-2 bg-neutral-500 hover:bg-neutral-300"
                  }`}
                  title={m.name}
                  aria-label={`Chuyển đến phim ${m.name}`}
                />
              );
            })}
          </div>
        )}
      </div>

      <BannerEditModal
        isOpen={isBannerModalOpen}
        onClose={() => setIsBannerModalOpen(false)}
      />
    </>
  );
}
