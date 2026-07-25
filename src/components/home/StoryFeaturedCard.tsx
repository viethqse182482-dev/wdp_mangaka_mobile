/**
 * StoryFeaturedCard — card lớn cho phần "Truyện đề xuất" ở trang chủ.
 *
 * Glass card với ảnh bìa + meta stats + tag genre + synopsis + CTA.
 *  - Toàn bộ card bọc trong LiquidGlass (depth 2).
 *  - Cover có ring glow accent.
 *  - CTA "ĐỌC NGAY" pill gradient warm.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FeaturedStory } from '../../types/story';
import { formatCompactNumber } from '../../utils/formatNumber';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { Tag } from '../../theme/uiPrimitives';
import { LiquidGlass } from '../../theme/LiquidGlass';

interface StoryFeaturedCardProps {
  story: FeaturedStory;
  onPress: (id: string) => void;
}

const COVER_WIDTH = 96;
const COVER_HEIGHT = 132;

export function StoryFeaturedCard({ story, onPress }: StoryFeaturedCardProps) {
  return (
    <Pressable
      onPress={() => onPress(story.id)}
      style={({ pressed }) => [
        styles.cardWrap,
        { transform: [{ scale: pressed ? 0.98 : 1 }], opacity: pressed ? 0.92 : 1 },
      ]}
    >
      <LiquidGlass
        tint="navy"
        depth={2}
        radius={radius.lg}
        style={styles.cardWrap}
        innerStyle={styles.cardInner}
      >
        <View style={styles.coverWrapper}>
          <Image
            source={{ uri: story.coverUrl }}
            style={styles.cover}
            contentFit="cover"
            transition={250}
          />
          <LinearGradient
            colors={['rgba(8,12,32,0)', 'rgba(8,12,32,0.45)']}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.coverBadge}>
            <Ionicons name="book" size={10} color={colors.cyan} />
            <Text style={styles.coverBadgeText}>{story.latestChapter}</Text>
          </View>
        </View>

        <View style={styles.info}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="star" size={12} color={colors.warning} />
              <Text style={styles.statText}>{story.rating?.toFixed(1)}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="eye-outline" size={12} color={colors.textMuted} />
              <Text style={styles.statText}>{formatCompactNumber(story.views)}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="person-outline" size={12} color={colors.textMuted} />
              <Text style={styles.statText}>{formatCompactNumber(story.followers)}</Text>
            </View>
          </View>

          <Text style={styles.title} numberOfLines={2}>
            {story.title}
          </Text>

          <View style={styles.genreRow}>
            {story.genres.slice(0, 2).map((genre) => (
              <Tag key={genre} label={genre} variant="default" size="sm" />
            ))}
          </View>

          {story.synopsis ? (
            <Text style={styles.synopsis} numberOfLines={2}>
              {story.synopsis}
            </Text>
          ) : null}

          <View style={styles.ctaWrap}>
            <LinearGradient
              colors={colors.gradWarm}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaPill}
            >
              <Ionicons name="play" size={12} color={colors.white} />
              <Text style={styles.ctaText}>ĐỌC NGAY</Text>
            </LinearGradient>
          </View>
        </View>
      </LiquidGlass>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  cardInner: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  coverWrapper: {
    width: COVER_WIDTH,
    height: COVER_HEIGHT,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
    shadowColor: colors.accent,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  coverBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(8,12,32,0.85)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  coverBadgeText: {
    color: colors.cyan,
    fontSize: 10,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '800',
  },
  info: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'space-between',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statText: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: typography.fontFamilyMedium,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '800',
    lineHeight: 20,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: 6,
  },
  synopsis: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: spacing.sm,
  },
  ctaWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ctaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    shadowColor: colors.warmGlow,
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  ctaText: {
    color: colors.white,
    fontSize: 11,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
