'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { CheckCircle, AlertCircle, Eye, EyeOff, Lock, ArrowLeft } from 'lucide-react';
import { validatePasswordResetTokenAction, resetPasswordAction } from '@/features/auth/actions/passwordReset';
import toast from 'react-hot-toast';
import Image from 'next/image';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  
  const [isValidating, setIsValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Token validieren beim Laden der Seite
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('Kein Reset-Token gefunden');
        setIsValidating(false);
        return;
      }

      try {
        const result = await validatePasswordResetTokenAction(token);
        
        if (result.valid && result.user) {
          setTokenValid(true);
          setUser(result.user);
        } else {
          setError(result.error || 'Ungültiger oder abgelaufener Reset-Link');
        }
      } catch (error) {
        setError('Fehler bei der Token-Validierung');
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen lang sein');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await resetPasswordAction(token!, password);
      
      if (result.success) {
        setResetSuccess(true);
        toast.success('Passwort erfolgreich zurückgesetzt!');
      } else {
        setError(result.error || 'Fehler beim Zurücksetzen des Passworts');
        toast.error(result.error || 'Fehler beim Zurücksetzen');
      }
    } catch (error) {
      setError('Ein unerwarteter Fehler ist aufgetreten');
      toast.error('Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading State
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#460b6c] via-[#5c1a7c] to-[#460b6c] flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-6">
          <Image src="/logo.svg" alt="Hügelfest Logo" width={64} height={64} />
          <Card className="w-full max-w-md">
            <CardContent className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff9900] mx-auto mb-4"></div>
                <p className="text-gray-600">Reset-Link wird überprüft...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Success State
  if (resetSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#460b6c] via-[#5c1a7c] to-[#460b6c] flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-6">
          <Image src="/logo.svg" alt="Hügelfest Logo" width={64} height={64} />
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-green-700">
                Passwort zurückgesetzt!
              </CardTitle>
              <CardDescription>
                Dein neues Passwort wurde erfolgreich gesetzt
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Du kannst dich jetzt mit deinem neuen Passwort anmelden.
                </AlertDescription>
              </Alert>
              
              <Button 
                className="w-full"
                onClick={() => router.push('/')}
              >
                Zur Anmeldung
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error State
  if (!tokenValid || error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#460b6c] via-[#5c1a7c] to-[#460b6c] flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-6">
          <Image src="/logo.svg" alt="Hügelfest Logo" width={64} height={64} />
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-red-700">
                Ungültiger Reset-Link
              </CardTitle>
              <CardDescription>
                Der Link ist abgelaufen oder ungültig
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error || 'Der Reset-Link ist ungültig oder abgelaufen. Bitte fordere einen neuen an.'}
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => router.push('/')}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Zur App
                </Button>
                <Button 
                  onClick={() => router.push('/')}
                  className="flex-1"
                >
                  Anmelden
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main Form
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#460b6c] via-[#5c1a7c] to-[#460b6c] flex items-center justify-center p-4">
      <div className="flex flex-col items-center space-y-6">
        <Image src="/logo.svg" alt="Hügelfest Logo" width={64} height={64} />
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-[#ff9900]/20 rounded-full flex items-center justify-center">
              <Lock className="h-6 w-6 text-[#ff9900]" />
            </div>
            <CardTitle className="text-2xl font-bold text-[#460b6c]">
              Neues Passwort
            </CardTitle>
            <CardDescription>
              Setze ein neues Passwort für {user?.name}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Neues Passwort
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mindestens 8 Zeichen"
                    required
                    disabled={isSubmitting}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Passwort bestätigen
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Passwort wiederholen"
                    required
                    disabled={isSubmitting}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isSubmitting}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              
              {password && confirmPassword && password !== confirmPassword && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Passwörter stimmen nicht überein</AlertDescription>
                </Alert>
              )}
              
              <Button 
                type="submit"
                disabled={isSubmitting || !password || !confirmPassword || password !== confirmPassword}
                className="w-full bg-[#ff9900] hover:bg-[#ff9900]/90"
              >
                {isSubmitting ? 'Wird gespeichert...' : 'Passwort zurücksetzen'}
              </Button>
            </form>
            
            <div className="mt-4 text-center">
              <Button 
                variant="ghost"
                onClick={() => router.push('/')}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Zurück zur Anmeldung
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#460b6c] via-[#5c1a7c] to-[#460b6c] flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-6">
          <Image src="/logo.svg" alt="Hügelfest Logo" width={64} height={64} />
          <Card className="w-full max-w-md">
            <CardContent className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff9900] mx-auto mb-4"></div>
                <p className="text-gray-600">Lade...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
} 