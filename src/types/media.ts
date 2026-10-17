export type MediaType = 'movie' | 'tv';

export type TrackingStatus =
  | 'want_to_watch'
  | 'watching'
  | 'watched'
  | 'dropped'
  | 'not_interested';

export type WatchlistPriorityTag = 'stream_ready' | 'theater' | 'backlog';

export interface StreamingProvider {
  id: number;
  name: string;
  logo_path: string;
  deep_link_url?: string;
  display_priority?: number;
}

export interface MediaItem {
  id: number; // tmdb_id
  tmdb_id: number;
  title: string;
  media_type: MediaType;
  poster_path: string;
  backdrop_path?: string | null;
  release_year: number;
  runtime?: number | null; // minutes
  vote_average: number;
  genres: string[];
  overview?: string | null;
  streaming_provider?: StreamingProvider | null;
  streaming_sources?: string[];
  primary_source?: string | null;
  stars?: string[];
  original_language?: string;
  origin_country?: string[];
  genre_ids?: number[];
  is_international?: boolean;
}

export interface UserTitle {
  id: string;
  user_id: string;
  tmdb_id: number;
  media_type: MediaType;
  status: TrackingStatus;
  
  // Diary & Review Details
  rating?: number | null; // 0.5 to 5.0
  notes?: string | null;
  is_rewatch: boolean;
  watched_on?: string | null; // YYYY-MM-DD
  streaming_provider_id?: number | null;
  platform_name?: string | null; // e.g. "Cinema / Theater", "Apple TV+", "Max", "70mm"
  
  // System timestamps
  created_at: string;
  updated_at: string;

  // Joined media details
  media?: MediaItem;
}

export interface QuickLogInput {
  tmdb_id: number;
  media_type: MediaType;
  status: TrackingStatus;
  rating?: number | null;
  notes?: string | null;
  is_rewatch?: boolean;
  watched_on?: string | null;
  platform_name?: string | null;
  streaming_provider_id?: number | null;
  media?: MediaItem;
}
