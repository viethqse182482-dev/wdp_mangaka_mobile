import { useRef, useState } from 'react';
import {
  Dimensions,
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
import { colors, radius, spacing } from '../../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - spacing.lg * 2;
const BANNER_HEIGHT = BANNER_WIDTH * 0.55;

interface BannerSliderProps {
  stories: Story[];
  onStoryPress: (id: string) => void;
}

export function BannerSlider({ stories, onStoryPress }: BannerSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<Story>>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / (BANNER_WIDTH + spacing.md));
    setActiveIndex(index);
  };

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
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onStoryPress(item.id)}
            style={({ pressed }) => [styles.bannerCard, pressed && styles.pressed]}
          >
            <Image
              source={{ uri: item.coverUrl }}
              style={styles.cover}
              contentFit="cover"
              transition={300}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.9)']}
              style={styles.gradient}
            />
            <View style={styles.info}>
              <View style={styles.genreRow}>
                {item.genres.slice(0, 2).map((genre) => (
                  <View key={genre} style={styles.genreBadge}>
                    <Text style={styles.genreText}>{genre}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.title} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.chapter}>Chương {item.latestChapter}</Text>
            </View>
          </Pressable>
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

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  bannerCard: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  info: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
  },
  genreRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  genreBadge: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.35)',
  },
  genreText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '600',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
    fontFamily: 'Roboto-Bold',
  },
  chapter: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: spacing.xs,
    fontWeight: '500',
    fontFamily: 'Roboto-Medium',
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
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.accent,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});
