export interface Chapter {
  id: string;
  number: number;
  releasedAt: string;
  views: number;
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
}

export interface StoryDetail {
  id: string;
  title: string;
  altName: string;
  coverUrl: string;
  latestChapter: number;
  updatedAt: string;
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
