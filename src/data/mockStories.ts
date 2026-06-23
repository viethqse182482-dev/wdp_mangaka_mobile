import { Story } from '../types/story';

export const mockStories: Story[] = [
  {
    id: '1',
    title: 'One Piece',
    coverUrl: 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=400&h=600&fit=crop',
    latestChapter: 1125,
    updatedAt: '2 giờ trước',
    views: 2_450_000,
    genres: ['Phiêu lưu', 'Hành động'],
  },
  {
    id: '2',
    title: 'Jujutsu Kaisen',
    coverUrl: 'https://images.unsplash.com/photo-1578632767114-3512bca0b744?w=400&h=600&fit=crop',
    latestChapter: 268,
    updatedAt: '5 giờ trước',
    views: 1_890_000,
    genres: ['Hành động', 'Siêu nhiên'],
  },
  {
    id: '3',
    title: 'Chainsaw Man',
    coverUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076ed5e?w=400&h=600&fit=crop',
    latestChapter: 175,
    updatedAt: '1 ngày trước',
    views: 1_520_000,
    genres: ['Hành động', 'Kinh dị'],
  },
  {
    id: '4',
    title: 'Solo Leveling',
    coverUrl: 'https://images.unsplash.com/photo-1613376023733-0a73315d9b06?w=400&h=600&fit=crop',
    latestChapter: 200,
    updatedAt: '3 giờ trước',
    views: 3_100_000,
    genres: ['Fantasy', 'Hành động'],
  },
  {
    id: '5',
    title: 'Spy x Family',
    coverUrl: 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=400&h=600&fit=crop&sat=-50',
    latestChapter: 95,
    updatedAt: '6 giờ trước',
    views: 980_000,
    genres: ['Hài hước', 'Gia đình'],
  },
  {
    id: '6',
    title: 'Blue Lock',
    coverUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=600&fit=crop',
    latestChapter: 280,
    updatedAt: '12 giờ trước',
    views: 1_200_000,
    genres: ['Thể thao', 'Shounen'],
  },
  {
    id: '7',
    title: 'Demon Slayer',
    coverUrl: 'https://images.unsplash.com/photo-1560972550-aba3456f2826?w=400&h=600&fit=crop',
    latestChapter: 205,
    updatedAt: '2 ngày trước',
    views: 2_800_000,
    genres: ['Hành động', 'Lịch sử'],
  },
  {
    id: '8',
    title: 'My Hero Academia',
    coverUrl: 'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?w=400&h=600&fit=crop',
    latestChapter: 430,
    updatedAt: '8 giờ trước',
    views: 1_650_000,
    genres: ['Shounen', 'Siêu anh hùng'],
  },
];

export const hotStories = mockStories.slice(0, 5);
export const latestStories = [...mockStories].sort((a, b) => a.id.localeCompare(b.id));
export const topWeekStories = [...mockStories].sort((a, b) => b.views - a.views);

export function getStoryById(id: string): Story | undefined {
  return mockStories.find((story) => story.id === id);
}
