import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import { getAuthToken } from '../../services/authService';
import {
  followAuthor,
  getFollowAuthorStatus,
  unfollowAuthor,
} from '../../services/followAuthorService';
import { colors, radius, spacing } from '../../theme/colors';

interface FollowAuthorButtonProps {
  authorId: string;
  authorName?: string;
  /** Báo ngược lại khi user chưa đăng nhập. */
  onLoginRequired?: () => void;
  variant?: 'pill' | 'compact';
}

/**
 * Nút theo dõi tác giả. Khi theo dõi, user sẽ nhận notification khi tác giả
 * ra series mới (status chuyển sang published + is_public).
 */
export function FollowAuthorButton({
  authorId,
  authorName,
  onLoginRequired,
  variant = 'pill',
}: FollowAuthorButtonProps) {
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const token = await getAuthToken();
      if (!mounted) return;
      if (!token) {
        setLoading(false);
        setFollowing(false);
        return;
      }
      try {
        const status = await getFollowAuthorStatus(authorId);
        if (mounted) setFollowing(status);
      } catch {
        if (mounted) setFollowing(false);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [authorId]);

  const handlePress = useCallback(async () => {
    if (busy || loading) return;
    const token = await getAuthToken();
    if (!token) {
      onLoginRequired?.();
      return;
    }
    setBusy(true);
    try {
      if (following) {
        await unfollowAuthor(authorId);
        setFollowing(false);
      } else {
        await followAuthor(authorId);
        setFollowing(true);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert('Không thể cập nhật', msg);
    } finally {
      setBusy(false);
    }
  }, [authorId, authorName, busy, following, loading, onLoginRequired]);

  const isCompact = variant === 'compact';

  return (
    <Pressable
      onPress={handlePress}
      disabled={loading || busy}
      style={({ pressed }) => [
        isCompact ? styles.compact : styles.pill,
        following && !isCompact && styles.pillActive,
        following && isCompact && styles.compactActive,
        pressed && styles.pressed,
      ]}
    >
      {loading || busy ? (
        <ActivityIndicator
          size="small"
          color={
            following
              ? isCompact
                ? colors.accent
                : colors.white
              : colors.textPrimary
          }
        />
      ) : (
        <>
          <Ionicons
            name={following ? 'person' : 'person-add-outline'}
            size={isCompact ? 16 : 18}
            color={
              following
                ? isCompact
                  ? colors.accent
                  : colors.white
                : colors.textPrimary
            }
          />
          <Text
            style={[
              isCompact ? styles.compactText : styles.text,
              following && !isCompact && styles.textActive,
              following && isCompact && styles.compactTextActive,
            ]}
            numberOfLines={1}
          >
            {following ? 'Đang theo dõi' : 'Theo dõi tác giả'}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  pillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minWidth: 40,
    height: 36,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  compactActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  text: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  textActive: {
    color: colors.white,
  },
  compactText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  compactTextActive: {
    color: colors.accent,
  },
  pressed: {
    opacity: 0.75,
  },
});