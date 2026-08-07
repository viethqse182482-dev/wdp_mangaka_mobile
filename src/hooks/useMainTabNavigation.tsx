import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { LoginRequiredModal } from '../components/auth/LoginRequiredModal';
import { clearAuthSession, getAuthToken } from '../services/authService';
import { emitAuthEvent } from '../services/authEvents';
import { BottomTabKey } from '../types/story';

const TAB_REDIRECT: Partial<Record<BottomTabKey, string>> = {
  library: '/library',
};

export function useMainTabNavigation(activeTab: BottomTabKey) {
  const router = useRouter();
  const [accountDrawerVisible, setAccountDrawerVisible] = useState(false);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);

  const showLoginPrompt = useCallback((redirectPath?: string) => {
    setPendingRedirect(redirectPath ?? null);
    setLoginModalVisible(true);
  }, []);

  const closeLoginPrompt = useCallback(() => {
    setLoginModalVisible(false);
    setPendingRedirect(null);
  }, []);

  const confirmLogin = useCallback(() => {
    const redirect = pendingRedirect;
    setLoginModalVisible(false);
    setPendingRedirect(null);

    if (redirect) {
      router.push(`/login?redirect=${encodeURIComponent(redirect)}`);
      return;
    }

    router.push('/login');
  }, [pendingRedirect, router]);

  const handleTabPress = useCallback(
    async (tab: BottomTabKey) => {
      if (tab === 'home') {
        router.replace('/');
        return;
      }

      if (tab === 'ranking') {
        if (activeTab !== 'ranking') {
          router.push('/ranking');
        }
        return;
      }

      if (tab === 'genres') {
        if (activeTab !== 'genres') {
          router.push('/genres');
        }
        return;
      }

      const token = await getAuthToken();
      if (!token) {
        showLoginPrompt(TAB_REDIRECT[tab]);
        return;
      }

      if (tab === 'profile') {
        router.push('/profile' as never);
        return;
      }

      if (tab === 'library') {
        if (activeTab !== 'library') {
          router.push('/library');
        }
        return;
      }

      console.log('[Navigation] Chuyển tab:', tab);
    },
    [activeTab, router, showLoginPrompt],
  );

  const handleAccountMenuPress = useCallback((key: string) => {
    if (key === 'wallet') {
      setAccountDrawerVisible(false);
      router.push('/wallet' as never);
      return;
    }

    if (key === 'login') {
      setAccountDrawerVisible(false);
      router.push('/login');
      return;
    }

    if (key === 'history') {
      setAccountDrawerVisible(false);
      router.push('/history');
      return;
    }

    if (key === 'following') {
      setAccountDrawerVisible(false);
      router.push('/library');
      return;
    }

    if (key === 'notifications') {
      setAccountDrawerVisible(false);
      router.push('/notifications');
      return;
    }

    if (key === 'contact') {
      setAccountDrawerVisible(false);
      router.push('/contact');
      return;
    }

    if (key === 'genres') {
      setAccountDrawerVisible(false);
      router.push('/genres');
      return;
    }

    console.log('[Navigation] Menu tài khoản:', key);
    if (key === 'logout') {
      void clearAuthSession();
      // Phát tín hiệu để NotificationContext reset state + dismissAll tray,
      // và SocketContext disconnect. Phát TRƯỚC khi navigate để cleanup
      // chạy đồng thời với chuyển trang, không chặn UI.
      emitAuthEvent({ type: 'logout' });
      setAccountDrawerVisible(false);
      router.replace('/login');
    }
  }, [router, setAccountDrawerVisible]);

  const loginPromptModal = (
    <LoginRequiredModal
      visible={loginModalVisible}
      onClose={closeLoginPrompt}
      onLogin={confirmLogin}
    />
  );

  return {
    handleTabPress,
    accountDrawerVisible,
    setAccountDrawerVisible,
    handleAccountMenuPress,
    loginPromptModal,
  };
}
