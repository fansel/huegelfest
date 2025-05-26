'use client';

import React, { useMemo } from 'react';
import { Check, Clock, Calendar, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useDeviceId } from '@/shared/hooks/useDeviceId';
import { useDeviceContext } from '@/shared/contexts/DeviceContext';
import { useUserActivitiesRealtime } from '../hooks/useUserActivitiesRealtime';
import { OfflineIndicator } from '@/shared/components/OfflineIndicator';
import { format, isToday, isTomorrow, isYesterday, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';
import type { ActivityWithCategoryAndTemplate } from '../types';

interface ActivityDay {
  date: Date;
  dateString: string;
  label: string;
  activities: ActivityWithCategoryAndTemplate[];
  isToday: boolean;
  isPast: boolean;
}

export default function ActivitiesClient() {
  const deviceId = useDeviceId();
  const { deviceType } = useDeviceContext();
  const isMobile = deviceType === 'mobile';

  // Use realtime hook for user activities
  const { data, loading, connected } = useUserActivitiesRealtime(deviceId);
  const { activities, userStatus } = data;

  // Group activities by day
  const activityDays = useMemo((): ActivityDay[] => {
    if (!activities.length) return [];

    const groupedByDate = activities.reduce((acc, activity) => {
      const date = new Date(activity.date);
      const dateString = startOfDay(date).toISOString();
      
      if (!acc[dateString]) {
        acc[dateString] = [];
      }
      acc[dateString].push(activity);
      return acc;
    }, {} as Record<string, ActivityWithCategoryAndTemplate[]>);

    return Object.entries(groupedByDate)
      .map(([dateString, dayActivities]) => {
        const date = new Date(dateString);
        const now = new Date();
        
        let label = format(date, 'EEEE, dd.MM.yyyy', { locale: de });
        if (isToday(date)) label = `Heute, ${format(date, 'dd.MM.yyyy', { locale: de })}`;
        else if (isTomorrow(date)) label = `Morgen, ${format(date, 'dd.MM.yyyy', { locale: de })}`;
        else if (isYesterday(date)) label = `Gestern, ${format(date, 'dd.MM.yyyy', { locale: de })}`;

        return {
          date,
          dateString,
          label,
          activities: dayActivities.sort((a, b) => {
            const timeA = a.time || '24:00';
            const timeB = b.time || '24:00';
            return timeA.localeCompare(timeB);
          }),
          isToday: isToday(date),
          isPast: date < startOfDay(now)
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [activities]);

  const getIconComponent = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent || LucideIcons.HelpCircle;
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="sticky top-0 z-10 bg-[#460b6c]/90 backdrop-blur-sm py-4 px-4">
          <div className="flex items-center gap-3">
            <Check className="h-6 w-6 text-[#ff9900]" />
            <h2 className="text-xl font-bold text-[#ff9900]">Deine Aufgaben</h2>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-[#ff9900]/70">Lade deine Aufgaben...</div>
        </div>
      </div>
    );
  }

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
          {/* Connection Status */}
          <div className="ml-auto flex items-center gap-2">
            {connected ? (
              <Wifi className="h-4 w-4 text-green-500" title="Live verbunden" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-400" title="Offline" />
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full px-2 sm:px-6 mt-4 sm:mt-6">
        <div className="space-y-4">
          {/* User Status Card */}
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
                  Du bist noch in keiner Gruppe. Sobald du einer Gruppe zugewiesen wirst, siehst du hier deine Aufgaben.
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-4xl mb-3">👋</div>
                    <h3 className="text-lg font-semibold text-[#ff9900] mb-3">
                  Hallo {userStatus.name}!
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

          {/* Activities by Day */}
          {activityDays.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-[#ff9900]/20 p-6 text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-3 text-[#ff9900]/60" />
              <p className="text-[#ff9900]/80 text-sm">
                {userStatus.groupId 
                  ? "Noch keine Aufgaben für deine Gruppe geplant."
                  : "Keine Aufgaben verfügbar."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {activityDays.map((day) => (
                <div key={day.dateString} className="space-y-3">
                  {/* Day Header */}
                  <div className="flex items-center gap-3 px-2">
                    <Calendar className={`h-5 w-5 ${day.isToday ? 'text-[#ff9900]' : 'text-[#ff9900]/70'}`} />
                    <h3 className={`text-lg font-semibold ${day.isToday ? 'text-[#ff9900]' : 'text-[#ff9900]/80'}`}>
                      {day.label}
                    </h3>
                    <div className="flex-1 h-px bg-[#ff9900]/20" />
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      day.isToday 
                        ? 'bg-[#ff9900]/20 text-[#ff9900]' 
                        : day.isPast 
                          ? 'bg-gray-500/20 text-gray-400'
                          : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {day.activities.length} Aufgabe{day.activities.length !== 1 ? 'n' : ''}
                    </span>
                  </div>

                  {/* Activities for this day */}
                  <div className="space-y-3">
                    {day.activities.map((activity) => {
                      const IconComponent = activity.category ? getIconComponent(activity.category.icon) : LucideIcons.HelpCircle;

                      return (
                        <div
                          key={activity._id}
                          className={`bg-white/10 backdrop-blur-sm rounded-lg border p-4 transition-all duration-200 ${
                            day.isToday 
                              ? 'border-[#ff9900]/40 hover:border-[#ff9900]/60' 
                              : day.isPast
                                ? 'border-gray-500/20 opacity-75'
                                : 'border-[#ff9900]/20 hover:border-[#ff9900]/40'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Category Icon */}
                            <div 
                              className="flex-shrink-0 p-2 rounded-full"
                              style={{ backgroundColor: `${activity.category?.color || '#ff9900'}20` }}
                            >
                              <IconComponent 
                                className="h-5 w-5" 
                                style={{ color: activity.category?.color || '#ff9900' }}
                              />
                            </div>

                            {/* Activity Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className={`font-medium text-sm ${
                                    day.isToday ? 'text-[#ff9900]' : 'text-[#ff9900]/80'
                                  }`}>
                                    {activity.template?.name || activity.customName}
                                  </h4>
                                  
                                  {activity.time && (
                                    <div className={`flex items-center gap-1 text-xs mt-1 ${
                                      day.isToday ? 'text-[#ff9900]/70' : 'text-[#ff9900]/50'
                                    }`}>
                                      <Clock className="h-3 w-3" />
                                      <span className="font-medium">{activity.time}</span>
                                    </div>
                                  )}

                                  <p className={`text-xs mt-2 ${
                                    day.isToday ? 'text-[#ff9900]/60' : 'text-[#ff9900]/50'
                                  }`}>
                                    {activity.description}
                                  </p>
                                </div>

                                {/* Status Badge */}
                                {day.isToday && (
                                  <div className="flex-shrink-0 ml-3">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#ff9900]/20 text-[#ff9900]">
                                      Heute
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer Info */}
          {userStatus.groupId && activityDays.length > 0 && (
            <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-[#ff9900]/10 p-4 text-center">
              <p className="text-[#ff9900]/60 text-xs">
                🔔 Du erhältst automatisch Benachrichtigungen, wenn deine Aufgaben beginnen
              </p>
              </div>
          )}
        </div>
      </div>
    </div>
  );
} 