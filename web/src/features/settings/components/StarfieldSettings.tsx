'use client';

import { useState, useEffect } from 'react';
import UserSettingsCard from './UserSettingsCard';
import { Star } from 'lucide-react';
import { Switch } from '@/shared/components/ui/switch';

interface StarfieldSettingsProps {
  showStarfield: boolean;
  onToggle: (value: boolean) => void;
  variant?: 'row' | 'tile';
}

export default function StarfieldSettings({ showStarfield, onToggle, variant = 'row' }: StarfieldSettingsProps) {
  const [localStorageValue, setLocalStorageValue] = useState<string | null>(null);
  
  // Debug-Log bei jeder Änderung (sicher vor SSR)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedValue = localStorage.getItem('showStarfield');
        setLocalStorageValue(storedValue);
        console.log('StarfieldSettings render with:', { showStarfield, storageValue: storedValue });
      } catch (error) {
        console.error('Error accessing localStorage in StarfieldSettings:', error);
      }
    }
  }, [showStarfield]);

  // Debug-Handler für onToggle
  const handleToggle = (value: boolean) => {
    console.log('StarfieldSettings toggle called with:', value);
    
    // Direkter localStorage-Test (sicher vor SSR)
    let beforeValue = null;
    if (typeof window !== 'undefined') {
      try {
        beforeValue = localStorage.getItem('showStarfield');
        console.log('Before localStorage change:', beforeValue);
      } catch (error) {
        console.error('Error reading localStorage:', error);
      }
    }
    
    // Callback aufrufen
    onToggle(value);
    
    // Prüfen, ob der Wert sofort geändert wurde (sicher vor SSR)
    if (typeof window !== 'undefined') {
      try {
        const afterValue = localStorage.getItem('showStarfield');
        setLocalStorageValue(afterValue);
        console.log('After onToggle called:', afterValue);
        
        // Kurz warten und nochmal prüfen (async-Effekte)
        setTimeout(() => {
          try {
            const delayedValue = localStorage.getItem('showStarfield');
            console.log('After 100ms:', delayedValue);
          } catch (error) {
            console.error('Error in timeout:', error);
          }
        }, 100);
      } catch (error) {
        console.error('Error accessing localStorage after toggle:', error);
      }
    }
  };

  return (
    <UserSettingsCard
      icon={<Star className="w-5 h-5 text-[#ff9900]" />}
      title="Sternenhimmel"
      switchElement={
        <div className="flex items-center gap-1">
          <Switch checked={showStarfield} onCheckedChange={handleToggle} />
        </div>
      }
      info="Aktiviere den animierten Sternenhimmel im Hintergrund."
      variant={variant}
    />
  );
}
