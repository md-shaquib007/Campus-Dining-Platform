import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import { complaintApi } from '@/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton, EmptyState } from '@/components/ui/Skeleton';
import { formatDate, COMPLAINT_STATUS_COLORS } from '@/utils';
import { AlertTriangle } from 'lucide-react';

const schema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  category: z.enum(['BAD_TASTE', 'COLD_FOOD', 'HYGIENE_ISSUE', 'FOREIGN_OBJECT', 'DELAY', 'QUANTITY_ISSUE', 'STAFF_BEHAVIOUR', 'OTHER']),
});

type Form = z.infer<typeof schema>;

export default function ComplaintsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const isStaff = user?.role === 'WARDEN' || user?.role === 'COLLEGE_ADMIN';

  const { data, isLoading } = useQuery({
    queryKey: ['complaints', page],
    queryFn: () => complaintApi.getAll({ page }).then((r) => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { category: 'BAD_TASTE' },
  });

  const createMutation = useMutation({
    mutationFn: (data: Form) => complaintApi.create(data),
    onSuccess: () => {
      toast.success('Complaint filed');
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      reset();
      setShowForm(false);
    },
    onError: () => toast.error('Failed to file complaint'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      complaintApi.update(id, { status }),
    onSuccess: () => {
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Complaints</h2>
          <p className="text-muted-foreground">Track and resolve dining issues</p>
        </div>
        {!isStaff && (
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4" /> File Complaint
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
              <Input id="title" label="Title" error={errors.title?.message} {...register('title')} />
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Category</label>
                <select className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" {...register('category')}>
                  {['BAD_TASTE', 'COLD_FOOD', 'HYGIENE_ISSUE', 'FOREIGN_OBJECT', 'DELAY', 'QUANTITY_ISSUE', 'STAFF_BEHAVIOUR', 'OTHER'].map((c) => (
                    <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  {...register('description')}
                />
                {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending}>Submit</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : !data?.data?.length ? (
        <EmptyState icon={AlertTriangle} title="No complaints" description="All clear! No complaints filed yet." />
      ) : (
        <div className="space-y-3">
          {data.data.map((c) => (
            <Card key={c.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{c.title}</h3>
                      <Badge className={COMPLAINT_STATUS_COLORS[c.status]}>{c.status.replace(/_/g, ' ')}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{c.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {c.category.replace(/_/g, ' ')} · {formatDate(c.createdAt)}
                      {c.user && ` · ${c.user.firstName} ${c.user.lastName}`}
                    </p>
                  </div>
                  {isStaff && c.status === 'OPEN' && (
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" onClick={() => updateMutation.mutate({ id: c.id, status: 'IN_PROGRESS' })}>
                        Accept
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ id: c.id, status: 'RESOLVED' })}>
                        Resolve
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {data.meta && data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {data.meta.page} of {data.meta.totalPages}</span>
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(data.meta!.totalPages, p + 1))} disabled={page >= data.meta.totalPages}>
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
