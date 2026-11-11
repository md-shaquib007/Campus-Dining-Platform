import { useState, useEffect } from 'react';
import { QrCode, RefreshCw, X, ShieldCheck } from 'lucide-react';
import { attendanceApi } from '@/api';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function MealPassModal({ isOpen, onClose }: Props) {
  const [tokenData, setTokenData] = useState<{ token: string; expiresAt: string; rollNumber: string; hostelName: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const fetchToken = async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.getMealPassToken('LUNCH');
      const data = res.data;
      setTokenData({
        token: data.token,
        expiresAt: data.expiresAt,
        rollNumber: data.student.rollNumber,
        hostelName: data.student.hostelName,
      });

      const expiresMs = new Date(data.expiresAt).getTime();
      const diffSec = Math.max(0, Math.floor((expiresMs - Date.now()) / 1000));
      setTimeLeft(diffSec);
    } catch {
      toast.error('Failed to generate meal pass token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchToken();
    }
  }, [isOpen]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-sm rounded-2xl bg-card border border-border p-6 shadow-2xl text-card-foreground">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-accent transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
            <QrCode className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Digital Meal Pass</h3>
            <p className="text-xs text-muted-foreground">Show QR at Mess Entry Gate</p>
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : tokenData ? (
          <div className="flex flex-col items-center">
            <div className="bg-white p-4 rounded-xl shadow-inner border border-gray-200 mb-4 flex flex-col items-center">
              <div className="w-48 h-48 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center relative overflow-hidden border">
                <div className="grid grid-cols-6 gap-1 p-2 opacity-80">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-6 w-6 rounded-sm ${
                        (i * 7) % 3 === 0 ? 'bg-indigo-600' : (i * 3) % 2 === 0 ? 'bg-purple-600' : 'bg-gray-800'
                      }`}
                    />
                  ))}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-transparent flex items-end justify-center pb-2">
                  <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-gray-900 bg-white/90 px-2 py-0.5 rounded shadow">
                    <ShieldCheck className="h-3 w-3 text-emerald-600" /> VERIFIED PASS
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center w-full mb-4 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {tokenData.hostelName}
              </p>
              <p className="text-lg font-mono font-bold text-foreground">
                Roll #: {tokenData.rollNumber}
              </p>
            </div>

            <div className="flex items-center justify-between w-full p-3 rounded-lg bg-accent/50 text-xs mb-4">
              <span className="text-muted-foreground">Pass Valid For:</span>
              <span className={`font-mono font-bold ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`}>
                {timeLeft > 0 ? formatTime(timeLeft) : 'Expired'}
              </span>
            </div>

            <button
              onClick={fetchToken}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-md active:scale-95"
            >
              <RefreshCw className="h-4 w-4" /> Refresh Pass
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
