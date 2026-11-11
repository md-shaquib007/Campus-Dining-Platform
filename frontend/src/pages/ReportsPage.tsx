import { useState } from 'react';
import toast from 'react-hot-toast';
import { Download } from 'lucide-react';
import { reportApi } from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const REPORT_TYPES = [
  { type: 'DAILY', label: 'Daily Report', desc: 'Today\'s ratings, complaints, and skips' },
  { type: 'WEEKLY', label: 'Weekly Report', desc: '7-day summary with trends' },
  { type: 'MONTHLY', label: 'Monthly Report', desc: 'Full month analytics' },
  { type: 'SEMESTER', label: 'Semester Report', desc: 'Semester-wide overview' },
  { type: 'YEARLY', label: 'Yearly Report', desc: 'Annual performance review' },
];

export default function ReportsPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const generate = async (type: string, format: string) => {
    setLoading(`${type}-${format}`);
    try {
      const endDate = new Date();
      const startDate = new Date();
      switch (type) {
        case 'DAILY':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'WEEKLY':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'MONTHLY':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'SEMESTER':
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case 'YEARLY':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      const response = await reportApi.generate({
        type,
        format,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cdip-${type.toLowerCase()}-report.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Report downloaded');
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Reports</h2>
        <p className="text-muted-foreground">Export dining analytics and feedback data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORT_TYPES.map((report) => (
          <Card key={report.type}>
            <CardHeader>
              <CardTitle className="text-base">{report.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{report.desc}</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => generate(report.type, 'CSV')}
                  disabled={loading === `${report.type}-CSV`}
                >
                  <Download className="h-4 w-4" /> CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
