import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { mealSkipApi } from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MEAL_TYPES, MEAL_LABELS } from '@/utils';

const schema = z.object({
  skipDate: z.string(),
  mealType: z.enum(['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER']),
  reason: z.enum(['GOING_HOME', 'FASTING', 'MEDICAL', 'VACATION', 'OTHER']),
  notes: z.string().optional(),
});

type Form = z.infer<typeof schema>;

export default function SkipMealPage() {
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      skipDate: new Date().toISOString().split('T')[0],
      mealType: 'LUNCH',
      reason: 'GOING_HOME',
    },
  });

  const onSubmit = async (data: Form) => {
    setSubmitting(true);
    try {
      await mealSkipApi.create(data);
      toast.success('Meal skip request submitted for approval');
    } catch {
      toast.error('Failed to submit skip request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h2 className="text-2xl font-bold">Skip Meal</h2>
        <p className="text-muted-foreground">Help reduce food waste by notifying in advance</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request Meal Skip</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Date</label>
              <input type="date" className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" {...register('skipDate')} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Meal</label>
              <select className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" {...register('mealType')}>
                {MEAL_TYPES.map((m) => (
                  <option key={m} value={m}>{MEAL_LABELS[m]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Reason</label>
              <select className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" {...register('reason')}>
                {['GOING_HOME', 'FASTING', 'MEDICAL', 'VACATION', 'OTHER'].map((r) => (
                  <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Notes (optional)</label>
              <textarea className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" {...register('notes')} />
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Skip Request'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
