"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import HeroBanner from "@/components/HeroBanner";
import MovieRow from "@/components/MovieRow";
import MovieModal from "@/components/MovieModal";
import NoteModal from "@/components/NoteModal";
import CoupleChatWidget from "@/components/CoupleChatWidget";
import { useAuth } from "@/context/AuthContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  getNewUpdates,
  getSeries,
  getSingleMovies,
  getAnimations,
  getRomanceMovies,
  getMovieDetail,
} from "@/lib/movieApi";
import {
  MovieItem,
  MovieDetail,
  WatchHistoryItem,
  CoupleMovie,
} from "@/types";
import { Heart, Sparkles, Film, Tv, Bookmark, Compass } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { currentProfile, featuredSlug } = useAuth();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<string>("home");

  // Dữ liệu API phim KKPhim
  const [newUpdates, setNewUpdates] = useState<MovieItem[]>([]);
  const [seriesList, setSeriesList] = useState<MovieItem[]>([]);
  const [singleList, setSingleList] = useState<MovieItem[]>([]);
  const [animeList, setAnimeList] = useState<MovieItem[]>([]);
  const [romanceList, setRomanceList] = useState<MovieItem[]>([]);
  const [bannerMovies, setBannerMovies] = useState<(MovieDetail | MovieItem)[]>([]);

  // Dữ liệu Supabase Realtime
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [couplePicks, setCouplePicks] = useState<CoupleMovie[]>([]);
  const [favoriteMovies, setFavoriteMovies] = useState<CoupleMovie[]>([]);

  // Trạng thái tải
  const [isLoadingApi, setIsLoadingApi] = useState<boolean>(true);

  // Modals
  const [selectedMovieForModal, setSelectedMovieForModal] = useState<MovieItem | null>(null);
  const [noteModalConfig, setNoteModalConfig] = useState<{
    isOpen: boolean;
    movie: MovieItem | null;
    category: "couple_pick" | "favorite";
  }>({
    isOpen: false,
    movie: null,
    category: "couple_pick",
  });

  // 1. Tải danh sách phim từ KKPhim & tuyển chọn Banner 4K Tình Cảm
  useEffect(() => {
    let isMounted = true;
    async function loadMovies() {
      setIsLoadingApi(true);
      try {
        const [updates, series, singles, animes, romances] = await Promise.all([
          getNewUpdates(1),
          getSeries(1, 18),
          getSingleMovies(1, 18),
          getAnimations(1, 18),
          getRomanceMovies(1, 18),
        ]);

        if (!isMounted) return;
        setNewUpdates(updates);
        setSeriesList(series);
        setSingleList(singles);
        setAnimeList(animes);
        setRomanceList(romances);

        // TUYỂN TẬP PHIM TÌNH CẢM LÃNG MẠN VỚI BACKDROP 4K / 3K SIÊU NÉT (LANDSCAPE 16:9)
        const TOP_ROMANCE_SLUGS = [
          "di-den-noi-co-gio",               // Đi Đến Nơi Có Gió (3100x1744 3K)
          "ha-canh-noi-anh",                 // Hạ Cánh Nơi Anh (3840x2160 4K UHD)
          "chiec-bat-lua-va-vay-cong-chua",   // Chiếc Bật Lửa Và Váy Công Chúa (3334x1875 3.3K)
          "em-la-niem-kieu-hanh-cua-anh",    // Em Là Niềm Kiêu Hãnh Của Anh (3420x1924 3.4K)
          "thu-ky-kim-sao-the",              // Thư Ký Kim Sao Thế? (2133x1200 2K)
          "hen-ho-chon-cong-so",             // Hẹn Hò Chốn Công Sở (1280x720 HD)
        ];

        const candidateSlugs = new Set<string>();
        const topBanners: (MovieDetail | MovieItem)[] = [];

        // 1. Nếu có phim ghim từ Supabase, lấy chi tiết đưa lên đầu
        if (featuredSlug) {
          candidateSlugs.add(featuredSlug);
          const pinnedDetail = await getMovieDetail(featuredSlug);
          if (pinnedDetail) topBanners.push(pinnedDetail);
        }

        // 2. Tải toàn bộ chi tiết kèm ảnh 4K cho danh sách phim tình cảm kinh điển
        const romanceDetails = await Promise.all(
          TOP_ROMANCE_SLUGS.map((slug) =>
            candidateSlugs.has(slug) ? Promise.resolve(null) : getMovieDetail(slug)
          )
        );

        for (const detail of romanceDetails) {
          if (detail && !candidateSlugs.has(detail.slug)) {
            candidateSlugs.add(detail.slug);
            topBanners.push(detail);
          }
        }

        // 3. Bổ sung thêm các phim tình cảm mới nhất từ API
        for (const item of romances.slice(0, 4)) {
          if (!candidateSlugs.has(item.slug)) {
            candidateSlugs.add(item.slug);
            topBanners.push(item);
          }
        }

        if (isMounted) {
          setBannerMovies(topBanners);
        }
      } catch (err) {
        console.error("Lỗi tải phim từ API:", err);
      } finally {
        if (isMounted) setIsLoadingApi(false);
      }
    }

    loadMovies();
    return () => {
      isMounted = false;
    };
  }, [featuredSlug]);

  // 2. Tải & Lắng nghe Realtime từ Supabase (watch_history & couple_movies) kết hợp LocalStorage Fallback
  const fetchSupabaseData = useCallback(async () => {
    // A. Luôn nạp tức thì từ LocalStorage (0ms, không phụ thuộc mạng hay Supabase RLS)
    try {
      const localCouple = JSON.parse(localStorage.getItem("ourflix_couple_movies") || "[]");
      if (Array.isArray(localCouple) && localCouple.length > 0) {
        setCouplePicks(localCouple.filter((m: any) => m.category === "couple_pick"));
        setFavoriteMovies(localCouple.filter((m: any) => m.category === "favorite"));
      }

      const localHistory = JSON.parse(localStorage.getItem("ourflix_watch_history") || "[]");
      if (Array.isArray(localHistory) && localHistory.length > 0) {
        setWatchHistory(localHistory);
      }
    } catch (e) {
      console.error("Lỗi đọc local data:", e);
    }

    if (!isSupabaseConfigured) return;

    // B. Nạp và hợp nhất dữ liệu từ Supabase Cloud
    try {
      // 1. Lịch sử xem dở
      const { data: historyData } = await supabase
        .from("watch_history")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(15);

      if (historyData && historyData.length > 0) {
        let localHistory: any[] = [];
        try {
          localHistory = JSON.parse(localStorage.getItem("ourflix_watch_history") || "[]");
        } catch {}

        const seenHistory = new Set();
        const mergedHistory = [...historyData, ...localHistory].filter((h: any) => {
          if (!h.movie_slug || seenHistory.has(h.movie_slug)) return false;
          seenHistory.add(h.movie_slug);
          return true;
        });
        setWatchHistory(mergedHistory);
        try {
          localStorage.setItem("ourflix_watch_history", JSON.stringify(mergedHistory));
        } catch {}
      }

      // 2. Kho phim cặp đôi (Góc Couple & Kho của Em)
      const { data: coupleData } = await supabase
        .from("couple_movies")
        .select("*")
        .order("created_at", { ascending: false });

      if (coupleData && coupleData.length > 0) {
        let localCouple: any[] = [];
        try {
          localCouple = JSON.parse(localStorage.getItem("ourflix_couple_movies") || "[]");
        } catch {}

        const seenCouple = new Set();
        const mergedCouple = [...coupleData, ...localCouple].filter((m: any) => {
          const key = `${m.movie_slug}_${m.category}`;
          if (!m.movie_slug || seenCouple.has(key)) return false;
          seenCouple.add(key);
          return true;
        });

        setCouplePicks(mergedCouple.filter((m) => m.category === "couple_pick"));
        setFavoriteMovies(mergedCouple.filter((m) => m.category === "favorite"));
        try {
          localStorage.setItem("ourflix_couple_movies", JSON.stringify(mergedCouple));
        } catch {}
      }
    } catch (err) {
      console.error("Lỗi lấy dữ liệu Supabase:", err);
    }
  }, []);

  useEffect(() => {
    fetchSupabaseData();

    if (!isSupabaseConfigured) return;

    // Đăng ký Supabase Realtime cho bảng watch_history
    const historyChannel = supabase
      .channel("realtime:watch_history")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "watch_history" },
        () => {
          fetchSupabaseData();
        }
      )
      .subscribe();

    // Đăng ký Supabase Realtime cho bảng couple_movies
    const coupleChannel = supabase
      .channel("realtime:couple_movies")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "couple_movies" },
        () => {
          fetchSupabaseData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(historyChannel);
      supabase.removeChannel(coupleChannel);
    };
  }, [fetchSupabaseData]);

  // Tập hợp các slug đã thêm để tô màu icon
  const couplePickSlugs = new Set(couplePicks.map((m) => m.movie_slug));
  const favoriteSlugs = new Set(favoriteMovies.map((m) => m.movie_slug));

  // Điều hướng khi chọn xem tiếp
  const handleSelectMovie = (movie: any) => {
    // Nếu là phim trong hàng "Xem tiếp" có sẵn episode_slug
    if (movie.episode_slug) {
      router.push(`/watch/${movie.movie_slug}/${movie.episode_slug}`);
      return;
    }
    // Ngược lại mở modal chi tiết & chọn tập
    setSelectedMovieForModal(movie);
  };

  // Mở modal thêm ghi chú
  const handleOpenNoteModal = (movie: any, category: "couple_pick" | "favorite") => {
    setNoteModalConfig({
      isOpen: true,
      movie: {
        _id: movie._id || movie.movie_slug || movie.slug,
        name: movie.name || movie.movie_name,
        slug: movie.slug || movie.movie_slug,
        origin_name: movie.origin_name || movie.name,
        thumb_url: movie.thumb_url || movie.poster_url,
        poster_url: movie.poster_url || movie.thumb_url,
        year: movie.year || new Date().getFullYear(),
      },
      category,
    });
  };

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col pb-20 selection:bg-netflix-red">
      {/* HEADER CỐ ĐỊNH */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onSelectMovie={(movie) => setSelectedMovieForModal(movie)}
      />

      {/* HERO BANNER SLIDER (XOAY TUA CÁC PHIM HOT LIÊN TỤC) */}
      {(activeTab === "home" || activeTab === "series" || activeTab === "single") && (
        <HeroBanner
          movies={bannerMovies}
          onOpenDetail={(movie) => setSelectedMovieForModal(movie as MovieItem)}
        />
      )}

      {/* NỘI DUNG CHÍNH CÁC HÀNG PHIM */}
      <main className={`flex-1 space-y-6 ${activeTab !== "home" && activeTab !== "series" && activeTab !== "single" ? "pt-24" : "-mt-10 sm:-mt-14 relative z-20"}`}>
        {/* ============================================================== */}
        {/* 1. HÀNG "XEM TIẾP CÙNG NHAU 🍿" (SUPABASE REALTIME) */}
        {/* ============================================================== */}
        {(activeTab === "home" || activeTab === "couple") && watchHistory.length > 0 && (
          <MovieRow
            title="Xem tiếp cùng nhau 🍿"
            subtitle="Đồng bộ tiến độ từng giây giữa các thiết bị qua Supabase"
            movies={watchHistory}
            layoutType="landscape"
            onSelectMovie={handleSelectMovie}
            onAddToCouple={(m) => handleOpenNoteModal(m, "couple_pick")}
            onAddToFavorite={(m) => handleOpenNoteModal(m, "favorite")}
            couplePickSlugs={couplePickSlugs}
            favoriteSlugs={favoriteSlugs}
          />
        )}

        {/* ============================================================== */}
        {/* 2. HÀNG "GÓC COUPLE — PHIM HAI ĐỨA CHỌN 💖" */}
        {/* ============================================================== */}
        {(activeTab === "home" || activeTab === "couple") && (
          <MovieRow
            title="Góc Couple — Phim hai đứa chọn 💖"
            subtitle="Những bộ phim hai đứa gợi ý cho nhau cùng xem"
            movies={couplePicks}
            layoutType="portrait"
            emptyMessage="Góc Couple chưa có phim nào. Hãy bấm icon Trái Tim trên bất kỳ phim nào để gợi ý cho người ấy nhé!"
            onSelectMovie={handleSelectMovie}
            onAddToCouple={(m) => handleOpenNoteModal(m, "couple_pick")}
            onAddToFavorite={(m) => handleOpenNoteModal(m, "favorite")}
            couplePickSlugs={couplePickSlugs}
            favoriteSlugs={favoriteSlugs}
          />
        )}

        {/* ============================================================== */}
        {/* 3. HÀNG "KHO CỦA EM 🔖" */}
        {/* ============================================================== */}
        {(activeTab === "home" || activeTab === "favorite") && (
          <MovieRow
            title="Kho của Em 🔖"
            subtitle="Bộ sưu tập phim yêu thích dành riêng cho em"
            movies={favoriteMovies}
            layoutType="portrait"
            emptyMessage="Kho của Em đang trống. Bấm icon Bookmark trên phim bất kỳ để lưu lại nha!"
            onSelectMovie={handleSelectMovie}
            onAddToCouple={(m) => handleOpenNoteModal(m, "couple_pick")}
            onAddToFavorite={(m) => handleOpenNoteModal(m, "favorite")}
            couplePickSlugs={couplePickSlugs}
            favoriteSlugs={favoriteSlugs}
          />
        )}

        {/* ============================================================== */}
        {/* HÀNG "TUYỂN TẬP PHIM TÌNH CẢM & LÃNG MẠN 💕" */}
        {/* ============================================================== */}
        {(activeTab === "home" || activeTab === "couple" || activeTab === "series") && (
          <MovieRow
            title="Tuyển tập Phim Tình Cảm & Lãng Mạn 💕"
            subtitle="Những câu chuyện tình yêu ngọt ngào, sâu lắng và chữa lành cho hai đứa"
            movies={romanceList}
            layoutType="portrait"
            isLoading={isLoadingApi}
            onSelectMovie={handleSelectMovie}
            onAddToCouple={(m) => handleOpenNoteModal(m, "couple_pick")}
            onAddToFavorite={(m) => handleOpenNoteModal(m, "favorite")}
            couplePickSlugs={couplePickSlugs}
            favoriteSlugs={favoriteSlugs}
          />
        )}

        {/* ============================================================== */}
        {/* 4. HÀNG "MỚI CẬP NHẬT LIÊN TỤC 24/7 ⚡ (KKPHIM API)" */}
        {/* ============================================================== */}
        {(activeTab === "home" || activeTab === "series" || activeTab === "single") && (
          <MovieRow
            title="Mới cập nhật liên tục 24/7 ⚡"
            subtitle="Tự động đồng bộ nguồn phim mới nhất từ KKPhim"
            movies={newUpdates}
            layoutType="portrait"
            isLoading={isLoadingApi}
            onSelectMovie={handleSelectMovie}
            onAddToCouple={(m) => handleOpenNoteModal(m, "couple_pick")}
            onAddToFavorite={(m) => handleOpenNoteModal(m, "favorite")}
            couplePickSlugs={couplePickSlugs}
            favoriteSlugs={favoriteSlugs}
          />
        )}

        {/* ============================================================== */}
        {/* 5. HÀNG "PHIM BỘ CÀY ĐÊM 🌙" */}
        {/* ============================================================== */}
        {(activeTab === "home" || activeTab === "series") && (
          <MovieRow
            title="Phim bộ cày đêm 🌙"
            subtitle="Các bộ phim truyền hình hot nhất Châu Á và thế giới"
            movies={seriesList}
            layoutType="portrait"
            isLoading={isLoadingApi}
            onSelectMovie={handleSelectMovie}
            onAddToCouple={(m) => handleOpenNoteModal(m, "couple_pick")}
            onAddToFavorite={(m) => handleOpenNoteModal(m, "favorite")}
            couplePickSlugs={couplePickSlugs}
            favoriteSlugs={favoriteSlugs}
          />
        )}

        {/* ============================================================== */}
        {/* 6. HÀNG "PHIM LẺ CUỐI TUẦN 🎬" */}
        {/* ============================================================== */}
        {(activeTab === "home" || activeTab === "single") && (
          <MovieRow
            title="Phim lẻ cuối tuần 🎬"
            subtitle="Tuyển tập phim chiếu rạp bom tấn trọn vẹn cảm xúc"
            movies={singleList}
            layoutType="portrait"
            isLoading={isLoadingApi}
            onSelectMovie={handleSelectMovie}
            onAddToCouple={(m) => handleOpenNoteModal(m, "couple_pick")}
            onAddToFavorite={(m) => handleOpenNoteModal(m, "favorite")}
            couplePickSlugs={couplePickSlugs}
            favoriteSlugs={favoriteSlugs}
          />
        )}

        {/* ============================================================== */}
        {/* 7. HÀNG "ANIME & HOẠT HÌNH ✨" */}
        {/* ============================================================== */}
        {(activeTab === "home" || activeTab === "anime") && (
          <MovieRow
            title="Anime & Hoạt hình ✨"
            subtitle="Thế giới hoạt hình tuổi thơ và những bộ Anime hấp dẫn"
            movies={animeList}
            layoutType="portrait"
            isLoading={isLoadingApi}
            onSelectMovie={handleSelectMovie}
            onAddToCouple={(m) => handleOpenNoteModal(m, "couple_pick")}
            onAddToFavorite={(m) => handleOpenNoteModal(m, "favorite")}
            couplePickSlugs={couplePickSlugs}
            favoriteSlugs={favoriteSlugs}
          />
        )}
      </main>

      {/* FOOTER */}
      <footer className="mt-20 border-t border-neutral-800/80 py-8 text-center text-xs text-neutral-500">
        <div className="flex items-center justify-center gap-1.5 mb-2">
          <span className="font-bold text-neutral-300">OURFLIX</span>
          <span>&bull; Dành riêng cho tình yêu của Trà My & Thiên Phát</span>
          <Heart className="w-3.5 h-3.5 text-couple-pink fill-couple-pink inline" />
        </div>
        <p>0 đồng chi phí vận hành &bull; 0% Quảng cáo &bull; Tự hào vận hành trên Next.js & Supabase Free Tier</p>
      </footer>

      {/* MODAL CHI TIẾT PHIM & CHỌN TẬP */}
      <MovieModal
        movie={selectedMovieForModal}
        onClose={() => setSelectedMovieForModal(null)}
        onAddToCouple={(m) => handleOpenNoteModal(m, "couple_pick")}
        onAddToFavorite={(m) => handleOpenNoteModal(m, "favorite")}
        isCouplePick={selectedMovieForModal ? couplePickSlugs.has(selectedMovieForModal.slug || (selectedMovieForModal as any).movie_slug) : false}
        isFavorite={selectedMovieForModal ? favoriteSlugs.has(selectedMovieForModal.slug || (selectedMovieForModal as any).movie_slug) : false}
      />

      {/* MODAL ĐÍNH KÈM GHI CHÚ KHI THÊM PHIM VÀO GÓC COUPLE HOẶC KHO CỦA EM */}
      <NoteModal
        isOpen={noteModalConfig.isOpen}
        onClose={() => setNoteModalConfig((prev) => ({ ...prev, isOpen: false }))}
        movie={noteModalConfig.movie}
        category={noteModalConfig.category}
        isAlreadySaved={
          noteModalConfig.movie
            ? noteModalConfig.category === "couple_pick"
              ? couplePickSlugs.has(noteModalConfig.movie.slug)
              : favoriteSlugs.has(noteModalConfig.movie.slug)
            : false
        }
        onSuccess={fetchSupabaseData}
      />
      {/* WIDGET CHAT CẶP ĐÔI NỔI GÓC DƯỚI BÊN PHẢI (THU GỌN TINH TẾ) */}
      <CoupleChatWidget />
    </div>
  );
}
