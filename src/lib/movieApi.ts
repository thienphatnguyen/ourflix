import { MovieDetail, MovieItem, EpisodeServer } from "@/types";

const KKPHIM_BASE_URL = "https://phimapi.com";
const OPHIM_BASE_URLS = [
  "https://ophim1.com",
  "https://ophim17.cc",
  "https://ophim.live",
];

/**
 * Tự động chuẩn hóa đường dẫn ảnh từ CDN KKPhim/Phimimg
 */
export function normalizeImageUrl(url?: string | null): string {
  if (!url) return "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const cleanPath = url.replace(/^\/+/, "");
  return `https://phimimg.com/${cleanPath}`;
}

/**
 * Lấy danh sách phim mới cập nhật (v3)
 */
export async function getNewUpdates(page: number = 1): Promise<MovieItem[]> {
  try {
    const res = await fetch(`${KKPHIM_BASE_URL}/danh-sach/phim-moi-cap-nhat-v3?page=${page}`, {
      next: { revalidate: 300 }, // Cache 5 phút
    });
    if (!res.ok) throw new Error(`Lỗi kết nối KKPhim: ${res.status}`);
    const data = await res.json();
    return (data.items || []).map((item: any) => ({
      _id: item._id || item.slug,
      name: item.name,
      slug: item.slug,
      origin_name: item.origin_name || item.name,
      thumb_url: normalizeImageUrl(item.thumb_url || item.poster_url),
      poster_url: normalizeImageUrl(item.poster_url || item.thumb_url),
      year: item.year || new Date().getFullYear(),
      time: item.time || "",
      episode_current: item.episode_current || "",
      quality: item.quality || "FHD",
      lang: item.lang || "Vietsub",
      category: item.category || [],
      country: item.country || [],
    }));
  } catch (err) {
    console.error("Lỗi getNewUpdates:", err);
    return [];
  }
}

/**
 * Lấy danh sách phim bộ
 */
export async function getSeries(page: number = 1, limit: number = 18): Promise<MovieItem[]> {
  try {
    const res = await fetch(`${KKPHIM_BASE_URL}/v1/api/danh-sach/phim-bo?page=${page}&limit=${limit}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`Lỗi kết nối KKPhim: ${res.status}`);
    const data = await res.json();
    const items = data.data?.items || [];
    return items.map((item: any) => ({
      _id: item._id || item.slug,
      name: item.name,
      slug: item.slug,
      origin_name: item.origin_name || item.name,
      thumb_url: normalizeImageUrl(item.thumb_url || item.poster_url),
      poster_url: normalizeImageUrl(item.poster_url || item.thumb_url),
      year: item.year || new Date().getFullYear(),
      time: item.time || "",
      episode_current: item.episode_current || "",
      quality: item.quality || "FHD",
      lang: item.lang || "Vietsub",
      category: item.category || [],
      country: item.country || [],
    }));
  } catch (err) {
    console.error("Lỗi getSeries:", err);
    return [];
  }
}

/**
 * Lấy danh sách phim lẻ
 */
export async function getSingleMovies(page: number = 1, limit: number = 18): Promise<MovieItem[]> {
  try {
    const res = await fetch(`${KKPHIM_BASE_URL}/v1/api/danh-sach/phim-le?page=${page}&limit=${limit}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`Lỗi kết nối KKPhim: ${res.status}`);
    const data = await res.json();
    const items = data.data?.items || [];
    return items.map((item: any) => ({
      _id: item._id || item.slug,
      name: item.name,
      slug: item.slug,
      origin_name: item.origin_name || item.name,
      thumb_url: normalizeImageUrl(item.thumb_url || item.poster_url),
      poster_url: normalizeImageUrl(item.poster_url || item.thumb_url),
      year: item.year || new Date().getFullYear(),
      time: item.time || "",
      episode_current: item.episode_current || "",
      quality: item.quality || "FHD",
      lang: item.lang || "Vietsub",
      category: item.category || [],
      country: item.country || [],
    }));
  } catch (err) {
    console.error("Lỗi getSingleMovies:", err);
    return [];
  }
}

