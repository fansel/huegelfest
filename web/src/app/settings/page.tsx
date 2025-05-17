'use client';
import Settings from '@/features/settings/components/Settings';
import { useUISettings } from '@/shared/contexts/UISettingsContext';

export default function SettingsPage() {
  const { showStarfield, setShowStarfield } = useUISettings();

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Einstellungen</h1>
      <Settings
        showStarfield={showStarfield}
        onToggleStarfield={setShowStarfield}
      />
    </div>
  );
}
