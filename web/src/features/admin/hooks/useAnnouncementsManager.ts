import { useAdminDashboard } from './useAdminDashboard';

export const useAnnouncementsManager = () => {
  const {
    announcements,
    loadingAnnouncements,
    errorAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    workingGroups,
  } = useAdminDashboard();

  // Hier ggf. weitere Logik, z.B. für Form-Handling

  return {
    announcements,
    loadingAnnouncements,
    errorAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    workingGroups,
  };
}; 