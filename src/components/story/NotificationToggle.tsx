import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  isSubscribedToNotification,
  subscribeNotification,
  unsubscribeNotification,
} from '../../services/notificationService';
import { getAuthToken } from '../../services/authService';
import { colors, radius, spacing } from '../../theme/colors';

interface NotificationToggleProps {
  seriesId: string;
  seriesTitle: string;
  /** Báo ngược lại khi user chưa đăng nhập (để mở LoginRequiredModal). */
  onLoginRequired?: () => void;
}

export function NotificationToggle({
  seriesId,
  seriesTitle,
  onLoginRequired,
}: NotificationToggleProps) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const token = await getAuthToken();
      if (!mounted) return;

      if (!token) {
        setLoading(false);
        setIsSubscribed(false);
        return;
      }

      try {
        const subscribed = await isSubscribedToNotification(seriesId);
        if (mounted) setIsSubscribed(subscribed);
      } catch {
        if (mounted) setIsSubscribed(false);
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
      if (isSubscribed) {
        await unsubscribeNotification(seriesId);
        setIsSubscribed(false);
      } else {
        await subscribeNotification(seriesId, seriesTitle);
        setIsSubscribed(true);
      }
    } catch {
      setIsSubscribed(isSubscribed);
    } finally {
      setBusy(false);
    }
  }, [busy, loading, isSubscribed, seriesId, seriesTitle, onLoginRequired]);

  return (
    <Pressable
      onPress={handlePress}
      disabled={loading || busy}
      style={({ pressed }) => [
        styles.button,
        isSubscribed && styles.buttonActive,
        pressed && styles.pressed,
      ]}
    >
      {loading || busy ? (
        <ActivityIndicator size="small" color={isSubscribed ? colors.accent : colors.textPrimary} />
      ) : (
        <>
          <Ionicons
            name={isSubscribed ? 'notifications' : 'notifications-outline'}
            size={18}
            color={isSubscribed ? colors.accent : colors.textPrimary}
          />
          <Text style={[styles.text, isSubscribed && styles.textActive]}>
            {isSubscribed ? 'Bật thông báo' : 'Thông báo'}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
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
  buttonActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  text: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  textActive: {
    color: colors.accent,
  },
  pressed: {
    opacity: 0.75,
  },
});
