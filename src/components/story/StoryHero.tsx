/**
 * StoryHero — banner cinematic đầu trang chi tiết truyện.
 *
 * Design:
 *  - Ảnh bìa expansive, parallax translation theo scrollY (parent truyền vào).
 *  - Gradient overlay hòa vào background.
 *  - Glass card chứa tags + title + stats inline (rating/view/chapter) — gọn,
 *    tối giản, không chiếm nhiều chiều dọc.
 */
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Animated as AnimatedType } from 'react-native';
import { StoryDetail } from '../../types/storyDetail';
import { formatCompactNumber } from '../../utils/formatNumber';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { Tag } from '../../theme/uiPrimitives';
import { LiquidGlass } from '../../theme/LiquidGlass';

const SCREEN_WIDTH = Dimensions.get('window').width;
const COVER_HEIGHT = SCREEN_WIDTH * 1.05;

interface StoryHeroProps {
  story: StoryDetail;
  /**
   * Animated.Value scrollY từ ScrollView cha — dùng để chạy parallax
   * cho cover và fade nhẹ cho bottom content.
   */
  scrollY?: AnimatedType.Value;
}

export function StoryHero({ story, scrollY }: StoryHeroProps) {
  const hasCover = !!story.coverUrl && story.coverUrl.length > 0;

  // Parallax: cover translate ngược hướng scroll một nửa tốc độ.
  const coverTranslateY = scrollY
    ? scrollY.interpolate({
        inputRange: [-COVER_HEIGHT, 0, COVER_HEIGHT],
        outputRange: [-COVER_HEIGHT / 2, 0, COVER_HEIGHT / 2],
        extrapolate: 'clamp',
      })
    : 0;
  const coverScale = scrollY
    ? scrollY.interpolate({
        inputRange: [-COVER_HEIGHT, 0, COVER_HEIGHT],
        outputRange: [1.25, 1, 1],
        extrapolate: 'clamp',
      })
    : 1;

  // Bottom content fade in nhẹ khi user kéo xuống.
  const contentOpacity = scrollY
    ? scrollY.interpolate({
        inputRange: [0, COVER_HEIGHT * 0.6],
        outputRange: [1, 0.4],
        extrapolate: 'clamp',
      })
    : 1;

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[
          styles.coverWrapper,
          {
            transform: [{ translateY: coverTranslateY }, { scale: coverScale }],
          },
        ]}
      >
        {hasCover ? (
          <Image
            source={{ uri: story.coverUrl }}
            style={styles.cover}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View style={styles.cover}>
            <Ionicons name="image-outline" size={48} color={colors.textMuted} />
          </View>
        )}
      </Animated.View>

      {/* Gradient overlay — seamless blend vào #070B1A */}
      <LinearGradient
        colors={colors.gradHero}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <Animated.View style={[styles.bottomContent, { opacity: contentOpacity }]}>
        <LiquidGlass
          tint="dark"
          depth={3}
          radius={radius.lg}
          showHighlight
          style={styles.bottomGlass}
          innerStyle={styles.bottomContentInner}
        >
          {story.genres.length > 0 && (
            <View style={styles.tagRow}>
              {story.genres.slice(0, 3).map((g) => (
                <Tag key={g} label={g} variant="accent" size="sm" />
              ))}
            </View>
          )}

          <Text style={styles.title} numberOfLines={3}>
            {story.title}
          </Text>

          <InlineStats story={story} />
        </LiquidGlass>
      </Animated.View>
    </View>
  );
}

/**
 * InlineStats — minimalist inline row (icon + text) — không card, không badge.
 * Tích hợp ngay dưới title để giảm noise.
 */
function InlineStats({ story }: { story: StoryDetail }) {
  const items = [
    {
      icon: 'star' as const,
      value: Number(story.rating).toFixed(1),
      color: colors.warning,
    },
    {
      icon: 'eye-outline' as const,
      value: formatCompactNumber(story.views),
      color: colors.cyan,
    },
    {
      icon: 'layers-outline' as const,
      value: `${story.chapters.length}`,
      color: colors.accentLight,
    },
  ];

  return (
    <View style={styles.statsRow}>
      {items.map((item, idx) => (
        <View key={item.icon} style={styles.statsItem}>
          <Ionicons name={item.icon} size={14} color={item.color} />
          <Text style={styles.statsValue}>{item.value}</Text>
          {idx < items.length - 1 ? <View style={styles.statsDivider} /> : null}
        </View>
      ))}
    </View>
  );
}

export const STORY_HERO_HEIGHT = COVER_HEIGHT;

const styles = StyleSheet.create({
  wrapper: {
    width: SCREEN_WIDTH,
    height: COVER_HEIGHT,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  coverWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  cover: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomContent: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
  },
  bottomGlass: {
    alignSelf: 'stretch',
  },
  bottomContentInner: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  title: {
    ...typography.title2,
    color: colors.textPrimary,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  statsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statsValue: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: typography.fontFamilyMedium,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  statsDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textMuted,
    marginHorizontal: spacing.sm,
    opacity: 0.6,
  },
});
