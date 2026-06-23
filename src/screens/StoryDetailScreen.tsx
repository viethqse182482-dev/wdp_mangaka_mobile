import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoginRequiredModal } from '../components/auth/LoginRequiredModal';
import { ChapterList } from '../components/story/ChapterList';
import { CommentSection } from '../components/story/CommentSection';
import { StoryActionBar } from '../components/story/StoryActionBar';
import { StoryHero } from '../components/story/StoryHero';
import { StoryOverview } from '../components/story/StoryOverview';
import { StoryRatingRow, StoryStatsBar } from '../components/story/StoryStatsBar';
import { getStoryDetailById } from '../data/mockStoryDetails';
import { getStoryById } from '../data/mockStories';
import { getAuthToken } from '../services/authService';
import { recordReadingHistory } from '../services/readingHistoryService';
import { Chapter } from '../types/storyDetail';
import { colors, spacing } from '../theme/colors';

export function StoryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const scrollRef = useRef<ScrollView>(null);
  const [showTopFab, setShowTopFab] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const story = typeof id === 'string' ? getStoryDetailById(id) : undefined;

  useEffect(() => {
    let mounted = true;

    getAuthToken().then((token) => {
      if (!mounted) return;

      if (!token) {
        setShowLoginModal(true);
        return;
      }

      setAuthChecked(true);
    });

    return () => {
      mounted = false;
    };
  }, [id, router]);

  const handleLoginFromModal = useCallback(() => {
    const redirectPath = typeof id === 'string' ? `/story/${id}` : '/';
    setShowLoginModal(false);
    router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`);
  }, [id, router]);

  const handleCloseLoginModal = useCallback(() => {
    setShowLoginModal(false);
    router.replace('/');
  }, [router]);

  const handleBackHome = useCallback(() => {
    router.replace('/');
  }, [router]);

  const handleReadFromStart = useCallback(() => {
    if (!story) return;
    const baseStory = getStoryById(story.id);
    if (baseStory) {
      void recordReadingHistory(baseStory, 1);
    }
    console.log('[Navigation] Đọc từ đầu:', story.id);
  }, [story]);

  const handleChapterPress = useCallback(
    (chapter: Chapter) => {
      if (!story) return;
      const baseStory = getStoryById(story.id);
      if (baseStory) {
        void recordReadingHistory(baseStory, chapter.number);
      }
      console.log('[Navigation] Đọc chương:', chapter.number);
    },
    [story],
  );

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setShowTopFab(event.nativeEvent.contentOffset.y > 320);
  }, []);

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  if (!authChecked) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoginRequiredModal
          visible={showLoginModal}
          onClose={handleCloseLoginModal}
          onLogin={handleLoginFromModal}
        />
        {!showLoginModal ? (
          <View style={styles.centered}>
            <Text style={styles.loadingText}>Đang kiểm tra đăng nhập...</Text>
          </View>
        ) : null}
      </SafeAreaView>
    );
  }

  if (!story) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundTitle}>Không tìm thấy truyện</Text>
          <Pressable onPress={handleBackHome} style={styles.backLink}>
            <Text style={styles.backLinkText}>Về trang chủ</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.topBar}>
        <Pressable
          onPress={handleBackHome}
          hitSlop={8}
          style={({ pressed }) => [styles.backHomeButton, pressed && styles.pressed]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          <Text style={styles.backHomeText}>Trang chủ</Text>
        </Pressable>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {story.title}
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <StoryHero story={story} />
        <StoryStatsBar story={story} />
        <StoryRatingRow rating={story.rating} />
        <StoryActionBar
          story={story}
          onReadFromStart={handleReadFromStart}
          onNotifyPress={() => console.log('[Navigation] Bật thông báo:', story.id)}
        />
        <StoryOverview story={story} />
        <ChapterList chapters={story.chapters} onChapterPress={handleChapterPress} />
        <CommentSection comments={story.comments} />
      </ScrollView>

      {showTopFab ? (
        <Pressable onPress={scrollToTop} style={styles.fab}>
          <Ionicons name="arrow-up" size={20} color={colors.white} />
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  backHomeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    flexShrink: 0,
  },
  backHomeText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  topBarTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  pressed: {
    opacity: 0.75,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  notFoundTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  backLink: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  backLinkText: {
    color: colors.accent,
    fontWeight: '600',
  },
});
