import AsyncStorage from '@react-native-async-storage/async-storage';
import { Story } from '../types/story';

export interface ReadingHistoryEntry extends Story {
  lastReadChapter: number;
  readAt: string;
}

const STORAGE_KEY = '@mangaka/reading-history';
const MAX_HISTORY_ITEMS = 50;

async function readStore(): Promise<ReadingHistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ReadingHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeStore(entries: ReadingHistoryEntry[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export async function getReadingHistory(): Promise<ReadingHistoryEntry[]> {
  const entries = await readStore();
  return entries.sort(
    (a, b) => new Date(b.readAt).getTime() - new Date(a.readAt).getTime(),
  );
}

export async function recordReadingHistory(
  story: Story,
  lastReadChapter?: number,
): Promise<void> {
  const entries = await readStore();
  const chapter = lastReadChapter ?? story.latestChapter;
  const now = new Date().toISOString();

  const filtered = entries.filter((entry) => entry.id !== story.id);
  const nextEntry: ReadingHistoryEntry = {
    ...story,
    lastReadChapter: chapter,
    readAt: now,
  };

  filtered.unshift(nextEntry);
  await writeStore(filtered.slice(0, MAX_HISTORY_ITEMS));
}

export async function removeHistoryEntry(storyId: string): Promise<void> {
  const entries = await readStore();
  await writeStore(entries.filter((entry) => entry.id !== storyId));
}

export async function clearReadingHistory(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
