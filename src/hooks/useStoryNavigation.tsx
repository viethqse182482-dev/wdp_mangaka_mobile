import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { LoginRequiredModal } from '../components/auth/LoginRequiredModal';
import { getStoryById } from '../data/mockStories';
import { getAuthToken } from '../services/authService';
import { recordReadingHistory } from '../services/readingHistoryService';

export function useStoryNavigation() {
  const router = useRouter();
  const [pendingStoryId, setPendingStoryId] = useState<string | null>(null);

  const openStory = useCallback(
    async (storyId: string) => {
      const token = await getAuthToken();

      if (!token) {
        setPendingStoryId(storyId);
        return;
      }

      const story = getStoryById(storyId);
      if (story) {
        void recordReadingHistory(story);
      }

      router.push(`/story/${storyId}`);
    },
    [router],
  );

  const closeLoginPrompt = useCallback(() => {
    setPendingStoryId(null);
  }, []);

  const confirmLogin = useCallback(() => {
    if (!pendingStoryId) return;

    const redirectPath = `/story/${pendingStoryId}`;
    setPendingStoryId(null);
    router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`);
  }, [pendingStoryId, router]);

  const loginPromptModal = (
    <LoginRequiredModal
      visible={pendingStoryId !== null}
      onClose={closeLoginPrompt}
      onLogin={confirmLogin}
    />
  );

  return { openStory, loginPromptModal };
}
