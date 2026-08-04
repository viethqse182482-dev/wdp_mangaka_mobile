import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Chapter } from '../../types/storyDetail';
import { formatCoinUnits } from '../../utils/coinUnit';
import { colors, radius, spacing, typography } from '../../theme/colors';

export function ChapterAccessBadge({ chapter }: { chapter: Chapter }) {
  if (chapter.accessType !== 'PAID') {
    return (
      <View style={[styles.badge, styles.freeBadge]}>
        <Ionicons name="lock-open-outline" size={12} color={colors.success} />
        <Text style={[styles.text, styles.freeText]}>Miễn phí</Text>
      </View>
    );
  }

  if (chapter.isPurchased) {
    return (
      <View style={[styles.badge, styles.purchasedBadge]}>
        <Ionicons name="checkmark-circle" size={12} color={colors.accentLight} />
        <Text style={[styles.text, styles.purchasedText]}>Đã mua</Text>
      </View>
    );
  }

  return (
    <View style={[styles.badge, styles.paidBadge]}>
      <Ionicons name="lock-closed" size={11} color={colors.warning} />
      <Text style={[styles.text, styles.paidText]}>
        {formatCoinUnits(chapter.coinPrice ?? 0)} Coin
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  text: {
    fontSize: 10,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
  },
  freeBadge: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
  },
  freeText: {
    color: colors.success,
  },
  purchasedBadge: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  purchasedText: {
    color: colors.accentLight,
  },
  paidBadge: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warning,
  },
  paidText: {
    color: colors.warning,
  },
});
