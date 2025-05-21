'use client';

import { useState } from 'react';
import { Switch } from "@/shared/components/ui/switch";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { useAuth } from '@/features/auth/AuthContext';
import UserSettingsCard from './UserSettingsCard';
import { Shield } from 'lucide-react';

interface AdminSettingsProps {
  variant?: 'row' | 'tile';
}

export default function AdminSettings({ variant = 'row' }: AdminSettingsProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showLoginForm, setShowLoginForm] = useState(false);
  const { isAuthenticated, isAdmin, login, logout, error, loading } = useAuth();

  const handleToggle = (value: boolean) => {
    console.log('Switch toggled:', value, isAuthenticated);
    if (value && !isAuthenticated) {
      setShowLoginForm(true);
    } else if (!value && isAuthenticated) {
      logout();
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await login(username, password);
    setUsername('');
    setPassword('');
    setShowLoginForm(false);
  };

  const handleCancel = () => {
    setShowLoginForm(false);
    setUsername('');
    setPassword('');
  };

  return (
    <UserSettingsCard
      icon={<Shield className="w-5 h-5 text-[#ff9900]" />}
      title="Admin-Modus"
      switchElement={
        <div className="flex items-center gap-1">
          <Switch checked={isAuthenticated} onCheckedChange={handleToggle} />
        </div>
      }
      info="Schalte spezielle Admin-Optionen frei (Login erforderlich)."
      variant={variant}
    >
      <Dialog open={showLoginForm && !isAuthenticated} onOpenChange={setShowLoginForm}>
        <DialogContent>
          <DialogTitle className="text-[#ff9900]">Admin-Login</DialogTitle>
          <DialogDescription>Bitte melde dich als Admin an.</DialogDescription>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-10 h-10 border-4 border-[#ff9900]/30 border-t-[#ff9900] rounded-full animate-spin mb-4"></div>
              <span className="text-[#ff9900]">Anmeldung läuft ...</span>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="text"
                id="username"
                value={username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                placeholder="Benutzername eingeben"
                autoFocus
                disabled={loading}
              />
              <Input
                type="password"
                id="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                placeholder="Passwort eingeben"
                disabled={loading}
              />
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <div className="flex gap-2 flex-row-reverse w-full">
                <Button type="submit" disabled={loading} className="flex-1 bg-[#ff9900] text-[#460b6c] hover:bg-[#ff9900]/80">
                  {loading ? 'Anmelden...' : 'Anmelden'}
                </Button>
                <Button type="button" variant="secondary" onClick={handleCancel} disabled={loading} className="flex-1 bg-[#460b6c] text-[#ff9900] hover:bg-[#460b6c]/80">
                  Abbrechen
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </UserSettingsCard>
  );
}
