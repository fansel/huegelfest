'use client';

import { Check } from 'lucide-react';
import useSWR from 'swr';
import { useDeviceId } from '@/shared/hooks/useDeviceId';
import { getUserStatusAction } from '../actions/getUserStatusAction';
import { useWebSocket } from '@/shared/hooks/useWebSocket';
import { getWebSocketUrl } from '@/shared/utils/getWebSocketUrl';
import { OfflineIndicator } from '@/shared/components/OfflineIndicator';
import type { UserStatus } from '../types/ActivityTypes';

async function fetchUserStatus(deviceId: string): Promise<UserStatus> {
  return await getUserStatusAction(deviceId);
}

export default function ActivitiesClient() {
  const deviceId = useDeviceId();
  
  const { data: userStatus, mutate } = useSWR(
    deviceId ? ['user-status', deviceId] : null,
    () => fetchUserStatus(deviceId!),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  // WebSocket für Live-Updates
  useWebSocket(getWebSocketUrl(), {
    onMessage: (msg) => {
      if (msg.topic === 'user-updated' || msg.topic === 'group-updated') {
        mutate();
      }
    },
    onError: (err) => console.error('[ActivitiesClient] WebSocket-Fehler:', err),
    reconnectIntervalMs: 5000,
  });

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Offline-Indicator */}
      <div className="mb-2">
        <OfflineIndicator className="mx-4" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#460b6c]/90 backdrop-blur-sm py-4 px-4">
        <div className="flex items-center gap-3">
          <Check className="h-6 w-6 text-[#ff9900]" />
          <h2 className="text-xl font-bold text-[#ff9900]">Deine Aufgaben</h2>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full px-2 sm:px-6 mt-4 sm:mt-6 lg:mt-10">
        <div className="space-y-2 sm:space-y-4 w-full">
          {!deviceId || !userStatus ? (
            <div className="text-center text-[#ff9900]/80 py-8">
              <div className="animate-pulse">Lädt...</div>
            </div>
          ) : (
            <>
              {/* Status Card */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-[#ff9900]/20 p-4 sm:p-6">
                {!userStatus.isRegistered ? (
                  <div className="text-center">
                    <div className="text-4xl mb-3">🚫</div>
                    <h3 className="text-lg font-semibold text-[#ff9900] mb-2">
                      Ups! Du bist noch nicht angemeldet.
                    </h3>
                    <p className="text-[#ff9900]/80 text-sm">
                      Registriere dich, um deine Aufgaben zu sehen.
                    </p>
                  </div>
                ) : !userStatus.groupId ? (
                  <div className="text-center">
                    <div className="text-4xl mb-3">👋</div>
                    <h3 className="text-lg font-semibold text-[#ff9900] mb-2">
                      Hallo {userStatus.name}!
                    </h3>
                    <p className="text-[#ff9900]/80 text-sm">
                      Du bist in keiner Gruppe.
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-4xl mb-3">👋</div>
                    <h3 className="text-lg font-semibold text-[#ff9900] mb-3">
                      Hallo, {userStatus.name}!
                    </h3>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-[#ff9900]/80 text-sm">Du bist in Gruppe</span>
                      <span 
                        className="font-semibold px-3 py-1 rounded-full text-white text-sm"
                        style={{ backgroundColor: userStatus.groupColor || '#ff9900' }}
                      >
                        {userStatus.groupName}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Placeholder für zukünftige Aufgaben */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-[#ff9900]/20 p-4 sm:p-6">
                <div className="text-center text-[#ff9900]/60">
                  <Check className="h-8 w-8 mx-auto mb-3 opacity-50" />
                  <p className="text-sm italic">
                    Aufgaben-Feature wird bald verfügbar sein...
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 