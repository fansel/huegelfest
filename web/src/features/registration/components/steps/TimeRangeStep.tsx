"use client";

import React from 'react';
import { ChevronLeft, ChevronRight, SwatchBook } from 'lucide-react';
import { useFestivalDays } from '@/shared/hooks/useFestivalDays';
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
  const { festivalDays: FESTIVAL_DAYS, loading: festivalDaysLoading } = useFestivalDays();

  // Handler für die Änderung des Start-Tages
  const handleFromDayChange = (newFromDay: number) => {
    const fromDayNum = Number(newFromDay);
    setFromDay(fromDayNum);
    // Wenn der neue Start-Tag nach dem End-Tag liegt, setze End-Tag auf Start-Tag
    if (fromDayNum > toDay) {
      setToDay(fromDayNum);
    }
    // Aktualisiere die Tage im Formular
    const newDays: number[] = [];
    for (let i = fromDayNum; i <= toDay; i++) {
      newDays.push(i);
    }
    setForm(prev => ({ ...prev, days: newDays }));
  };

  // Handler für die Änderung des End-Tages
  const handleToDayChange = (newToDay: number) => {
    const toDayNum = Number(newToDay);
    setToDay(toDayNum);
    // Wenn der neue End-Tag vor dem Start-Tag liegt, setze Start-Tag auf End-Tag
    if (toDayNum < fromDay) {
      setFromDay(toDayNum);
    }
    // Aktualisiere die Tage im Formular
    const newDays: number[] = [];
    for (let i = fromDay; i <= toDayNum; i++) {
      newDays.push(i);
    }
    setForm(prev => ({ ...prev, days: newDays }));
  };

  // Show loading state if festival days are still loading
  if (festivalDaysLoading || FESTIVAL_DAYS.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 w-full">
        <div className="flex flex-col gap-2 w-full items-center mb-2">
          <SwatchBook className="inline-block w-7 h-7 text-[#ff9900]" />
          <span className="text-sm text-[#460b6c]/80 text-center">Festival-Tage werden geladen...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="flex flex-col gap-2 w-full items-center mb-2">
        <SwatchBook className="inline-block w-7 h-7 text-[#ff9900]" />
        <span className="text-sm text-[#460b6c]/80 text-center">Von wann bis wann bist du da?</span>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex gap-4 items-center justify-center">
          <div className="flex flex-col items-center">
            <span className="text-xs mb-1">Von</span>
            <div className="flex items-center gap-1">
              <button 
                type="button" 
                disabled={fromDay === 0} 
                onClick={() => handleFromDayChange(Math.max(0, fromDay - 1))} 
                className="p-1 disabled:opacity-50"
              >
                <ChevronLeft />
              </button>
              <select 
                value={fromDay} 
                onChange={e => handleFromDayChange(Number(e.target.value))} 
                className="rounded border px-2 py-1"
              >
                {FESTIVAL_DAYS.map((d, i) => (
                  <option key={d} value={i}>{d}</option>
                ))}
              </select>
              <button 
                type="button" 
                disabled={fromDay === FESTIVAL_DAYS.length - 1} 
                onClick={() => handleFromDayChange(Math.min(FESTIVAL_DAYS.length - 1, fromDay + 1))} 
                className="p-1 disabled:opacity-50"
              >
                <ChevronRight />
              </button>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs mb-1">Bis</span>
            <div className="flex items-center gap-1">
              <button 
                type="button" 
                disabled={toDay === 0} 
                onClick={() => handleToDayChange(Math.max(0, toDay - 1))} 
                className="p-1 disabled:opacity-50"
              >
                <ChevronLeft />
              </button>
              <select 
                value={toDay} 
                onChange={e => handleToDayChange(Number(e.target.value))} 
                className="rounded border px-2 py-1"
              >
                {FESTIVAL_DAYS.map((d, i) => (
                  <option key={d} value={i}>{d}</option>
                ))}
              </select>
              <button 
                type="button" 
                disabled={toDay === FESTIVAL_DAYS.length - 1} 
                onClick={() => handleToDayChange(Math.min(FESTIVAL_DAYS.length - 1, toDay + 1))} 
                className="p-1 disabled:opacity-50"
              >
                <ChevronRight />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Zeige ausgewählte Tage an */}
      <div className="mt-4 text-sm text-[#460b6c]/80">
        Ausgewählte Tage: {form.days.map(d => FESTIVAL_DAYS[d]).join(", ")}
      </div>
    </div>
  );
};

export default TimeRangeStep; 