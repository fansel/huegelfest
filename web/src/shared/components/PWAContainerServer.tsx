import PWAContainerClient from './PWAContainerClient';
import { verifyToken } from '@/features/auth/actions/verifyToken';
import { getTimelineData } from '@/features/timeline/components/TimelineServer';
import { getInfoBoardData } from '@/features/infoboard/components/InfoBoardServer';

export default async function PWAContainerServer() {
  const auth = await verifyToken();
  const isAdmin = !!auth.isAdmin;

  // Timeline-Daten über Server-Komponente laden
  const timelineData = await getTimelineData();
  const infoBoardData = await getInfoBoardData();

  return (
    <PWAContainerClient isAdmin={isAdmin} timelineData={timelineData} infoBoardData={infoBoardData} />
  );
} 