import PWAContainerClient from './PWAContainerClient';
import { verifyToken } from '@/features/auth/actions/verifyToken';
import { getTimelineData } from '@/features/timeline/components/TimelineServer';
import { getInfoBoardData } from '@/features/infoboard/components/InfoBoardServer';
import { getRidesAction } from '@/features/registration/actions/getRides';
import { getGlobalPacklistAction } from '@/features/packlist/actions/getGlobalPacklistAction';
import { PacklistItem } from '@/features/packlist/types/PacklistItem';
import { getAllAnnouncementsAction } from '@/features/announcements/actions/getAllAnnouncements';
import { getWorkingGroupsArrayAction } from '@/features/workingGroups/actions/getWorkingGroupColors';
import { getCategoriesAction } from '@/features/categories/actions/getCategories';
import { getPendingEventsAction } from '@/features/timeline/actions/getPendingEventsAction';
import { getAllTracks } from '@/features/music/actions/getAllTracks';
import { fetchGroupsData } from '@/features/admin/components/groups/actions/fetchGroupsData';
import { fetchActivitiesData } from '@/features/admin/components/activities/actions/fetchActivitiesData';

interface Ride {
  _id?: string;
  driver: string;
  direction: 'hinfahrt' | 'rückfahrt';
  start: string;
  destination: string;
  date: string;
  time: string;
  seats: number;
  contact: string;
  passengers: { name: string, contact?: string }[];
}

export default async function PWAContainerServer() {
  const auth = await verifyToken();
  const isAdmin = !!auth.isAdmin;
  const timelineData = await getTimelineData();
  const infoBoardDataRaw = await getInfoBoardData();
  
  // Lade Carpool-Daten für SSR
  let carpoolData: Ride[] = [];
  try {
    const data = await getRidesAction();
    carpoolData = Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Fehler beim Laden der Fahrten:', error);
    carpoolData = [];
  }

  // Lade Packlist-Daten für SSR
  let packlistData: PacklistItem[] = [];
  try {
    const data = await getGlobalPacklistAction();
    packlistData = Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Fehler beim Laden der globalen Packliste:', error);
    packlistData = [];
  }

  // Lade Admin-Daten für SSR (nur wenn Admin)
  let adminData = undefined;
  if (isAdmin) {
    try {
      const [announcementsData, workingGroups, categories, pendingEvents, tracks, groupsData, activitiesData] = await Promise.all([
        getAllAnnouncementsAction(),
        getWorkingGroupsArrayAction(), 
        getCategoriesAction(),
        getPendingEventsAction(),
        getAllTracks(),
        fetchGroupsData(),
        fetchActivitiesData()
      ]);

      // Map announcements with group info
      const announcements = announcementsData.map((a: any) => ({
        ...a,
        groupName: a.groupInfo?.name || '',
        groupColor: a.groupInfo?.color || '',
      }));

      adminData = {
        announcements,
        workingGroups,
        categories,
        pendingEvents,
        tracks,
        groupsData,
        activitiesData
      };
    } catch (error) {
      console.error('Fehler beim Laden der Admin-Daten:', error);
      adminData = undefined;
    }
  }

  // InfoBoard-Daten für Client bereitstellen
  const infoBoardData = {
    ...infoBoardDataRaw,
  };

  return (
    <PWAContainerClient 
      isAdmin={isAdmin} 
      timelineData={timelineData} 
      infoBoardData={infoBoardData}
      carpoolData={carpoolData}
      packlistData={packlistData}
      adminData={adminData}
    />
  );
} 