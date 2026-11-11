import { useQuery } from '@tanstack/react-query';
import { diningHallApi } from '@/api';

export function useDiningHall() {
  return useQuery({
    queryKey: ['dining-hall', 'me'],
    queryFn: () => diningHallApi.getMyHall().then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  });
}
