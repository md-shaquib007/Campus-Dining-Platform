import { useQuery } from '@tanstack/react-query';
import { auditApi } from '@/api';
import { formatDate } from '@/utils';
import { Skeleton, EmptyState } from '@/components/ui/Skeleton';
import { Shield } from 'lucide-react';

export default function AuditLogsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => auditApi.getAll().then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Audit Logs</h2>
        <p className="text-muted-foreground">Track all administrative actions for accountability</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
      ) : !data?.data?.length ? (
        <EmptyState icon={Shield} title="No audit logs" description="Actions will appear here as users interact with the system." />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3">Action</th>
                <th className="text-left p-3">Entity</th>
                <th className="text-left p-3">User</th>
                <th className="text-left p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((log) => (
                <tr key={log.id} className="border-t border-border">
                  <td className="p-3 font-medium">{log.action}</td>
                  <td className="p-3">{log.entity}{log.entityId ? ` #${log.entityId.slice(0, 8)}` : ''}</td>
                  <td className="p-3">{log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}</td>
                  <td className="p-3 text-muted-foreground">{formatDate(log.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
