import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { LoginRequiredModal } from '../components/auth/LoginRequiredModal';
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

      // Record một entry tối thiểu để lịch sử đọc biết user đã mở truyện.
      // StoryDetail thật sẽ được fetch chi tiết khi vào màn StoryDetail.
      void recordReadingHistory({
        id: storyId,
        title: '',
        coverUrl: '',
        latestChapter: 0,
        updatedAt: '',
        views: 0,
        genres: [],
      });

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
