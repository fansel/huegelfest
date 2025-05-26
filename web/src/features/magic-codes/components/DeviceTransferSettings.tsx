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
import { Smartphone, ArrowRight, Key, Clock, CheckCircle, AlertCircle, QrCode, Info } from 'lucide-react';
import { useDeviceId } from '@/shared/hooks/useDeviceId';
import { 
  createMagicCodeAction, 
  transferDeviceAction, 
  checkActiveMagicCodeAction 
} from '../actions/magicCodeActions';
import { getUserWithRegistrationAction } from '@/features/auth/actions/userActions';
import { toast } from 'react-hot-toast';
import { pushPermissionUtils } from '../../settings/components/PushNotificationSettings';
import { useWebSocket, WebSocketMessage } from '@/shared/hooks/useWebSocket';
import { getWebSocketUrl } from '@/shared/utils/getWebSocketUrl';
import UserSettingsCard from '../../settings/components/UserSettingsCard';

interface DeviceTransferSettingsProps {
  variant?: 'row' | 'tile';
}

type TransferStep = 'initial' | 'generate' | 'input' | 'success';

interface GeneratedCode {
  code: string;
  expiresAt: string;
}

interface UserInfo {
  name: string;
  hasRegistration: boolean;
  deviceId: string;
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
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [showDebug, setShowDebug] = useState(false);

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
                'Dein Account ist jetzt auf dem neuen Gerät verfügbar. Dieses Gerät wird resettet.',
                { duration: 7000, icon: '📱' }
              );
            }, 1000);
            
            // ✨ WICHTIG: Setze neue deviceId für dieses (alte) Gerät im localStorage
            // Das alte Gerät bekommt eine neue Identität
            if (payload.newFreshDeviceId) {
              localStorage.setItem('deviceId', payload.newFreshDeviceId);
              console.log(`[DeviceTransferSettings] Neue deviceId für altes Gerät gesetzt: ${payload.newFreshDeviceId}`);
            }
            
            // Nach kurzer Verzögerung die Seite neu laden (für kompletten Reset)
            setTimeout(() => {
              window.location.reload();
            }, 3000);
          }
        } else if (msg.topic === 'device-transfer-push-prompt') {
          const payload = msg.payload as any;
          // Prüfe ob die Nachricht für dieses Gerät ist (NEUES Gerät)
          if (payload.deviceId === deviceId) {
            console.log('[DeviceTransferSettings] Push-Prompt erhalten:', payload);
            
            // ✨ WICHTIG: Setze übertragene deviceId für dieses (neue) Gerät
            // Das neue Gerät übernimmt die Identität des alten Geräts
            if (payload.transferredDeviceId) {
              localStorage.setItem('deviceId', payload.transferredDeviceId);
              console.log(`[DeviceTransferSettings] Übertragene deviceId für neues Gerät gesetzt: ${payload.transferredDeviceId}`);
            }
            
            // Push-Prompt wird von AutoPushPrompt automatisch gehandhabt 
            // - kein manueller Code hier nötig
            toast.success(
              `Willkommen zurück, ${payload.userName}! Die App wird neu geladen...`,
              { duration: 4000, icon: '🔔' }
            );
            
            // Reload nach deviceId-Update
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          }
        }
      },
      onError: (err) => {
        console.error('[DeviceTransferSettings] WebSocket-Fehler:', err);
      },
      reconnectIntervalMs: 5000,
    }
  );

  // Lade User-Informationen
  const loadUserInfo = async () => {
    if (!deviceId) {
      console.log('[DeviceTransferSettings] Keine deviceId verfügbar');
      return;
    }
    
    console.log('[DeviceTransferSettings] Lade User-Info für deviceId:', deviceId);
    
    try {
      const user = await getUserWithRegistrationAction(deviceId);
      console.log('[DeviceTransferSettings] User-Daten erhalten:', user);
      
      if (user) {
        const userInfo = {
          name: user.name,
          hasRegistration: !!user.registrationId,
          deviceId: deviceId
        };
        console.log('[DeviceTransferSettings] Setting userInfo:', userInfo);
        setUserInfo(userInfo);
      } else {
        console.log('[DeviceTransferSettings] Kein User gefunden - setze Standard-Werte');
        setUserInfo({
          name: 'Nicht angemeldet',
          hasRegistration: false,
          deviceId: deviceId
        });
      }
    } catch (error) {
      console.error('[DeviceTransferSettings] Fehler beim Laden der User-Info:', error);
      setUserInfo({
        name: 'Nicht angemeldet',
        hasRegistration: false,
        deviceId: deviceId || 'Unbekannt'
      });
    }
  };

  useEffect(() => {
    loadUserInfo();
  }, [deviceId, transferResult]); // Auch bei transferResult neu laden

  // Beim Öffnen des Dialogs User-Info neu laden
  useEffect(() => {
    if (isOpen) {
      loadUserInfo();
    }
  }, [isOpen]);

  // Event Listener für Registrierungsänderungen
  useEffect(() => {
    const handleRegistrationChange = () => {
      console.log('[DeviceTransferSettings] Registrierung geändert - lade User-Info neu');
      loadUserInfo();
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'deviceId' || e.key === 'userRegistration') {
        console.log('[DeviceTransferSettings] Storage-Änderung erkannt - lade User-Info neu');
        loadUserInfo();
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('[DeviceTransferSettings] App wieder fokussiert - lade User-Info neu');
        loadUserInfo();
      }
    };

    // Custom Events für Registrierungsänderungen
    window.addEventListener('registration-updated', handleRegistrationChange);
    window.addEventListener('user-logged-in', handleRegistrationChange);
    window.addEventListener('user-logged-out', handleRegistrationChange);
    
    // Storage Events für deviceId Änderungen
    window.addEventListener('storage', handleStorageChange);
    
    // Visibility Change für App-Fokus
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('registration-updated', handleRegistrationChange);
      window.removeEventListener('user-logged-in', handleRegistrationChange);
      window.removeEventListener('user-logged-out', handleRegistrationChange);
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [deviceId]);

  // Zusätzlich: Aktualisiere User-Info wenn ein Transfer abgeschlossen ist
  useEffect(() => {
    if (transferResult?.success && transferResult?.userName) {
      setUserInfo(prev => prev ? {
        ...prev,
        name: transferResult.userName,
        hasRegistration: true
      } : {
        name: transferResult.userName,
        hasRegistration: true,
        deviceId: transferResult.transferredDeviceId || deviceId || 'Unbekannt'
      });
    }
  }, [transferResult, deviceId]);

  // Prüfe bei Öffnung ob bereits ein aktiver Code existiert
  useEffect(() => {
    if (isOpen && deviceId) {
      checkActiveMagicCodeAction(deviceId).then(setHasActiveCode);
    }
  }, [isOpen, deviceId]);

  const handleGenerateCode = async () => {
    if (!deviceId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await createMagicCodeAction(deviceId);
      
      if (result.success && result.code && result.expiresAt) {
        setGeneratedCode({ 
          code: result.code, 
          expiresAt: result.expiresAt // Bereits ISO String vom Server
        });
        setCurrentStep('generate');
      } else {
        setError(result.error || 'Fehler beim Generieren des Codes');
      }
    } catch (error) {
      console.error('[DeviceTransferSettings] Fehler beim Generieren:', error);
      setError('Ein unerwarteter Fehler ist aufgetreten');
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
        
        // ✨ WICHTIG: Übernehme die deviceId des alten Geräts SOFORT
        // Das neue Gerät übernimmt die "Identität" des alten Geräts
        if (result.transferredDeviceId) {
          localStorage.setItem('deviceId', result.transferredDeviceId);
          console.log(`[DeviceTransferSettings] Neue Identität übernommen: ${result.transferredDeviceId}`);
        }
        
        // Reset Push-Permissions - wird automatisch über WebSocket gehandhabt
        pushPermissionUtils.resetPermissions();
        
        setTransferResult(result);
        
        // Automatisches Reload nach erfolgreichem Transfer
        // WebSocket-Handler übernimmt Push-Einrichtung automatisch
        setTimeout(() => {
          window.location.reload();
        }, 3000); // Kürzerer Delay da deviceId bereits gesetzt ist
      } else {
        setError(result.error || 'Fehler beim Gerätewechsel');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeRemaining = (expiresAt: string): string => {
    const expiry = new Date(expiresAt); // Konvertiere ISO String zu Date
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Abgelaufen';
    
    const minutes = Math.floor(diffMs / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
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

  const isCodeGenerationDisabled = !userInfo?.hasRegistration;

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

        <Card 
          className={`cursor-pointer transition-shadow ${
            isCodeGenerationDisabled 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:shadow-md'
          }`} 
          onClick={isCodeGenerationDisabled ? undefined : handleGenerateCode}
        >
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
              <Key className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-base">Code erstellen</CardTitle>
            <CardDescription className="text-sm">
              {isCodeGenerationDisabled 
                ? 'Erst anmelden erforderlich'
                : 'Für Transfer auf neues Gerät'
              }
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {isCodeGenerationDisabled && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Du musst dich zuerst für das Festival anmelden, bevor du einen Magic Code erstellen kannst.
          </AlertDescription>
        </Alert>
      )}

      {hasActiveCode && !isCodeGenerationDisabled && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Du hast bereits einen aktiven Magic Code. Dieser wird durch einen neuen Code ersetzt.
          </AlertDescription>
        </Alert>
      )}

      {/* Debug-Informationen */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Debug-Informationen</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDebug(!showDebug)}
            className="text-xs"
          >
            {showDebug ? 'Ausblenden' : 'Anzeigen'}
          </Button>
        </div>
        {showDebug && (
          <div className="mt-2 space-y-1 text-xs text-gray-600">
            <div><strong>Device ID:</strong> {userInfo?.deviceId || 'Nicht verfügbar'}</div>
            <div><strong>Name:</strong> {userInfo?.name || 'Nicht verfügbar'}</div>
            <div><strong>Angemeldet:</strong> {userInfo?.hasRegistration ? 'Ja' : 'Nein'}</div>
            <div><strong>Hook Device ID:</strong> {deviceId || 'Nicht verfügbar'}</div>
            <div><strong>userInfo State:</strong> {userInfo ? 'Gesetzt' : 'Null'}</div>
            <div><strong>Code-Generierung disabled:</strong> {isCodeGenerationDisabled ? 'Ja' : 'Nein'}</div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadUserInfo}
              className="mt-2 text-xs"
            >
              User-Info neu laden
            </Button>
          </div>
        )}
      </div>
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
          ✨ Dieses Gerät hat deine Account-Identität übernommen.<br />
          Die App wird automatisch neu geladen.
        </AlertDescription>
      </Alert>

      {/* Push-Notification Info */}
      {transferResult?.pushSubscriptionInfo?.requiresReactivation && (
        <Alert className="border-blue-200 bg-blue-50">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Fast fertig!</strong><br />
            Push-Benachrichtigungen werden automatisch eingerichtet.
          </AlertDescription>
        </Alert>
      )}

      <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
        <p><strong>Was ist passiert?</strong></p>
        <ul className="list-disc list-inside space-y-1 mt-2 text-left">
          <li>Dieses Gerät hat deine Account-Identität übernommen</li>
          <li>Das alte Gerät wurde komplett zurückgesetzt</li>
          <li>Alle deine Daten sind auf diesem Gerät verfügbar</li>
          <li>Push-Benachrichtigungen werden automatisch aktiviert</li>
        </ul>
      </div>
    </div>
  );

  // Haupt-Button für SettingsCard
  const switchElement = (
    <Button 
      variant="outline" 
      size="sm"
      onClick={(e) => {
        e.stopPropagation();
        setIsOpen(true);
      }}
      className="text-xs"
    >
      Öffnen
    </Button>
  );

  // Info-Text für Tooltip
  const infoText = (
    <div className="space-y-2">
      <p>Übertrage deine Festival-Anmeldung auf ein neues Gerät oder hole sie von einem alten Gerät.</p>
      <div className="space-y-1">
        <p><strong>Funktionen:</strong></p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Code erstellen für Transfer auf neues Gerät</li>
          <li>Code eingeben um Daten zu empfangen</li>
          <li>Automatische Push-Einrichtung</li>
          <li>Kompletter Account-Transfer</li>
        </ul>
      </div>
      {!userInfo?.hasRegistration && (
        <p className="text-orange-600 font-medium">
          Hinweis: Du musst zuerst angemeldet sein, um einen Code zu erstellen.
        </p>
      )}
    </div>
  );

  return (
    <>
      <UserSettingsCard
        icon={<Smartphone className="w-5 h-5 text-[#ff9900]" />}
        title="Gerätewechsel"
        switchElement={switchElement}
        info={infoText}
        variant={variant}
      />

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