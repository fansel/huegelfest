'use client';

import React, { useMemo } from 'react';
import { Check, Clock, Calendar, AlertCircle, Wifi, WifiOff, Crown } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useDeviceId } from '@/shared/hooks/useDeviceId';
import { useDeviceContext } from '@/shared/contexts/DeviceContext';
import { format, isToday, isTomorrow, isYesterday, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';
import type { ActivityWithCategoryAndTemplate } from '../../admin/components/activities/types';
import { formatActivityTime, sortActivitiesByTime, getActivityTimeStatus, groupActivitiesByStatus } from '../../admin/components/activities/utils/timeUtils';
import useSWR from 'swr';
import { fetchUserActivitiesAction, type UserActivitiesData } from '../../admin/components/activities/actions/fetchUserActivities';
import { useGlobalWebSocket } from '@/shared/hooks/useGlobalWebSocket';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';

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
  const isOnline = useNetworkStatus();
  const isMobile = deviceType === 'mobile';

  // SWR für User Activities mit Offline-Caching
  const { data, mutate, isLoading } = useSWR<UserActivitiesData>(
    deviceId ? `user-activities-${deviceId}` : null,
    () => deviceId ? fetchUserActivitiesAction(deviceId) : Promise.resolve({ activities: [], userStatus: { isRegistered: false } }),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // 30 Sekunden
    }
  );

  const { activities = [], userStatus = { isRegistered: false } } = data || {};

  // WebSocket für Live-Updates
  useGlobalWebSocket({
    onMessage: (msg: any) => {
      // Bei relevanten Updates: SWR Cache invalidieren
      if (msg.topic === 'ACTIVITY_CREATED' || 
          msg.topic === 'ACTIVITY_UPDATED' || 
          msg.topic === 'ACTIVITY_DELETED' ||
          msg.topic === 'group-updated' ||
          msg.topic === 'user-assigned' ||
          msg.topic === 'user-removed') {
        
        console.log('[ActivitiesClient] Activities-Update erkannt, invalidiere SWR Cache');
        mutate(); // SWR Cache invalidieren
      }
    },
    topicFilter: [
      'ACTIVITY_CREATED',
      'ACTIVITY_UPDATED', 
      'ACTIVITY_DELETED',
      'group-updated',
      'user-assigned',
      'user-removed'
    ]
  });

  // Find current active activities and check if user is responsible
  const currentActivities = useMemo(() => {
    if (!activities.length || !userStatus.isRegistered || !deviceId) return [];
    
    const todayActivities = activities.filter(activity => isToday(new Date(activity.date)));
    const { active } = groupActivitiesByStatus(todayActivities);
    
    return active.map(activity => {
      const isResponsible = activity.responsibleUsersData?.some(user => user.deviceId === deviceId) || false;
      return { ...activity, isResponsible };
    });
  }, [activities, deviceId, userStatus.isRegistered]);

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
            const timeA = a.startTime || '24:00';
            const timeB = b.startTime || '24:00';
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

  // Sort activities by time
  const sortedActivities = sortActivitiesByTime(activities);

  if (isLoading) {
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
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#460b6c]/90 backdrop-blur-sm py-4 px-4">
        <div className="flex items-center gap-3">
          <Check className="h-6 w-6 text-[#ff9900]" />
          <h2 className="text-xl font-bold text-[#ff9900]">Deine Aufgaben</h2>
          {/* Connection Status */}
          <div className="ml-auto flex items-center gap-2">
            {isOnline ? (
              <div className="flex items-center" title="Live verbunden">
                <Wifi className="h-4 w-4 text-green-500" />
              </div>
            ) : (
              <div className="flex items-center" title="Offline">
                <WifiOff className="h-4 w-4 text-red-400" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full px-2 sm:px-6 mt-4 sm:mt-6">
        <div className="space-y-4">
          {/* Current Activity Status */}
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
                  Du bist noch in keiner Gruppe.
                </h3>
                <p className="text-[#ff9900]/80 text-sm">
                  Sobald du einer Gruppe zugewiesen wirst, siehst du hier deine Aufgaben.
                </p>
              </div>
            ) : (
              <div className="text-center space-y-3">
                {/* Name */}
                <div className="text-[#ff9900]/80 text-sm">
                  {userStatus.name}
                </div>
                
                {/* Jetzt: Status */}
                <div className="space-y-2">
                  <div className="text-[#ff9900]/80 text-lg">
                    Jetzt:
                  </div>
                  
                  {currentActivities.length > 0 ? (
                    <div className="space-y-3">
                      {currentActivities.map((activity) => {
                        const IconComponent = activity.category ? getIconComponent(activity.category.icon) : LucideIcons.HelpCircle;
                        const activityName = activity.template?.name || activity.customName || 'Unbekannte Aufgabe';
                        
                        return (
                          <div key={activity._id} className="space-y-2">
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <div 
                                className="p-2 rounded-full"
                                style={{ backgroundColor: `${activity.category?.color || '#ff9900'}20` }}
                              >
                                <IconComponent 
                                  className="h-6 w-6" 
                                  style={{ color: activity.category?.color || '#ff9900' }}
                                />
                              </div>
                            </div>
                            
                            <div className="text-2xl font-bold text-[#ff9900]">
                              {activityName}
                            </div>
                            
                            {activity.isResponsible && (
                              <div className="flex items-center justify-center gap-2">
                                <Crown className="h-4 w-4 text-yellow-400" />
                                <span className="font-bold text-yellow-400 text-sm">
                                  Du trägst die Hauptverantwortung
                                </span>
                              </div>
                            )}
                            
                            {activity.startTime && (
                              <div className="flex items-center justify-center gap-1 text-[#ff9900]/80 text-sm">
                                <Clock className="h-4 w-4" />
                                <span>{formatActivityTime(activity)}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-[#ff9900]">
                      Keine Aufgaben
                    </div>
                  )}
                </div>
                
                {/* Gruppe */}
                <div className="flex items-center justify-center gap-2">
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
                      const timeStatus = getActivityTimeStatus(activity);
                      const isResponsible = deviceId ? activity.responsibleUsersData?.some(user => user.deviceId === deviceId) || false : false;

                      return (
                        <div
                          key={activity._id}
                          className={`bg-white/10 backdrop-blur-sm rounded-lg border p-4 transition-all duration-200 ${
                            timeStatus.isActive
                              ? 'border-green-400/60 bg-green-400/10'
                              : day.isToday 
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
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className={`font-medium text-sm ${
                                      day.isToday ? 'text-[#ff9900]' : 'text-[#ff9900]/80'
                                    }`}>
                                      {activity.template?.name || activity.customName}
                                    </h4>
                                  </div>
                                  
                                  {activity.startTime && (
                                    <div className="flex items-center gap-1 text-sm text-[#ff9900]/70 mb-1">
                                      <Clock className="h-3 w-3" />
                                      <span className="font-medium">{formatActivityTime(activity)}</span>
                                    </div>
                                  )}

                                  <p className="text-xs mt-2 text-[#ff9900]/60">
                                    {activity.description}
                                  </p>
                                </div>

                                {/* Status Badge */}
                                <div className="flex-shrink-0 ml-3 flex items-center gap-2">
                                  {isResponsible && (
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-400/20">
                                      <Crown className="h-3 w-3 text-yellow-400" />
                                    </span>
                                  )}
                                  
                                  {timeStatus.isActive ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-400/20 text-green-400">
                                      Aktiv
                                    </span>
                                  ) : day.isToday && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#ff9900]/20 text-[#ff9900]">
                                      Heute
                                    </span>
                                  )}
                                </div>
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
        </div>
      </div>
    </div>
  );
} 