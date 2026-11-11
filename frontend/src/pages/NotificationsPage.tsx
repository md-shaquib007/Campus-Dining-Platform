import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '@/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton, EmptyState } from '@/components/ui/Skeleton';
import { formatDate } from '@/utils';
import { Bell } from 'lucide-react';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getAll().then((r) => r.data),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold">Notifications</h2>
        <p className="text-muted-foreground">Stay updated on dining activities</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : !data?.data?.length ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="space-y-2">
          {data.data.map((n) => (
            <Card key={n.id} className={!n.isRead ? 'border-primary/30 bg-primary/5' : ''}>
              <CardContent className="pt-3 pb-3 flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-sm">{n.title}</p>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(n.createdAt)}</p>
                </div>
                {!n.isRead && (
                  <Button size="sm" variant="ghost" onClick={() => markRead.mutate(n.id)}>Mark read</Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
