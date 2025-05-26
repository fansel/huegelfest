'use client';

import React, { useState, useMemo } from 'react';
import { AlertCircle, CheckCircle, Copy } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import FestivalRegisterForm from '../FestivalRegisterForm';
import { submitNachmeldungAction } from '@/features/registration/actions/submitNachmeldung';
import type { FestivalRegisterData } from '../FestivalRegisterForm';
import toast from 'react-hot-toast';

interface NachmeldungResult {
  success: boolean;
  magicCode?: string;
  error?: string;
}

/**
 * Generiert eine 6-stellige zufällige Device-ID mit A-Z 0-9
 */
function generateDeviceId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const NachmeldungPage: React.FC = () => {
  const [result, setResult] = useState<NachmeldungResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Generiere einmalig eine temporäre deviceId für diese Nachmeldung
  const tempDeviceId = useMemo(() => generateDeviceId(), []);

  const handleSubmit = async (formData: FestivalRegisterData) => {
    setIsLoading(true);
    try {
      // Verwende die temporäre deviceId für die Nachmeldung
      const formDataWithTempDeviceId = {
        ...formData,
        deviceId: tempDeviceId
      };
      
      const result = await submitNachmeldungAction(formDataWithTempDeviceId);
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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Code kopiert!');
    } catch (error) {
      toast.error('Fehler beim Kopieren');
    }
  };

  if (result?.success && result.magicCode) {
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
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Du erhältst einen speziellen Code zur Anmeldung. Notiere dir diesen Code gut!
              </AlertDescription>
            </Alert>
            
            <div className="border rounded-lg p-4 bg-gray-50">
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Dein Anmeldecode:
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-lg font-mono bg-white px-3 py-2 border rounded">
                  {result.magicCode}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(result.magicCode!)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Nächste Schritte:</strong></p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Notiere dir den Code sicher</li>
                <li>Gehe auf dem Festival-Gerät in die App</li>
                <li>Nutze die "Gerätewechsel" Funktion</li>
                <li>Gib den Code ein um deine Anmeldung zu importieren</li>
              </ol>
            </div>

          </CardContent>
        </Card>
      </div>
    );
  }

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
              Die reguläre Anmeldephase ist beendet. Du kannst dich hier nachträglich anmelden und erhältst einen speziellen Code.
            </AlertDescription>
          </Alert>
          
          <FestivalRegisterForm 
            onRegister={handleSubmit}
            setCookies={false}
            skipRegistrationCheck={true}
            customDeviceId={tempDeviceId}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default NachmeldungPage; 