import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { analyticsApi } from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatCard, Skeleton } from '@/components/ui/Skeleton';

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => analyticsApi.getDashboard().then((r) => r.data.data),
  });

  if (isLoading) return <Skeleton className="h-96" />;

  const cards = data?.cards;
  const charts = data?.charts;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Analytics</h2>
        <p className="text-muted-foreground">Deep dive into dining performance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Monthly Satisfaction" value={`${cards?.monthlySatisfaction?.toFixed(1) ?? '—'}/5`} />
        <StatCard title="Weekly Satisfaction" value={`${cards?.weeklySatisfaction?.toFixed(1) ?? '—'}/5`} />
        <StatCard title="Food Waste (skips/week)" value={cards?.foodWasteEstimate ?? 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Rating Trends</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={charts?.dailyRatings ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Line type="monotone" dataKey="rating" stroke="var(--color-primary)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Hostel Comparison</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charts?.hostelComparison ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="students" fill="var(--color-primary)" name="Students" />
                <Bar dataKey="skips" fill="var(--color-destructive)" name="Skips" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
