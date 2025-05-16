import { getAllAnnouncementsAction } from '../../announcements/actions/getAllAnnouncements';
import { getAnnouncementReactionsAction } from '../../announcements/actions/getAnnouncementReactions';
import InfoBoard from './InfoBoard';
import { IAnnouncement, ReactionType } from '../../../shared/types/types';

export async function getInfoBoardData(deviceId: string = '') {
  const announcements: IAnnouncement[] = await getAllAnnouncementsAction();
  // Reactions für alle Announcements laden
  const reactionsMap: Record<string, { counts: Record<ReactionType, number>; userReaction?: ReactionType }> = {};
  await Promise.all(
    announcements.map(async (a) => {
      reactionsMap[a.id] = await getAnnouncementReactionsAction(a.id, deviceId);
    })
  );
  return { announcements, reactionsMap, deviceId };
}

// Optional: SSR-Komponente für klassische SSR/SSG-Seiten
export default async function InfoBoardServer() {
  const { announcements, reactionsMap, deviceId } = await getInfoBoardData();
  return <InfoBoard announcements={announcements} reactionsMap={reactionsMap} deviceId={deviceId} onReact={() => {}} />;
} 