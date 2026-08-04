/**
 * PurchasedSeriesCard — một card gom các chapter đã mua của cùng một truyện.
 *
 * Mỗi card gồm:
 *  - ảnh bìa + tên truyện (nhấn để mở StoryDetail)
 *  - tổng số chapter đã mua
 *  - tổng Coin đã chi
 *  - chương gần nhất đã mua + thời gian mua gần nhất
 *  - badge "Đã mua"
 *  - nút "Đọc tiếp" → chapter có số lớn nhất
 *  - nút mở rộng/thu gọn danh sách chapter
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PurchasedChapterEntry } from '../../types/storyDetail';
import { formatReadTime } from '../../utils/formatReadTime';
import { formatCoinUnits } from '../../utils/coinUnit';
import { colors, radius, spacing, typography } from '../../theme/colors';
import { GlassCard } from '../../theme/uiPrimitives';
import { PurchasedChapterRow } from './PurchasedChapterRow';

export interface PurchasedSeriesGroup {
  /**
   * `null` khi series đã bị xoá nhưng purchase vẫn tồn tại.
   * Lúc đó card vẫn hiển thị để user thấy lịch sử mua, nhưng không mở được
   * detail và nút đọc bị disable.
   */
  seriesId: string | null;
  seriesName: string;
  seriesCoverUrl?: string;
  /** Tổng CoinUnit đã chi (đã dedupe theo `chapter_id`). */
  totalCoinUnit: number;
  /** ISO timestamp mua gần nhất, dùng để sort group ngoài danh sách. */
  latestPurchasedAt: string;
  /** Chapter gần nhất (chapterNumber lớn nhất). */
  latestChapter: PurchasedChapterEntry | null;
  /** Toàn bộ chapter đã mua — đã sort theo chapter_number giảm dần. */
  chapters: PurchasedChapterEntry[];
}

interface PurchasedSeriesCardProps {
  group: PurchasedSeriesGroup;
  onOpenSeries: (seriesId: string) => void;
  onReadChapter: (params: { seriesId: string; chapterNumber: number }) => void;
  /**
   * Khi `true`, nút "Đọc tiếp" ưu tiên chapter trong lịch sử đọc (nếu tìm thấy)
   * thay vì luôn lấy chapter có số lớn nhất.
   */
  historyChapterBySeries?: Record<string, number>;
}

export function PurchasedSeriesCard({
  group,
  onOpenSeries,
  onReadChapter,
  historyChapterBySeries,
}: PurchasedSeriesCardProps) {
  const [expanded, setExpanded] = useState(false);
  const seriesDisabled = !group.seriesId;

  const fallbackCover = (
    <View style={[styles.cover, styles.coverPlaceholder]}>
      <Ionicons name="book-outline" size={26} color={colors.textMuted} />
    </View>
  );

  const handleOpenSeries = () => {
    if (!group.seriesId) return;
    onOpenSeries(group.seriesId);
  };

  const handleContinue = () => {
    if (seriesDisabled) return;
    const seriesId = group.seriesId;
    if (!seriesId) return;

    // Ưu tiên lịch sử đọc nếu có và chapter đó cũng nằm trong danh sách đã mua.
    const lastRead = historyChapterBySeries?.[seriesId];
    const target =
      lastRead != null
        ? group.chapters.find((c) => c.chapterNumber === lastRead) ?? group.latestChapter
        : group.latestChapter;

    if (!target) return;
    onReadChapter({ seriesId, chapterNumber: target.chapterNumber });
  };

  const continueLabel = group.latestChapter
    ? `Đọc tiếp chương ${group.latestChapter.chapterNumber}`
    : 'Đã mua';

  return (
    <View style={styles.wrap}>
      <GlassCard
        tint="navy"
        depth={1}
        radius={radius.lg}
        innerStyle={styles.cardInner}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={handleOpenSeries}
            disabled={seriesDisabled}
            style={({ pressed }) => [
              styles.seriesPressable,
              pressed && !seriesDisabled && styles.pressed,
            ]}
          >
            <View style={styles.coverWrapper}>
              {group.seriesCoverUrl ? (
                <Image
                  source={{ uri: group.seriesCoverUrl }}
                  style={styles.cover}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                fallbackCover
              )}
            </View>
            <View style={styles.headerInfo}>
              <View style={styles.titleRow}>
                <Text style={styles.seriesName} numberOfLines={2}>
                  {group.seriesName || 'Truyện không còn tồn tại'}
                </Text>
                <View style={styles.badge}>
                  <Ionicons name="checkmark-circle" size={11} color={colors.success} />
                  <Text style={styles.badgeText}>Đã mua</Text>
                </View>
              </View>
              <Text style={styles.metaLine}>
                {group.chapters.length} chương đã mua • Đã chi{' '}
                {formatCoinUnits(group.totalCoinUnit)} Coin
              </Text>
              <Text style={styles.subMeta}>
                Gần nhất: Chương {group.latestChapter?.chapterNumber ?? '—'}
                {group.latestChapter
                  ? ` • mua ${formatReadTime(group.latestChapter.purchasedAt) || '—'}`
                  : ''}
              </Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={handleContinue}
            disabled={seriesDisabled || !group.latestChapter}
            style={({ pressed }) => [
              styles.continueButton,
              (seriesDisabled || !group.latestChapter) && styles.continueButtonDisabled,
              pressed &&
                !(seriesDisabled || !group.latestChapter) &&
                styles.pressed,
            ]}
          >
            <Ionicons
              name="book"
              size={15}
              color={
                seriesDisabled || !group.latestChapter
                  ? colors.textMuted
                  : colors.white
              }
            />
            <Text
              style={[
                styles.continueLabel,
                (seriesDisabled || !group.latestChapter) && styles.continueLabelDisabled,
              ]}
            >
              {continueLabel}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setExpanded((v) => !v)}
            style={({ pressed }) => [styles.expandButton, pressed && styles.pressed]}
            hitSlop={6}
          >
            <Text style={styles.expandLabel}>
              {expanded ? 'Thu gọn' : `Xem ${group.chapters.length} chương`}
            </Text>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={colors.accentLight}
            />
          </Pressable>
        </View>

        {expanded ? (
          <View style={styles.chapterList}>
            {group.chapters.map((chapter) => (
              <PurchasedChapterRow
                key={chapter.id}
                entry={chapter}
                disabled={seriesDisabled}
                onPress={onReadChapter}
              />
            ))}
          </View>
        ) : null}
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  cardInner: {
    padding: spacing.md,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
  },
  seriesPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  coverWrapper: {
    width: 64,
    height: 92,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    shadowColor: colors.accent,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  seriesName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
    lineHeight: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  badgeText: {
    color: colors.success,
    fontSize: 10,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '800',
  },
  metaLine: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 6,
    fontFamily: typography.fontFamilyMedium,
  },
  subMeta: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    fontFamily: typography.fontFamilyMedium,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  continueButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  continueButtonDisabled: {
    backgroundColor: colors.glassLight,
    shadowOpacity: 0,
  },
  continueLabel: {
    color: colors.white,
    fontSize: 13,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
  },
  continueLabelDisabled: {
    color: colors.textMuted,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.glassLight,
  },
  expandLabel: {
    color: colors.accentLight,
    fontSize: 12,
    fontFamily: typography.fontFamilyBold,
    fontWeight: '700',
  },
  chapterList: {
    marginTop: spacing.xs,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});