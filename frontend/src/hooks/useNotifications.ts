import { useQuery } from '@tanstack/react-query';
import { notificationApi } from '@/api';

export function useUnreadNotifications() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationApi.getUnreadCount().then((r) => r.data.data?.count ?? 0),
    refetchInterval: 30000,
  });
}
