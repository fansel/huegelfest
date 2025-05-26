"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/shared/components/ui/sheet";
import { Euro, Info } from 'lucide-react';
import { useDeviceContext } from '@/shared/contexts/DeviceContext';
import { formatDateBerlin } from '@/shared/utils/formatDateBerlin';
import type { RegistrationWithId } from '../types';

interface RegistrationDetailDialogProps {
  registration: RegistrationWithId | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (field: 'paid' | 'checkedIn', value: boolean) => void;
}

export function RegistrationDetailDialog({ 
  registration, 
  open, 
  onOpenChange, 
  onStatusChange 
}: RegistrationDetailDialogProps) {
  const { deviceType } = useDeviceContext();

  if (!registration) return null;

  const content = (
    <div className="flex flex-col gap-6 text-[#460b6c] overflow-y-auto">
      <div className="text-center">
        <div className="flex gap-4 items-center mt-2 justify-center">
          <button
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-colors border focus:outline-none focus:ring-2 ${
              registration.paid 
                ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200 focus:ring-green-400' 
                : 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200 focus:ring-red-400'
            }`}
            onClick={() => onStatusChange('paid', !registration.paid)}
            type="button"
          >
            <Euro className="w-4 h-4" /> {registration.paid ? 'Bezahlt' : 'Unbezahlt'}
          </button>
          <button
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-colors border focus:outline-none focus:ring-2 ${
              registration.checkedIn 
                ? 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200 focus:ring-orange-400' 
                : 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200 focus:ring-red-400'
            }`}
            onClick={() => onStatusChange('checkedIn', !registration.checkedIn)}
            type="button"
          >
            <Info className="w-4 h-4" /> {registration.checkedIn ? 'Angemeldet' : 'Unangemeldet'}
          </button>
        </div>
        <div className="text-xs text-gray-400 mt-4">
          Erstellt: {formatDateBerlin(registration.createdAt)}
        </div>
      </div>
    </div>
  );

  if (deviceType === "mobile") {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="max-w-md w-full flex flex-col px-6">
          <SheetHeader>
            <SheetTitle>
              <div className="flex flex-col items-center mb-2">
                <span className="text-2xl font-bold text-[#460b6c] text-center tracking-wider" style={{ textTransform: 'uppercase' }}>
                  {registration.name}
                </span>
              </div>
            </SheetTitle>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[800px] w-[90vw] p-6 flex flex-col max-h-[80vh] bg-white">
        <DialogHeader>
          <DialogTitle className="text-center">
            <span className="text-2xl font-bold text-[#460b6c] text-center tracking-wider" style={{ textTransform: 'uppercase' }}>
              {registration.name}
            </span>
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto pr-2">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
} 