'use client';

import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/shared/components/ui/dialog';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Copy, Key, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { createMagicCodeByAdminAction } from '../actions/magicCodeActions';
import { toast } from 'react-hot-toast';

interface AdminMagicCodeButtonProps {
  deviceId: string;
  userName: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
}

interface GeneratedCode {
  code: string;
  expiresAt: Date;
}

export default function AdminMagicCodeButton({ 
  deviceId, 
  userName, 
  variant = 'outline',
  size = 'sm'
}: AdminMagicCodeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateCode = async () => {
    if (!deviceId) {
      setError('Device ID nicht verfügbar');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await createMagicCodeByAdminAction(deviceId);
      
      if (result.success && result.code && result.expiresAt) {
        setGeneratedCode({
          code: result.code,
          expiresAt: new Date(result.expiresAt)
        });
        toast.success(`Magic Code für ${userName} erstellt`);
      } else {
        setError(result.error || 'Unbekannter Fehler beim Erstellen des Codes');
        toast.error('Fehler beim Erstellen des Magic Codes');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
      setError(errorMessage);
      toast.error('Fehler beim Erstellen des Magic Codes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!generatedCode?.code) return;

    try {
      await navigator.clipboard.writeText(generatedCode.code);
      toast.success('Code in Zwischenablage kopiert');
    } catch (err) {
      toast.error('Fehler beim Kopieren des Codes');
    }
  };

  const formatTimeRemaining = (expiresAt: Date): string => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    
    if (diff <= 0) return 'Abgelaufen';
    
    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDialogClose = () => {
    setIsOpen(false);
    setGeneratedCode(null);
    setError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className="gap-1"
          title={`Magic Code für ${userName} erstellen`}
        >
          <Key className="w-3 h-3" />
          Recovery Code
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-[#ff9900]" />
            Recovery Code erstellen
          </DialogTitle>
          <DialogDescription>
            Erstelle einen Magic Code für <strong>{userName}</strong> zum Gerätewechsel.
            Der Code ist 5 Minuten gültig und nur einmal verwendbar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!generatedCode ? (
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                <strong>Device ID:</strong> <code className="text-xs bg-gray-100 px-1 rounded">{deviceId}</code>
              </div>
              
              <Button 
                onClick={handleGenerateCode}
                disabled={isLoading}
                className="w-full bg-[#ff9900] hover:bg-orange-600"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Erstelle Code...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4 mr-2" />
                    Magic Code erstellen
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Magic Code erfolgreich erstellt!
                </AlertDescription>
              </Alert>

              <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Magic Code</div>
                  <div className="text-3xl font-mono font-bold text-[#460b6c] tracking-wider mb-2">
                    {generatedCode.code}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyCode}
                    className="text-xs"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Kopieren
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-orange-600">
                <Clock className="w-4 h-4" />
                Gültig für: {formatTimeRemaining(generatedCode.expiresAt)}
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                <p><strong>Anweisungen für den Benutzer:</strong></p>
                <ol className="list-decimal list-inside space-y-1 pl-2">
                  <li>Öffne die App auf dem neuen Gerät</li>
                  <li>Gehe zu Einstellungen → Gerätewechsel</li>
                  <li>Gib den Magic Code ein: <code className="bg-gray-100 px-1 rounded">{generatedCode.code}</code></li>
                  <li>Bestätige den Transfer</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={handleDialogClose}>
            {generatedCode ? 'Schließen' : 'Abbrechen'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 