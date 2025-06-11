"use client";

import React, { useMemo, useState } from 'react';
import { fetchUserActivitiesAction } from '@/features/admin/components/activities/actions/fetchUserActivities';
import type { UserActivitiesData } from '@/features/admin/components/activities/actions/fetchUserActivities';
import type { ActivityWithCategoryAndTemplate } from '@/features/admin/components/activities/types';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import { useDeviceContext } from '@/shared/contexts/DeviceContext';
import { useGlobalWebSocket } from '@/shared/hooks/useGlobalWebSocket';
import useSWR from 'swr';
import { 
  Check, 
  Calendar, 
  Clock, 
  AlertCircle, 
  Wifi, 
  WifiOff,
  MessageCircle,
  Users2,
  Crown
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { startOfDay, format, isToday, isTomorrow, isYesterday } from 'date-fns';
import { de } from 'date-fns/locale';
import { formatActivityTime, groupActivitiesByStatus } from '@/features/admin/components/activities/utils/timeUtils';
import { useAuth } from '@/features/auth/AuthContext';
import { useUserActivitiesRealtime } from '@/features/admin/components/activities/hooks/useUserActivitiesRealtime';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import ChatModal from '@/features/chat/components/ChatModal';
import { GroupMembersDialog } from './GroupMembersDialog';

export interface ActivityDay {
  date: Date;
  dateString: string;
  label: string;
  activities: ActivityWithCategoryAndTemplate[];
  isToday: boolean;
  isPast: boolean;
}

export default function ActivitiesClient() {
  const { user } = useAuth();
  const { deviceType } = useDeviceContext();
  const { isOnline } = useNetworkStatus();
  const isMobile = deviceType === 'mobile';

  // Chat state
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatActivityId, setChatActivityId] = useState<string | null>(null);
  const [chatGroupId, setChatGroupId] = useState<string | null>(null);
  const [chatTitle, setChatTitle] = useState('');

  // Group members dialog state
  const [groupInfoModalOpen, setGroupInfoModalOpen] = useState(false);
  const [infoGroupId, setInfoGroupId] = useState<string | null>(null);
  const [infoGroupName, setInfoGroupName] = useState<string | null>(null);

  // SWR für User Activities mit session-basierter Authentifizierung
  const { data, mutate, isLoading } = useSWR<UserActivitiesData>(
    user ? `user-activities-${user.id}` : null,
    () => fetchUserActivitiesAction(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000,
    }
  );

  const { activities = [], userStatus = { isRegistered: false } } = data || {};

  // WebSocket für Live-Updates
  useGlobalWebSocket({
    onMessage: (msg: any) => {
      if (msg.topic === 'ACTIVITY_CREATED' || 
          msg.topic === 'ACTIVITY_UPDATED' || 
          msg.topic === 'ACTIVITY_DELETED' ||
          msg.topic === 'group-updated' ||
          msg.topic === 'user-assigned' ||
          msg.topic === 'user-removed') {
        
        console.log('[ActivitiesClient] Activities-Update erkannt, invalidiere SWR Cache');
        mutate();
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
    if (!activities.length || !userStatus.isRegistered || !user) return [];
    
    const todayActivities = activities.filter((activity: ActivityWithCategoryAndTemplate) => 
      isToday(new Date(activity.date))
    );
    const { active } = groupActivitiesByStatus(todayActivities);
    
    return active.map((activity: ActivityWithCategoryAndTemplate) => {
      const isResponsible = activity.responsibleUsersData?.some(
        (userData: { _id: string; name: string; email: string }) => userData._id === user.id
      ) || false;
      return { ...activity, isResponsible };
    });
  }, [activities, user, userStatus.isRegistered]);

  // Group activities by day
  const activityDays = useMemo((): ActivityDay[] => {
    if (!activities.length) return [];

    const groupedByDate = activities.reduce((acc: Record<string, ActivityWithCategoryAndTemplate[]>, activity: ActivityWithCategoryAndTemplate) => {
      const date = new Date(activity.date);
      const dateString = startOfDay(date).toISOString();
      
      if (!acc[dateString]) {
        acc[dateString] = [];
      }
      acc[dateString].push(activity);
      return acc;
    }, {});

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
          activities: dayActivities.sort((a: ActivityWithCategoryAndTemplate, b: ActivityWithCategoryAndTemplate) => {
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

  const handleOpenActivityChat = (activity: ActivityWithCategoryAndTemplate) => {
    setChatActivityId(activity._id);
    setChatGroupId(null);
    setChatTitle(`Aufgaben-Chat: ${activity.template?.name || activity.customName || 'Unbenannte Aufgabe'}`);
    setChatModalOpen(true);
  };

  const handleOpenActivityInfo = (activity: ActivityWithCategoryAndTemplate) => {
    setChatActivityId(activity._id);
    setChatGroupId(null);
    setChatTitle(`Aufgaben-Chat: ${activity.template?.name || activity.customName || 'Unbenannte Aufgabe'}`);
    setChatModalOpen(true);
    // Will open with info section visible via prop
  };

  const handleOpenGroupInfo = () => {
    if (userStatus.groupId) {
      const groupId = typeof userStatus.groupId === 'string' 
        ? userStatus.groupId 
        : (userStatus.groupId as any)?._id || String(userStatus.groupId);
      
      setInfoGroupId(groupId);
      setInfoGroupName(userStatus.groupName || null);
      setGroupInfoModalOpen(true);
    }
  };

  const handleOpenGroupChat = () => {
    if (userStatus.groupId) {
      // Ensure groupId is a string, handle if it's an object with _id
      const groupId = typeof userStatus.groupId === 'string' 
        ? userStatus.groupId 
        : (userStatus.groupId as any)?._id || String(userStatus.groupId);
        
      setChatActivityId(null);
      setChatGroupId(groupId);
      setChatTitle(`Gruppen-Chat: ${userStatus.groupName || 'Unbekannte Gruppe'}`);
      setChatModalOpen(true);
    }
  };

  const handleCloseChat = () => {
    setChatModalOpen(false);
    setChatActivityId(null);
    setChatGroupId(null);
    setChatTitle('');
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className={`sticky ${!isMobile ? 'top-16' : 'top-0'} z-10 bg-[#460b6c]/90 backdrop-blur-sm py-4 px-4`}>
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
      <div className={`sticky ${!isMobile ? 'top-16' : 'top-0'} z-10 bg-[#460b6c]/90 backdrop-blur-sm py-4 px-4`}>
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
            {!user ? (
              <div className="text-center">
                <div className="text-4xl mb-3">🔐</div>
                <h3 className="text-lg font-semibold text-[#ff9900] mb-2">
                  Du bist nicht angemeldet.
                </h3>
                <p className="text-[#ff9900]/80 text-sm">
                  Melde dich an, um deine Aufgaben zu sehen.
                </p>
              </div>
            ) : !userStatus.isRegistered ? (
              <div className="text-center">
                <div className="text-4xl mb-3">🚫</div>
                <h3 className="text-lg font-semibold text-[#ff9900] mb-2">
                  Ups! Du bist noch nicht registriert.
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
                      {currentActivities.map((activity: any) => {
                        const IconComponent = activity.category ? getIconComponent(activity.category.icon) : LucideIcons.HelpCircle;
                        const activityName = activity.template?.name || activity.customName || 'Unbekannte Aufgabe';

                        return (
                          <div 
                            key={activity._id} 
                            className={`flex items-center gap-3 p-3 rounded-lg border ${
                              activity.isResponsible 
                                ? 'border-[#ff9900] bg-[#ff9900]/10' 
                                : 'border-[#ff9900]/30 bg-white/5'
                            }`}
                          >
                            <IconComponent 
                              className="h-5 w-5" 
                              style={{ color: activity.category?.color || '#ff9900' }}
                            />
                            <div className="flex-1">
                              <div className="font-medium text-[#ff9900] text-lg">
                                {activityName}
                                {activity.isResponsible && (
                                  <span className="ml-2 text-xs bg-[#ff9900] text-white px-2 py-1 rounded-full">
                                    Hauptverantwortung
                                  </span>
                                )}
                              </div>
                              {activity.startTime && (
                                <div className="text-sm text-[#ff9900]/70">
                                  {formatActivityTime(activity)}
                                </div>
                              )}
                            </div>
                            {/* Chat Button for Current Activity */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenActivityChat(activity)}
                              className="h-8 w-8 text-[#ff9900]/70 hover:text-[#ff9900] hover:bg-[#ff9900]/10 flex-shrink-0"
                              title="Chat öffnen"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
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
                
                {/* Gruppe mit Chat-Button */}
                <div className="flex items-center justify-center gap-2">
                  <span 
                    className="font-semibold px-3 py-1 rounded-full text-white text-sm"
                    style={{ backgroundColor: userStatus.groupColor || '#ff9900' }}
                  >
                    {userStatus.groupName}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleOpenGroupInfo}
                    className="h-8 w-8 text-[#ff9900]/70 hover:text-[#ff9900] hover:bg-[#ff9900]/10"
                    title="Gruppenmitglieder anzeigen"
                  >
                    <Users2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Group Chat Button (when user is in a group but not necessarily active) */}
          {userStatus.groupId && userStatus.groupName && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-[#ff9900]/20 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users2 className="h-5 w-5 text-[#ff9900]" />
                  <div>
                    <h3 className="text-[#ff9900] font-medium">Gruppen-Chat</h3>
                    <p className="text-[#ff9900]/70 text-sm">Mit deiner Gruppe {userStatus.groupName} schreiben</p>
                  </div>
                </div>
                <Button
                  onClick={handleOpenGroupChat}
                  className="bg-[#ff9900] hover:bg-orange-600 text-[#460b6c] px-4"
                  size="sm"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chat öffnen
                </Button>
              </div>
            </div>
          )}

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
                  <div className="space-y-2">
                    {day.activities.map((activity) => {
                      const IconComponent = activity.category ? getIconComponent(activity.category.icon) : LucideIcons.HelpCircle;
                      const activityName = activity.template?.name || activity.customName || 'Unbekannte Aufgabe';
                      
                      // Check if current user is responsible (by userId)
                      const isResponsible = user && activity.responsibleUsersData?.some((userData: { _id: string; name: string; email: string }) => userData._id === user.id) || false;

                      return (
                        <div 
                          key={activity._id}
                          className={`bg-white/10 backdrop-blur-sm rounded-lg border p-4 ${
                            isResponsible
                              ? 'border-[#ff9900] bg-[#ff9900]/5'
                              : day.isToday 
                                ? 'border-[#ff9900]/40' 
                                : 'border-[#ff9900]/20'
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
                                  <h4 className="font-medium text-[#ff9900] text-sm">
                                    {activityName}
                                    {isResponsible && (
                                      <span className="ml-2 text-xs bg-[#ff9900] text-white px-2 py-1 rounded-full">
                                        Hauptverantwortung
                                      </span>
                                    )}
                                  </h4>
                                  
                                  {/* Time */}
                                  {activity.startTime && (
                                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                      <Clock className="h-3 w-3" />
                                      {formatActivityTime(activity)}
                                    </div>
                                  )}

                                  {/* Description */}
                                  {activity.description && (
                                    <p className="text-xs text-[#ff9900]/60 mt-2">
                                      {activity.description}
                                    </p>
                                  )}

                                  {/* Responsible Users */}
                                  {activity.responsibleUsersData && activity.responsibleUsersData.length > 0 && (
                                    <div className="flex items-center gap-1 text-xs text-[#ff9900]/70 mt-2">
                                      <Crown className="h-3 w-3" />
                                      <div className="flex flex-wrap gap-1">
                                        {activity.responsibleUsersData?.map((userData, index) => (
                                          <Badge 
                                            key={userData._id} 
                                            variant="outline" 
                                            className="text-xs px-1 py-0 border-[#ff9900]/30 cursor-pointer hover:border-[#ff9900]/50 hover:bg-[#ff9900]/10 transition-colors"
                                            onClick={() => handleOpenActivityInfo(activity)}
                                            title="Info für diese Aufgabe anzeigen"
                                          >
                                            {userData.name}
                                            {index < (activity.responsibleUsersData?.length || 0) - 1 && ','}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Chat Button */}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenActivityChat(activity)}
                                  className="h-8 w-8 text-[#ff9900]/70 hover:text-[#ff9900] hover:bg-[#ff9900]/10 flex-shrink-0 ml-2"
                                  title="Chat öffnen"
                                >
                                  <MessageCircle className="h-4 w-4" />
                                </Button>
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

      {/* Chat Modal */}
      <ChatModal
        isOpen={chatModalOpen}
        onClose={handleCloseChat}
        activityId={chatActivityId || undefined}
        groupId={chatGroupId || undefined}
        title={chatTitle}
        isAdminView={false}
        showInfoOnOpen={chatActivityId !== null}
      />

      {/* Group Members Dialog */}
      <GroupMembersDialog
        isOpen={groupInfoModalOpen}
        onClose={() => setGroupInfoModalOpen(false)}
        groupId={infoGroupId}
        groupName={infoGroupName}
      />
    </div>
  );
} 