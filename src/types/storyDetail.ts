export interface Chapter {
  id: string;
  number: number;
  releasedAt: string;
  views: number;
  coverUrl?: string;
  accessType?: 'FREE' | 'PAID';
  /** Giá backend trả về theo CoinUnit (100 CoinUnit = 1 Coin). */
  coinPrice?: number;
  isPurchased?: boolean;
}

export interface PurchasedChapterSeries {
  id: string;
  name: string;
  coverImageUrl?: string;
}

export interface PurchasedChapterEntry {
  /** `_id` của bản ghi purchase, dùng để dedupe giữa các trang. */
  id: string;
  /** ID chương đã mua (BE trả `chapter_id._id`). */
  chapterId: string;
  /** Số thứ tự chương, dùng để sort và hiển thị. */
  chapterNumber: number;
  /** Tiêu đề chương (nếu có). */
  chapterTitle?: string;
  /** Series của chapter; có thể undefined khi BE trả object rỗng/series đã bị xoá. */
  series?: PurchasedChapterSeries;
  /** Giá theo CoinUnit (100 CoinUnit = 1 Coin). */
  priceCoinUnit: number;
  /** ISO timestamp lúc mua. */
  purchasedAt: string;
}

export interface PurchasedChapterListResponse {
  success: boolean;
  data: PurchasedChapterEntry[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface StoryComment {
  id: string;
  username: string;
  badge: string;
  badgeColor: string;
  chapterNumber: number;
  content: string;
  createdAt: string;
  replyTo?: string;
  readerId?: string;
}

export interface StoryDetail {
  id: string;
  title: string;
  altName: string;
  coverUrl: string;
  latestChapter: number;
  updatedAt: string;
  /**
   * ISO timestamp của chapter mới nhất publish.
   * Lấy từ `Series.last_chapter_published_at` của BE (chỉ bump khi publish chapter,
   * không bị ảnh hưởng bởi vote/comment/view như `updatedAt`).
   */
  latestChapterPublishedAt?: string | null;
  views: number;
  genres: string[];
  author: string;
  authorId?: string;
  status: string;
  synopsis: string;
  rating: number;
  ratingCount: number;
  followers: number;
  chapters: Chapter[];
  comments: StoryComment[];
}
