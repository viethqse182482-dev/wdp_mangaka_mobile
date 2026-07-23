import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StoryDetail } from '../../types/storyDetail';
import { colors, radius, spacing } from '../../theme/colors';

interface StoryOverviewProps {
  story: StoryDetail;
  onAuthorPress?: () => void;
}

export function StoryOverview({ story, onAuthorPress }: StoryOverviewProps) {
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
        <InfoRow label="TÁC GIẢ" value={story.author} onPress={onAuthorPress} />
        <InfoRow label="TRẠNG THÁI" value={story.status} />
      </View>
    </View>
  );
}

function InfoRow({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) {
  const content = (
    <Text
      style={[
        styles.infoValue,
        onPress && styles.infoValueLink,
      ]}
      numberOfLines={2}
    >
      {value}
    </Text>
  );

  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}:</Text>
      {onPress ? (
        <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
          {content}
        </Pressable>
      ) : (
        content
      )}
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
  infoValueLink: {
    color: colors.accent,
  },
  pressed: {
    opacity: 0.7,
  },
});
