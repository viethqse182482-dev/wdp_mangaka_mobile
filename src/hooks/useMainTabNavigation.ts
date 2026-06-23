import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { BottomTabKey } from '../types/story';

export function useMainTabNavigation(activeTab: BottomTabKey) {
  const router = useRouter();
  const [accountDrawerVisible, setAccountDrawerVisible] = useState(false);

  const handleTabPress = useCallback(
    (tab: BottomTabKey) => {
      if (tab === 'profile') {
        setAccountDrawerVisible(true);
        return;
      }

      if (tab === 'genres') {
        if (activeTab !== 'genres') {
          router.push('/genres');
        }
        return;
      }

      if (tab === 'library') {
        if (activeTab !== 'library') {
          router.push('/library');
        }
        return;
      }

      if (tab === 'home') {
        router.replace('/');
        return;
      }

      console.log('[Navigation] Chuyển tab:', tab);
    },
    [activeTab, router],
  );

  const handleAccountMenuPress = useCallback((key: string) => {
    if (key === 'history') {
      setAccountDrawerVisible(false);
      router.push('/history');
      return;
    }

    console.log('[Navigation] Menu tài khoản:', key);
    if (key === 'logout') {
      setAccountDrawerVisible(false);
    }
  }, [router]);

  return {
    handleTabPress,
    accountDrawerVisible,
    setAccountDrawerVisible,
    handleAccountMenuPress,
  };
}
