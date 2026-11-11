import { useQuery } from '@tanstack/react-query';
import {
  Star,
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  Users,
  Building2,
  Trash2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { analyticsApi } from '@/api';
import { useAuth } from '@/contexts/AuthContext';
import { StatCard, Skeleton } from '@/components/ui/Skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { getRatingColor } from '@/utils';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => analyticsApi.getDashboard().then((r) => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (user?.role === 'SUPER_ADMIN') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Platform Overview</h2>
          <p className="text-muted-foreground">Global analytics across all colleges</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Active Colleges" value={data?.colleges ?? 0} icon={Building2} />
          <StatCard title="Total Users" value={data?.users ?? 0} icon={Users} />
          <StatCard title="Total Ratings" value={data?.ratings ?? 0} icon={Star} />
          <StatCard title="Open Complaints" value={data?.openComplaints ?? 0} icon={AlertTriangle} />
        </div>
      </div>
    );
  }

  const cards = data?.cards;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back, {user?.firstName}! Here's your dining overview.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Rating"
          value={cards?.todayRating?.toFixed(1) ?? '—'}
          icon={Star}
          subtitle="Out of 5.0"
        />
        <StatCard
          title="Total Feedback"
          value={cards?.totalFeedback ?? 0}
          icon={MessageSquare}
        />
        <StatCard
          title="Pending Complaints"
          value={cards?.pendingComplaints ?? 0}
          icon={AlertTriangle}
        />
        <StatCard
          title="Weekly Satisfaction"
          value={`${cards?.weeklySatisfaction?.toFixed(1) ?? '—'}/5`}
          icon={TrendingUp}
          trend={{ value: 5, positive: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Ratings (7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.charts?.dailyRatings?.length ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data.charts.dailyRatings}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(d) => d.slice(5)} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="rating" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">No rating data yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Complaint Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.charts?.topComplaints?.length ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.charts.topComplaints} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="category" type="category" tick={{ fontSize: 10 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">No complaints recorded</p>
            )}
          </CardContent>
        </Card>
      </div>

      {data?.demandPrediction && (
        <Card>
          <CardHeader><CardTitle>Today's Lunch Demand Prediction</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><p className="text-muted-foreground">Total Students</p><p className="text-xl font-bold">{data.demandPrediction.totalStudents}</p></div>
              <div><p className="text-muted-foreground">Approved Skips</p><p className="text-xl font-bold">{data.demandPrediction.approvedSkips}</p></div>
              <div><p className="text-muted-foreground">Predicted Attendance</p><p className="text-xl font-bold text-green-600">{data.demandPrediction.predictedAttendance}</p></div>
              <div><p className="text-muted-foreground">Est. Waste</p><p className="text-xl font-bold text-orange-500">{data.demandPrediction.predictedWaste} plates</p></div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Monthly Satisfaction"
          value={
            <span className={getRatingColor(cards?.monthlySatisfaction ?? 0)}>
              {cards?.monthlySatisfaction?.toFixed(1) ?? '—'}/5
            </span>
          }
          icon={TrendingUp}
        />
        <StatCard
          title="Avg Hostel Rating"
          value={cards?.averageHostelRating?.toFixed(1) ?? '—'}
          icon={Star}
        />
        <StatCard
          title="Food Waste Estimate"
          value={cards?.foodWasteEstimate ?? 0}
          subtitle="Skipped meals this week"
          icon={Trash2}
        />
        {(cards?.slaBreaches ?? 0) > 0 && (
          <StatCard title="SLA Breaches" value={cards!.slaBreaches!} subtitle="Overdue complaints" icon={AlertTriangle} />
        )}
      </div>
    </div>
  );
}
