import { useQuery } from '@tanstack/react-query';
import { studentApi } from '@/api';
import { Input } from '@/components/ui/Input';
import { Skeleton, EmptyState } from '@/components/ui/Skeleton';
import { Users } from 'lucide-react';
import { useState } from 'react';

export default function StudentsPage() {
  const [search, setSearch] = useState('');
  const [submitted, setSubmitted] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['students', submitted],
    queryFn: () => studentApi.getAll({ search: submitted || undefined }).then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Students</h2>
        <p className="text-muted-foreground">Manage enrolled students across hostels</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); setSubmitted(search); }} className="max-w-sm">
        <Input id="search" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </form>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : !data?.data?.length ? (
        <EmptyState icon={Users} title="No students found" description="Add students via the API or onboarding wizard." />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium">Roll No.</th>
                <th className="text-left p-3 font-medium">Hostel</th>
                <th className="text-left p-3 font-medium">Department</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((s) => (
                <tr key={s.id} className="border-t border-border hover:bg-muted/30">
                  <td className="p-3">
                    <p className="font-medium">{s.firstName} {s.lastName}</p>
                    <p className="text-xs text-muted-foreground">{s.email}</p>
                  </td>
                  <td className="p-3">{s.student?.rollNumber ?? '—'}</td>
                  <td className="p-3">{s.student?.hostel?.name ?? '—'}</td>
                  <td className="p-3">{s.student?.department ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
