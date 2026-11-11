import { useQuery } from '@tanstack/react-query';
import { collegeApi } from '@/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';

export default function CollegesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['colleges'],
    queryFn: () => collegeApi.getAll().then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Colleges</h2>
        <p className="text-muted-foreground">Manage registered institutions</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.data?.map((college) => (
            <Card key={college.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{college.name}</h3>
                    <p className="text-sm text-muted-foreground">{college.city}, {college.state}</p>
                    <p className="text-xs text-muted-foreground mt-1">{college.slug}</p>
                  </div>
                  <Badge variant={college.isActive ? 'success' : 'secondary'}>
                    {college.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
