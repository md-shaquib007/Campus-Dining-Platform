import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { menuApi, menuMgmtApi } from '@/api';
import { useDiningHall } from '@/hooks/useDiningHall';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { MEAL_LABELS } from '@/utils';

export default function MenuManagementPage() {
  const queryClient = useQueryClient();
  const { data: diningHall } = useDiningHall();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [eventName, setEventName] = useState('');

  const { data: menu, isLoading } = useQuery({
    queryKey: ['menu', diningHall?.id, today],
    queryFn: () => menuApi.getMenu(diningHall!.id, today).then((r) => r.data.data),
    enabled: !!diningHall?.id,
    retry: false,
  });

  const createMenu = useMutation({
    mutationFn: () => menuMgmtApi.create({ diningHallId: diningHall!.id, menuDate: today }),
    onSuccess: () => { toast.success('Menu created'); queryClient.invalidateQueries({ queryKey: ['menu'] }); },
    onError: () => toast.error('Menu may already exist for today'),
  });

  const publishMenu = useMutation({
    mutationFn: (id: string) => menuMgmtApi.publish(id),
    onSuccess: () => { toast.success('Menu published! Students notified.'); queryClient.invalidateQueries({ queryKey: ['menu'] }); },
  });

  const createSpecial = useMutation({
    mutationFn: () =>
      menuMgmtApi.createSpecialEvent({
        diningHallId: diningHall!.id,
        menuDate: today,
        eventName,
        meals: [
          { mealType: 'LUNCH', dishes: [{ name: 'Biryani', isVegetarian: false }, { name: 'Raita', isVegetarian: true }] },
          { mealType: 'DINNER', dishes: [{ name: 'Gulab Jamun', isVegetarian: true, isSpecial: true }] },
        ],
      }),
    onSuccess: () => { toast.success('Special event menu created'); queryClient.invalidateQueries({ queryKey: ['menu'] }); },
  });

  if (!diningHall) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Menu Management</h2>
        <p className="text-muted-foreground">{diningHall.name} · {format(new Date(), 'MMMM d, yyyy')}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        {!menu && <Button onClick={() => createMenu.mutate()} disabled={createMenu.isPending}>Create Today's Menu</Button>}
        {menu && menu.status !== 'PUBLISHED' && (
          <Button onClick={() => publishMenu.mutate(menu.id)} disabled={publishMenu.isPending}>Publish Menu</Button>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Festival / Special Event Menu</CardTitle></CardHeader>
        <CardContent className="flex gap-3">
          <Input id="eventName" placeholder="Event name (e.g. Diwali Special)" value={eventName} onChange={(e) => setEventName(e.target.value)} className="max-w-xs" />
          <Button variant="outline" onClick={() => createSpecial.mutate()} disabled={!eventName || createSpecial.isPending}>Create Special Menu</Button>
        </CardContent>
      </Card>

      {isLoading && <Skeleton className="h-48" />}

      {menu && (
        <div className="space-y-3">
          <Badge variant={menu.status === 'PUBLISHED' ? 'success' : 'secondary'}>{menu.status}</Badge>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {menu.meals.map((meal) => (
              <Card key={meal.id}>
                <CardHeader className="pb-2"><CardTitle className="text-sm">{MEAL_LABELS[meal.mealType]}</CardTitle></CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-1">
                    {meal.dishes.map((d) => <li key={d.id}>{d.name}</li>)}
                    {meal.dishes.length === 0 && <li className="text-muted-foreground">No dishes — add via API</li>}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
