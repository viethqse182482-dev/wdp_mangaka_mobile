export interface Story {
  id: string;
  title: string;
  coverUrl: string;
  latestChapter: number;
  updatedAt: string;
  /**
   * ISO timestamp của thời điểm publish chapter mới nhất.
   * Lấy từ `Series.last_chapter_published_at` của BE (chỉ bị bump khi có chapter mới publish,
   * KHÔNG bị ảnh hưởng bởi vote/comment/view). Dùng để hiển thị nhãn "Cập nhật" cho đúng nghĩa.
   * Có thể null với series chưa có chapter publish nào.
   */
  latestChapterPublishedAt?: string | null;
  views: number;
  genres: string[];
  rating?: number;
  ratingCount?: number;
}

export interface FeaturedStory extends Story {
  synopsis: string;
  rating: number;
  followers: number;
}

export type BottomTabKey = 'home' | 'ranking' | 'genres' | 'library' | 'profile';

// ============ Reader Ranking Types ============
export type RankingPeriod = 'daily' | 'weekly' | 'monthly' | 'all';
export type RankingType = 'top_views' | 'top_votes' | 'top_rating';

export interface ReaderRankingItem {
  rank: number;
  series_id: string;
  name: string;
  cover_image_url: string;
  genre: string[];
  views_count?: number;
  votes_count?: number;
  average_score?: number;
}

export interface ReaderRankingMeta {
  period: RankingPeriod;
  period_label: string;
  limit: number;
}

export interface ReaderRankingResponse {
  success: boolean;
  data: {
    top_views: ReaderRankingItem[];
    top_votes: ReaderRankingItem[];
    top_rating: ReaderRankingItem[];
  };
  meta: ReaderRankingMeta;
}

// ============ Auth Types ============
export interface AuthUser {
  _id: string;
  username: string;
  fullName?: string;
  email?: string;
  avatarUrl?: string;
  role: string;
  level: number;
}
