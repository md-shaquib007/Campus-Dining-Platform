import { useQuery } from '@tanstack/react-query';
import { Pin } from 'lucide-react';
import { announcementApi } from '@/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton, EmptyState } from '@/components/ui/Skeleton';
import { formatDate } from '@/utils';
import { MessageSquare } from 'lucide-react';

export default function AnnouncementsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => announcementApi.getAll().then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Announcements</h2>
        <p className="text-muted-foreground">Latest updates from hostel management</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : !data?.data?.length ? (
        <EmptyState icon={MessageSquare} title="No announcements" description="Management hasn't posted any announcements yet." />
      ) : (
        <div className="space-y-3">
          {data.data.map((a) => (
            <Card key={a.id} className={a.isPinned ? 'border-primary/50' : ''}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  {a.isPinned && <Pin className="h-4 w-4 text-primary mt-1 shrink-0" />}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{a.title}</h3>
                      <Badge variant="outline">{a.type.replace(/_/g, ' ')}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{a.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">{formatDate(a.publishedAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
