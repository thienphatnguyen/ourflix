"use client";

import React, { useRef } from "react";
import MovieCard from "./MovieCard";
import { MovieItem, WatchHistoryItem, CoupleMovie } from "@/types";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MovieRowProps {
  title: string;
  subtitle?: string;
  movies: any[];
  layoutType?: "portrait" | "landscape";
  isLoading?: boolean;
  emptyMessage?: string;
  onSelectMovie: (movie: any) => void;
  onAddToCouple?: (movie: any) => void;
  onAddToFavorite?: (movie: any) => void;
  couplePickSlugs?: Set<string>;
  favoriteSlugs?: Set<string>;
}

export default function MovieRow({
  title,
  subtitle,
  movies,
  layoutType = "portrait",
  isLoading = false,
  emptyMessage = "Chưa có phim nào trong danh sách này.",
  onSelectMovie,
  onAddToCouple,
  onAddToFavorite,
  couplePickSlugs = new Set(),
  favoriteSlugs = new Set(),
}: MovieRowProps) {
  const rowRef = useRef<HTMLDivElement | null>(null);

  const handleScroll = (direction: "left" | "right") => {
    if (!rowRef.current) return;
    const { scrollLeft, clientWidth } = rowRef.current;
    const scrollAmount = clientWidth * 0.75;
    rowRef.current.scrollTo({
      left: direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative py-4 group/row">
      {/* Tiêu đề & Subtitle của hàng */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-3 flex items-baseline justify-between">
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-wide flex items-center gap-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-neutral-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Vùng phim cuộn ngang */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Nút lướt sang trái */}
        <button
          onClick={() => handleScroll("left")}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all duration-200 backdrop-blur-sm border border-neutral-700 shadow-xl focus:outline-none"
          aria-label="Cuộn trái"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Nút lướt sang phải */}
        <button
          onClick={() => handleScroll("right")}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all duration-200 backdrop-blur-sm border border-neutral-700 shadow-xl focus:outline-none"
          aria-label="Cuộn phải"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Danh sách thẻ phim cuộn ngang */}
        <div
          ref={rowRef}
          className="flex items-center gap-3 sm:gap-4 overflow-x-auto scrollbar-none py-2 px-1 scroll-smooth"
        >
          {isLoading ? (
            // Skeleton loader
            Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className={`flex-shrink-0 rounded-xl bg-neutral-900 border border-neutral-800 animate-pulse ${
                  layoutType === "landscape"
                    ? "w-64 sm:w-72 md:w-80 aspect-[16/9]"
                    : "w-36 sm:w-44 md:w-48 aspect-[2/3]"
                }`}
              />
            ))
          ) : movies.length === 0 ? (
            <div className="w-full py-8 text-center text-neutral-500 text-sm italic bg-neutral-900/30 rounded-xl border border-neutral-800/40">
              {emptyMessage}
            </div>
          ) : (
            movies.map((item, index) => {
              const slug = item.slug || item.movie_slug;
              const hasProgress = Boolean(
                item.current_time_sec !== undefined && item.duration_sec
              );

              return (
                <MovieCard
                  key={item.id || item._id || `${slug}_${index}`}
                  movie={item}
                  layoutType={layoutType}
                  progress={
                    hasProgress
                      ? {
                          current_time_sec: item.current_time_sec,
                          duration_sec: item.duration_sec,
                          episode_name: item.episode_name,
                          episode_slug: item.episode_slug,
                          updated_by: item.updated_by,
                        }
                      : undefined
                  }
                  note={item.note}
                  onSelect={() => onSelectMovie(item)}
                  onAddToCouple={
                    onAddToCouple ? () => onAddToCouple(item) : undefined
                  }
                  onAddToFavorite={
                    onAddToFavorite ? () => onAddToFavorite(item) : undefined
                  }
                  isCouplePick={couplePickSlugs.has(slug)}
                  isFavorite={favoriteSlugs.has(slug)}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
