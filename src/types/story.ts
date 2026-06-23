export interface Story {
  id: string;
  title: string;
  coverUrl: string;
  latestChapter: number;
  updatedAt: string;
  views: number;
  genres: string[];
}

export type BottomTabKey = 'home' | 'genres' | 'library' | 'profile';
