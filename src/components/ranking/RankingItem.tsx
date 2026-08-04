/**
 * RankingItem — item trong bảng xếp hạng.
 *
 *  - Top 3 có rank badge gradient (gold/silver/bronze).
 *  - Card glass (LiquidGlass depth=1).
 */
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ReaderRankingItem, RankingType } from '../../types/story';
import { formatCompactNumber } from '../../utils/formatNumber';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { GlassCard, Tag } from '../../theme/uiPrimitives';

interface RankingItemProps {
  item: ReaderRankingItem;
  rankingType: RankingType;
  onPress: (seriesId: string) => void;
}

export function RankingItem({ item, rankingType, onPress }: RankingItemProps) {
  const roundedRating = Math.max(0, Math.min(5, Math.round(item.average_score ?? 0)));

  const getValueDisplay = () => {
    switch (rankingType) {
      case 'top_views':
        return `${formatCompactNumber(item.views_count ?? 0)} lượt đọc`;
      case 'top_votes':
        return `${formatCompactNumber(item.votes_count ?? 0)} lượt vote`;
      case 'top_rating':
        return `${item.average_score?.toFixed(1) ?? '0.0'}/5 sao`;
    }
  };

  const getValueIcon = () => {
    switch (rankingType) {
      case 'top_views':
        return 'eye-outline' as const;
      case 'top_votes':
        return 'heart-outline' as const;
      case 'top_rating':
        return 'star-outline' as const;
    }
  };

  return (
    <Pressable
      onPress={() => onPress(item.series_id)}
      style={({ pressed }) => [styles.cardWrap, pressed && styles.pressed]}
    >
      <GlassCard
        tint="navy"
        depth={1}
        radius={radius.lg}
        style={styles.card}
        innerStyle={styles.cardInner}
      >
        <View style={styles.rankWrap}>
          <RankBadge rank={item.rank} />
        </View>

        <View style={styles.coverWrapper}>
          <Image
            source={{ uri: item.cover_image_url }}
            style={styles.cover}
            contentFit="cover"
            transition={250}
          />
        </View>

        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {item.name}
          </Text>

          {item.genre && item.genre.length > 0 && (
            <View style={styles.genreRow}>
              {item.genre.slice(0, 2).map((g, index) => (
                <Tag key={index} label={g} variant="default" size="sm" />
              ))}
            </View>
          )}

          <View style={styles.valueRow}>
            <Ionicons name={getValueIcon()} size={12} color={colors.cyan} />
            <Text style={styles.valueText}>{getValueDisplay()}</Text>
          </View>

          {rankingType === 'top_rating' && (
            <View style={styles.starRow}>
              {Array.from({ length: 5 }).map((_, index) => (
                <Ionicons
                  key={index}
                  name={index < roundedRating ? 'star' : 'star-outline'}
                  size={12}
                  color={
                    index < roundedRating ? colors.warning : colors.textMuted
                  }
                />
              ))}
            </View>
          )}
        </View>

        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </GlassCard>
    </Pressable>
  );
}

function RankBadge({ rank }: { rank: number }) {
  let gradient: readonly [string, string, ...string[]];
  let shadowColor: string = colors.accent;
  if (rank === 1) {
    gradient = ['#FFD56B', '#FF9A3D'];
    shadowColor = colors.warning;
  } else if (rank === 2) {
    gradient = ['#E8ECEF', '#A5B0BD'];
  } else if (rank === 3) {
    gradient = ['#F4A56A', '#B86E3C'];
  } else {
    gradient = [colors.accent, colors.cyan];
  }

  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.rankBadge, { shadowColor }]}
    >
      <Text style={styles.rankText}>{rank}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  card: {
    borderRadius: radius.lg,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  rankWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.45,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  rankText: {
    color: colors.white,
    fontSize: 13,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '800',
  },
  coverWrapper: {
    width: 56,
    height: 80,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
    shadowColor: colors.accent,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  valueText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: typography.fontFamilyMedium,
    fontWeight: '600',
  },
  starRow: {
    flexDirection: 'row',
    gap: 2,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
});
