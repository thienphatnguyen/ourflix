"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Hls from "hls.js";
import { MovieDetail, EpisodeData, EpisodeServer } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useWatchParty } from "@/context/WatchPartyContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getOPhimMovieDetail } from "@/lib/movieApi";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ArrowLeft,
  SkipForward,
  Server,
  HeartHandshake,
  Settings,
  Layers,
  Loader2,
  Sparkles,
  Scaling,
} from "lucide-react";

interface PlayerProps {
  movie: MovieDetail;
  initialEpisodeSlug: string;
}

export default function Player({ movie, initialEpisodeSlug }: PlayerProps) {
  const router = useRouter();
  const { currentProfile } = useAuth();
  const {
    isWatchPartyActive,
    toggleWatchParty,
    sendBroadcast,
    lastRemoteEvent,
  } = useWatchParty();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRemoteActionRef = useRef<boolean>(false);

  // Trạng thái server & tập phim
  const [servers, setServers] = useState<EpisodeServer[]>(movie.episodes || []);
  const [activeServerIdx, setActiveServerIdx] = useState<number>(0);
  const [currentEpisodeSlug, setCurrentEpisodeSlug] = useState<string>(initialEpisodeSlug);
  const [isLoadingOphim, setIsLoadingOphim] = useState<boolean>(false);
  const [ophimLoaded, setOphimLoaded] = useState<boolean>(false);

  // Trạng thái Video
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [bufferedEnd, setBufferedEnd] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [fitMode, setFitMode] = useState<"contain" | "cover" | "fill">("contain");
  const [fitModeToast, setFitModeToast] = useState<string | null>(null);
  const fitToastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);
  const [showEpisodeDrawer, setShowEpisodeDrawer] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Tìm tập hiện tại
  const activeServer = servers[activeServerIdx] || servers[0];
  const episodeList = activeServer?.server_data || [];
  const currentEpisodeIndex = episodeList.findIndex((ep) => ep.slug === currentEpisodeSlug);
  const currentEpisode: EpisodeData | undefined =
    currentEpisodeIndex !== -1 ? episodeList[currentEpisodeIndex] : episodeList[0];
  const nextEpisode: EpisodeData | undefined =
    currentEpisodeIndex !== -1 && currentEpisodeIndex < episodeList.length - 1
      ? episodeList[currentEpisodeIndex + 1]
      : undefined;

  // 1. Khởi tạo & Tải luồng .m3u8 với hls.js (Fallback Safari Native HLS)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentEpisode?.link_m3u8) {
      setErrorMessage("Không tìm thấy đường dẫn video m3u8 của tập này.");
      return;
    }

    setErrorMessage(null);
    setIsBuffering(true);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const streamUrl = currentEpisode.link_m3u8;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsBuffering(false);
        // Tự động khôi phục tiến độ xem dở từ Supabase
        resumeFromHistory();
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setErrorMessage("Lỗi tải video. Bạn có thể bấm Đổi Server Dự Phòng (OPhim) phía trên.");
              hls.destroy();
              break;
          }
        }
      });

      hlsRef.current = hls;
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Hỗ trợ Safari native HLS trên iOS/macOS
      video.src = streamUrl;
      video.addEventListener("loadedmetadata", () => {
        setIsBuffering(false);
        resumeFromHistory();
      });
    } else {
      setErrorMessage("Trình duyệt không hỗ trợ phát luồng HLS (.m3u8).");
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentEpisode?.link_m3u8]);

  // 2. Khôi phục tiến độ xem dở từ Supabase (watch_history)
  const resumeFromHistory = async () => {
    if (!isSupabaseConfigured || !videoRef.current) return;
    try {
      const { data } = await supabase
        .from("watch_history")
        .select("current_time_sec, duration_sec, episode_slug")
        .eq("movie_slug", movie.slug)
        .single();

      if (data && data.current_time_sec && videoRef.current) {
        // Chỉ tua nếu cùng tập và chưa xem hết phim (còn hơn 30s)
        if (
          data.episode_slug === currentEpisodeSlug &&
          data.current_time_sec > 5 &&
          data.duration_sec &&
          data.current_time_sec < data.duration_sec - 30
        ) {
          videoRef.current.currentTime = data.current_time_sec;
        }
      }
    } catch (err) {
      console.error("Lỗi khôi phục lịch sử xem:", err);
    }
  };

  // 3. Tự động lưu tiến độ xem lên Supabase mỗi 5 giây
  const saveProgressToSupabase = useCallback(async () => {
    if (!isSupabaseConfigured || !videoRef.current || !currentProfile || !currentEpisode) return;
    const v = videoRef.current;
    if (v.currentTime <= 0) return;

    try {
      await supabase.from("watch_history").upsert(
        {
          movie_slug: movie.slug,
          movie_name: movie.name,
          poster_url: movie.poster_url || movie.thumb_url,
          episode_slug: currentEpisode.slug,
          episode_name: currentEpisode.name,
          current_time_sec: v.currentTime,
          duration_sec: v.duration || 0,
          updated_by: currentProfile.name,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "movie_slug" }
      );
    } catch (err) {
      console.error("Lỗi lưu tiến độ Supabase:", err);
    }
  }, [movie, currentEpisode, currentProfile]);

  useEffect(() => {
    if (isPlaying) {
      syncIntervalRef.current = setInterval(() => {
        saveProgressToSupabase();
      }, 5000);
    } else {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    }

    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [isPlaying, saveProgressToSupabase]);

  // Lưu khi thoát trang
  useEffect(() => {
    const handleUnload = () => {
      saveProgressToSupabase();
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      saveProgressToSupabase();
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [saveProgressToSupabase]);

  // 4. LẮNG NGHE SỰ KIỆN WATCH PARTY ĐỒNG BỘ TỪ SUPABASE
  useEffect(() => {
    if (!lastRemoteEvent || !isWatchPartyActive || !videoRef.current) return;

    isRemoteActionRef.current = true;
    const video = videoRef.current;

    switch (lastRemoteEvent.type) {
      case "pause":
        if (!video.paused) {
          video.pause();
          setIsPlaying(false);
        }
        break;

      case "play":
        if (video.paused) {
          video.play().catch(() => {});
          setIsPlaying(true);
        }
        break;

      case "seek":
        if (Math.abs(video.currentTime - lastRemoteEvent.time) > 2) {
          video.currentTime = lastRemoteEvent.time;
          setCurrentTime(lastRemoteEvent.time);
        }
        break;

      case "change_episode":
        if (
          lastRemoteEvent.episodeSlug &&
          lastRemoteEvent.episodeSlug !== currentEpisodeSlug
        ) {
          setCurrentEpisodeSlug(lastRemoteEvent.episodeSlug);
        }
        break;
    }

    setTimeout(() => {
      isRemoteActionRef.current = false;
    }, 400);
  }, [lastRemoteEvent, isWatchPartyActive, currentEpisodeSlug]);

  // 5. CÁC HÀNH ĐỘNG CỦA NGƯỜI DÙNG & PHÁT SÓNG BROADCAST
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
      if (!isRemoteActionRef.current && isWatchPartyActive) {
        sendBroadcast({
          type: "play",
          time: video.currentTime,
          episodeSlug: currentEpisodeSlug,
          movieSlug: movie.slug,
        });
      }
    } else {
      video.pause();
      setIsPlaying(false);
      saveProgressToSupabase();
      if (!isRemoteActionRef.current && isWatchPartyActive) {
        sendBroadcast({
          type: "pause",
          time: video.currentTime,
          episodeSlug: currentEpisodeSlug,
          movieSlug: movie.slug,
        });
      }
    }
  };

  const handleSeek = (newTime: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = newTime;
    setCurrentTime(newTime);

    if (!isRemoteActionRef.current && isWatchPartyActive) {
      sendBroadcast({
        type: "seek",
        time: newTime,
        episodeSlug: currentEpisodeSlug,
        movieSlug: movie.slug,
      });
    }
  };

  const handleSkip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    const target = Math.max(0, Math.min(video.duration || 0, video.currentTime + seconds));
    handleSeek(target);
  };

  const handleChangeEpisode = (epSlug: string) => {
    saveProgressToSupabase();
    setCurrentEpisodeSlug(epSlug);
    setShowEpisodeDrawer(false);

    if (!isRemoteActionRef.current && isWatchPartyActive) {
      sendBroadcast({
        type: "change_episode",
        time: 0,
        episodeSlug: epSlug,
        movieSlug: movie.slug,
      });
    }
  };

  // Đổi sang Server OPhim dự phòng
  const handleSwitchToOPhim = async () => {
    setIsLoadingOphim(true);
    try {
      const ophimServers = await getOPhimMovieDetail(movie.slug);
      if (ophimServers && ophimServers.length > 0) {
        setServers((prev) => [...prev, ...ophimServers]);
        setActiveServerIdx(servers.length); // Chuyển sang server vừa thêm
        setOphimLoaded(true);
      } else {
        alert("Server OPhim hiện chưa có luồng phát dự phòng cho phim này.");
      }
    } catch {
      alert("Không thể kết nối đến server OPhim dự phòng.");
    } finally {
      setIsLoadingOphim(false);
    }
  };

  // Quản lý ẩn/hiện điều khiển khi rê chuột
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        setShowSpeedMenu(false);
      }, 3500);
    }
  };

  // Đồng bộ sự kiện thoát toàn màn hình (khi ấn nút Back điện thoại hoặc phím ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isFull);
      if (!isFull) {
        try {
          if (screen.orientation && (screen.orientation as any).unlock) {
            (screen.orientation as any).unlock();
          }
        } catch {}
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    const video = videoRef.current;
    const handleWebKitBegin = () => setIsFullscreen(true);
    const handleWebKitEnd = () => setIsFullscreen(false);

    if (video) {
      video.addEventListener("webkitbeginfullscreen", handleWebKitBegin);
      video.addEventListener("webkitendfullscreen", handleWebKitEnd);
    }

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
      if (video) {
        video.removeEventListener("webkitbeginfullscreen", handleWebKitBegin);
        video.removeEventListener("webkitendfullscreen", handleWebKitEnd);
      }
    };
  }, []);

  // Bật/tắt chế độ tỉ lệ khung hình (Vừa vặn / Tràn viền màn hình điện thoại / Kéo giãn)
  const toggleFitMode = () => {
    setFitMode((prev) => {
      let next: "contain" | "cover" | "fill" = "contain";
      let label = "Chuẩn 16:9 (Vừa khung hình)";
      if (prev === "contain") {
        next = "cover";
        label = "Tràn viền màn hình (Zoom đầy điện thoại)";
      } else if (prev === "cover") {
        next = "fill";
        label = "Kéo giãn khít 100% (Stretch)";
      } else {
        next = "contain";
        label = "Chuẩn 16:9 (Vừa khung hình)";
      }

      setFitModeToast(label);
      if (fitToastTimeoutRef.current) clearTimeout(fitToastTimeoutRef.current);
      fitToastTimeoutRef.current = setTimeout(() => {
        setFitModeToast(null);
      }, 2500);

      return next;
    });
  };

  // Bật/tắt toàn màn hình (Hỗ trợ Desktop, Android tự xoay ngang, và Safari iPhone iOS)
  const toggleFullscreen = async () => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container && !video) return;

    try {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      if (!isCurrentlyFullscreen) {
        if (container?.requestFullscreen) {
          await container.requestFullscreen();
          setIsFullscreen(true);
        } else if ((container as any)?.webkitRequestFullscreen) {
          (container as any).webkitRequestFullscreen();
          setIsFullscreen(true);
        } else if ((container as any)?.msRequestFullscreen) {
          (container as any).msRequestFullscreen();
          setIsFullscreen(true);
        } else if (video && (video as any).webkitEnterFullscreen) {
          // Trực tiếp cho iPhone iOS Safari
          (video as any).webkitEnterFullscreen();
          setIsFullscreen(true);
          return;
        }

        // Tự động xoay ngang màn hình trên thiết bị di động nếu được hỗ trợ
        try {
          if (screen.orientation && (screen.orientation as any).lock) {
            await (screen.orientation as any).lock("landscape").catch(() => {});
          }
        } catch {}
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          (document as any).msExitFullscreen();
        }
        setIsFullscreen(false);

        try {
          if (screen.orientation && (screen.orientation as any).unlock) {
            (screen.orientation as any).unlock();
          }
        } catch {}
      }
    } catch {
      // Fallback khi container fullscreen bị chặn trên Safari iOS
      if (video && (video as any).webkitEnterFullscreen) {
        try {
          (video as any).webkitEnterFullscreen();
          setIsFullscreen(true);
        } catch (e) {
          console.error("Lỗi bật toàn màn hình:", e);
        }
      }
    }
  };

  // Format thời gian hiển thị mm:ss hoặc hh:mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "00:00";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
    }
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full h-screen min-h-[100dvh] bg-black text-white overflow-hidden select-none flex items-center justify-center font-sans"
    >
      {/* THẺ VIDEO THUẦN HLS (KHÔNG CHỨA IFRAME / KHÔNG QUẢNG CÁO) */}
      <video
        ref={videoRef}
        playsInline
        className={`w-full h-full cursor-pointer transition-all duration-200 ${
          fitMode === "cover"
            ? "object-cover"
            : fitMode === "fill"
            ? "object-fill"
            : "object-contain"
        }`}
        onClick={togglePlay}
        onDoubleClick={toggleFitMode}
        onTimeUpdate={() => {
          if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
            if (videoRef.current.buffered.length > 0) {
              setBufferedEnd(
                videoRef.current.buffered.end(videoRef.current.buffered.length - 1)
              );
            }
          }
        }}
        onDurationChange={() => {
          if (videoRef.current) setDuration(videoRef.current.duration);
        }}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => {
          setIsBuffering(false);
          setIsPlaying(true);
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          if (nextEpisode) {
            handleChangeEpisode(nextEpisode.slug);
          }
        }}
      />

      {/* VÒNG XOAY BUFFERING */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <Loader2 className="w-14 h-14 text-netflix-red animate-spin" />
        </div>
      )}

      {/* THÔNG BÁO TỈ LỆ KHUNG HÌNH (TOAST) */}
      {fitModeToast && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 px-5 py-2.5 rounded-full bg-black/85 backdrop-blur-md border border-white/20 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 pointer-events-none animate-fade-in shadow-2xl">
          <Scaling className="w-4 h-4 text-couple-pink" />
          <span>{fitModeToast}</span>
        </div>
      )}

      {/* THÔNG BÁO LỖI NẾU CÓ */}
      {errorMessage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-30 p-6 text-center">
          <p className="text-red-400 font-semibold mb-4 text-base max-w-md">
            {errorMessage}
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleSwitchToOPhim}
              className="px-4 py-2 rounded-xl bg-netflix-red hover:bg-red-700 font-semibold text-sm transition"
            >
              Thử Server OPhim
            </button>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 font-semibold text-sm transition"
            >
              Quay lại
            </button>
          </div>
        </div>
      )}

      {/* LỚP PHỦ ĐIỀU KHIỂN CHUẨN NETFLIX (TỰ ẨN KHI KHÔNG RÊ CHUỘT) */}
      <div
        className={`absolute inset-0 z-20 flex flex-col justify-between p-4 sm:p-6 transition-opacity duration-300 pointer-events-none ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* THANH ĐIỀU KHIỂN TRÊN (TOP BAR) */}
        <div className="flex items-center justify-between gap-4 pointer-events-auto bg-gradient-to-b from-black/80 via-black/40 to-transparent -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 p-4 sm:p-6">
          {/* Nút quay lại & Tiêu đề */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                saveProgressToSupabase();
                router.back();
              }}
              className="p-2 rounded-full hover:bg-white/20 transition active:scale-95"
              title="Quay lại"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-sm sm:text-base md:text-lg font-bold text-white drop-shadow truncate max-w-[200px] sm:max-w-md">
                {movie.name}
              </h1>
              <p className="text-xs text-couple-pink font-medium truncate">
                {currentEpisode?.name || "Tập phim"} &bull; {movie.quality || "FHD"}
              </p>
            </div>
          </div>

          {/* CÁC NÚT TÍNH NĂNG ĐẶC BIỆT */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* NÚT BẬT/TẮT XEM CHUNG REALTIME (WATCH PARTY) */}
            <button
              onClick={toggleWatchParty}
              title="Chế độ xem chung thời gian thực với người ấy"
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition shadow-lg ${
                isWatchPartyActive
                  ? "bg-couple-pink text-white border border-couple-pink shadow-couple-pink/30 animate-pulse-fast"
                  : "bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 border border-neutral-700"
              }`}
            >
              <HeartHandshake className="w-4 h-4" />
              <span className="hidden sm:inline">
                {isWatchPartyActive ? "👩‍❤️‍👨 Xem chung Realtime: BẬT" : "Xem chung: TẮT"}
              </span>
            </button>

            {/* NÚT ĐỔI SERVER DỰ PHÒNG (OPHIM) */}
            <button
              onClick={handleSwitchToOPhim}
              disabled={isLoadingOphim}
              title="Đổi nguồn phát sang server dự phòng nếu luồng hiện tại bị nghẽn"
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 flex items-center gap-1.5 transition"
            >
              <Server className="w-3.5 h-3.5 text-netflix-red" />
              <span className="hidden md:inline">
                {isLoadingOphim ? "Đang kết nối..." : ophimLoaded ? "Server: OPhim" : "Đổi Server (OPhim)"}
              </span>
            </button>
          </div>
        </div>

        {/* NÚT PLAY LỚN Ở GIỮA MÀN HÌNH KHI PAUSE */}
        {!isPlaying && !isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <button
              onClick={togglePlay}
              className="pointer-events-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/60 hover:bg-netflix-red text-white flex items-center justify-center backdrop-blur-sm border-2 border-white/40 hover:border-netflix-red transition-all transform hover:scale-110 shadow-2xl"
            >
              <Play className="w-8 h-8 fill-white ml-1" />
            </button>
          </div>
        )}

        {/* THANH ĐIỀU KHIỂN DƯỚI (BOTTOM BAR) */}
        <div className="pointer-events-auto bg-gradient-to-t from-black/90 via-black/60 to-transparent -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 p-4 sm:p-6 space-y-3">
          {/* THANH TIẾN TRÌNH (SCRUBBER) */}
          <div className="relative group/scrubber cursor-pointer flex items-center h-4">
            {/* Thanh nền xám */}
            <div className="w-full bg-neutral-700/60 h-1 group-hover/scrubber:h-2 rounded-full overflow-hidden relative transition-all">
              {/* Vùng đã buffer */}
              <div
                className="absolute top-0 bottom-0 left-0 bg-neutral-500/50"
                style={{
                  width: `${duration ? (bufferedEnd / duration) * 100 : 0}%`,
                }}
              />
              {/* Vùng đã phát (Đỏ Netflix) */}
              <div
                className="absolute top-0 bottom-0 left-0 bg-netflix-red"
                style={{
                  width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                }}
              />
            </div>

            {/* Input range vô hình phủ lên trên để kéo tua mượt mà */}
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.5}
              value={currentTime}
              onChange={(e) => handleSeek(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          {/* HÀNG CÁC NÚT ĐIỀU KHIỂN */}
          <div className="flex items-center justify-between text-neutral-200">
            {/* BÊN TRÁI: Play, Tua, Âm lượng, Thời gian */}
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={togglePlay}
                className="hover:text-white transition active:scale-90"
                title={isPlaying ? "Tạm dừng (Space)" : "Phát (Space)"}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current" />
                )}
              </button>

              <button
                onClick={() => handleSkip(-10)}
                className="hover:text-white transition active:scale-90"
                title="Tua lại 10s"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                onClick={() => handleSkip(10)}
                className="hover:text-white transition active:scale-90"
                title="Tua tới 10s"
              >
                <RotateCw className="w-5 h-5" />
              </button>

              {/* Âm lượng & Mute */}
              <div className="flex items-center gap-2 group/volume">
                <button
                  onClick={() => {
                    const video = videoRef.current;
                    if (!video) return;
                    video.muted = !video.muted;
                    setIsMuted(video.muted);
                  }}
                  className="hover:text-white transition"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-5 h-5 text-neutral-400" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setVolume(val);
                    if (videoRef.current) {
                      videoRef.current.volume = val;
                      videoRef.current.muted = val === 0;
                      setIsMuted(val === 0);
                    }
                  }}
                  className="w-16 sm:w-20 h-1 bg-neutral-600 accent-netflix-red cursor-pointer hidden sm:inline-block"
                />
              </div>

              {/* Thời gian hiển thị */}
              <div className="text-xs text-neutral-300 font-mono">
                <span>{formatTime(currentTime)}</span>
                <span className="text-neutral-500 mx-1">/</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* BÊN PHẢI: Tốc độ, Tập tiếp theo, Danh sách tập, Toàn màn hình */}
            <div className="flex items-center gap-3 sm:gap-4 relative">
              {/* NÚT TẬP TIẾP THEO (NẾU CÓ) */}
              {nextEpisode && (
                <button
                  onClick={() => handleChangeEpisode(nextEpisode.slug)}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition active:scale-95"
                  title={`Phát tiếp: ${nextEpisode.name}`}
                >
                  <SkipForward className="w-4 h-4" />
                  <span>Tập tiếp theo</span>
                </button>
              )}

              {/* CHỌN TỐC ĐỘ PHÁT (1x, 1.25x, 1.5x...) */}
              <div className="relative">
                <button
                  onClick={() => setShowSpeedMenu((prev) => !prev)}
                  className="px-2 py-1 rounded text-xs font-semibold hover:bg-white/20 transition"
                  title="Tốc độ phát"
                >
                  {playbackRate}x
                </button>

                {showSpeedMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-[#181818] border border-neutral-700 rounded-xl shadow-2xl py-1 text-xs w-24 z-50">
                    {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => {
                          setPlaybackRate(rate);
                          if (videoRef.current) videoRef.current.playbackRate = rate;
                          setShowSpeedMenu(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left hover:bg-neutral-800 transition ${
                          playbackRate === rate
                            ? "text-netflix-red font-bold"
                            : "text-neutral-300"
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* NGĂN CHỌN TẬP (EPISODE DRAWER) */}
              <button
                onClick={() => setShowEpisodeDrawer((prev) => !prev)}
                className="hover:text-white transition p-1"
                title="Danh sách tập"
              >
                <Layers className="w-5 h-5" />
              </button>

              {/* ĐỔI TỈ LỆ KHUNG HÌNH / TRÀN VIỀN (ZOOM TO FILL) */}
              <button
                onClick={toggleFitMode}
                className="hover:text-white transition p-1 text-neutral-300 hover:text-couple-pink flex items-center gap-1"
                title={`Đổi tỉ lệ màn hình: ${
                  fitMode === "cover"
                    ? "Tràn viền màn hình (Zoom)"
                    : fitMode === "fill"
                    ? "Kéo giãn khít 100% (Stretch)"
                    : "Chuẩn 16:9 (Vừa vặn)"
                }`}
              >
                <Scaling className="w-5 h-5" />
                <span className="text-[10px] hidden sm:inline uppercase font-bold text-couple-pink">
                  {fitMode === "cover" ? "Zoom" : fitMode === "fill" ? "Fill" : "Fit"}
                </span>
              </button>

              {/* TOÀN MÀN HÌNH */}
              <button
                onClick={toggleFullscreen}
                className="hover:text-white transition p-1"
                title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
              >
                {isFullscreen ? (
                  <Minimize className="w-5 h-5" />
                ) : (
                  <Maximize className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DRAWER DANH SÁCH TẬP PHIM KHI ĐANG XEM */}
      {showEpisodeDrawer && (
        <div className="absolute right-0 top-0 bottom-0 w-72 sm:w-80 bg-[#181818]/95 backdrop-blur-lg border-l border-neutral-700 z-40 p-4 overflow-y-auto animate-fade-in flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-netflix-red" />
              <span>Danh sách tập phim</span>
            </h3>
            <button
              onClick={() => setShowEpisodeDrawer(false)}
              className="text-xs text-neutral-400 hover:text-white"
            >
              Đóng
            </button>
          </div>

          <div className="space-y-1.5 flex-1 overflow-y-auto">
            {episodeList.map((ep) => {
              const isActive = ep.slug === currentEpisodeSlug;
              return (
                <button
                  key={ep.slug}
                  onClick={() => handleChangeEpisode(ep.slug)}
                  className={`w-full px-3 py-2.5 rounded-xl text-left text-xs font-medium transition flex items-center justify-between ${
                    isActive
                      ? "bg-netflix-red text-white font-bold shadow-lg"
                      : "bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300"
                  }`}
                >
                  <span className="truncate">{ep.name}</span>
                  {isActive && <Play className="w-3 h-3 fill-white ml-2 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
