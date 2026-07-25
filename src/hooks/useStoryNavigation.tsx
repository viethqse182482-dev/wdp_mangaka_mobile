import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { LoginRequiredModal } from '../components/auth/LoginRequiredModal';
import { getAuthToken } from '../services/authService';

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

      // KHÔNG ghi lịch sử ở đây. Lịch sử đọc chỉ được ghi khi user thật sự
      // mở ReaderScreen (xử lý trong ReaderScreen.useEffect). Ghi tại đây với
      // data rỗng (title='', coverUrl='', latestChapter=0) sẽ tạo entry
      // history xấu + có thể upsert lastReadChapter=0 lên server, làm hỏng
      // hiển thị "Tiếp tục đọc" trên StoryDetailScreen.
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
