'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui/card';
import { Smartphone, ArrowRight, Key, Clock, CheckCircle, AlertCircle, QrCode } from 'lucide-react';
import { useDeviceId } from '@/shared/hooks/useDeviceId';
import { 
  createMagicCodeAction, 
  transferDeviceAction, 
  checkActiveMagicCodeAction 
} from '../actions/magicCodeActions';
import { toast } from 'react-hot-toast';
import { pushPermissionUtils } from '../../settings/components/PushNotificationSettings';
import { useWebSocket, WebSocketMessage } from '@/shared/hooks/useWebSocket';
import { getWebSocketUrl } from '@/shared/utils/getWebSocketUrl';

interface DeviceTransferSettingsProps {
  variant?: 'row' | 'tile';
}

type TransferStep = 'initial' | 'generate' | 'input' | 'success';

interface GeneratedCode {
  code: string;
  expiresAt: Date;
}

export default function DeviceTransferSettings({ variant = 'row' }: DeviceTransferSettingsProps) {
  const deviceId = useDeviceId();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<TransferStep>('initial');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [inputCode, setInputCode] = useState('');
  const [hasActiveCode, setHasActiveCode] = useState(false);
  const [transferredUser, setTransferredUser] = useState<string | null>(null);
  const [transferResult, setTransferResult] = useState<any | null>(null);

  // NEU: WebSocket-Listener für Transfer-Bestätigungen
  useWebSocket(
    getWebSocketUrl(),
    {
      onMessage: (msg: WebSocketMessage) => {
        if (msg.topic === 'device-transfer-confirmation') {
          const payload = msg.payload as any;
          // Prüfe ob die Nachricht für dieses Gerät ist (ALTES Gerät)
          if (payload.oldDeviceId === deviceId) {
            console.log('[DeviceTransferSettings] Transfer-Bestätigung erhalten:', payload);
            
            // Zeige erfolgreiche Bestätigung
            toast.success(payload.message || 'Gerätewechsel erfolgreich!', {
              duration: 5000,
              icon: '✅'
            });
            
            // WICHTIG: Dialog schließen - Transfer ist abgeschlossen!
            setIsOpen(false);
            setCurrentStep('initial');
            setGeneratedCode(null);
            setInputCode('');
            setError(null);
            setTransferredUser(null);
            setTransferResult(null);
            
            // Toast mit weiteren Infos
            setTimeout(() => {
              toast.success(
                'Dein Account ist jetzt auf dem neuen Gerät verfügbar. Dieses Gerät wurde zurückgesetzt.',
                { duration: 7000, icon: '📱' }
              );
            }, 1000);
            
            // Nach kurzer Verzögerung die Seite neu laden (für Clean-Up)
            setTimeout(() => {
              window.location.reload();
            }, 3000);
          }
        }
      },
      onError: (err) => {
        console.error('[DeviceTransferSettings] WebSocket-Fehler:', err);
      },
      reconnectIntervalMs: 5000,
    }
  );

  // Prüfe bei Öffnung ob bereits ein aktiver Code existiert
  useEffect(() => {
    if (isOpen && deviceId) {
      checkActiveMagicCodeAction(deviceId).then(setHasActiveCode);
    }
  }, [isOpen, deviceId]);

  const handleGenerateCode = async () => {
    if (!deviceId) {
      setError('Device ID nicht verfügbar');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await createMagicCodeAction(deviceId);
      
      if (result.success && result.code && result.expiresAt) {
        setGeneratedCode({
          code: result.code,
          expiresAt: result.expiresAt
        });
        setCurrentStep('generate');
        toast.success('Magic Code erstellt');
      } else {
        setError(result.error || 'Fehler beim Erstellen des Codes');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransferDevice = async () => {
    if (!inputCode || !deviceId) {
      setError('Bitte gib den 6-stelligen Code ein');
      return;
    }

    if (!/^\d{6}$/.test(inputCode)) {
      setError('Der Code muss genau 6 Ziffern enthalten');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await transferDeviceAction(inputCode, deviceId);
      
      if (result.success) {
        setTransferredUser(result.userName || 'Unbekannter Benutzer');
        setCurrentStep('success');
        toast.success('Gerätewechsel erfolgreich!');
        
        // NEU: Reset Push-Permissions und zeige Prompt nach erfolgreichem Transfer
        pushPermissionUtils.resetPermissions();
        
        setTransferResult(result);
        
        // ✅ Push-Behandlung läuft jetzt automatisch über WebSocket vom Server
        // Kein manueller Trigger mehr nötig - Server entscheidet intelligent!
        
        // Längerer Delay für Reload damit User eventuellen Prompt oder Push sieht
        setTimeout(() => {
          window.location.reload();
        }, 8000); // 8 Sekunden damit User Zeit hat
      } else {
        setError(result.error || 'Fehler beim Gerätewechsel');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setIsLoading(false);
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
    setCurrentStep('initial');
    setGeneratedCode(null);
    setInputCode('');
    setError(null);
    setTransferredUser(null);
    setTransferResult(null);
  };

  const renderInitialStep = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentStep('input')}>
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
              <QrCode className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle className="text-base">Ich habe einen Code</CardTitle>
            <CardDescription className="text-sm">
              Code vom alten Gerät eingeben
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleGenerateCode}>
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
              <Key className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-base">Code erstellen</CardTitle>
            <CardDescription className="text-sm">
              Für Transfer auf neues Gerät
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {hasActiveCode && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Du hast bereits einen aktiven Magic Code. Dieser wird durch einen neuen Code ersetzt.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  const renderGenerateStep = () => (
    <div className="space-y-4">
      {generatedCode && (
        <>
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Magic Code erfolgreich erstellt!
            </AlertDescription>
          </Alert>

          <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Magic Code</div>
              <div className="text-4xl font-mono font-bold text-[#460b6c] tracking-wider mb-2">
                {generatedCode.code}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(generatedCode.code);
                  toast.success('Code kopiert');
                }}
                className="text-xs"
              >
                <QrCode className="w-3 h-3 mr-1" />
                Code kopieren
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-orange-600">
            <Clock className="w-4 h-4" />
            Noch gültig: {formatTimeRemaining(generatedCode.expiresAt)}
          </div>

          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>So gehst du vor:</strong></p>
            <ol className="list-decimal list-inside space-y-1 pl-2">
              <li>Öffne die App auf dem neuen Gerät</li>
              <li>Gehe zu Einstellungen → Gerätewechsel</li>
              <li>Wähle "Ich habe einen Code"</li>
              <li>Gib diesen Code ein: <code className="bg-gray-100 px-1 rounded font-mono">{generatedCode.code}</code></li>
              <li>Bestätige den Transfer</li>
            </ol>
          </div>
        </>
      )}
    </div>
  );

  const renderInputStep = () => (
    <div className="space-y-4">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Smartphone className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Code eingeben</h3>
        <p className="text-gray-600 text-sm">
          Gib den 6-stelligen Magic Code vom alten Gerät ein
        </p>
      </div>

      <div className="space-y-3">
        <Label htmlFor="magicCode">Magic Code</Label>
        <Input
          id="magicCode"
          type="text"
          placeholder="123456"
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          className="text-center text-2xl font-mono tracking-wider"
          maxLength={6}
        />
        <p className="text-xs text-gray-500 text-center">
          Der Code ist nur 5 Minuten gültig
        </p>
      </div>

      <Button
        onClick={handleTransferDevice}
        disabled={isLoading || inputCode.length !== 6}
        className="w-full bg-[#ff9900] hover:bg-orange-600"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Übertrage Daten...
          </>
        ) : (
          <>
            <ArrowRight className="w-4 h-4 mr-2" />
            Gerätewechsel durchführen
          </>
        )}
      </Button>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="space-y-4 text-center">
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-green-800 mb-2">
          Gerätewechsel erfolgreich!
        </h3>
        <p className="text-gray-600">
          Willkommen zurück, <strong>{transferredUser}</strong>!
          <br />
          Deine Daten und Einstellungen wurden übertragen.
        </p>
      </div>

      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Die App wird automatisch neu geladen, um die Änderungen zu übernehmen.
        </AlertDescription>
      </Alert>

      {/* NEU: Push-Notification Warnung falls nötig */}
      {transferResult?.pushSubscriptionInfo?.requiresReactivation && (
        <Alert className="border-blue-200 bg-blue-50">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Fast fertig!</strong><br />
            Du wirst gleich gefragt, ob du Push-Benachrichtigungen aktivieren möchtest.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Smartphone className="w-4 h-4" />
        Gerätewechsel
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-[#ff9900]" />
              Gerätewechsel
            </DialogTitle>
            <DialogDescription>
              {currentStep === 'initial' && 'Übertrage deine Daten auf ein neues Gerät oder von einem alten Gerät'}
              {currentStep === 'generate' && 'Verwende diesen Code auf dem neuen Gerät'}
              {currentStep === 'input' && 'Gib den Code vom alten Gerät ein'}
              {currentStep === 'success' && 'Daten erfolgreich übertragen'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {currentStep === 'initial' && renderInitialStep()}
            {currentStep === 'generate' && renderGenerateStep()}
            {currentStep === 'input' && renderInputStep()}
            {currentStep === 'success' && renderSuccessStep()}
          </div>

          <div className="flex justify-between gap-2 pt-4">
            {currentStep !== 'initial' && currentStep !== 'success' && (
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep('initial')}
                disabled={isLoading}
              >
                Zurück
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={handleDialogClose}
              disabled={isLoading}
              className={currentStep === 'initial' || currentStep === 'success' ? 'ml-auto' : ''}
            >
              {currentStep === 'success' ? 'Fertig' : 'Abbrechen'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 