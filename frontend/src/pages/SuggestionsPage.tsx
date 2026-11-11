import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ThumbsUp, Lightbulb } from 'lucide-react';
import { suggestionApi } from '@/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton, EmptyState } from '@/components/ui/Skeleton';

const schema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  category: z.enum(['NEW_DISH', 'BETTER_TIMING', 'BETTER_QUALITY', 'FESTIVAL_MENU', 'OTHER']),
});

type Form = z.infer<typeof schema>;

export default function SuggestionsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['suggestions'],
    queryFn: () => suggestionApi.getAll().then((r) => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { category: 'NEW_DISH' },
  });

  const createMutation = useMutation({
    mutationFn: (data: Form) => suggestionApi.create(data),
    onSuccess: () => {
      toast.success('Suggestion submitted!');
      queryClient.invalidateQueries({ queryKey: ['suggestions'] });
      reset();
    },
  });

  const upvoteMutation = useMutation({
    mutationFn: (id: string) => suggestionApi.upvote(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suggestions'] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Suggestions</h2>
        <p className="text-muted-foreground">Share ideas to improve dining experience</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
            <Input id="title" label="Title" error={errors.title?.message} {...register('title')} />
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Category</label>
              <select className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" {...register('category')}>
                {['NEW_DISH', 'BETTER_TIMING', 'BETTER_QUALITY', 'FESTIVAL_MENU', 'OTHER'].map((c) => (
                  <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description</label>
              <textarea className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" {...register('description')} />
            </div>
            <Button type="submit" disabled={createMutation.isPending}>Submit Suggestion</Button>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : !data?.data?.length ? (
        <EmptyState icon={Lightbulb} title="No suggestions yet" description="Be the first to share an idea!" />
      ) : (
        <div className="space-y-3">
          {data.data.map((s) => (
            <Card key={s.id}>
              <CardContent className="pt-4 flex items-start gap-4">
                <button
                  onClick={() => upvoteMutation.mutate(s.id)}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span className="text-xs font-medium">{s.upvotes}</span>
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{s.title}</h3>
                    <Badge variant="outline">{s.category.replace(/_/g, ' ')}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
                  {s.user && <p className="text-xs text-muted-foreground mt-2">by {s.user.firstName} {s.user.lastName}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
