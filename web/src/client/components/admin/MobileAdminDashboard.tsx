import { useState, useCallback } from 'react';
import { IAnnouncement } from '@/types/announcement';
import { GroupColors } from '@/types/types';
import AnnouncementForm from './AnnouncementForm';
import GroupColorManager from './GroupColorManager';
import MusicManager from '../MusicManager';
import TimelineManager from './TimelineManager';
import { FaTimes } from 'react-icons/fa';

interface MobileAdminDashboardProps {
  announcements: IAnnouncement[];
  onSaveAnnouncements: (announcements: IAnnouncement[]) => void;
  onDeleteAnnouncement: (id: string) => void;
  groups: GroupColors;
  musicUrls: string[];
  onSaveMusicUrls: (urls: string[]) => void;
  onSaveGroupColors: (colors: GroupColors) => void;
}

const MobileAdminDashboard = ({
  announcements,
  onSaveAnnouncements,
  onDeleteAnnouncement,
  groups,
  musicUrls,
  onSaveMusicUrls,
  onSaveGroupColors,
}: MobileAdminDashboardProps) => {
  const [editingAnnouncement, setEditingAnnouncement] = useState<IAnnouncement | undefined>();
  const [activeTab, setActiveTab] = useState<'announcements' | 'groups' | 'music' | 'timeline'>('announcements');
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);

  const handleSaveAnnouncement = useCallback(
    (announcement: IAnnouncement) => {
      if (editingAnnouncement) {
        const updatedAnnouncement = {
          ...editingAnnouncement,
          ...announcement,
          id: editingAnnouncement.id
        };
        const updatedAnnouncements = announcements.map((a) => 
          a.id === editingAnnouncement.id ? updatedAnnouncement : a
        );
        onSaveAnnouncements(updatedAnnouncements);
      } else {
        onSaveAnnouncements([...announcements, announcement]);
      }
      // Reset everything
      setEditingAnnouncement(undefined);
      setShowAnnouncementModal(false);
    },
    [announcements, editingAnnouncement, onSaveAnnouncements],
  );

  return (
    <div className="fixed inset-0 bg-[#460b6c]">
      {/* Tabs */}
      <div className="fixed top-0 left-0 right-0 bg-[#460b6c] z-10">
        <nav className="flex justify-around px-2 py-3">
          <button
            onClick={() => setActiveTab('announcements')}
            className={`flex-1 py-2 text-center font-medium text-sm ${
              activeTab === 'announcements'
                ? 'text-[#ff9900] border-b-2 border-[#ff9900]'
                : 'text-[#ff9900]/60'
            }`}
          >
            Ankündigungen
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`flex-1 py-2 text-center font-medium text-sm ${
              activeTab === 'groups'
                ? 'text-[#ff9900] border-b-2 border-[#ff9900]'
                : 'text-[#ff9900]/60'
            }`}
          >
            Gruppen
          </button>
          <button
            onClick={() => setActiveTab('music')}
            className={`flex-1 py-2 text-center font-medium text-sm ${
              activeTab === 'music'
                ? 'text-[#ff9900] border-b-2 border-[#ff9900]'
                : 'text-[#ff9900]/60'
            }`}
          >
            Musik
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex-1 py-2 text-center font-medium text-sm ${
              activeTab === 'timeline'
                ? 'text-[#ff9900] border-b-2 border-[#ff9900]'
                : 'text-[#ff9900]/60'
            }`}
          >
            Timeline
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="pt-16 h-full">
        {activeTab === 'announcements' && (
          <div className="h-full bg-white">
            <div className="p-4">
              <button
                onClick={() => {
                  setEditingAnnouncement(undefined);
                  setShowAnnouncementModal(true);
                }}
                className="w-full bg-[#ff9900] text-white py-3 px-4 rounded-lg font-medium"
              >
                Neue Ankündigung
              </button>
            </div>
            <div className="px-4 space-y-3">
              {announcements.map((announcement) => (
                <div
                  key={`announcement-${announcement.id}`}
                  className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span
                      className="inline-block px-2 py-1 text-xs font-semibold rounded-full"
                      style={{ backgroundColor: announcement.groupColor }}
                    >
                      {announcement.groupName}
                    </span>
                    {announcement.important && (
                      <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                        Wichtig
                      </span>
                    )}
                  </div>
                  <p className="text-gray-800 text-sm mb-2">{announcement.content}</p>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => {
                        setEditingAnnouncement(announcement);
                        setShowAnnouncementModal(true);
                      }}
                      className="text-sm text-blue-600 px-3 py-1 rounded-full bg-blue-50"
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => onDeleteAnnouncement(announcement.id)}
                      className="text-sm text-red-600 px-3 py-1 rounded-full bg-red-50"
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'groups' && (
          <div className="h-full bg-white">
            <GroupColorManager onSaveGroupColors={onSaveGroupColors} />
          </div>
        )}
        {activeTab === 'music' && (
          <div className="h-full bg-white">
            <MusicManager musicUrls={musicUrls} onSaveMusicUrls={onSaveMusicUrls} />
          </div>
        )}
        {activeTab === 'timeline' && (
          <div className="h-full bg-white">
            <TimelineManager />
          </div>
        )}
      </div>

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50">
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-[#460b6c]">
                  {editingAnnouncement ? 'Ankündigung bearbeiten' : 'Neue Ankündigung'}
                </h3>
                <button
                  onClick={() => setShowAnnouncementModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>
              <div className="p-4">
                <AnnouncementForm
                  key={editingAnnouncement?.id || 'new'}
                  onSubmit={handleSaveAnnouncement}
                  initialData={editingAnnouncement}
                  groups={groups}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileAdminDashboard;
