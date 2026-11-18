"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { searchMovies } from "@/lib/movieApi";
import { MovieItem } from "@/types";
import BannerEditModal from "./BannerEditModal";
import {
  Heart,
  Search,
  X,
  Edit3,
  UserCheck,
  LogOut,
  ChevronDown,
  Sparkles,
  Film,
  Tv,
  Bookmark,
  Compass,
} from "lucide-react";

interface HeaderProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onSelectMovie?: (movie: MovieItem) => void;
}

export default function Header({ activeTab = "home", onTabChange, onSelectMovie }: HeaderProps) {
  const { currentProfile, loveDays, switchProfile, lockApp } = useAuth();
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<MovieItem[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showSearchInput, setShowSearchInput] = useState<boolean>(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState<boolean>(false);

  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  // Hiệu ứng đổi màu nền Header khi scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Xử lý tìm kiếm tức thì debounce 400ms
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    searchDebounceRef.current = setTimeout(async () => {
      try {
        const results = await searchMovies(searchQuery, 8);
        setSearchResults(results);
      } catch (err) {
        console.error("Lỗi search:", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchResults([]);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { id: "home", label: "Trang chủ" },
    { id: "series", label: "Phim bộ" },
    { id: "single", label: "Phim lẻ" },
    { id: "anime", label: "Hoạt hình" },
    { id: "couple", label: "Góc Couple 💕" },
    { id: "favorite", label: "Kho của Em 🔖" },
  ];

  const handleNavClick = (id: string) => {
    if (onTabChange) {
      onTabChange(id);
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? "bg-[#141414]/95 backdrop-blur-md shadow-lg shadow-black/50 py-3"
            : "bg-gradient-to-b from-black/90 via-black/50 to-transparent py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* LOGO & MENU LINKS */}
          <div className="flex items-center gap-6 lg:gap-8">
            <Link
              href="/"
              onClick={() => handleNavClick("home")}
              className="flex items-center gap-1.5 focus:outline-none group flex-shrink-0"
            >
              <span className="text-2xl sm:text-3xl font-extrabold tracking-wider text-netflix-red font-sans">
                OURFLIX
              </span>
              <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-couple-pink fill-couple-pink animate-pulse" />
            </Link>

            {/* Nav Links Desktop */}
            <nav className="hidden md:flex items-center gap-4 lg:gap-6 text-sm font-medium">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`transition-colors duration-200 py-1 ${
                      isActive
                        ? "text-white font-bold border-b-2 border-netflix-red"
                        : "text-neutral-300 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* ACTIONS: SEARCH, LOVE DAYS BADGE, BANNER EDIT, PROFILE */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* SEARCH BAR (TỨC THÌ VỚI DEBOUNCE 400MS) */}
            <div ref={searchContainerRef} className="relative">
              <div
                className={`flex items-center transition-all duration-300 rounded-full border ${
                  showSearchInput || searchQuery
                    ? "w-44 sm:w-64 bg-black/80 border-neutral-600 px-3 py-1.5"
                    : "w-9 h-9 border-transparent justify-center cursor-pointer hover:bg-neutral-800/60"
                }`}
                onClick={() => setShowSearchInput(true)}
              >
                <Search className="w-4 h-4 text-neutral-300 flex-shrink-0" />
                {(showSearchInput || searchQuery) && (
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm phim..."
                    autoFocus
                    className="w-full bg-transparent border-none text-xs sm:text-sm text-white px-2 focus:outline-none placeholder:text-neutral-400"
                  />
                )}
                {searchQuery && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="text-neutral-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* LIVE SEARCH RESULTS DROPDOWN */}
              {searchResults.length > 0 && (
                <div className="absolute top-full mt-2 right-0 w-80 sm:w-96 bg-[#181818] border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in max-h-[70vh] overflow-y-auto">
                  <div className="p-3 text-xs font-semibold text-neutral-400 border-b border-neutral-800 flex items-center justify-between">
                    <span>Kết quả tìm kiếm cho &ldquo;{searchQuery}&rdquo;</span>
                    <span className="text-[10px] text-couple-pink">{searchResults.length} kết quả</span>
                  </div>
                  <div className="divide-y divide-neutral-800/60">
                    {searchResults.map((item) => (
                      <div
                        key={item._id || item.slug}
                        onClick={() => {
                          if (onSelectMovie) onSelectMovie(item);
                          setSearchResults([]);
                          setSearchQuery("");
                        }}
                        className="p-2.5 flex items-center gap-3 hover:bg-neutral-800/80 cursor-pointer transition group"
                      >
                        <img
                          src={item.thumb_url || item.poster_url}
                          alt={item.name}
                          className="w-12 h-16 object-cover rounded-md flex-shrink-0 shadow"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=200&auto=format&fit=crop&q=80";
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs sm:text-sm font-semibold text-white group-hover:text-couple-pink transition truncate">
                            {item.name}
                          </h4>
                          <p className="text-[11px] text-neutral-400 truncate">
                            {item.origin_name} &bull; {item.year}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {item.episode_current && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-netflix-red/30 text-red-300 font-medium">
                                {item.episode_current}
                              </span>
                            )}
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">
                              {item.quality || "FHD"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* BADGE ĐẾM NGÀY YÊU NHAU (TỰ ĐỘNG TÍNH TỪ SUPABASE) */}
            <div
              onClick={() => setIsBannerModalOpen(true)}
              title="Bấm để chỉnh sửa lời nhắn & ngày kỷ niệm"
              className="hidden sm:flex items-center gap-1.5 bg-neutral-900/90 border border-couple-pink/40 hover:border-couple-pink px-3 py-1.5 rounded-full cursor-pointer transition group shadow-sm"
            >
              <Heart className="w-3.5 h-3.5 text-couple-pink fill-couple-pink animate-pulse" />
              <span className="text-xs font-semibold text-neutral-200 group-hover:text-white">
                {loveDays} ngày yêu
              </span>
              <Edit3 className="w-3 h-3 text-neutral-500 group-hover:text-couple-pink ml-0.5" />
            </div>

            {/* AVATAR PROFILE ĐANG DÙNG & DROPDOWN */}
            {currentProfile && (
              <div ref={profileMenuRef} className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 focus:outline-none group p-1 rounded-lg hover:bg-neutral-800/50 transition"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm text-white shadow-md border border-white/20 transition-transform group-hover:scale-105"
                    style={{ backgroundColor: currentProfile.avatarColor }}
                  >
                    {currentProfile.name.charAt(0)}
                  </div>
                  <span className="hidden lg:inline text-xs font-medium text-neutral-300 group-hover:text-white">
                    {currentProfile.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white" />
                </button>

                {/* Profile Dropdown Menu */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-[#181818] border border-neutral-700 rounded-xl shadow-2xl py-2 z-50 animate-fade-in text-xs">
                    <div className="px-3 py-2 border-b border-neutral-800">
                      <p className="text-[11px] text-neutral-400">Đang đăng nhập:</p>
                      <p className="font-semibold text-white text-sm">{currentProfile.name}</p>
                    </div>

                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        setIsBannerModalOpen(true);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-neutral-800 flex items-center gap-2 text-neutral-300 hover:text-white transition"
                    >
                      <Sparkles className="w-4 h-4 text-couple-pink" />
                      <span>Đổi lời nhắn & Ngày yêu</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        switchProfile();
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-neutral-800 flex items-center gap-2 text-neutral-300 hover:text-white transition"
                    >
                      <UserCheck className="w-4 h-4 text-blue-400" />
                      <span>Đổi người xem</span>
                    </button>

                    <div className="border-t border-neutral-800 my-1" />

                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        lockApp();
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-neutral-800 flex items-center gap-2 text-red-400 hover:text-red-300 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Khóa ứng dụng</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Nav Bar */}
        <div className="md:hidden flex items-center gap-2 overflow-x-auto px-4 py-2 mt-2 border-t border-neutral-800/80 scrollbar-none text-xs">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
                activeTab === item.id
                  ? "bg-netflix-red text-white font-semibold"
                  : "bg-neutral-900 text-neutral-300 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {/* Modal chỉnh sửa Banner & Ngày kỷ niệm */}
      <BannerEditModal
        isOpen={isBannerModalOpen}
        onClose={() => setIsBannerModalOpen(false)}
      />
    </>
  );
}
