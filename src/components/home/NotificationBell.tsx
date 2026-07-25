/**
 * NotificationBell — glass icon button có badge số thông báo chưa đọc.
 */
import { useRouter } from 'expo-router';
import { useNotification } from '../../context/NotificationContext';
import { GlassIconButton } from '../../theme/uiPrimitives';

interface NotificationBellProps {
  tint?: string;
}

export function NotificationBell({ tint: _tint }: NotificationBellProps) {
  const router = useRouter();
  const { unreadCount } = useNotification();

  return (
    <GlassIconButton
      icon="notifications-outline"
      size={42}
      tint="light"
      badge={unreadCount}
      onPress={() => router.push('/notifications')}
      accessibilityLabel={
        unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Mở thông báo'
      }
    />
  );
}

export default NotificationBell;
