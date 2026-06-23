import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { StoryDetail } from '../../types/storyDetail';
import { colors, radius, spacing } from '../../theme/colors';

interface StoryOverviewProps {
  story: StoryDetail;
}

export function StoryOverview({ story }: StoryOverviewProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{story.title}</Text>

      <View style={styles.tags}>
        {story.genres.map((genre) => (
          <View key={genre} style={styles.tag}>
            <Ionicons name="pricetag-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.tagText}>{genre}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.synopsis}>{story.synopsis}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông Tin</Text>
        <View style={styles.divider} />

        <InfoRow label="TÊN KHÁC" value={story.altName} />
        <InfoRow label="TÁC GIẢ" value={story.author} />
        <InfoRow label="TRẠNG THÁI" value={story.status} />
      </View>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 28,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  synopsis: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginTop: spacing.lg,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
  },
  infoLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  infoValue: {
    color: colors.success,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
});
