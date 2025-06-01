"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/shared/components/ui/sheet";
import { 
  Euro, 
  Info, 
  AlertTriangle, 
  Shield, 
  Camera, 
  Lightbulb, 
  Music, 
  ChefHat, 
  WheatOff, 
  Wrench, 
  MessageCircle,
  Stethoscope,
  Car as CarIcon,
  Bed,
  Tent,
  TrainIcon,
  BikeIcon,
  HelpCircle,
  Calendar,
  User,
  Phone,
  Send
} from 'lucide-react';
import { useDeviceContext } from '@/shared/contexts/DeviceContext';
import { formatDateBerlin } from '@/shared/utils/formatDateBerlin';
import type { RegistrationWithId } from '../types';
import { useFestivalDays } from '@/shared/hooks/useFestivalDays';
import { Badge } from '@/shared/components/ui/badge';

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
  const { festivalDays: FESTIVAL_DAYS, loading: festivalDaysLoading } = useFestivalDays();

  if (!registration) return null;

  if (festivalDaysLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="text-center py-4">
            Lade Festival-Daten...
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const content = (
    <div className="flex flex-col gap-6 text-[#460b6c] overflow-y-auto">
      {/* Status Buttons */}
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

      {/* Grunddaten */}
      <div className="bg-[#460b6c]/10 border border-[#ff9900]/30 rounded-xl px-4 py-3 space-y-3">
        <h3 className="font-semibold text-[#460b6c] mb-3">Grunddaten</h3>
        
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#ff9900]" />
          <span className="font-medium">Zeitraum:</span>
          <span>{FESTIVAL_DAYS[registration.days[0]]} – {FESTIVAL_DAYS[registration.days[registration.days.length - 1]]}</span>
        </div>

        {/* Contact Information */}
        {registration.contactType && registration.contactType !== 'none' && registration.contactInfo && registration.contactInfo.trim() && (
          <div className="flex items-center gap-2">
            {registration.contactType === 'phone' ? <Phone className="w-4 h-4 text-[#ff9900]" /> : <Send className="w-4 h-4 text-[#ff9900]" />}
            <span className="font-medium">{registration.contactType === 'phone' ? 'Telefon:' : 'Telegram:'}</span>
            <span>{registration.contactInfo}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {registration.travelType === 'auto' && <CarIcon className="w-4 h-4 text-[#ff9900]" />}
          {registration.travelType === 'zug' && <TrainIcon className="w-4 h-4 text-[#ff9900]" />}
          {registration.travelType === 'fahrrad' && <BikeIcon className="w-4 h-4 text-[#ff9900]" />}
          {registration.travelType === 'andere' && <HelpCircle className="w-4 h-4 text-[#ff9900]" />}
          <span className="font-medium">Anreise:</span>
          <span>{registration.travelType === 'zug' ? 'Zug' : registration.travelType === 'auto' ? 'Auto' : registration.travelType === 'fahrrad' ? 'Fahrrad' : 'Andere'}</span>
        </div>

        <div className="flex items-center gap-2">
          {registration.sleepingPreference === 'bed' && <Bed className="w-4 h-4 text-[#ff9900]" />}
          {registration.sleepingPreference === 'tent' && <Tent className="w-4 h-4 text-[#ff9900]" />}
          {registration.sleepingPreference === 'car' && <CarIcon className="w-4 h-4 text-[#ff9900]" />}
          <span className="font-medium">Schlafplatz:</span>
          <span>{registration.sleepingPreference === 'bed' ? 'Bett' : registration.sleepingPreference === 'tent' ? 'Zelt' : 'Auto'}</span>
        </div>
      </div>

      {/* Engagement */}
      <div className="bg-[#460b6c]/10 border border-[#ff9900]/30 rounded-xl px-4 py-3 space-y-3">
        <h3 className="font-semibold text-[#460b6c] mb-3">Engagement</h3>
        
        {registration.isMedic && (
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-blue-500" />
            <span className="font-medium">Sanitäter:in</span>
          </div>
        )}

        {registration.canStaySober && (
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <span className="font-medium">Kann nüchtern fahren</span>
          </div>
        )}

        {registration.wantsAwareness && (
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-500" />
            <span className="font-medium">Awareness-Team</span>
          </div>
        )}

        {registration.wantsKitchenHelp && (
          <div className="flex items-center gap-2">
            <ChefHat className="w-4 h-4 text-green-600" />
            <span className="font-medium">Küchen-Hilfe</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Camera className={`w-4 h-4 ${registration.allowsPhotos ? 'text-green-500' : 'text-red-500'}`} />
          <span className="font-medium">Fotos:</span>
          <span>{registration.allowsPhotos ? 'Erlaubt' : 'Nicht erlaubt'}</span>
        </div>
      </div>

      {/* Programm & Beiträge */}
      {(registration.programContribution && registration.programContribution !== "nein") || registration.lineupContribution.trim() ? (
        <div className="bg-[#460b6c]/10 border border-[#ff9900]/30 rounded-xl px-4 py-3 space-y-3">
          <h3 className="font-semibold text-[#460b6c] mb-3">Programm & Beiträge</h3>
          
          {registration.programContribution && registration.programContribution !== "nein" && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-[#ff9900]" />
                <span className="font-medium">Programmpunkt:</span>
                <span>{registration.programContribution === "ja_mit_idee" ? "Ja, mit Idee" : "Ja, ohne Idee"}</span>
              </div>
              {registration.wantsToOfferWorkshop.trim() && (
                <div className="ml-6 text-sm text-gray-600 bg-white/50 rounded p-2">
                  {registration.wantsToOfferWorkshop}
                </div>
              )}
            </div>
          )}

          {registration.lineupContribution.trim() && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-[#ff9900]" />
                <span className="font-medium">Line-Up Beitrag:</span>
              </div>
              <div className="ml-6 text-sm text-gray-600 bg-white/50 rounded p-2">
                {registration.lineupContribution}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Zusätzliche Informationen */}
      {(registration.allergies.trim() || registration.equipment.trim() || registration.concerns.trim()) && (
        <div className="bg-[#460b6c]/10 border border-[#ff9900]/30 rounded-xl px-4 py-3 space-y-3">
          <h3 className="font-semibold text-[#460b6c] mb-3">Zusätzliche Informationen</h3>
          
          {registration.allergies.trim() && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <WheatOff className="w-4 h-4 text-[#ff9900]" />
                <span className="font-medium">Allergien & Unverträglichkeiten:</span>
              </div>
              <div className="ml-6 text-sm text-gray-600 bg-white/50 rounded p-2">
                {registration.allergies}
              </div>
            </div>
          )}

          {registration.equipment.trim() && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#ff9900]" />
                <span className="font-medium">Equipment:</span>
              </div>
              <div className="ml-6 text-sm text-gray-600 bg-white/50 rounded p-2">
                {registration.equipment}
              </div>
            </div>
          )}

          {registration.concerns.trim() && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#ff9900]" />
                <span className="font-medium">Anliegen:</span>
              </div>
              <div className="ml-6 text-sm text-gray-600 bg-white/50 rounded p-2">
                {registration.concerns}
              </div>
            </div>
          )}
        </div>
      )}
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