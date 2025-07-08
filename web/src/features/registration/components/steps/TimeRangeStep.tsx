"use client";

import React, { useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, SwatchBook } from 'lucide-react';
import { useCentralFestivalDays } from '@/shared/hooks/useCentralFestivalDays';
import type { FestivalRegisterData } from './types';

interface TimeRangeStepProps {
  form: FestivalRegisterData;
  setForm: React.Dispatch<React.SetStateAction<FestivalRegisterData>>;
  fromDay: number;
  toDay: number;
  setFromDay: (day: number) => void;
  setToDay: (day: number) => void;
}

const TimeRangeStep: React.FC<TimeRangeStepProps> = ({ 
  form, 
  setForm, 
  fromDay, 
  toDay, 
  setFromDay, 
  setToDay 
}) => {
  const { data: centralFestivalDays, loading: festivalDaysLoading } = useCentralFestivalDays();

  // Convert central festival days to the legacy format that existing registrations expect
  const FESTIVAL_DAYS = useMemo(() => {
    if (!centralFestivalDays || centralFestivalDays.length === 0) return [];
    
    return centralFestivalDays.map(day => {
      try {
        const date = new Date(day.date);
        const dayNum = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${dayNum}.${month}.`;
      } catch (error) {
        console.error('Error converting festival day:', day, error);
        return '01.01.'; // Fallback
      }
    });
  }, [centralFestivalDays]);

  // Update form data whenever the day selection changes
  useEffect(() => {
    if (FESTIVAL_DAYS.length > 0) {
      // Debounce the update to prevent rapid-fire changes
      const timeoutId = setTimeout(() => {
        const selectedDays: number[] = [];
        for (let i = fromDay; i <= toDay; i++) {
          selectedDays.push(i);
        }
        
        // Only update if the days array actually changed to prevent infinite loops
        const currentDays = form.days || [];
        const daysChanged = selectedDays.length !== currentDays.length || 
                           selectedDays.some((day, index) => day !== currentDays[index]);
        
        if (daysChanged) {
          setForm(prev => ({
            ...prev,
            days: selectedDays
          }));
        }
      }, 10); // Very short debounce to batch rapid changes
      
      return () => clearTimeout(timeoutId);
    }
  }, [fromDay, toDay, setForm]);

  // Show loading state if festival days are still loading
  if (festivalDaysLoading || FESTIVAL_DAYS.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff9900]"></div>
          <p className="text-gray-600">Lade Festival-Tage...</p>
        </div>
      </div>
    );
  }

  // Handler für die Änderung des Start-Tages
  const handleFromDayChange = (newFromDay: number) => {
    if (newFromDay >= 0 && newFromDay < FESTIVAL_DAYS.length) {
      // Use React's automatic batching to update both states together
      React.startTransition(() => {
        setFromDay(newFromDay);
        // Sicherstellen, dass der End-Tag nicht vor dem Start-Tag liegt
        if (newFromDay > toDay) {
          setToDay(newFromDay);
        }
      });
    }
  };

  // Handler für die Änderung des End-Tages  
  const handleToDayChange = (newToDay: number) => {
    if (newToDay >= 0 && newToDay < FESTIVAL_DAYS.length) {
      // Use React's automatic batching to update both states together
      React.startTransition(() => {
        setToDay(newToDay);
        // Sicherstellen, dass der Start-Tag nicht nach dem End-Tag liegt
        if (newToDay < fromDay) {
          setFromDay(newToDay);
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <SwatchBook className="mx-auto h-12 w-12 text-[#ff9900] mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">An welchen Tagen kommst du?</h2>
        <p className="text-gray-600">
          Wähle die Tage aus, an denen du beim Festival dabei sein möchtest.
        </p>
      </div>

      <div className="space-y-4">
        {/* Von-Tag Auswahl */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Von (erster Tag):
          </label>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => handleFromDayChange(fromDay - 1)}
              disabled={fromDay <= 0}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {FESTIVAL_DAYS[fromDay] || 'Laden...'}
              </div>
              <div className="text-sm text-gray-500">
                Tag {fromDay + 1}
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => handleFromDayChange(fromDay + 1)}
              disabled={fromDay >= FESTIVAL_DAYS.length - 1}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Bis-Tag Auswahl */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bis (letzter Tag):
          </label>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => handleToDayChange(toDay - 1)}
              disabled={toDay <= fromDay}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {FESTIVAL_DAYS[toDay] || 'Laden...'}
              </div>
              <div className="text-sm text-gray-500">
                Tag {toDay + 1}
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => handleToDayChange(toDay + 1)}
              disabled={toDay >= FESTIVAL_DAYS.length - 1}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Übersicht der gewählten Tage */}
        <div className="bg-[#ff9900]/5 border border-[#ff9900]/20 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Deine gewählten Tage:</h3>
          <div className="flex flex-wrap gap-2">
            {FESTIVAL_DAYS.slice(fromDay, toDay + 1).map((day, index) => (
              <span
                key={fromDay + index}
                className="px-3 py-1 bg-[#ff9900] text-white text-sm rounded-full"
              >
                {day}
              </span>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Du hast {toDay - fromDay + 1} Tag{toDay - fromDay + 1 !== 1 ? 'e' : ''} gewählt.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TimeRangeStep; 