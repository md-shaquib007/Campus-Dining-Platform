import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const MenuPage = lazy(() => import('@/pages/MenuPage'));
const MenuManagementPage = lazy(() => import('@/pages/MenuManagementPage'));
const RateMealPage = lazy(() => import('@/pages/RateMealPage'));
const SkipMealPage = lazy(() => import('@/pages/SkipMealPage'));
const ComplaintsPage = lazy(() => import('@/pages/ComplaintsPage'));
const SuggestionsPage = lazy(() => import('@/pages/SuggestionsPage'));
const PollsPage = lazy(() => import('@/pages/PollsPage'));
const AnnouncementsPage = lazy(() => import('@/pages/AnnouncementsPage'));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const SearchPage = lazy(() => import('@/pages/SearchPage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const CollegesPage = lazy(() => import('@/pages/CollegesPage'));
const HostelsPage = lazy(() => import('@/pages/HostelsPage'));
const StudentsPage = lazy(() => import('@/pages/StudentsPage'));
const AuditLogsPage = lazy(() => import('@/pages/AuditLogsPage'));
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage'));
const ContractorScorecardPage = lazy(() => import('@/pages/ContractorScorecardPage'));
const AttendanceScanPage = lazy(() => import('@/pages/AttendanceScanPage'));

function PageLoader() {
  return <div className="p-6"><Skeleton className="h-64 w-full" /></div>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="flex h-screen items-center justify-center"><Skeleton className="h-8 w-32" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RoleRoute({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const { user } = useAuth();
  if (user && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
      <p className="text-lg mt-4">Page not found</p>
      <a href="/dashboard" className="text-primary mt-2 hover:underline">Go to dashboard</a>
    </div>
  );
}

export function AppRoutes() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />

          <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="menu" element={<RoleRoute roles={['COLLEGE_ADMIN', 'WARDEN', 'MESS_OPERATOR', 'STUDENT']}><MenuPage /></RoleRoute>} />
            <Route path="menu-management" element={<RoleRoute roles={['COLLEGE_ADMIN', 'WARDEN', 'MESS_OPERATOR']}><MenuManagementPage /></RoleRoute>} />
            <Route path="rate" element={<RoleRoute roles={['STUDENT']}><RateMealPage /></RoleRoute>} />
            <Route path="skip-meal" element={<RoleRoute roles={['STUDENT']}><SkipMealPage /></RoleRoute>} />
            <Route path="complaints" element={<RoleRoute roles={['COLLEGE_ADMIN', 'WARDEN', 'STUDENT']}><ComplaintsPage /></RoleRoute>} />
            <Route path="suggestions" element={<RoleRoute roles={['COLLEGE_ADMIN', 'WARDEN', 'STUDENT']}><SuggestionsPage /></RoleRoute>} />
            <Route path="polls" element={<RoleRoute roles={['COLLEGE_ADMIN', 'WARDEN', 'STUDENT']}><PollsPage /></RoleRoute>} />
            <Route path="announcements" element={<RoleRoute roles={['COLLEGE_ADMIN', 'WARDEN', 'STUDENT']}><AnnouncementsPage /></RoleRoute>} />
            <Route path="analytics" element={<RoleRoute roles={['SUPER_ADMIN', 'COLLEGE_ADMIN', 'WARDEN']}><AnalyticsPage /></RoleRoute>} />
            <Route path="reports" element={<RoleRoute roles={['COLLEGE_ADMIN', 'WARDEN']}><ReportsPage /></RoleRoute>} />
            <Route path="scorecard" element={<RoleRoute roles={['COLLEGE_ADMIN', 'WARDEN', 'MESS_OPERATOR']}><ContractorScorecardPage /></RoleRoute>} />
            <Route path="attendance-scan" element={<RoleRoute roles={['COLLEGE_ADMIN', 'WARDEN', 'MESS_OPERATOR']}><AttendanceScanPage /></RoleRoute>} />
            <Route path="audit-logs" element={<RoleRoute roles={['SUPER_ADMIN', 'COLLEGE_ADMIN']}><AuditLogsPage /></RoleRoute>} />
            <Route path="onboarding" element={<RoleRoute roles={['SUPER_ADMIN']}><OnboardingPage /></RoleRoute>} />
            <Route path="search" element={<SearchPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="colleges" element={<RoleRoute roles={['SUPER_ADMIN']}><CollegesPage /></RoleRoute>} />
            <Route path="hostels" element={<RoleRoute roles={['COLLEGE_ADMIN']}><HostelsPage /></RoleRoute>} />
            <Route path="students" element={<RoleRoute roles={['COLLEGE_ADMIN', 'WARDEN']}><StudentsPage /></RoleRoute>} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}


