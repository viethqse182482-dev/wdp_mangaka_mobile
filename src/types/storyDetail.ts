export interface Chapter {
  id: string;
  number: number;
  releasedAt: string;
  views: number;
  coverUrl?: string;
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