/**
 * Lấy danh sách phim hoạt hình / Anime
 */
export async function getAnimations(page: number = 1, limit: number = 18): Promise<MovieItem[]> {
  try {
    const res = await fetch(`${KKPHIM_BASE_URL}/v1/api/danh-sach/hoat-hinh?page=${page}&limit=${limit}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`Lỗi kết nối KKPhim: ${res.status}`);
    const data = await res.json();
    const items = data.data?.items || [];
    return items.map((item: any) => ({
      _id: item._id || item.slug,
      name: item.name,
      slug: item.slug,
      origin_name: item.origin_name || item.name,
      thumb_url: normalizeImageUrl(item.thumb_url || item.poster_url),
      poster_url: normalizeImageUrl(item.poster_url || item.thumb_url),
      year: item.year || new Date().getFullYear(),
      time: item.time || "",
      episode_current: item.episode_current || "",
      quality: item.quality || "FHD",
      lang: item.lang || "Vietsub",
      category: item.category || [],
      country: item.country || [],
    }));
  } catch (err) {
    console.error("Lỗi getAnimations:", err);
    return [];
  }
}

/**
 * Lấy danh sách phim tình cảm lãng mạn dành cho cặp đôi
 */
export async function getRomanceMovies(page: number = 1, limit: number = 18): Promise<MovieItem[]> {
  try {
    const res = await fetch(`${KKPHIM_BASE_URL}/v1/api/the-loai/tinh-cam?page=${page}&limit=${limit}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`Lỗi kết nối KKPhim: ${res.status}`);
    const data = await res.json();
    const items = data.data?.items || [];
    return items.map((item: any) => ({
      _id: item._id || item.slug,
      name: item.name,
      slug: item.slug,
      origin_name: item.origin_name || item.name,
      thumb_url: normalizeImageUrl(item.thumb_url || item.poster_url),
      poster_url: normalizeImageUrl(item.poster_url || item.thumb_url),
      year: item.year || new Date().getFullYear(),
      time: item.time || "",
      episode_current: item.episode_current || "",
      quality: item.quality || "FHD",
      lang: item.lang || "Vietsub",
      category: item.category || [],
      country: item.country || [],
    }));
  } catch (err) {
    console.error("Lỗi getRomanceMovies:", err);
    return [];
  }
}

/**
 * Tìm kiếm phim theo từ khóa (hỗ trợ Smart Fuzzy Fallback khi gõ lệch từ hoặc sai chữ)
 */
