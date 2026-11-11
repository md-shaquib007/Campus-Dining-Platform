import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { searchApi } from '@/api';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['search', submitted],
    queryFn: () => searchApi.search(submitted).then((r) => r.data.data),
    enabled: submitted.length >= 2,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(query);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold">Search</h2>
        <p className="text-muted-foreground">Find students, complaints, menus, and more</p>
      </div>

      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="search"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
      </form>

      {isLoading && <p className="text-muted-foreground text-sm">Searching...</p>}

      {data && Object.entries(data).map(([type, items]) => {
        const list = items as Array<Record<string, unknown>>;
        if (!list.length) return null;
        return (
          <div key={type}>
            <h3 className="font-medium capitalize mb-2">{type}</h3>
            <div className="space-y-2">
              {list.map((item, i) => {
                const displayName = item.title || item.name || [item.firstName, item.lastName].filter(Boolean).join(' ') || 'Unknown';
                return (
                  <Card key={String(item.id || item.slug || i)}>
                    <CardContent className="pt-3 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {String(displayName)}
                        </span>
                        {item.status != null && <Badge variant="outline">{String(item.status)}</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
