'use client';

import { useState } from 'react';
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { toast } from 'react-hot-toast';
import { forceUpdateForAllClientsAction, notifyClientsAboutUpdateAction, getAppInfoAction } from '@/features/settings/actions/updateActions';

export function AdminUpdateSettings() {
  const [isForcing, setIsForcing] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  const [reason, setReason] = useState('');
  const [appInfo, setAppInfo] = useState<any>(null);

  const loadAppInfo = async () => {
    try {
      const info = await getAppInfoAction();
      setAppInfo(info);
    } catch (error) {
      toast.error('Fehler beim Laden der App-Info');
    }
  };

  const handleForceUpdate = async () => {
    if (!reason.trim()) {
      toast.error('Bitte gib einen Grund für das Force-Update an');
      return;
    }

    setIsForcing(true);

    try {
      const result = await forceUpdateForAllClientsAction(reason);
      
      if (result.success) {
        toast.success('Force-Update an alle Clients gesendet!', {
          duration: 5000,
          icon: '🚀'
        });
        setReason('');
      } else {
        toast.error(`Force-Update fehlgeschlagen: ${result.error}`);
      }
    } catch (error) {
      toast.error('Fehler beim Force-Update');
    } finally {
      setIsForcing(false);
    }
  };

  const handleNotifyUpdate = async () => {
    setIsNotifying(true);

    try {
      const updateInfo = {
        appUpdate: true,
        assetUpdate: true,
        serviceWorkerUpdate: false
      };

      const result = await notifyClientsAboutUpdateAction(updateInfo);
      
      if (result.success) {
        toast.success('Update-Benachrichtigung an alle Clients gesendet!', {
          duration: 5000,
          icon: '📢'
        });
      } else {
        toast.error(`Benachrichtigung fehlgeschlagen: ${result.error}`);
      }
    } catch (error) {
      toast.error('Fehler bei der Benachrichtigung');
    } finally {
      setIsNotifying(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔄 Update-Management
          </CardTitle>
          <CardDescription>
            Verwalte App-Updates für alle verbundenen Clients
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* App-Info */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadAppInfo}
            >
              App-Info laden
            </Button>
            {appInfo && (
              <div className="text-sm text-gray-600">
                Version: {appInfo.version} | Build: {appInfo.buildId} | {appInfo.environment}
              </div>
            )}
          </div>

          {/* Update-Benachrichtigung */}
          <div className="space-y-2">
            <h4 className="font-medium">Update-Benachrichtigung senden</h4>
            <p className="text-sm text-gray-600">
              Benachrichtigt alle Clients über ein verfügbares Update (ohne Zwang)
            </p>
            <Button 
              onClick={handleNotifyUpdate}
              disabled={isNotifying}
              className="w-full"
            >
              {isNotifying ? 'Sendet...' : '📢 Update-Benachrichtigung senden'}
            </Button>
          </div>

          {/* Force-Update */}
          <div className="space-y-2">
            <h4 className="font-medium text-orange-600">Force-Update (Kritisch)</h4>
            <p className="text-sm text-gray-600">
              Erzwingt sofortiges Update für alle Clients. Nur für kritische Updates verwenden!
            </p>
            
            <Input
              placeholder="Grund für das Force-Update eingeben..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full"
            />
            
            <Button 
              variant="destructive"
              onClick={handleForceUpdate}
              disabled={isForcing || !reason.trim()}
              className="w-full"
            >
              {isForcing ? 'Erzwinge Update...' : '🚀 Force-Update für alle Clients'}
            </Button>
          </div>

          {/* WebSocket-Status */}
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">WebSocket-Status</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>• Update-Events werden über WebSocket gesendet</div>
              <div>• Clients registrieren sich automatisch bei Verbindung</div>
              <div>• Force-Updates überschreiben User-Präferenzen</div>
              <div>• Benachrichtigungen respektieren User-Dismissals</div>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
} 