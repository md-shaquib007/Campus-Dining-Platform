import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Star,
  MessageSquare,
  AlertTriangle,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Search,
  Building2,
  Users,
  Vote,
  Lightbulb,
  SkipForward,
  FileText,
  Shield,
  ChefHat,
  Rocket,
  QrCode,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useUnreadNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/Button';
import { MealPassModal } from '@/components/MealPassModal';
import { cn, formatRole, getInitials } from '@/utils';
import type { UserRole } from '@/types';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'WARDEN', 'MESS_OPERATOR', 'STUDENT'] },
  { label: 'Menu', href: '/menu', icon: UtensilsCrossed, roles: ['COLLEGE_ADMIN', 'WARDEN', 'MESS_OPERATOR', 'STUDENT'] },
  { label: 'Menu Management', href: '/menu-management', icon: ChefHat, roles: ['COLLEGE_ADMIN', 'WARDEN', 'MESS_OPERATOR'] },
  { label: 'Gate Scanner', href: '/attendance-scan', icon: QrCode, roles: ['COLLEGE_ADMIN', 'WARDEN', 'MESS_OPERATOR'] },
  { label: 'Rate Meal', href: '/rate', icon: Star, roles: ['STUDENT'] },
  { label: 'Skip Meal', href: '/skip-meal', icon: SkipForward, roles: ['STUDENT'] },
  { label: 'Complaints', href: '/complaints', icon: AlertTriangle, roles: ['COLLEGE_ADMIN', 'WARDEN', 'STUDENT'] },
  { label: 'Suggestions', href: '/suggestions', icon: Lightbulb, roles: ['COLLEGE_ADMIN', 'WARDEN', 'STUDENT'] },
  { label: 'Polls', href: '/polls', icon: Vote, roles: ['COLLEGE_ADMIN', 'WARDEN', 'STUDENT'] },
  { label: 'Announcements', href: '/announcements', icon: MessageSquare, roles: ['COLLEGE_ADMIN', 'WARDEN', 'STUDENT'] },
  { label: 'Analytics', href: '/analytics', icon: BarChart3, roles: ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'WARDEN'] },
  { label: 'Contractor Scorecard', href: '/scorecard', icon: BarChart3, roles: ['COLLEGE_ADMIN', 'WARDEN', 'MESS_OPERATOR'] },
  { label: 'Reports', href: '/reports', icon: FileText, roles: ['COLLEGE_ADMIN', 'WARDEN'] },
  { label: 'Audit Logs', href: '/audit-logs', icon: Shield, roles: ['SUPER_ADMIN', 'COLLEGE_ADMIN'] },
  { label: 'Onboarding', href: '/onboarding', icon: Rocket, roles: ['SUPER_ADMIN'] },
  { label: 'Colleges', href: '/colleges', icon: Building2, roles: ['SUPER_ADMIN'] },
  { label: 'Students', href: '/students', icon: Users, roles: ['COLLEGE_ADMIN', 'WARDEN'] },
  { label: 'Hostels', href: '/hostels', icon: Building2, roles: ['COLLEGE_ADMIN'] },
];

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mealPassOpen, setMealPassOpen] = useState(false);

  const { data: unreadCount = 0 } = useUnreadNotifications();

  const filteredNav = NAV_ITEMS.filter((item) => user && item.roles.includes(user.role));

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-background">
      <MealPassModal isOpen={mealPassOpen} onClose={() => setMealPassOpen(false)} />

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform lg:translate-x-0 lg:static',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center gap-2 border-b border-border px-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              C
            </div>
            <div>
              <p className="font-semibold text-sm">CDIP</p>
              <p className="text-xs text-muted-foreground">Dining Intelligence</p>
            </div>
            <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {filteredNav.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-border p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                {user && getInitials(user.firstName, user.lastName)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-muted-foreground truncate">{user && formatRole(user.role)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate('/settings')} aria-label="Settings">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Logout">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center gap-4 border-b border-border bg-card px-6">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold capitalize">
              {filteredNav.find((n) => n.href === location.pathname)?.label || 'Dashboard'}
            </h1>
          </div>
          {user?.role === 'STUDENT' && (
            <Button
              onClick={() => setMealPassOpen(true)}
              className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm"
              size="sm"
            >
              <QrCode className="h-4 w-4" /> Digital Pass
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => navigate('/search')} aria-label="Search">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate('/notifications')} aria-label="Notifications" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] text-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center p-12">
        <div className="text-primary-foreground max-w-md">
          <h1 className="text-4xl font-bold mb-4">Campus Dining Intelligence Platform</h1>
          <p className="text-primary-foreground/80 text-lg">
            Transform hostel food feedback into actionable insights. Data-driven dining management for modern institutions.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {['Real-time Analytics', 'Meal Ratings', 'Waste Reduction', 'Smart Reports'].map((f) => (
              <div key={f} className="bg-white/10 rounded-lg p-3 text-sm">{f}</div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center p-8 relative">
        <button
          onClick={toggleTheme}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-accent"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
