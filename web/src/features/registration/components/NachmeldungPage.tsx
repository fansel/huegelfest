'use client';

import React, { useState } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import FestivalRegisterForm from '../FestivalRegisterForm';
import { submitNachmeldungAction } from '@/features/registration/actions/submitNachmeldung';
import type { FestivalRegisterData } from './steps/types';
import toast from 'react-hot-toast';
import { useAuth } from '@/features/auth/AuthContext';
import { validateEmailAvailability } from '@/features/auth/actions/validateEmail';

interface NachmeldungResult {
  success: boolean;
  error?: string;
}

export default function NachmeldungPage() {
  // Hooks müssen immer in der gleichen Reihenfolge aufgerufen werden
  const { isLoading: authLoading } = useAuth();
  const [result, setResult] = useState<NachmeldungResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (formData: FestivalRegisterData & { username?: string, password?: string }) => {
    setIsLoading(true);
    try {
      // Stelle sicher, dass username und password vorhanden sind
      if (!formData.username || !formData.password) {
        setResult({
          success: false,
          error: 'Username und Passwort sind erforderlich'
        });
        return;
      }

      // Prüfe E-Mail-Verfügbarkeit wenn eine angegeben wurde
      if (formData.email?.trim()) {
        const emailValidation = await validateEmailAvailability(formData.email);
        if (!emailValidation.isAvailable) {
          setResult({
            success: false,
            error: emailValidation.error || 'Diese E-Mail-Adresse wird bereits verwendet'
          });
          return;
        }
      }

      const result = await submitNachmeldungAction(formData);
      setResult(result);
      
      if (result.success) {
        toast.success('Nachmeldung erfolgreich!');
      } else {
        toast.error(result.error || 'Fehler bei der Nachmeldung');
      }
    } catch (error) {
      console.error('Nachmeldung error:', error);
      setResult({
        success: false,
        error: 'Unerwarteter Fehler bei der Nachmeldung'
      });
      toast.error('Unerwarteter Fehler bei der Nachmeldung');
    }
    setIsLoading(false);
  };

  // Render loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#460b6c] via-[#5c1a7c] to-[#460b6c] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff9900] mx-auto mb-4"></div>
              <p className="text-gray-600">Lädt...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success State
  if (result?.success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#460b6c] via-[#5c1a7c] to-[#460b6c] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-700">
              Nachmeldung erfolgreich!
            </CardTitle>
            <CardDescription>
              Deine Anmeldung wurde verarbeitet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Du wurdest erfolgreich für das Festival nachgemeldet! Du kannst diese Seite jetzt schließen.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Nächste Schritte:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Öffne die Hügelfest App</li>
                <li>Gehe zu "Einstellungen"</li>
                <li>Logge dich dort mit deinem Account ein</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error State
  if (result && !result.success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#460b6c] via-[#5c1a7c] to-[#460b6c] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-700">
              Fehler bei der Nachmeldung
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {result.error}
              </AlertDescription>
            </Alert>
            
            <Button 
              className="w-full"
              variant="outline"
              onClick={() => setResult(null)}
            >
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main Form
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#460b6c] via-[#5c1a7c] to-[#460b6c] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-[#ff9900]">
            Nachmeldung
          </CardTitle>
          <CardDescription>
            Anmeldung nach Ende der regulären Phase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Die reguläre Anmeldephase ist beendet. Du kannst dich hier nachträglich anmelden. 
              Ein Account wird automatisch für dich erstellt.
            </AlertDescription>
          </Alert>
          
          <FestivalRegisterForm 
            onRegister={handleSubmit}
            setCookies={false}
            skipRegistrationCheck={true}
          />
        </CardContent>
      </Card>
    </div>
  );
} 