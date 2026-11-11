import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi, diningHallApi } from '@/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatCard, Skeleton } from '@/components/ui/Skeleton';
import { getRatingColor } from '@/utils';

export default function ContractorScorecardPage() {
  const { user } = useAuth();
  const [selectedContractorId, setSelectedContractorId] = useState<string | null>(null);

  const { data: diningHalls } = useQuery({
    queryKey: ['dining-halls'],
    queryFn: () => diningHallApi.getAll().then((r) => r.data.data),
    enabled: user?.role !== 'MESS_OPERATOR',
  });

  const availableContractors = diningHalls
    ?.filter((h) => h.contractorId && h.contractor)
    .map((h) => h.contractor!);

  const activeContractorId =
    user?.contractor?.id ||
    selectedContractorId ||
    diningHalls?.find((h) => h.contractorId)?.contractorId ||
    null;

  const { data, isLoading } = useQuery({
    queryKey: ['contractor-scorecard', activeContractorId],
    queryFn: () => analyticsApi.getContractorScorecard(activeContractorId!).then((r) => r.data.data),
    enabled: !!activeContractorId,
  });

  const { data: summary } = useQuery({
    queryKey: ['executive-summary'],
    queryFn: () => analyticsApi.getExecutiveSummary().then((r) => r.data.data?.summary),
    enabled: user?.role === 'COLLEGE_ADMIN' || user?.role === 'WARDEN',
  });

  if (isLoading) return <Skeleton className="h-64" />;

  const performance = data?.performance as { averageRating?: number; totalRatings?: number; complaintCount?: number; performanceScore?: number } | undefined;
  const contractor = data?.contractor as { companyName?: string; user?: { firstName: string; lastName: string } } | undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Contractor Scorecard</h2>
          <p className="text-muted-foreground">{contractor?.companyName ?? 'Performance overview'}</p>
        </div>
        {availableContractors && availableContractors.length > 1 && (
          <select
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            value={activeContractorId || ''}
            onChange={(e) => setSelectedContractorId(e.target.value)}
          >
            {availableContractors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Performance Score" value={`${performance?.performanceScore ?? 0}/100`} />
        <StatCard title="Average Rating" value={<span className={getRatingColor(performance?.averageRating ?? 0)}>{performance?.averageRating ?? '—'}/5</span>} />
        <StatCard title="Total Ratings" value={performance?.totalRatings ?? 0} />
        <StatCard title="Complaints" value={performance?.complaintCount ?? 0} />
      </div>

      {summary && (
        <Card>
          <CardHeader><CardTitle>AI Executive Summary</CardTitle></CardHeader>
          <CardContent><p className="text-sm leading-relaxed">{summary}</p></CardContent>
        </Card>
      )}
    </div>
  );
}
