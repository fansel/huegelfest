import PWAContainerClient from './PWAContainerClient';
import { verifyToken } from '@/features/auth/actions/verifyToken';
import { getTimelineData } from '@/features/timeline/components/TimelineServer';
import { getInfoBoardData } from '@/features/infoboard/components/InfoBoardServer';
import { getRidesAction } from '@/features/registration/actions/getRides';
import { getGlobalPacklistAction } from '@/features/packlist/actions/getGlobalPacklistAction';
import { PacklistItem } from '@/features/packlist/types/PacklistItem';

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

  // DeviceId für InfoBoard hinzufügen (kann leer sein da SSR)
  const infoBoardData = {
    ...infoBoardDataRaw,
    deviceId: '', // Wird client-side gesetzt
  };

  return (
    <PWAContainerClient 
      isAdmin={isAdmin} 
      timelineData={timelineData} 
      infoBoardData={infoBoardData}
      carpoolData={carpoolData}
      packlistData={packlistData}
    />
  );
} 