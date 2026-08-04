import Ionicons from '@expo/vector-icons/Ionicons';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Image, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StartupSplash } from '../src/components/splash/StartupSplash';
import { AppProviders } from '../src/context/AppProviders';
import { getAuthToken } from '../src/services/authService';
import { fetchGenres } from '../src/services/genreService';
import { colors } from '../src/theme/colors';

LogBox.ignoreLogs([
  'Text strings must be rendered within a <Text> component',
]);

const MIN_SPLASH_DURATION_MS = 2000;

SplashScreen.preventAutoHideAsync().catch(() => {
  // ignore — có thể đã bị tự ẩn trên web hoặc khi reload
});

interface StartupState {
  ready: boolean;
  statusMessage: string;
  error: Error | null;
}

const initialState: StartupState = {
  ready: false,
  statusMessage: 'Đang khởi động...',
  error: null,
};

async function preloadLogo(): Promise<void> {
  try {
    // Ưu tiên ảnh "nho" (logo chính dùng ngoài app & trong app).
    // Ảnh nho là JPG nên truyền qua Image.prefetch để cache trước khi render.
    const logo = require('../assets/images/logonho.jpg');
    await Image.prefetch(logo);
  } catch {
    // ignore — nếu asset lỗi vẫn tiếp tục hiển thị app
  }
}

async function restoreSession(): Promise<void> {
  try {
    await getAuthToken();
  } catch {
    // ignore — lỗi đọc storage không chặn khởi động
  }
}

async function loadInitialGenres(): Promise<void> {
  try {
    await fetchGenres();
  } catch {
    // ignore — fallback dùng BASE_GENRES trong genreService
  }
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    ...Ionicons.font,
    'Roboto-Regular': require('../assets/fonts/Roboto-Regular.ttf'),
    'Roboto-Medium': require('../assets/fonts/Roboto-Medium.ttf'),
    'Roboto-Bold': require('../assets/fonts/Roboto-Bold.ttf'),
  });

  const [state, setState] = useState<StartupState>(initialState);

  useEffect(() => {
    if (fontError) {
      setState({
        ready: false,
        statusMessage: 'Lỗi tải font, đang thử lại...',
        error: fontError,
      });
      return;
    }

    if (!fontsLoaded) {
      return;
    }

    let cancelled = false;
    const startedAt = Date.now();

    (async () => {
      try {
        // Ẩn native splash NGAY để React render ra StartupSplash với animation
        // (halo, title, text) chạy song song với việc preload data bên dưới.
        await SplashScreen.hideAsync().catch(() => undefined);

        await Promise.all([
          preloadLogo(),
          restoreSession(),
          loadInitialGenres(),
        ]);

        if (cancelled) return;

        const elapsed = Date.now() - startedAt;
        const remaining = Math.max(0, MIN_SPLASH_DURATION_MS - elapsed);
        if (remaining > 0) {
          setState((prev) => ({ ...prev, statusMessage: 'Sắp xong...' }));
          await new Promise((resolve) => setTimeout(resolve, remaining));
        }

        if (cancelled) return;

        setState({ ready: true, statusMessage: '', error: null });
      } catch (err) {
        if (cancelled) return;
        const error = err instanceof Error ? err : new Error(String(err));
        await SplashScreen.hideAsync().catch(() => undefined);
        setState({ ready: true, statusMessage: '', error });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fontsLoaded, fontError]);

  if (!state.ready) {
    return <StartupSplash statusMessage={state.statusMessage} />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppProviders>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen
            name="read/[storyId]/[chapter]"
            options={{
              contentStyle: { backgroundColor: '#000000' },
              animation: 'fade',
              gestureEnabled: true,
            }}
          />
          <Stack.Screen
            name="notifications"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="author/[authorId]"
            options={{
              headerShown: false,
              animation: 'slide_from_right',
              gestureEnabled: true,
            }}
          />
          <Stack.Screen
            name="ranking/index"
            options={{
              headerShown: false,
              animation: 'slide_from_right',
              gestureEnabled: true,
            }}
          />
          <Stack.Screen
            name="payment/checkout"
            options={{ headerShown: false, animation: 'slide_from_right', gestureEnabled: false }}
          />
          <Stack.Screen
            name="payment/return"
            options={{ headerShown: false, animation: 'fade', gestureEnabled: false }}
          />
          <Stack.Screen
            name="payment/cancel"
            options={{ headerShown: false, animation: 'fade', gestureEnabled: false }}
          />
        </Stack>
      </AppProviders>
    </SafeAreaProvider>
  );
}
