import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { menuApi, ratingApi } from '@/api';
import { useDiningHall } from '@/hooks/useDiningHall';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RatingCriteriaForm } from '@/components/RatingForm';
import { Skeleton } from '@/components/ui/Skeleton';
import { MEAL_LABELS } from '@/utils';

const DEFAULT_CRITERIA = { taste: 0, quality: 0, quantity: 0, hygiene: 0, variety: 0, temperature: 0, overall: 0 };

export default function RateMealPage() {
  const { user, refreshUser } = useAuth();
  const { data: diningHall } = useDiningHall();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);
  const [criteria, setCriteria] = useState(DEFAULT_CRITERIA);
  const [submitting, setSubmitting] = useState(false);

  const { data: menu } = useQuery({
    queryKey: ['menu', diningHall?.id, today],
    queryFn: () => menuApi.getMenu(diningHall!.id, today).then((r) => r.data.data),
    enabled: !!diningHall?.id,
  });

  const handleSubmit = async () => {
    if (!selectedMeal) return;
    if (Object.values(criteria).some((v) => v === 0)) {
      toast.error('Please rate all criteria');
      return;
    }
    setSubmitting(true);
    try {
      await ratingApi.create({ mealId: selectedMeal, ...criteria });
      await refreshUser();
      toast.success(`Rating submitted! Streak: ${(user?.ratingStreak ?? 0) + 1} days`);
      setSelectedMeal(null);
      setCriteria(DEFAULT_CRITERIA);
    } catch {
      toast.error('Failed to submit rating. You may have already rated this meal.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!diningHall) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Rate Today's Meal</h2>
          <p className="text-muted-foreground">Help us improve by rating your dining experience</p>
        </div>
        {(user?.ratingStreak ?? 0) > 0 && (
          <Badge variant="success">{user?.ratingStreak} day streak</Badge>
        )}
      </div>

      {!selectedMeal ? (
        <div className="grid grid-cols-2 gap-3">
          {menu?.meals.map((meal) => (
            <button
              key={meal.id}
              onClick={() => setSelectedMeal(meal.id)}
              className="p-4 rounded-xl border border-border hover:border-primary hover:bg-accent transition-colors text-left"
            >
              <p className="font-medium">{MEAL_LABELS[meal.mealType]}</p>
              <p className="text-xs text-muted-foreground mt-1">{meal.dishes.length} dishes</p>
            </button>
          )) ?? <Skeleton className="h-24 col-span-2" />}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Rate {MEAL_LABELS[menu?.meals.find((m) => m.id === selectedMeal)?.mealType ?? '']}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <RatingCriteriaForm criteria={criteria} onChange={(key, value) => setCriteria((c) => ({ ...c, [key]: value }))} />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setSelectedMeal(null); setCriteria(DEFAULT_CRITERIA); }}>Back</Button>
              <Button onClick={handleSubmit} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Rating'}</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
