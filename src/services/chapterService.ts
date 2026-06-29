import { MANGADEX_API_BASE_URL, MANGADEX_UPLOADS_BASE_URL } from '../config/mangadex';

export interface ChapterPage {
  index: number;
  url: string;
}

export interface ChapterDetail {
  id: string;
  storyId: string;
  chapterNumber: number;
  pages: ChapterPage[];
}

interface MangaDexChapterResponse {
  result: string;
  baseUrl?: string;
  chapter?: {
    hash: string;
    data: string[];
    dataSaver: string[];
  };
}

async function fetchChapterFromMangaDex(chapterId: string): Promise<ChapterPage[]> {
  const url = new URL(`/at-home/server/${chapterId}`, MANGADEX_API_BASE_URL);

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`MangaDex chapter error: ${response.status}`);
  }

  const data = (await response.json()) as MangaDexChapterResponse;

  if (data.result !== 'ok' || !data.chapter) {
    throw new Error('Invalid MangaDex chapter response');
  }

  const baseUrl = data.baseUrl ?? MANGADEX_UPLOADS_BASE_URL;
  const hash = data.chapter.hash;
  const imageFiles = data.chapter.data;

  return imageFiles.map((fileName, index) => ({
    index,
    url: `${baseUrl}/data/${hash}/${fileName}`,
  }));
}

function buildMockPages(storyId: string, chapterNumber: number): ChapterPage[] {
  const count = Math.floor(Math.random() * 10) + 12;
  return Array.from({ length: count }, (_, index) => ({
    index,
    url: `https://picsum.photos/seed/${storyId}-${chapterNumber}-${index}/600/800`,
  }));
}

export async function fetchChapterPages(
  storyId: string,
  chapterNumber: number,
  mangaDexChapterId?: string,
): Promise<ChapterDetail> {
  const isMangaDex = typeof mangaDexChapterId === 'string' && mangaDexChapterId.length > 0;

  let pages: ChapterPage[];
  if (isMangaDex) {
    pages = await fetchChapterFromMangaDex(mangaDexChapterId!);
  } else {
    pages = buildMockPages(storyId, chapterNumber);
  }

  return {
    id: isMangaDex ? mangaDexChapterId! : `${storyId}-ch-${chapterNumber}`,
    storyId,
    chapterNumber,
    pages,
  };
}
