import { usePathname, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const ADMIN_PREFIX = '/admin';

export function getRoleHome(role: string): string {
  if (role === 'Admin') return '/admin/dashboard';
  if (role === 'Assistant' || role === 'Mangaka') return '/profile';
  return '/';
}

export function RoleRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready } = useAuth();

  useEffect(() => {
    if (!ready) return;

    if (!user) {
      if (pathname.startsWith(ADMIN_PREFIX) || pathname === '/profile' || pathname === '/creator-wallet' || pathname === '/bank-information') {
        router.replace('/login' as never);
      }
      return;
    }

    // LoginScreen phát auth event ngay sau khi lưu session. Trong một số lần
    // điều hướng, Stack đã dựng màn hình theo role ở phía sau nhưng /login vẫn
    // còn là màn hình hiện tại. Không cho session hợp lệ lưu lại trên /login.
    if (pathname === '/login') {
      router.replace(getRoleHome(user.role) as never);
      return;
    }

    const isAdminRoute = pathname.startsWith(ADMIN_PREFIX);
    if (user.role === 'Reader') {
      if (isAdminRoute) router.replace('/');
      else if (pathname === '/creator-wallet' || pathname === '/bank-information') router.replace('/profile' as never);
      return;
    }

    if (user.role === 'Admin') {
      if (!isAdminRoute && pathname !== '/profile') {
        router.replace('/admin/dashboard' as never);
      }
      return;
    }

    if (pathname !== '/profile' && pathname !== '/creator-wallet' && pathname !== '/bank-information') {
      router.replace('/profile' as never);
    }
  }, [pathname, ready, router, user]);

  return <>{children}</>;
}
