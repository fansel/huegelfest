import { useState, useCallback, useEffect } from 'react';
import { IAnnouncement } from '@/shared/types/types';
import { getAllAnnouncementsAction } from '../../announcements/actions/getAllAnnouncements';
import { saveAnnouncementsAction } from '../../announcements/actions/saveAnnouncementAction';
import { deleteAnnouncementAction } from '../../announcements/actions/deleteAnnouncement';
import { getWorkingGroupsArrayAction } from '../../workingGroups/actions/getWorkingGroupColors';
import { WorkingGroup } from '@/features/workingGroups/hooks/useWorkingGroupsWebSocket';
// Importiere hier die Services, z.B.:
// import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../../announcements/services/announcementService';
// import { getGroups, createGroup, updateGroup, deleteGroup } from '../../workingGroups/services/groupService';
// import { getTimeline, createTimelineEntry, updateTimelineEntry, deleteTimelineEntry } from '../../timeline/services/timelineService';

// Typdefinitionen (Platzhalter, bitte mit echten Typen ersetzen)
export interface Announcement extends IAnnouncement {}

export interface Group {
  id: string;
  name: string;
  color: string;
}

export interface TimelineEntry {
  id: string;
  title: string;
  description: string;
  date: string;
}

export interface UseAdminDashboard {
  // Announcements
  announcements: Announcement[];
  loadingAnnouncements: boolean;
  errorAnnouncements: string | null;
  createAnnouncement: (data: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAnnouncement: (id: string, data: Partial<Announcement>) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;

  // WorkingGroups
  workingGroups: WorkingGroup[];
  loadingWorkingGroups: boolean;
  errorWorkingGroups: string | null;
  createGroup: (data: Omit<Group, 'id'>) => Promise<void>;
  updateGroup: (id: string, data: Partial<Group>) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;

  // Timeline
  timeline: TimelineEntry[];
  loadingTimeline: boolean;
  errorTimeline: string | null;
  createTimelineEntry: (data: Omit<TimelineEntry, 'id'>) => Promise<void>;
  updateTimelineEntry: (id: string, data: Partial<TimelineEntry>) => Promise<void>;
  deleteTimelineEntry: (id: string) => Promise<void>;
}

/**
 * useAdminDashboard
 * Gemeinsamer Hook für die Admin-Logik (Announcements, Gruppen, Timeline)
 */
export const useAdminDashboard = (): UseAdminDashboard => {
  // Announcements State
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState<boolean>(false);
  const [errorAnnouncements, setErrorAnnouncements] = useState<string | null>(null);

  // WorkingGroups State
  const [workingGroups, setWorkingGroups] = useState<WorkingGroup[]>([]);
  const [loadingWorkingGroups, setLoadingGroups] = useState<boolean>(false);
  const [errorWorkingGroups, setErrorGroups] = useState<string | null>(null);

  // Timeline State
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState<boolean>(false);
  const [errorTimeline, setErrorTimeline] = useState<string | null>(null);

  // Announcements laden beim Mount
  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoadingAnnouncements(true);
      setErrorAnnouncements(null);
      try {
        const data = await getAllAnnouncementsAction();
        // groupName und groupColor aus groupInfo übernehmen
        const mapped = data.map((a: any) => ({
          ...a,
          groupName: a.groupInfo?.name || '',
          groupColor: a.groupInfo?.color || '',
        })) as Announcement[];
        setAnnouncements(mapped);
      } catch (error: any) {
        setErrorAnnouncements('Fehler beim Laden der Ankündigungen');
      } finally {
        setLoadingAnnouncements(false);
      }
    };
    fetchAnnouncements();
  }, []);

  // WorkingGroups laden beim Mount
  useEffect(() => {
    const fetchWorkingGroups = async () => {
      setLoadingGroups(true);
      setErrorGroups(null);
      try {
        const data = await getWorkingGroupsArrayAction();
        setWorkingGroups(data);
      } catch (error: any) {
        setErrorGroups('Fehler beim Laden der Arbeitsgruppen');
      } finally {
        setLoadingGroups(false);
      }
    };
    fetchWorkingGroups();
  }, []);

  // Create Announcement
  const createAnnouncement = useCallback(async (data: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoadingAnnouncements(true);
    setErrorAnnouncements(null);
    try {
      const newAnnouncement: IAnnouncement = {
        ...data,
        id: '', // Backend generiert ID
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        reactions: {},
        groupName: '', // Wird vom Backend ergänzt
        groupColor: '', // Wird vom Backend ergänzt
      };
      await saveAnnouncementsAction([newAnnouncement]);
      const updated = await getAllAnnouncementsAction();
      const mapped = updated.map((a: any) => ({
        ...a,
        groupName: a.groupInfo?.name || '',
        groupColor: a.groupInfo?.color || '',
      })) as Announcement[];
      setAnnouncements(mapped);
    } catch (error: any) {
      setErrorAnnouncements('Fehler beim Erstellen der Ankündigung');
    } finally {
      setLoadingAnnouncements(false);
    }
  }, []);

  // Update Announcement
  const updateAnnouncement = useCallback(async (id: string, data: Partial<Announcement>) => {
    setLoadingAnnouncements(true);
    setErrorAnnouncements(null);
    try {
      const toUpdate = announcements.find(a => a.id === id);
      if (!toUpdate) throw new Error('Ankündigung nicht gefunden');
      const updatedAnnouncement: IAnnouncement = {
        ...toUpdate,
        ...data,
        updatedAt: new Date().toISOString(),
      };
      await saveAnnouncementsAction([updatedAnnouncement]);
      const updated = await getAllAnnouncementsAction();
      const mapped = updated.map((a: any) => ({
        ...a,
        groupName: a.groupInfo?.name || '',
        groupColor: a.groupInfo?.color || '',
      })) as Announcement[];
      setAnnouncements(mapped);
    } catch (error: any) {
      setErrorAnnouncements('Fehler beim Aktualisieren der Ankündigung');
    } finally {
      setLoadingAnnouncements(false);
    }
  }, [announcements]);

  // Delete Announcement
  const deleteAnnouncement = useCallback(async (id: string) => {
    setLoadingAnnouncements(true);
    setErrorAnnouncements(null);
    try {
      await deleteAnnouncementAction(id);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (error: any) {
      setErrorAnnouncements('Fehler beim Löschen der Ankündigung');
    } finally {
      setLoadingAnnouncements(false);
    }
  }, []);

  // Methoden (Platzhalter, später mit Service-Calls und Fehlerbehandlung)
  const createGroup = useCallback(async (data: Omit<Group, 'id'>) => {}, []);
  const updateGroup = useCallback(async (id: string, data: Partial<Group>) => {}, []);
  const deleteGroup = useCallback(async (id: string) => {}, []);

  const createTimelineEntry = useCallback(async (data: Omit<TimelineEntry, 'id'>) => {}, []);
  const updateTimelineEntry = useCallback(async (id: string, data: Partial<TimelineEntry>) => {}, []);
  const deleteTimelineEntry = useCallback(async (id: string) => {}, []);

  return {
    announcements,
    loadingAnnouncements,
    errorAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    workingGroups,
    loadingWorkingGroups,
    errorWorkingGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    timeline,
    loadingTimeline,
    errorTimeline,
    createTimelineEntry,
    updateTimelineEntry,
    deleteTimelineEntry,
  };
}; 