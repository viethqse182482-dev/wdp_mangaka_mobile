import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text } from 'react-native';
import {
  addToBookshelf,
  checkBookshelfStatus,
  removeFromBookshelf,
} from '../../services/bookshelfService';
import { getAuthToken } from '../../services/authService';
import { colors, radius, spacing } from '../../theme/colors';

export type BookshelfButtonVariant = 'icon' | 'pill' | 'row';

interface BookshelfButtonProps {
  seriesId: string;
  variant?: BookshelfButtonVariant;
  /** Báo ngược lại khi user đã login nhưng bấm mà chưa đăng nhập (để mở LoginRequiredModal). */
  onLoginRequired?: () => void;
  /** Báo trạng thái mới sau khi toggle. */
  onChange?: (inBookshelf: boolean) => void;
}

export function BookshelfButton({
  seriesId,
  variant = 'icon',
  onLoginRequired,
  onChange,
}: BookshelfButtonProps) {
  const [inBookshelf, setInBookshelf] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const token = await getAuthToken();
      if (!mounted) return;

      if (!token) {
        setLoading(false);
        setInBookshelf(false);
        return;
      }

      try {
        const map = await checkBookshelfStatus([seriesId]);
        if (mounted) setInBookshelf(Boolean(map[seriesId]));
      } catch {
        if (mounted) setInBookshelf(false);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [seriesId]);

  const handlePress = useCallback(async () => {
    if (busy || loading) return;

    const token = await getAuthToken();
    if (!token) {
      onLoginRequired?.();
      return;
    }

    setBusy(true);
    try {
      if (inBookshelf) {
        await removeFromBookshelf(seriesId);
        setInBookshelf(false);
        onChange?.(false);
      } else {
        await addToBookshelf(seriesId);
        setInBookshelf(true);
        onChange?.(true);
      }
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : String(err);
      const isAuthError =
        err instanceof Error && (err as { status?: number }).status === 401;

      if (errMessage === 'UNAUTHENTICATED' || isAuthError) {
        onLoginRequired?.();
      } else {
        Alert.alert('Không thể cập nhật tủ sách', errMessage);
      }
    } finally {
      setBusy(false);
    }
  }, [busy, loading, inBookshelf, seriesId, onLoginRequired, onChange]);

  const label = inBookshelf ? 'Đã lưu' : 'Lưu vào tủ sách';
  const iconName = inBookshelf ? 'bookmark' : 'bookmark-outline';

  if (variant === 'icon') {
    return (
      <Pressable
        onPress={handlePress}
        disabled={loading || busy}
        hitSlop={8}
        style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
      >
        {loading || busy ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : (
          <Ionicons
            name={iconName}
            size={22}
            color={inBookshelf ? colors.accent : colors.textPrimary}
          />
        )}
      </Pressable>
    );
  }

  if (variant === 'row') {
    return (
      <Pressable
        onPress={handlePress}
        disabled={loading || busy}
        hitSlop={8}
        style={({ pressed }) => [
          styles.rowButton,
          inBookshelf && styles.rowButtonActive,
          pressed && styles.pressed,
        ]}
      >
        {loading || busy ? (
          <ActivityIndicator size="small" color={inBookshelf ? colors.accent : colors.textPrimary} />
        ) : (
          <Ionicons
            name={iconName}
            size={18}
            color={inBookshelf ? colors.accent : colors.textPrimary}
          />
        )}
      </Pressable>
    );
  }

  // variant === 'pill' (dùng trong StoryActionBar)
  return (
    <Pressable
      onPress={handlePress}
      disabled={loading || busy}
      style={({ pressed }) => [
        styles.pill,
        inBookshelf && styles.pillActive,
        pressed && styles.pressed,
      ]}
    >
      {loading || busy ? (
        <ActivityIndicator size="small" color={inBookshelf ? colors.accent : colors.textPrimary} />
      ) : (
        <Ionicons
          name={iconName}
          size={18}
          color={inBookshelf ? colors.accent : colors.textPrimary}
        />
      )}
      <Text style={[styles.pillText, inBookshelf && styles.pillTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
  },
  pillActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  pillText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  pillTextActive: {
    color: colors.accent,
  },
  rowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowButtonActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  pressed: {
    opacity: 0.75,
  },
});