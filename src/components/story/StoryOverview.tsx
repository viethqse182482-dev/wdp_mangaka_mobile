/**
 * StoryOverview — phần tóm tắt + metadata sau khi refactor.
 *
 * Sau khi tách:
 *  - Title đã có trong StoryHero (loại bỏ duplicate).
 *  - Author đã có trong StoryAuthorCard (loại bỏ row TÁC GIẢ).
 *
 * Còn lại: synopsis + info grid (tên khác, trạng thái, cập nhật).
 */
import { StyleSheet, Text, View } from 'react-native';
import { StoryDetail } from '../../types/storyDetail';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { GlassCard, Tag } from '../../theme/uiPrimitives';

interface StoryOverviewProps {
  story: StoryDetail;
  onAuthorPress?: () => void;
}

export function StoryOverview({ story }: StoryOverviewProps) {
  return (
    <GlassCard
      tint="navy"
      depth={2}
      radius={radius.lg}
      innerStyle={styles.card}
    >
      {story.genres.length > 0 && (
        <View style={styles.tags}>
          {story.genres.map((genre) => (
            <Tag key={genre} label={genre} variant="accent" size="sm" />
          ))}
        </View>
      )}

      {story.synopsis ? (
        <View style={styles.synopsisWrap}>
          <Text style={styles.sectionLabel}>NỘI DUNG</Text>
          <Text style={styles.synopsis}>{story.synopsis}</Text>
        </View>
      ) : null}

      <View style={styles.divider} />

      <View style={styles.metaGrid}>
        <InfoRow label="TÊN KHÁC" value={story.altName || story.title} />
        <InfoRow label="TRẠNG THÁI" value={story.status} />
        <InfoRow label="CẬP NHẬT" value={story.updatedAt} />
      </View>
    </GlassCard>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  synopsisWrap: {
    gap: spacing.xs,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  synopsis: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: -0.05,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.glassBorder,
    marginVertical: spacing.xs,
  },
  metaGrid: {
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  infoLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
    letterSpacing: 0.6,
    minWidth: 90,
    paddingTop: 2,
  },
  infoValue: {
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: typography.fontFamilyMedium,
    fontWeight: '600',
    flex: 1,
  },
});
