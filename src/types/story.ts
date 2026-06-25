export interface Story {
  id: string;
  title: string;
  coverUrl: string;
  latestChapter: number;
  updatedAt: string;
  views: number;
  genres: string[];
}

export interface FeaturedStory extends Story {
  synopsis: string;
  rating: number;
  followers: number;
}

export type BottomTabKey = 'home' | 'genres' | 'library' | 'profile';
