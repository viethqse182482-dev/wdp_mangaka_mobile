import { useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import {
  Dimensions,
  FlatList,
  ListRenderItem,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HomeHeader } from '../components/home/HomeHeader';
import { BannerSlider } from '../components/home/BannerSlider';
import { SectionHeader } from '../components/home/SectionHeader';
import { StoryGridCard } from '../components/home/StoryGridCard';
import { StoryHorizontalCard } from '../components/home/StoryHorizontalCard';
import { BottomTabBar } from '../components/home/BottomTabBar';
import { AccountDrawer } from '../components/home/AccountDrawer';
import { useMainTabNavigation } from '../hooks/useMainTabNavigation';
import { useStoryNavigation } from '../hooks/useStoryNavigation';
import { hotStories, latestStories, topWeekStories } from '../data/mockStories';
import { Story } from '../types/story';
import { colors, spacing } from '../theme/colors';

const GRID_COLUMNS = 3;
const GRID_GAP = spacing.md;
const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_ITEM_WIDTH =
  (SCREEN_WIDTH - spacing.lg * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

export function HomeScreen() {
  const router = useRouter();
  const { openStory, loginPromptModal } = useStoryNavigation();
  const {
    handleTabPress,
    accountDrawerVisible,
    setAccountDrawerVisible,
    handleAccountMenuPress,
    loginPromptModal: tabLoginPromptModal,
  } = useMainTabNavigation('home');

  const handlePressStory = useCallback((storyId: string) => {
    void openStory(storyId);
  }, [openStory]);

  const handleSearchPress = useCallback(() => {
    // TODO: router.push('/search')
    console.log('[Navigation] Mở tìm kiếm');
  }, []);

  const handleHistoryPress = useCallback(() => {
    router.push('/history');
  }, [router]);

  const handleSeeAllLatest = useCallback(() => {
    // TODO: router.push('/latest')
    console.log('[Navigation] Xem tất cả truyện mới');
  }, []);

  const handleSeeAllTopWeek = useCallback(() => {
    // TODO: router.push('/top-week')
    console.log('[Navigation] Xem top tuần');
  }, []);

  const renderTopWeekItem: ListRenderItem<Story> = useCallback(
    ({ item, index }) => (
      <StoryHorizontalCard
        story={item}
        rank={index + 1}
        onPress={handlePressStory}
      />
    ),
    [handlePressStory],
  );

  const gridRows = useMemo(() => {
    const rows: Story[][] = [];
    for (let i = 0; i < latestStories.length; i += GRID_COLUMNS) {
      rows.push(latestStories.slice(i, i + GRID_COLUMNS));
    }
    return rows;
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <HomeHeader
        onSearchPress={handleSearchPress}
        onHistoryPress={handleHistoryPress}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <BannerSlider stories={hotStories} onStoryPress={handlePressStory} />

        <SectionHeader
          title="Truyện Mới Cập Nhật"
          subtitle="Cập nhật liên tục mỗi ngày"
          onSeeAllPress={handleSeeAllLatest}
        />

        <View style={styles.grid}>
          {gridRows.map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.gridRow}>
              {row.map((story) => (
                <StoryGridCard
                  key={story.id}
                  story={story}
                  width={GRID_ITEM_WIDTH}
                  onPress={handlePressStory}
                />
              ))}
              {row.length < GRID_COLUMNS &&
                Array.from({ length: GRID_COLUMNS - row.length }).map((_, i) => (
                  <View key={`spacer-${i}`} style={{ width: GRID_ITEM_WIDTH }} />
                ))}
            </View>
          ))}
        </View>

        <SectionHeader
          title="Top Tuần"
          subtitle="Truyện xem nhiều nhất 7 ngày qua"
          onSeeAllPress={handleSeeAllTopWeek}
        />

        <FlatList
          data={topWeekStories}
          keyExtractor={(item) => `top-${item.id}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          renderItem={renderTopWeekItem}
          // Nested scroll — tắt gesture dọc để tránh xung đột với ScrollView cha
          nestedScrollEnabled
        />

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <BottomTabBar activeTab="home" onTabPress={handleTabPress} />

      <AccountDrawer
        visible={accountDrawerVisible}
        onClose={() => setAccountDrawerVisible(false)}
        onMenuPress={handleAccountMenuPress}
      />

      {loginPromptModal}
      {tabLoginPromptModal}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  grid: {
    paddingHorizontal: spacing.lg,
  },
  gridRow: {
    flexDirection: 'row',
    gap: GRID_GAP,
  },
  horizontalList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  bottomSpacer: {
    height: spacing.lg,
  },
});
