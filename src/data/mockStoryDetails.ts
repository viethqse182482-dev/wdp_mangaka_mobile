import { FeaturedStory, Story } from '../types/story';
import { Chapter, StoryComment, StoryDetail } from '../types/storyDetail';
import { mockStories } from './mockStories';

const SYNOPSIS_MAP: Record<string, string> = {
  '1': 'Hành trình của Monkey D. Luffy và băng Mũ Rơm trên con đường trở thành Vua Hải Tặc, khám phá những hòn đảo mới và đối mặt với kẻ thù ngày càng mạnh hơn.',
  '2': 'Yuji Itadori gia nhập thế giới phù thủy để tiêu diệt lời nguyền, chiến đấu cùng các đồng đội chống lại quỷ dữ và bảo vệ nhân loại.',
  '3': 'Denji ký khế ước với chó cưa máy Pochita, trở thành Chainsaw Man và lao vào cuộc sống đầy máu và hỗn loạn của thế giới quỷ dữ.',
  '4': 'Sung Jinwoo – thợ săn yếu nhất – nhận sức mạnh bí ẩn, dần trở thành kẻ thống trị các hầm ngục và bảo vệ nhân loại.',
  '5': 'Gia đình gián điệp Forger phải cùng nhau hoàn thành nhiệm vụ bảo vệ hòa bình thế giới trong khi che giấu danh tính thật.',
  '6': 'Isagi Yoichi bước vào dự án Blue Lock để trở thành tiền đạo vĩ đại nhất Nhật Bản thông qua sự cạnh tranh khốc liệt.',
  '7': 'Tanjiro Kamado lên đường trả thù và cứu em gái Nezuko khỏi lời nguyền quỷ, gia nhập Quân đoàn Diệt Quỷ.',
  '8': 'Izuku Midoriya theo đuổi ước mơ trở thành anh hùng vĩ đại nhất trong thế giới nơi hầu hết mọi người đều có siêu năng lực.',
};

const ALT_NAME_MAP: Record<string, string> = {
  '1': 'Vua Hải Tặc',
  '4': 'Na Honja Level Up',
  '7': 'Kimetsu no Yaiba',
  '8': 'Boku no Hero Academia',
};

function buildChapters(latestChapter: number, storyId: string): Chapter[] {
  const count = Math.min(12, latestChapter);
  return Array.from({ length: count }, (_, index) => {
    const number = latestChapter - index;
    const day = String(Math.max(1, 28 - index)).padStart(2, '0');
    const month = '06';
    const year = '2026';

    return {
      id: `${storyId}-ch-${number}`,
      number,
      releasedAt: index < 2 ? `${index + 1} giờ trước` : `${day}-${month}-${year}`,
      views: Math.max(0, 320 - index * 37 + (Number(storyId) * 11)),
    };
  });
}

const MOCK_COMMENTS: StoryComment[] = [
  {
    id: 'c1',
    username: 'Thrynxia Phantaminum',
    badge: 'Gà Con',
    badgeColor: '#3B82F6',
    chapterNumber: 240,
    content: 'Chương này hay quá, cốt truyện đang lên cao trào!',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'c2',
    username: 'Tào Tam',
    badge: 'Gà Lọ Vương',
    badgeColor: '#EC4899',
    chapterNumber: 239,
    content: 'Đợi chương mới mỗi tuần mà nản thật sự 😅',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'c3',
    username: 'Minh Reader',
    badge: 'Gà Vô Sỉ',
    badgeColor: '#8B5CF6',
    chapterNumber: 238,
    content: '@Tào Tam kiên nhẫn đi bạn, tác giả đang vẽ căng lắm.',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    replyTo: 'Tào Tam',
  },
];

function buildDetail(story: Story): StoryDetail {
  return {
    ...story,
    altName: ALT_NAME_MAP[story.id] ?? story.title,
    author: 'Updating',
    status: 'Đang Thực Hiện',
    synopsis: SYNOPSIS_MAP[story.id] ?? `Câu chuyện hấp dẫn về ${story.title}, thuộc thể loại ${story.genres.join(', ')}.`,
    rating: 3,
    ratingCount: 156 + Number(story.id) * 20,
    followers: 1200 + Number(story.id) * 380,
    chapters: buildChapters(story.latestChapter, story.id),
    comments: MOCK_COMMENTS.map((comment, index) => ({
      ...comment,
      id: `${story.id}-${comment.id}`,
      chapterNumber: story.latestChapter - index,
    })),
  };
}

const detailCache = new Map<string, StoryDetail>();

export function getStoryDetailById(id: string): StoryDetail | undefined {
  if (detailCache.has(id)) {
    return detailCache.get(id);
  }

  const story = mockStories.find((item) => item.id === id);
  if (!story) return undefined;

  const detail = buildDetail(story);
  detailCache.set(id, detail);
  return detail;
}

function toFeaturedStory(detail: StoryDetail): FeaturedStory {
  return {
    id: detail.id,
    title: detail.title,
    coverUrl: detail.coverUrl,
    latestChapter: detail.latestChapter,
    updatedAt: detail.updatedAt,
    views: detail.views,
    genres: detail.genres,
    synopsis: detail.synopsis,
    rating: detail.rating,
    followers: detail.followers,
  };
}

export const newStories: FeaturedStory[] = mockStories.map((story) =>
  toFeaturedStory(buildDetail(story)),
);
