import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatRole } from '@/utils';

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground">Manage your account preferences</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Name</span><p className="font-medium">{user?.firstName} {user?.lastName}</p></div>
            <div><span className="text-muted-foreground">Email</span><p className="font-medium">{user?.email}</p></div>
            <div><span className="text-muted-foreground">Role</span><p className="font-medium">{user && formatRole(user.role)}</p></div>
            <div><span className="text-muted-foreground">College</span><p className="font-medium">{user?.college?.name ?? 'Platform Admin'}</p></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Theme</p>
              <p className="text-xs text-muted-foreground">Currently using {theme} mode</p>
            </div>
            <Button variant="outline" onClick={toggleTheme}>
              Switch to {theme === 'dark' ? 'light' : 'dark'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
