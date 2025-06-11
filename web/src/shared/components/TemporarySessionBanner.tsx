'use client';

import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Shield, Crown } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import toast from 'react-hot-toast';

export function TemporarySessionBanner() {
  const { isTemporarySession, restoreAdminSession, user } = useAuth();
  const [isRestoring, setIsRestoring] = useState(false);

  if (!isTemporarySession) {
    return null;
  }

  const handleRestoreAdminSession = async () => {
    if (!restoreAdminSession) {
      toast.error('Restore Admin Funktion nicht verfügbar');
      return;
    }

    setIsRestoring(true);
    
    try {
      const result = await restoreAdminSession();
      
      if (result.success) {
        toast.success('Admin-Session wiederhergestellt');
        // Redirect back to admin interface
        window.location.href = '/';
      } else {
        toast.error(result.error || 'Fehler beim Wiederherstellen der Admin-Session');
      }
    } catch (error) {
      console.error('Fehler beim Restore Admin Session:', error);
      toast.error('Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setIsRestoring(false);
    }
  };

  const isAdminUser = user?.role === 'admin';

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 border-b shadow-sm ${
      isAdminUser 
        ? 'bg-blue-50 border-blue-200' 
        : 'bg-gray-100 border-gray-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4 py-1.5">
        <div className="flex items-center justify-between text-sm">
          <div className={`flex items-center gap-2 ${
            isAdminUser ? 'text-blue-700' : 'text-gray-700'
          }`}>
            {isAdminUser ? (
              <Crown className="h-3 w-3 text-blue-500" />
            ) : (
              <Shield className="h-3 w-3 text-gray-500" />
            )}
            <span className="font-medium">
              Temporärer {isAdminUser ? 'Admin' : 'User'}-Modus:
            </span>
            <span className={isAdminUser ? 'text-blue-600' : 'text-gray-600'}>
              {user?.name}
            </span>
            {isAdminUser && (
              <span className="text-xs text-blue-500 font-medium">
                (Admin-Funktionen verfügbar)
              </span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRestoreAdminSession}
            disabled={isRestoring}
            className={`h-7 px-3 text-xs bg-white ${
              isAdminUser 
                ? 'border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
            }`}
          >
            {isRestoring ? (
              <>
                <div className={`w-3 h-3 border border-t-transparent rounded-full animate-spin mr-1 ${
                  isAdminUser ? 'border-blue-400' : 'border-gray-400'
                }`} />
                Wiederherstellen...
              </>
            ) : (
              <>
                <Shield className="h-3 w-3 mr-1" />
                Zurück zu Admin
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
} 