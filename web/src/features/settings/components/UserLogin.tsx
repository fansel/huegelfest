'use client';

import { useState, useRef } from 'react';
import { Switch } from "@/shared/components/ui/switch";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { useAuth } from '@/features/auth/AuthContext';
import { unsubscribePushAction } from '@/features/push/actions/unsubscribePush';
import UserSettingsCard from './UserSettingsCard';
import { Shield, User, Mail, Lock, Eye, EyeOff, LogIn, Loader2 } from 'lucide-react';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import { ForgotPasswordModal } from '@/features/auth/components/ForgotPasswordModal';
import { subscribePushAction } from '@/features/push/actions/subscribePush';
import toast from 'react-hot-toast';

interface UserLoginProps {
  variant?: 'row' | 'tile';
}

/**
 * Allgemeine Login-Komponente
 * User loggen sich ein und bekommen eine Session
 * Shield-Icon nur für Admin-Sessions
 */
export default function UserLogin({ variant = 'row' }: UserLoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated, isAdmin, login, logout, isLoading: authLoading } = useAuth();
  const isOnline = useNetworkStatus();
  const formRef = useRef<HTMLFormElement>(null);

  const handleToggle = async (value: boolean) => {
    if (!isOnline) return;
    
    if (value && !isAuthenticated) {
      if (!isLoading) {
        setShowLoginForm(true);
        setError(null);
      }
    } else if (!value && isAuthenticated && user?.id) {
      try {
        const userId = user.id;
        
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          
          if (subscription) {
            await unsubscribePushAction(subscription.endpoint, userId);
          }
        }
        
        await logout();
      } catch (error) {
        console.error('Fehler beim Logout/Push-Cleanup:', error);
        await logout();
      }
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const identifier = formData.get('identifier') as string;
    const password = formData.get('password') as string;
    
    if (!identifier || !password) {
      setError('Bitte fülle alle Felder aus');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await login(identifier, password);
    
      if (result.success) {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            
            if (subscription) {
              const authKey = subscription.getKey('auth');
              const p256dhKey = subscription.getKey('p256dh');
              
              if (authKey && p256dhKey) {
                await subscribePushAction({
                  endpoint: subscription.endpoint,
                  keys: {
                    auth: Buffer.from(authKey).toString('base64'),
                    p256dh: Buffer.from(p256dhKey).toString('base64')
                  }
                });
              }
            }
          } catch (error) {
            console.warn('Fehler beim Verknüpfen der Push-Subscription:', error);
          }
        }

        setShowLoginForm(false);
        form.reset();
        setError(null);
        setTimeout(() => {
          toast.success('Erfolgreich angemeldet!');
        }, 100);
      } else {
        setError(result.error || 'Login fehlgeschlagen');
        toast.error(result.error || 'Login fehlgeschlagen');
      }
    } catch (error) {
      setError('Ein unerwarteter Fehler ist aufgetreten');
      toast.error('Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (formRef.current) {
      formRef.current.reset();
    }
    setError(null);
    setShowLoginForm(false);
  };

  // Icon und Titel je nach Session-Status
  const getIconAndTitle = () => {
    if (isAuthenticated) {
      if (isAdmin) {
        return {
          icon: <Shield className="w-5 h-5 text-[#ff9900]" />,
          title: `Admin-Session (${user?.name})`
        };
      } else {
        return {
          icon: <User className="w-5 h-5 text-[#ff9900]" />,
          title: `Eingeloggt (${user?.name})`
        };
      }
    } else {
      return {
        icon: <LogIn className="w-5 h-5 text-[#ff9900]" />,
        title: "Login"
      };
    }
  };

  const { icon, title } = getIconAndTitle();

  const getInfoText = () => {
    if (!isOnline) {
      return "Login ist nur online möglich.";
    }
    if (isAuthenticated) {
      if (isAdmin) {
        return "Admin-Session aktiv. Erweiterte Funktionen verfügbar.";
      } else {
        return "Session aktiv. Andere Komponenten können Account-Daten abrufen.";
      }
    }
    return "Melde dich mit deiner E-Mail oder deinem Username an.";
  };

  // Login-Dialog
  const LoginDialog = () => (
    <Dialog open={showLoginForm} onOpenChange={setShowLoginForm}>
      <DialogContent className="sm:max-w-md !top-24 !translate-y-0 !h-auto transition-all duration-200">
        <DialogTitle className="flex items-center gap-2">
          <LogIn className="h-5 w-5 text-[#ff9900]" />
          Login
        </DialogTitle>
        <DialogDescription>
          Melde dich mit deinem Account an
        </DialogDescription>

        <form ref={formRef} onSubmit={handleLogin} className="space-y-4 mt-4">
          <div className="space-y-2">
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                name="identifier"
                placeholder="E-Mail oder Username"
                className="pl-10"
                autoComplete="username"
                inputMode="email"
                enterKeyHint="next"
                autoFocus
                disabled={isLoading}
              />
            </div>
            
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <Input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Passwort"
                className="pl-10 pr-10"
                autoComplete="current-password"
                enterKeyHint="done"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => {
                setShowLoginForm(false);
                setShowForgotPassword(true);
              }}
              className="text-sm text-[#ff9900] hover:text-[#ff9900]/80"
              disabled={isLoading}
            >
              Passwort vergessen?
            </button>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="min-w-[100px] relative"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Lädt...
                </>
              ) : (
                "Anmelden"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      <UserSettingsCard
        icon={icon}
        title={title}
        switchElement={
          <Switch
            checked={isAuthenticated}
            onCheckedChange={handleToggle}
            disabled={!isOnline}
          />
        }
        info={
          <div className="space-y-2">
            <p>
              {isAuthenticated
                ? "Du bist angemeldet und kannst alle Funktionen nutzen."
                : "Melde dich an, um alle Funktionen nutzen zu können."}
            </p>
            {!isOnline && (
              <p className="text-yellow-600">
                Login ist offline nicht verfügbar
              </p>
            )}
          </div>
        }
        variant={variant}
      />
      <LoginDialog />
      {showForgotPassword && (
        <ForgotPasswordModal
          isOpen={showForgotPassword}
          onClose={() => setShowForgotPassword(false)}
        />
      )}
    </>
  );
}
