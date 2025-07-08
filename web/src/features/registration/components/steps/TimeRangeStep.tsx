"use client";

import React from 'react';
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
  const FESTIVAL_DAYS = centralFestivalDays.map(day => {
    const date = new Date(day.date);
    const dayNum = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${dayNum}.${month}.`;
  });

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
    setFromDay(newFromDay);
    // Sicherstellen, dass der End-Tag nicht vor dem Start-Tag liegt
    if (newFromDay > toDay) {
      setToDay(newFromDay);
    }
  };

  // Handler für die Änderung des End-Tages  
  const handleToDayChange = (newToDay: number) => {
    setToDay(newToDay);
    // Sicherstellen, dass der Start-Tag nicht nach dem End-Tag liegt
    if (newToDay < fromDay) {
      setFromDay(newToDay);
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
              onClick={() => handleFromDayChange(Math.max(0, fromDay - 1))}
              disabled={fromDay <= 0}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {FESTIVAL_DAYS[fromDay]}
              </div>
              <div className="text-sm text-gray-500">
                Tag {fromDay + 1}
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => handleFromDayChange(Math.min(FESTIVAL_DAYS.length - 1, fromDay + 1))}
              disabled={fromDay >= FESTIVAL_DAYS.length - 1}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
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
              onClick={() => handleToDayChange(Math.max(fromDay, toDay - 1))}
              disabled={toDay <= fromDay}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {FESTIVAL_DAYS[toDay]}
              </div>
              <div className="text-sm text-gray-500">
                Tag {toDay + 1}
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => handleToDayChange(Math.min(FESTIVAL_DAYS.length - 1, toDay + 1))}
              disabled={toDay >= FESTIVAL_DAYS.length - 1}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
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