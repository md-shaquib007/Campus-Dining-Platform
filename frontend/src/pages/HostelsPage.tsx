import { useQuery } from '@tanstack/react-query';
import { hostelApi } from '@/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Users } from 'lucide-react';

export default function HostelsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['hostels'],
    queryFn: () => hostelApi.getAll().then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Hostels</h2>
        <p className="text-muted-foreground">Manage hostel blocks and capacity</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.data?.map((hostel) => (
            <Card key={hostel.id}>
              <CardContent className="pt-6">
                <h3 className="font-semibold">{hostel.name}</h3>
                <p className="text-sm text-muted-foreground">Code: {hostel.code}</p>
                <div className="flex items-center gap-4 mt-3 text-sm">
                  <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {hostel._count?.students ?? 0} students</span>
                  <span className="text-muted-foreground">Capacity: {hostel.capacity}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
