import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
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
import { ChapterList } from '../components/story/ChapterList';
import { CommentSection } from '../components/story/CommentSection';
import { StoryActionBar } from '../components/story/StoryActionBar';
import { StoryHero } from '../components/story/StoryHero';
import { StoryOverview } from '../components/story/StoryOverview';
import { StoryRatingRow, StoryStatsBar } from '../components/story/StoryStatsBar';
import { getStoryDetailById } from '../data/mockStoryDetails';
import { getStoryById } from '../data/mockStories';
import { recordReadingHistory } from '../services/readingHistoryService';
import { Chapter } from '../types/storyDetail';
import { colors, spacing } from '../theme/colors';

export function StoryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const scrollRef = useRef<ScrollView>(null);
  const [showTopFab, setShowTopFab] = useState(false);

  const story = typeof id === 'string' ? getStoryDetailById(id) : undefined;

  const handleBack = useCallback(() => {
    router.back();
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

  if (!story) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundTitle}>Không tìm thấy truyện</Text>
          <Pressable onPress={handleBack} style={styles.backLink}>
            <Text style={styles.backLinkText}>Quay lại</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.topBar}>
        <Pressable onPress={handleBack} hitSlop={8} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {story.title}
        </Text>
        <View style={styles.backButton} />
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
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
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
