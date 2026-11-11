import { useState } from 'react';
import { QrCode, Search, CheckCircle, UserCheck, ShieldAlert } from 'lucide-react';
import { attendanceApi } from '@/api';
import toast from 'react-hot-toast';

export default function AttendanceScanPage() {
  const [rollNumber, setRollNumber] = useState('');
  const [qrTokenInput, setQrTokenInput] = useState('');
  const [mealType, setMealType] = useState('LUNCH');
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    student: { name: string; rollNumber: string; hostelName: string; avatar?: string };
    isMealSkipped: boolean;
    message: string;
  } | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNumber.trim() && !qrTokenInput.trim()) {
      toast.error('Please enter a roll number or scan a QR token');
      return;
    }

    setLoading(true);
    setScanResult(null);

    try {
      const res = await attendanceApi.scan({
        token: qrTokenInput.trim() || undefined,
        rollNumber: rollNumber.trim() || undefined,
        mealType,
      });

      setScanResult(res.data);
      if (res.data.isMealSkipped) {
        toast.error(`WARNING: ${res.data.student.name} marked this meal as SKIPPED!`);
      } else {
        toast.success(`Check-in verified for ${res.data.student.name}`);
      }
      setRollNumber('');
      setQrTokenInput('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Attendance verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mess Entry Attendance Scanner</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Scan student meal passes or verify roll numbers at gate entrance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={mealType}
            onChange={(e) => setMealType(e.target.value)}
            className="px-3 py-2 text-sm font-medium rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="BREAKFAST">Breakfast</option>
            <option value="LUNCH">Lunch</option>
            <option value="SNACKS">Snacks</option>
            <option value="DINNER">Dinner</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" /> Gate Entrance Verification
          </h2>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">
                Scan QR Token
              </label>
              <input
                type="text"
                placeholder="Paste or scan QR token payload..."
                value={qrTokenInput}
                onChange={(e) => setQrTokenInput(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink mx-4 text-xs text-muted-foreground uppercase">OR</span>
              <div className="flex-grow border-t border-border"></div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">
                Manual Roll Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. CS2024001"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm font-mono rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-md disabled:opacity-50"
            >
              <UserCheck className="h-4 w-4" /> {loading ? 'Verifying...' : 'Verify & Log Attendance'}
            </button>
          </form>
        </div>

        {/* Verification Result Card */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col justify-center items-center text-center">
          {scanResult ? (
            <div className="space-y-4 w-full animate-in zoom-in-95">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
                  scanResult.isMealSkipped
                    ? 'bg-red-500/10 text-red-500'
                    : 'bg-emerald-500/10 text-emerald-500'
                }`}
              >
                {scanResult.isMealSkipped ? (
                  <ShieldAlert className="h-8 w-8" />
                ) : (
                  <CheckCircle className="h-8 w-8" />
                )}
              </div>

              <div>
                <h3 className="text-xl font-bold">{scanResult.student.name}</h3>
                <p className="text-sm font-mono text-muted-foreground">
                  Roll #: {scanResult.student.rollNumber}
                </p>
                <p className="text-xs font-semibold text-primary mt-1">
                  {scanResult.student.hostelName}
                </p>
              </div>

              <div
                className={`p-3 rounded-lg text-sm font-medium ${
                  scanResult.isMealSkipped
                    ? 'bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400'
                    : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {scanResult.message}
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground space-y-2 py-8">
              <QrCode className="h-12 w-12 mx-auto stroke-1 opacity-50" />
              <p className="text-sm font-medium">Ready to scan student meal passes</p>
              <p className="text-xs opacity-70 max-w-xs">
                Scan student QR token or input roll number to log entrance attendance in real-time.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
