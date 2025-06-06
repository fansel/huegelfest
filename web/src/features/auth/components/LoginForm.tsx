'use client';

import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { ForgotPasswordModal } from './ForgotPasswordModal';

/**
 * Vereinheitlichtes Login-Formular für das neue User-System
 * Funktioniert sowohl für normale User als auch Admins
 */
export function LoginForm() {
  const { login, isLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    identifier: '', // Kann E-Mail oder Username sein
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Fehler zurücksetzen wenn User tippt
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.identifier || !formData.password) {
      setError('Bitte füllen Sie alle Felder aus');
      return;
    }

    try {
      const result = await login(formData.identifier, formData.password);
      
      if (!result.success) {
        setError(result.error || 'Login fehlgeschlagen');
      }
      // Bei Erfolg wird der User automatisch durch den AuthContext weitergeleitet
    } catch (error) {
      setError('Ein unerwarteter Fehler ist aufgetreten');
    }
  };

  return (
    <>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            Anmelden
          </CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            Melden Sie sich mit E-Mail oder Benutzername an
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <label htmlFor="identifier" className="text-sm font-medium">
                E-Mail oder Benutzername
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="identifier"
                  name="identifier"
                  type="text"
                  value={formData.identifier}
                  onChange={handleInputChange}
                  placeholder="E-Mail oder Benutzername"
                  className="pl-10"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">
                  Passwort
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-xs text-[#ff9900] hover:text-[#ff9900]/80 hover:underline"
                >
                  Passwort vergessen?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Ihr Passwort"
                  className="pl-10 pr-10"
                  disabled={isLoading}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-[#ff9900] hover:bg-[#ff9900]/90" 
              disabled={isLoading}
            >
              {isLoading ? 'Wird angemeldet...' : 'Anmelden'}
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>
              Noch kein Account?{' '}
              <button 
                className="font-medium text-[#ff9900] hover:underline"
                onClick={() => {
                  // Hier könnte Navigation zur Registrierung implementiert werden
                  console.log('Navigation zur Registrierung');
                }}
              >
                Registrieren Sie sich hier
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
      
      <ForgotPasswordModal 
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </>
  );
} 