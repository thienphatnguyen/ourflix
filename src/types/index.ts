export interface Profile {
  id: string;
  name: string;
  avatarColor: string;
  avatarUrl?: string;
  pin?: string;
}

export interface WatchHistoryItem {
  id?: string;
  movie_slug: string;
  movie_name: string;
  poster_url: string;
  episode_slug: string;
  episode_name: string;
  current_time_sec: number;
  duration_sec: number;
  updated_by: string;
  updated_at?: string;
}

export interface CoupleMovie {
  id?: string;
  movie_slug: string;
  movie_name: string;
  poster_url: string;
  category: 'favorite' | 'couple_pick';
  note?: string;
  added_by: string;
  created_at?: string;
}

export interface CoupleStatus {
  id: number;
  anniversary_date: string;
  banner_message: string;
  featured_slug: string;
  updated_at?: string;
}

export interface CoupleMessage {
  id?: string;
  sender_id: string;
  sender_name: string;
  message: string;
  created_at: string;
}

export interface MovieCategory {
  id: string;
  name: string;
  slug: string;
}

export interface MovieCountry {
  id: string;
  name: string;
  slug: string;
}

export interface MovieItem {
  _id: string;
  name: string;
  slug: string;
  origin_name: string;
  thumb_url: string;
  poster_url: string;
  year: number;
  time?: string;
  episode_current?: string;
  quality?: string;
  lang?: string;
  category?: MovieCategory[];
  country?: MovieCountry[];
  type?: string;
  content?: string;
}

export interface EpisodeData {
  name: string;
  slug: string;
  filename?: string;
  link_embed?: string;
  link_m3u8: string;
}

export interface EpisodeServer {
  server_name: string;
  server_data: EpisodeData[];
}

export interface MovieDetail extends MovieItem {
  content: string;
  actor?: string[];
  director?: string[];
  episode_total?: string;
  trailer_url?: string;
  view?: number;
  episodes: EpisodeServer[];
}

export interface WatchPartyBroadcast {
  type: 'play' | 'pause' | 'seek' | 'change_episode' | 'ping';
  sender: string;
  time: number;
  episodeSlug?: string;
  movieSlug?: string;
  timestamp: number;
}
