import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Leaf, Flame, UtensilsCrossed } from 'lucide-react';
import { menuApi } from '@/api';
import { useDiningHall } from '@/hooks/useDiningHall';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton, EmptyState } from '@/components/ui/Skeleton';
import { MEAL_LABELS } from '@/utils';

export default function MenuPage() {
  const [date, setDate] = useState(new Date());
  const { data: diningHall, isLoading: hallLoading } = useDiningHall();
  const dateStr = format(date, 'yyyy-MM-dd');

  const { data: menu, isLoading, error } = useQuery({
    queryKey: ['menu', diningHall?.id, dateStr],
    queryFn: () => menuApi.getMenu(diningHall!.id, dateStr).then((r) => r.data.data),
    enabled: !!diningHall?.id,
    retry: false,
  });

  const changeDate = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d);
  };

  if (hallLoading) return <Skeleton className="h-64" />;

  if (!diningHall) {
    return (
      <EmptyState
        icon={UtensilsCrossed}
        title="No dining hall assigned"
        description="Contact your warden or college admin to link your hostel to a dining hall."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Daily Menu</h2>
          <p className="text-muted-foreground">{diningHall.name}{diningHall.hostel ? ` · ${diningHall.hostel.name}` : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => changeDate(-1)} className="p-2 rounded-lg hover:bg-accent" aria-label="Previous day">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-sm font-medium min-w-[120px] text-center">{format(date, 'EEE, MMM d yyyy')}</span>
          <button onClick={() => changeDate(1)} className="p-2 rounded-lg hover:bg-accent" aria-label="Next day">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      )}

      {error && (
        <EmptyState icon={UtensilsCrossed} title="No menu available" description={`No menu published for ${format(date, 'MMMM d, yyyy')}`} />
      )}

      {menu && (
        <>
          {menu.status === 'PUBLISHED' && (menu as { isSpecialEvent?: boolean; eventName?: string }).isSpecialEvent && (
            <Badge className="text-sm">{((menu as { eventName?: string }).eventName) || 'Special Event Menu'}</Badge>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {menu.meals.map((meal) => (
              <Card key={meal.id} className={!meal.isAvailable ? 'opacity-60' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{MEAL_LABELS[meal.mealType]}</CardTitle>
                    <Badge variant={meal.isAvailable ? 'success' : 'secondary'}>{meal.isAvailable ? 'Available' : 'Unavailable'}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {meal.dishes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No dishes listed</p>
                  ) : (
                    <ul className="space-y-2">
                      {meal.dishes.map((dish) => (
                        <li key={dish.id} className="flex items-start gap-2 text-sm">
                          {dish.isVegetarian ? <Leaf className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> : <Flame className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />}
                          <div>
                            <span className="font-medium">{dish.name}</span>
                            {dish.isSpecial && <Badge variant="outline" className="ml-2 text-xs">Special</Badge>}
                            {dish.calories && <span className="text-muted-foreground ml-2">{dish.calories} cal</span>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