export async function searchMovies(keyword: string, limit: number = 24): Promise<MovieItem[]> {
  const cleanKeyword = keyword.trim();
  if (!cleanKeyword) return [];

  // Hàm gọi API tìm kiếm
  const fetchSearch = async (term: string): Promise<MovieItem[]> => {
    try {
      const res = await fetch(`${KKPHIM_BASE_URL}/v1/api/tim-kiem?keyword=${encodeURIComponent(term)}&limit=${limit}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        },
      });
      if (!res.ok) return [];
      const data = await res.json();
      const items = data.data?.items || [];
      return items.map((item: any) => ({
        _id: item._id || item.slug,
        name: item.name,
        slug: item.slug,
        origin_name: item.origin_name || item.name,
        thumb_url: normalizeImageUrl(item.thumb_url || item.poster_url),
        poster_url: normalizeImageUrl(item.poster_url || item.thumb_url),
        year: item.year || new Date().getFullYear(),
        time: item.time || "",
        episode_current: item.episode_current || "",
        quality: item.quality || "FHD",
        lang: item.lang || "Vietsub",
        category: item.category || [],
        country: item.country || [],
      }));
    } catch {
      return [];
    }
  };

  // 1. Thử tìm kiếm trực tiếp với từ khóa gốc
  let results = await fetchSearch(cleanKeyword);
  if (results.length > 0) return results;

  // 2. Fallback thông minh: Thay thế các từ hay bị nhầm lẫn
  // Ví dụ: "đi về" <-> "đi đến" (Đi Về Nơi Có Gió -> Đi Đến Nơi Có Gió)
  let altKeyword = cleanKeyword;
  if (/đi về/i.test(altKeyword)) {
    altKeyword = altKeyword.replace(/đi về/gi, "đi đến");
  } else if (/đi đến/i.test(altKeyword)) {
    altKeyword = altKeyword.replace(/đi đến/gi, "đi về");
  }

  if (altKeyword !== cleanKeyword) {
    results = await fetchSearch(altKeyword);
    if (results.length > 0) return results;
  }

  // 3. Fallback loại bỏ các tiền tố / hư từ mở đầu câu (phim, bộ phim, xem phim, đi về, đi đến...)
  const coreKeyword = cleanKeyword
    .replace(/^(phim|bộ phim|xem phim|đi về|đi đến)\s+/gi, "")
    .trim();

  if (coreKeyword && coreKeyword !== cleanKeyword && coreKeyword.length >= 3) {
    results = await fetchSearch(coreKeyword);
    if (results.length > 0) return results;
  }

  // 4. Nếu từ khóa có nhiều từ (>= 3 từ), thử tìm với các từ khóa trọng tâm ở cuối
  const words = cleanKeyword.split(/\s+/);
  if (words.length >= 3) {
    const trailingPhrase = words.slice(-3).join(" ");
    if (trailingPhrase !== cleanKeyword && trailingPhrase !== coreKeyword) {
      results = await fetchSearch(trailingPhrase);
      if (results.length > 0) return results;
    }
  }

  return [];
}

/**
 * Lấy chi tiết phim và danh sách tập phát m3u8 từ KKPhim
 */
export async function getMovieDetail(slug: string): Promise<MovieDetail | null> {
  try {
    const res = await fetch(`${KKPHIM_BASE_URL}/phim/${slug}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.status || !data.movie) return null;

    const movie = data.movie;
    const episodes: EpisodeServer[] = (data.episodes || []).map((srv: any) => ({
      server_name: srv.server_name || "KKPhim Server",
      server_data: (srv.server_data || []).map((ep: any) => ({
        name: ep.name,
        slug: ep.slug,
        filename: ep.filename || ep.name,
        link_embed: ep.link_embed || "",
        link_m3u8: ep.link_m3u8 || "",
      })),
    }));

    return {
      _id: movie._id || movie.slug,
      name: movie.name,
      slug: movie.slug,
      origin_name: movie.origin_name || movie.name,
      thumb_url: normalizeImageUrl(movie.thumb_url || movie.poster_url),
      poster_url: normalizeImageUrl(movie.poster_url || movie.thumb_url),
      year: movie.year || new Date().getFullYear(),
      time: movie.time || "",
      episode_current: movie.episode_current || "",
      quality: movie.quality || "FHD",
      lang: movie.lang || "Vietsub",
      category: movie.category || [],
      country: movie.country || [],
      content: movie.content || "",
      actor: movie.actor || [],
      director: movie.director || [],
      episode_total: movie.episode_total || "",
      trailer_url: movie.trailer_url || "",
      view: movie.view || 0,
      episodes,
    };
  } catch (err) {
    console.error(`Lỗi getMovieDetail cho ${slug}:`, err);
    return null;
  }
}

/**
 * Lấy dữ liệu dự phòng từ OPhim (Fallback Server)
 */
export async function getOPhimMovieDetail(slug: string): Promise<EpisodeServer[] | null> {
  for (const baseUrl of OPHIM_BASE_URLS) {
    try {
      const res = await fetch(`${baseUrl}/phim/${slug}`, {
        cache: "no-store",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          Accept: "application/json",
        },
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (data.status && data.episodes && data.episodes.length > 0) {
        return data.episodes.map((srv: any) => ({
          server_name: `Dự phòng (${srv.server_name || "OPhim"})`,
          server_data: (srv.server_data || []).map((ep: any) => ({
            name: ep.name,
            slug: ep.slug,
            filename: ep.filename || ep.name,
            link_embed: ep.link_embed || "",
            link_m3u8: ep.link_m3u8 || "",
          })),
        }));
      }
    } catch {
      // Thử domain tiếp theo nếu lỗi
      continue;
    }
  }
  return null;
}
