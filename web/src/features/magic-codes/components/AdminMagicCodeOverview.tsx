'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Badge } from '@/shared/components/ui/badge';
import { Key, Clock, User, Trash2, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { getActiveMagicCodesAction, cleanupExpiredCodesAction } from '../actions/magicCodeActions';
import { toast } from 'react-hot-toast';
import { useDeviceContext } from '@/shared/contexts/DeviceContext';
import type { ParsedActiveMagicCode } from '../types';

export default function AdminMagicCodeOverview() {
  const { deviceType } = useDeviceContext();
  const isMobile = deviceType === 'mobile';
  const [activeCodes, setActiveCodes] = useState<ParsedActiveMagicCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  const loadActiveCodes = async () => {
    setIsLoading(true);
    try {
      const codes = await getActiveMagicCodesAction();
      // Parse string dates to Date objects
      const parsedCodes: ParsedActiveMagicCode[] = codes.map(code => ({
        ...code,
        expiresAt: new Date(code.expiresAt),
        createdAt: new Date(code.createdAt)
      }));
      setActiveCodes(parsedCodes);
    } catch (error) {
      console.error('[AdminMagicCodeOverview] Fehler beim Laden:', error);
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
      console.error('[AdminMagicCodeOverview] Cleanup-Fehler:', error);
      toast.error('Fehler beim Bereinigen der Codes');
    } finally {
      setIsCleaningUp(false);
    }
  };

  const formatTimeRemaining = (expiresAt: Date): string => {
    try {
      const now = new Date();
      const expiry = new Date(expiresAt); // Sicherstellen dass es ein Date ist
      const diff = expiry.getTime() - now.getTime();
      
      if (diff <= 0) return 'Abgelaufen';
      
      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } catch (error) {
      console.error('[AdminMagicCodeOverview] Date formatting error:', error);
      return 'Fehler';
    }
  };

  const formatCreatedTime = (createdAt: Date): string => {
    try {
      const created = new Date(createdAt); // Sicherstellen dass es ein Date ist
      return new Intl.DateTimeFormat('de-DE', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit'
      }).format(created);
    } catch (error) {
      console.error('[AdminMagicCodeOverview] Date formatting error:', error);
      return 'Fehler';
    }
  };

  useEffect(() => {
    loadActiveCodes();
    
    // Auto-refresh alle 30 Sekunden
    const interval = setInterval(loadActiveCodes, 30000);
    return () => clearInterval(interval);
  }, []);

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Mobile Header Card */}
        <Card className="border-[#ff9900]/20 bg-gradient-to-r from-[#ff9900]/5 to-[#460b6c]/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#ff9900]/10 rounded-lg">
                  <Key className="w-4 h-4 text-[#ff9900]" />
                </div>
                <div>
                  <CardTitle className="text-lg text-[#460b6c]">Magic Codes</CardTitle>
                  <CardDescription className="text-xs text-gray-600">
                    {activeCodes.length} aktive Recovery Codes
                  </CardDescription>
                </div>
              </div>
              
              {/* Status Indicator */}
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-500">Live</span>
              </div>
            </div>
            
            {/* Mobile Action Buttons */}
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={loadActiveCodes}
                disabled={isLoading}
                className="flex-1 h-8 border-[#ff9900]/30 hover:bg-[#ff9900]/10"
              >
                <RefreshCw className={`w-3 h-3 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="text-xs font-medium">Aktualisieren</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCleanup}
                disabled={isCleaningUp}
                className="flex-1 h-8 text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-3 h-3 mr-1.5" />
                <span className="text-xs font-medium">
                  {isCleaningUp ? 'Bereinige...' : 'Bereinigen'}
                </span>
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Codes List */}
        {activeCodes.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-medium text-gray-900 mb-1">Alles sauber!</h3>
                <p className="text-sm text-gray-500">
                  Keine aktiven Magic Codes vorhanden.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {activeCodes.map((code) => {
              const timeRemaining = formatTimeRemaining(code.expiresAt);
              const isExpired = timeRemaining === 'Abgelaufen';
              
              return (
                <Card 
                  key={code.id}
                  className={`overflow-hidden ${
                    isExpired 
                      ? 'border-red-200 bg-red-50/50' 
                      : 'border-gray-200 bg-white shadow-sm'
                  }`}
                >
                  <CardContent className="p-4">
                    {/* Code Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="text-xl font-mono font-bold text-[#460b6c] mb-1 tracking-wider">
                          {code.code}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={code.createdBy === 'admin' ? 'secondary' : 'outline'}
                            className="text-xs px-2 py-0.5"
                          >
                            {code.createdBy === 'admin' ? '👨‍💼 Admin' : '👤 User'}
                          </Badge>
                          {isExpired && (
                            <Badge variant="destructive" className="text-xs px-2 py-0.5">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Abgelaufen
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Timer */}
                      <div className={`text-right ${
                        isExpired ? 'text-red-600' : 'text-orange-600'
                      }`}>
                        <div className="flex items-center gap-1 justify-end mb-1">
                          <Clock className="w-3 h-3" />
                          <span className="font-mono text-sm font-bold">
                            {timeRemaining}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          verbleibend
                        </div>
                      </div>
                    </div>

                    {/* User Info Section */}
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-[#460b6c]/10 rounded-full flex items-center justify-center">
                          <User className="w-3 h-3 text-[#460b6c]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {code.userName}
                          </div>
                          <div className="text-xs text-gray-500 font-mono truncate">
                            {code.deviceId}
                          </div>
                        </div>
                      </div>
                      
                      {/* Meta Info */}
                      <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-200">
                        <div>
                          Erstellt: {formatCreatedTime(code.createdAt)}
                        </div>
                        {code.adminId && (
                          <div className="text-right">
                            von {code.adminId}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Footer Info */}
        {activeCodes.length > 0 && (
          <Card className="bg-gray-50/50">
            <CardContent className="p-3">
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span>Auto-Update alle 30s • Codes laufen automatisch ab</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Desktop Layout (Original)
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