"use client";

import React, { useEffect, useState } from 'react';
import { getAllAnnouncementsAction } from '@/features/announcements/actions/getAllAnnouncements';
import { getWorkingGroupsArrayAction } from '@/features/workingGroups/actions/getWorkingGroupColors';
import { AnnouncementManagerClient } from './AnnouncementManagerClient';

/**
 * WebSocket-Wrapper für den AnnouncementManager
 * Lädt Daten client-side und verwendet AnnouncementManagerClient direkt
 */

const AnnouncementManagerWebSocket: React.FC = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [workingGroups, setWorkingGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load both announcements and working groups client-side
        const [announcementsData, workingGroupsData] = await Promise.all([
          getAllAnnouncementsAction(),
          getWorkingGroupsArrayAction()
        ]);

        // Map announcements with group info like in useAdminDashboard
        const mappedAnnouncements = announcementsData.map((a: any) => ({
          ...a,
          groupName: a.groupInfo?.name || '',
          groupColor: a.groupInfo?.color || '',
        }));

        setAnnouncements(mappedAnnouncements);
        setWorkingGroups(workingGroupsData);
      } catch (error) {
        console.error('Error loading announcement data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <div className="p-4 text-center">Lade Ankündigungen...</div>;
  }

  return (
    <AnnouncementManagerClient 
      initialAnnouncements={announcements}
      initialWorkingGroups={workingGroups}
    />
  );
};

export default AnnouncementManagerWebSocket; 