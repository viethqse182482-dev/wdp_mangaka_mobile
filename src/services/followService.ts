import AsyncStorage from '@react-native-async-storage/async-storage';
import { Story } from '../types/story';

export interface FollowedStory extends Story {
  followedAt: string;
}

const STORAGE_KEY = '@mangaka/followed-stories';

async function readStore(): Promise<FollowedStory[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FollowedStory[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeStore(stories: FollowedStory[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
}

export async function getFollowedStories(): Promise<FollowedStory[]> {
  const stories = await readStore();
  return stories.sort(
    (a, b) => new Date(b.followedAt).getTime() - new Date(a.followedAt).getTime(),
  );
}

export async function isStoryFollowed(storyId: string): Promise<boolean> {
  const stories = await readStore();
  return stories.some((story) => story.id === storyId);
}

export async function followStory(story: Story): Promise<void> {
  const stories = await readStore();
  if (stories.some((item) => item.id === story.id)) return;

  stories.unshift({
    ...story,
    followedAt: new Date().toISOString(),
  });

  await writeStore(stories);
}

export async function unfollowStory(storyId: string): Promise<void> {
  const stories = await readStore();
  await writeStore(stories.filter((story) => story.id !== storyId));
}

export async function toggleFollowStory(story: Story): Promise<boolean> {
  const followed = await isStoryFollowed(story.id);

  if (followed) {
    await unfollowStory(story.id);
    return false;
  }

  await followStory(story);
  return true;
}
