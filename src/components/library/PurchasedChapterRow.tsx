/**
 * PurchasedChapterRow — một dòng chapter đã mua trong card mở rộng.
 *
 * Hiển thị:
 *  - "Chương {chapter_number}" + title (nếu có)
 *  - giá Coin đã mua (CoinUnit → Coin)
 *  - ngày mua
 *  - nút "Đọc" → điều hướng thẳng đến Reader
 */
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PurchasedChapterEntry } from '../../types/storyDetail';
import { formatReadTime } from '../../utils/formatReadTime';
import { formatCoinUnits } from '../../utils/coinUnit';
import { colors, radius, spacing, typography } from '../../theme/colors';

interface PurchasedChapterRowProps {
  entry: PurchasedChapterEntry;
  onPress: (params: { seriesId: string; chapterNumber: number }) => void;
  /**
   * Nếu series thiếu/không còn tồn tại, nút đọc bị disable để bảo vệ user khỏi
   * chuyển sang màn hình reader với chapter không xác định.
   */
  disabled?: boolean;
}

export function PurchasedChapterRow({
  entry,
  onPress,
  disabled = false,
}: PurchasedChapterRowProps) {
  const seriesId = entry.series?.id;
  const canRead = !disabled && Boolean(seriesId);

  return (
    <View style={styles.row}>
      <View style={styles.iconBox}>
        <Ionicons name="book-outline" size={16} color={colors.accentLight} />
      </View>

      <View style={styles.info}>
        <Text style={styles.chapter} numberOfLines={1}>
          Chương {entry.chapterNumber}
        </Text>
        {entry.chapterTitle ? (
          <Text style={styles.chapterTitle} numberOfLines={1}>
            {entry.chapterTitle}
          </Text>
        ) : null}
        <View style={styles.metaRow}>
          <Text style={styles.price}>{formatCoinUnits(entry.priceCoinUnit)} Coin</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.date}>{formatReadTime(entry.purchasedAt) || '—'}</Text>
        </View>
      </View>

      <Pressable
        onPress={() =>
          canRead && seriesId
            ? onPress({ seriesId, chapterNumber: entry.chapterNumber })
            : undefined
        }
        disabled={!canRead}
        style={({ pressed }) => [
          styles.readButton,
          !canRead && styles.readButtonDisabled,
          pressed && canRead && styles.pressed,
        ]}
      >
        <Ionicons
          name={canRead ? 'play' : 'lock-closed'}
          size={14}
          color={canRead ? colors.white : colors.textMuted}
        />
        <Text style={[styles.readLabel, !canRead && styles.readLabelDisabled]}>
          Đọc
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.glassLight,
    marginBottom: spacing.sm,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  chapter: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
  },
  chapterTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
    fontFamily: typography.fontFamilyMedium,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 4,
  },
  price: {
    color: colors.cyan,
    fontSize: 12,
    fontFamily: typography.fontFamilyMedium,
    fontWeight: '600',
  },
  dot: {
    color: colors.textMuted,
    fontSize: 12,
  },
  date: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: typography.fontFamilyMedium,
  },
  readButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  readButtonDisabled: {
    backgroundColor: colors.glassLight,
    shadowOpacity: 0,
  },
  readLabel: {
    color: colors.white,
    fontSize: 12,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
  },
  readLabelDisabled: {
    color: colors.textMuted,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
});