'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Badge } from '@/shared/components/ui/badge';
import { Key, Clock, User, Trash2, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { getActiveMagicCodesAction, cleanupExpiredCodesAction } from '../actions/magicCodeActions';
import { toast } from 'react-hot-toast';
import type { ActiveMagicCode } from '../types';

export default function AdminMagicCodeOverview() {
  const [activeCodes, setActiveCodes] = useState<ActiveMagicCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  const loadActiveCodes = async () => {
    setIsLoading(true);
    try {
      const codes = await getActiveMagicCodesAction();
      setActiveCodes(codes);
    } catch (error) {
      toast.error('Fehler beim Laden der aktiven Codes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanup = async () => {
    setIsCleaningUp(true);
    try {
      const result = await cleanupExpiredCodesAction();
      if (result.success) {
        toast.success(`${result.deletedCount || 0} abgelaufene Codes bereinigt`);
        await loadActiveCodes(); // Neuladen
      } else {
        toast.error(result.error || 'Fehler beim Bereinigen');
      }
    } catch (error) {
      toast.error('Fehler beim Bereinigen der Codes');
    } finally {
      setIsCleaningUp(false);
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

  const formatCreatedTime = (createdAt: Date): string => {
    return new Intl.DateTimeFormat('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    }).format(new Date(createdAt));
  };

  useEffect(() => {
    loadActiveCodes();
    
    // Auto-refresh alle 30 Sekunden
    const interval = setInterval(loadActiveCodes, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-[#ff9900]" />
            <div>
              <CardTitle>Aktive Magic Codes</CardTitle>
              <CardDescription>
                Übersicht über alle aktuell gültigen Recovery Codes
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadActiveCodes}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Aktualisieren
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCleanup}
              disabled={isCleaningUp}
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              {isCleaningUp ? 'Bereinige...' : 'Bereinigen'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {activeCodes.length === 0 ? (
          <Alert>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Keine aktiven Magic Codes vorhanden.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {activeCodes.map((code) => {
              const timeRemaining = formatTimeRemaining(code.expiresAt);
              const isExpired = timeRemaining === 'Abgelaufen';
              
              return (
                <div
                  key={code.id}
                  className={`p-4 border rounded-lg ${
                    isExpired ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-mono font-bold text-[#460b6c]">
                        {code.code}
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-3 h-3" />
                          <span className="font-medium">{code.userName}</span>
                          <code className="text-xs bg-gray-100 px-1 rounded">
                            {code.deviceId}
                          </code>
                        </div>
                        <div className="text-xs text-gray-500">
                          Erstellt: {formatCreatedTime(code.createdAt)}
                          {code.adminId && ` von ${code.adminId}`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={code.createdBy === 'admin' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {code.createdBy === 'admin' ? 'Admin' : 'User'}
                      </Badge>
                      
                      <div className={`flex items-center gap-1 text-sm ${
                        isExpired ? 'text-red-600' : 'text-orange-600'
                      }`}>
                        <Clock className="w-3 h-3" />
                        <span className="font-mono text-xs">
                          {timeRemaining}
                        </span>
                      </div>

                      {isExpired && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Abgelaufen
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeCodes.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              Automatische Aktualisierung alle 30 Sekunden • 
              Codes werden automatisch nach Ablauf gelöscht
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 