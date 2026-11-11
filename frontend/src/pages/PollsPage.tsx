import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import toast from 'react-hot-toast';
import { pollApi } from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton, EmptyState } from '@/components/ui/Skeleton';
import { Vote } from 'lucide-react';

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];

export default function PollsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['polls'],
    queryFn: () => pollApi.getAll().then((r) => r.data.data),
  });

  const voteMutation = useMutation({
    mutationFn: ({ pollId, optionId }: { pollId: string; optionId: string }) =>
      pollApi.vote(pollId, optionId),
    onSuccess: () => {
      toast.success('Vote recorded!');
      queryClient.invalidateQueries({ queryKey: ['polls'] });
    },
    onError: () => toast.error('You may have already voted'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Polls</h2>
        <p className="text-muted-foreground">Vote on menu decisions and dining preferences</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      ) : !data?.length ? (
        <EmptyState icon={Vote} title="No active polls" description="Check back later for new polls from management." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {data.map((poll) => {
            const totalVotes = poll.options.reduce((s, o) => s + o.voteCount, 0);
            const chartData = poll.options.map((o) => ({ name: o.text, value: o.voteCount }));

            return (
              <Card key={poll.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{poll.title}</CardTitle>
                    <Badge>{poll.status}</Badge>
                  </div>
                  {poll.description && <p className="text-sm text-muted-foreground">{poll.description}</p>}
                </CardHeader>
                <CardContent className="space-y-4">
                  {poll.status === 'ACTIVE' && (
                    <div className="space-y-2">
                      {poll.options.map((option) => (
                        <Button
                          key={option.id}
                          variant="outline"
                          className="w-full justify-between"
                          onClick={() => voteMutation.mutate({ pollId: poll.id, optionId: option.id })}
                        >
                          {option.text}
                          <span className="text-muted-foreground">{option.voteCount} votes</span>
                        </Button>
                      ))}
                    </div>
                  )}
                  {totalVotes > 0 && (
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60}>
                          {chartData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
