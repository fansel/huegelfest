import React, { useState } from 'react';
import AnnouncementsDesktop from '../components/announcements/AnnouncementsDesktop';
import GroupsManagerDesktop from '../components/groups/GroupsManagerDesktop';
import TimelineManagerDesktop from '../components/timeline/TimelineDesktop';
import MusicManager from '../components/music/MusicManager';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Settings from '@/features/settings/components/Settings';
import { useTimeline } from '@/features/timeline/hooks/useTimeline';

const AdminDashboardDesktop: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'announcements' | 'groups' | 'timeline' | 'music' | 'settings'>('announcements');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const {
    timeline,
    loading,
    error,
    refetch,
    createDay,
    removeDay,
    updateDay,
    createEvent,
    removeEvent,
    moveEvent,
    updateEvent,
  } = useTimeline();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // TODO: Logout-Logik einbauen
      // await logout();
      router.push('/login');
    } catch (error) {
      setIsLoggingOut(false);
      toast.error('Beim Ausloggen ist ein Fehler aufgetreten. Bitte versuche es erneut.');
    }
  };

  return (
    <div className="min-h-screen text-[#ff9900] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#460b6c]/80 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
          {/* Header mit Logout-Button */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-[#ff9900]/20">
            <h1 className="text-xl font-semibold">Admin Dashboard</h1>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoggingOut ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Wird ausgeloggt...</span>
                </>
              ) : (
                'Ausloggen'
              )}
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-[#ff9900]/20">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('announcements')}
                className={`py-4 px-3 border-b-2 font-medium text-sm ${
                  activeTab === 'announcements'
                    ? 'border-[#ff9900] text-[#ff9900]'
                    : 'border-transparent text-[#ff9900]/60 hover:text-[#ff9900] hover:border-[#ff9900]/40'
                }`}
              >
                Ankündigungen
              </button>
              <button
                onClick={() => setActiveTab('groups')}
                className={`py-4 px-3 border-b-2 font-medium text-sm ${
                  activeTab === 'groups'
                    ? 'border-[#ff9900] text-[#ff9900]'
                    : 'border-transparent text-[#ff9900]/60 hover:text-[#ff9900] hover:border-[#ff9900]/40'
                }`}
              >
                Gruppen
              </button>
              <button
                onClick={() => setActiveTab('timeline')}
                className={`py-4 px-3 border-b-2 font-medium text-sm ${
                  activeTab === 'timeline'
                    ? 'border-[#ff9900] text-[#ff9900]'
                    : 'border-transparent text-[#ff9900]/60 hover:text-[#ff9900] hover:border-[#ff9900]/40'
                }`}
              >
                Timeline
              </button>
              <button
                onClick={() => setActiveTab('music')}
                className={`py-4 px-3 border-b-2 font-medium text-sm ${
                  activeTab === 'music'
                    ? 'border-[#ff9900] text-[#ff9900]'
                    : 'border-transparent text-[#ff9900]/60 hover:text-[#ff9900] hover:border-[#ff9900]/40'
                }`}
              >
                Musik
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-4 px-3 border-b-2 font-medium text-sm ${
                  activeTab === 'settings'
                    ? 'border-[#ff9900] text-[#ff9900]'
                    : 'border-transparent text-[#ff9900]/60 hover:text-[#ff9900] hover:border-[#ff9900]/40'
                }`}
              >
                Admin-Einstellungen
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'announcements' && (
              <AnnouncementsDesktop />
            )}
            {activeTab === 'groups' && (
              <GroupsManagerDesktop />
            )}
            {activeTab === 'timeline' && (
              <TimelineManagerDesktop
                timeline={timeline}
                loading={loading}
                error={error}
                refetch={refetch}
                createDay={createDay}
                removeDay={removeDay}
                updateDay={updateDay}
                createEvent={createEvent}
                removeEvent={removeEvent}
                moveEvent={moveEvent}
                updateEvent={updateEvent}
              />
            )}
            {activeTab === 'music' && (
              <MusicManager />
            )}
            {activeTab === 'settings' && (
              <Settings showStarfield={false} onToggleStarfield={() => {}} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardDesktop; 