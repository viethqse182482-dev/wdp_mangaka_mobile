import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNotification } from '../../context/NotificationContext';
import { colors } from '../../theme/colors';

interface NotificationBellProps {
  tint?: string;
}

export function NotificationBell({ tint = colors.white }: NotificationBellProps) {
  const router = useRouter();
  const { unreadCount } = useNotification();

  const badge = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <Pressable
      onPress={() => router.push('/notifications')}
      hitSlop={8}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={
        unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Mở thông báo'
      }
    >
      <Ionicons name="notifications-outline" size={22} color={tint} />
      {unreadCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText} numberOfLines={1}>
            {badge}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
});

export default NotificationBell;