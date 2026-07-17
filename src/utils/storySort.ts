import { FeaturedStory } from '../types/story';

export function sortByReaders(stories: FeaturedStory[]): FeaturedStory[] {
  return [...stories].sort((a, b) => {
    if (b.views !== a.views) return b.views - a.views;
    return b.rating - a.rating;
  });
}

export function sortByRelevance(
  stories: FeaturedStory[],
  query: string,
): FeaturedStory[] {
  const lower = query.trim().toLowerCase();
  if (!lower) return stories;

  return [...stories].sort((a, b) => {
    const aTitle = a.title.toLowerCase();
    const bTitle = b.title.toLowerCase();

    // Ưu tiên 1: tên bắt đầu bằng từ khóa
    const aStart = aTitle.startsWith(lower);
    const bStart = bTitle.startsWith(lower);
    if (aStart !== bStart) return aStart ? -1 : 1;

    // Ưu tiên 2: khớp chính xác toàn bộ tên
    const aExact = aTitle === lower;
    const bExact = bTitle === lower;
    if (aExact !== bExact) return aExact ? -1 : 1;

    // Ưu tiên 3: tên ngắn hơn (cụ thể hơn)
    if (aTitle.length !== bTitle.length) {
      return aTitle.length - bTitle.length;
    }

    // Ưu tiên 4: theo views (giữ logic cũ)
    if (b.views !== a.views) return b.views - a.views;
    return b.rating - a.rating;
  });
}
