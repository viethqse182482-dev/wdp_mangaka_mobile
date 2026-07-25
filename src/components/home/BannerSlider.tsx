/**
 * BannerSlider — slider banner trang chủ với hiệu ứng parallax + glass overlay.
 *
 * Apple Liquid Glass:
 *  - Banner cover full-bleed, gradient scrim đáy.
 *  - Info overlay là GlassCard blur, đặt ở góc dưới-trái.
 *  - Pagination dot glass morphing width khi active.
 */
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Story } from '../../types/story';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { Tag } from '../../theme/uiPrimitives';
import { LiquidGlass } from '../../theme/LiquidGlass';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - spacing.lg * 2;
const BANNER_HEIGHT = BANNER_WIDTH * 0.58;

interface BannerSliderProps {
  stories: Story[];
  onStoryPress: (id: string) => void;
}

export function BannerSlider({ stories, onStoryPress }: BannerSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<Story>>(null);
  const currentIndexRef = useRef(0);
  const isScrollingRef = useRef(false);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(
      e.nativeEvent.contentOffset.x / (BANNER_WIDTH + spacing.md),
    );
    currentIndexRef.current = index;
    setActiveIndex(index);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (isScrollingRef.current || stories.length <= 1) return;
      const nextIndex = (currentIndexRef.current + 1) % stories.length;
      listRef.current?.scrollToOffset({
        offset: nextIndex * (BANNER_WIDTH + spacing.md),
        animated: true,
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!stories.length) {
    return <View style={styles.empty} />;
  }

  return (
    <View style={styles.wrapper}>
      <FlatList
        ref={listRef}
        data={stories}
        keyExtractor={(item) => `banner-${item.id}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={BANNER_WIDTH + spacing.md}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onScrollBeginDrag={() => {
          isScrollingRef.current = true;
        }}
        onScrollEndDrag={() => {
          isScrollingRef.current = false;
        }}
        renderItem={({ item }) => (
          <BannerCard item={item} onPress={onStoryPress} />
        )}
      />

      <View style={styles.dots}>
        {stories.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, index === activeIndex && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

function BannerCard({
  item,
  onPress,
}: {
  item: Story;
  onPress: (id: string) => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () =>
    Animated.timing(scale, {
      toValue: 0.97,
      duration: 120,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  const onPressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
      tension: 80,
    }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={() => onPress(item.id)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={styles.bannerCard}
      >
        <Image
          source={{ uri: item.coverUrl }}
          style={styles.cover}
          contentFit="cover"
          transition={300}
        />
        <LinearGradient
          colors={colors.gradBanner}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Glass overlay ở góc dưới */}
        <LiquidGlass
          tint="dark"
          depth={3}
          radius={radius.lg}
          showHighlight
          style={styles.glassInfoWrap}
          innerStyle={styles.glassInfoInner}
        >
          <View style={styles.genreRow}>
            {item.genres.slice(0, 2).map((genre) => (
              <Tag key={genre} label={genre} variant="accent" size="sm" />
            ))}
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.chapter}>Chương {item.latestChapter}</Text>
            <View style={styles.chevronChip}>
              <Text style={styles.chevronText}>Đọc ngay</Text>
              <View style={styles.chevronDot} />
            </View>
          </View>
        </LiquidGlass>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.sm,
  },
  empty: {
    height: BANNER_HEIGHT,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  bannerCard: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    shadowColor: colors.accent,
    shadowOpacity: 0.4,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  glassInfoWrap: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
  },
  glassInfoInner: {
    padding: spacing.md,
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: 6,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 19,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '800',
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  chapter: {
    color: colors.cyan,
    fontSize: 12,
    fontFamily: typography.fontFamilyMedium,
    fontWeight: '700',
  },
  chevronChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  chevronText: {
    color: colors.accentLight,
    fontSize: 11,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  chevronDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentLight,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.glassMedium,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
});
