import { getAllAnnouncementsAction } from '../../announcements/actions/getAllAnnouncements';
import { getAnnouncementReactionsAction } from '../../announcements/actions/getAnnouncementReactions';
import InfoBoard from './InfoBoard';
import { IAnnouncement, ReactionType } from '../../../shared/types/types';

export async function getInfoBoardData() {
  const announcementsRaw: any[] = await getAllAnnouncementsAction();
  const reactionsMap: Record<string, { counts: Record<ReactionType, number>; userReaction?: ReactionType }> = {};
  await Promise.all(
    announcementsRaw.map(async (a) => {
      reactionsMap[a.id] = await getAnnouncementReactionsAction(a.id);
    })
  );
  // Mapping auf vollständige IAnnouncement-Objekte
  const announcements: IAnnouncement[] = announcementsRaw.map((a) => ({
    id: a.id,
    content: a.content,
    date: a.date,
    time: a.time,
    groupId: a.groupId,
    groupName: a.groupInfo?.name || '',
    groupColor: a.groupInfo?.color || '#cccccc',
    important: a.important,
    reactions: reactionsMap[a.id] || {},
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  }));
  return { announcements, reactionsMap };
}

// Optional: SSR-Komponente für klassische SSR/SSG-Seiten
export default async function InfoBoardServer() {
  try {
    const { announcements, reactionsMap } = await getInfoBoardData();
    return <InfoBoard announcements={announcements} reactionsMap={reactionsMap} />;
  } catch (error: any) {
    return <div className="text-red-500">Fehler beim Laden des Infoboards: {error?.message || String(error)}</div>;
  }
} 