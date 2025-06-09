"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { toast } from "react-hot-toast";
import { updateRegistrationAction } from '../../../../../registration/actions/updateRegistration';
import type { RegistrationWithId } from '../types';
import { useFestivalDays } from '@/shared/hooks/useFestivalDays';
import { User, Calendar, CarIcon, Bed, Phone, Shield, Stethoscope, ChefHat, Camera, Lightbulb, Info, Euro, AlertTriangle } from 'lucide-react';
import { globalWebSocketManager } from '@/shared/utils/globalWebSocketManager';

interface EditRegistrationDialogProps {
  registration: RegistrationWithId | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegistrationUpdated: (registration: RegistrationWithId) => void;
}

export function EditRegistrationDialog({ 
  registration, 
  open, 
  onOpenChange, 
  onRegistrationUpdated 
}: EditRegistrationDialogProps) {
  const { festivalDays: FESTIVAL_DAYS, loading: festivalDaysLoading } = useFestivalDays();
  const [formData, setFormData] = useState<Partial<RegistrationWithId>>({});
  const [loading, setLoading] = useState(false);

  // Initialize form data when registration changes
  useEffect(() => {
    if (registration) {
      setFormData({
        name: registration.name,
        days: registration.days,
        isMedic: registration.isMedic,
        canStaySober: registration.canStaySober,
        wantsAwareness: registration.wantsAwareness,
        allowsPhotos: registration.allowsPhotos,
        programContribution: registration.programContribution,
        wantsKitchenHelp: registration.wantsKitchenHelp,
        travelType: registration.travelType,
        sleepingPreference: registration.sleepingPreference,
        equipment: registration.equipment,
        concerns: registration.concerns,
        wantsToOfferWorkshop: registration.wantsToOfferWorkshop,
        lineupContribution: registration.lineupContribution,
        allergies: registration.allergies,
        paid: registration.paid,
        checkedIn: registration.checkedIn,
        contactType: registration.contactType,
        contactInfo: registration.contactInfo
      });
    }
  }, [registration]);

  // WebSocket-Listener für Updates
  useEffect(() => {
    const handleRegistrationUpdate = (msg: string) => {
      try {
        const data = JSON.parse(msg);
        if (data.topic !== 'registration:updated') return;
        
        const updatedRegistration = data.payload;
        if (registration && updatedRegistration._id === registration._id) {
          // Nur die empfangenen Felder aktualisieren
          onRegistrationUpdated({
            ...registration,
            ...updatedRegistration
          });
        }
      } catch (error) {
        console.error('Fehler beim Verarbeiten der WebSocket-Nachricht:', error);
      }
    };

    globalWebSocketManager.addListeners({
      onMessage: handleRegistrationUpdate
    });

    return () => {
      globalWebSocketManager.removeListeners({
        onMessage: handleRegistrationUpdate
      });
    };
  }, [registration, onRegistrationUpdated]);

  if (!registration) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      // Optimistic update
      const optimisticUpdate = {
        ...registration,
        ...formData
      };
      onRegistrationUpdated(optimisticUpdate);

      const result = await updateRegistrationAction(registration._id, {
        name: formData.name || registration.name,
        days: formData.days || registration.days,
        isMedic: formData.isMedic ?? registration.isMedic,
        canStaySober: formData.canStaySober ?? registration.canStaySober,
        wantsAwareness: formData.wantsAwareness ?? registration.wantsAwareness,
        allowsPhotos: formData.allowsPhotos ?? registration.allowsPhotos,
        programContribution: formData.programContribution || registration.programContribution,
        wantsKitchenHelp: formData.wantsKitchenHelp ?? registration.wantsKitchenHelp,
        travelType: formData.travelType || registration.travelType,
        sleepingPreference: formData.sleepingPreference || registration.sleepingPreference,
        equipment: formData.equipment || registration.equipment,
        concerns: formData.concerns || registration.concerns,
        wantsToOfferWorkshop: formData.wantsToOfferWorkshop || registration.wantsToOfferWorkshop,
        lineupContribution: formData.lineupContribution || registration.lineupContribution,
        allergies: formData.allergies || registration.allergies,
        paid: formData.paid ?? registration.paid,
        checkedIn: formData.checkedIn ?? registration.checkedIn,
        contactType: formData.contactType || registration.contactType,
        contactInfo: formData.contactInfo || registration.contactInfo
      });

      if (result.success) {
        // Server bestätigt die Änderung
        onOpenChange(false);
        toast.success('Anmeldung erfolgreich aktualisiert');

        // WebSocket-Nachricht senden - nur minimal notwendige Daten
        globalWebSocketManager.send(JSON.stringify({
          topic: 'registration:updated',
          payload: {
            _id: registration._id,
            // Nur öffentliche Informationen
            name: formData.name,
            days: formData.days,
            isMedic: formData.isMedic,
            canStaySober: formData.canStaySober,
            wantsAwareness: formData.wantsAwareness,
            wantsKitchenHelp: formData.wantsKitchenHelp,
            paid: formData.paid,
            checkedIn: formData.checkedIn
          }
        }));
      } else {
        // Fehler - UI zurücksetzen
        onRegistrationUpdated(registration);
        toast.error(result.error || 'Fehler beim Speichern');
      }
    } catch (error) {
      // Fehler - UI zurücksetzen
      onRegistrationUpdated(registration);
      toast.error('Fehler beim Speichern');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof RegistrationWithId, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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

  return (
    <>
      <div id="select-portal" className="relative z-[100]" />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[700px] w-[90vw] p-6 bg-white max-h-[90vh] overflow-visible fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-[#460b6c] text-xl font-semibold">
              {registration.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="overflow-y-auto flex-1 pr-2" style={{ maxHeight: 'calc(90vh - 200px)' }}>
            <div className="space-y-6 relative" style={{ position: 'static' }}>
              {/* Grunddaten */}
              <div className="bg-[#460b6c]/5 border border-[#ff9900]/20 rounded-xl p-5 space-y-4">
                <h3 className="font-semibold text-[#460b6c] flex items-center gap-2">
                  <User className="w-4 h-4 text-[#ff9900]" />
                  Grunddaten
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-[#460b6c]">Name</label>
                    <Input
                      value={formData.name || ''}
                      onChange={(e) => updateField('name', e.target.value)}
                      placeholder="Name eingeben"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[#460b6c] flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#ff9900]" />
                      Festival-Tage
                    </label>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {FESTIVAL_DAYS.map((day, index) => (
                        <label key={index} className="flex items-center gap-2 bg-white/80 p-2 rounded-lg hover:bg-white transition-colors">
                          <input
                            type="checkbox"
                            checked={formData.days?.includes(index) || false}
                            onChange={(e) => updateField('days', e.target.checked ? [...(formData.days || []), index].sort((a, b) => a - b) : formData.days?.filter(d => d !== index))}
                            className="rounded border-[#ff9900]/30"
                          />
                          <span className="text-sm">{day}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-[#460b6c] flex items-center gap-2">
                        <CarIcon className="w-4 h-4 text-[#ff9900]" />
                        Anreise
                      </label>
                      <select
                        value={formData.travelType || ''}
                        onChange={(e) => updateField('travelType', e.target.value)}
                        className="mt-1 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-[#ff9900] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Anreise wählen</option>
                        <option value="auto">Auto</option>
                        <option value="zug">Zug</option>
                        <option value="fahrrad">Fahrrad</option>
                        <option value="andere">Andere</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-[#460b6c] flex items-center gap-2">
                        <Bed className="w-4 h-4 text-[#ff9900]" />
                        Schlafplatz
                      </label>
                      <select
                        value={formData.sleepingPreference || ''}
                        onChange={(e) => updateField('sleepingPreference', e.target.value)}
                        className="mt-1 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-[#ff9900] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Schlafplatz wählen</option>
                        <option value="bed">Bett</option>
                        <option value="tent">Zelt</option>
                        <option value="car">Auto</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kontakt */}
              <div className="bg-[#460b6c]/5 border border-[#ff9900]/20 rounded-xl p-5 space-y-4">
                <h3 className="font-semibold text-[#460b6c] flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#ff9900]" />
                  Kontakt
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-[#460b6c]">Kontakt-Art</label>
                    <select
                      value={formData.contactType || ''}
                      onChange={(e) => updateField('contactType', e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-[#ff9900] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Kontakt-Art wählen</option>
                      <option value="none">Keine Angabe</option>
                      <option value="phone">Telefonnummer</option>
                      <option value="telegram">Telegram</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[#460b6c]">
                      {formData.contactType === 'phone' ? 'Telefonnummer' : 
                       formData.contactType === 'telegram' ? 'Telegram Handle' : 'Kontakt Information'}
                    </label>
                    <Input
                      value={formData.contactInfo || ''}
                      onChange={(e) => updateField('contactInfo', e.target.value)}
                      placeholder={
                        formData.contactType === 'phone' ? 'z.B. +49 123 456789' :
                        formData.contactType === 'telegram' ? 'z.B. @username' :
                        'Kontakt Information'
                      }
                      disabled={formData.contactType === 'none'}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Engagement */}
              <div className="bg-[#460b6c]/5 border border-[#ff9900]/20 rounded-xl p-5 space-y-4">
                <h3 className="font-semibold text-[#460b6c] flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#ff9900]" />
                  Engagement
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-2 bg-white/80 p-2 rounded-lg hover:bg-white transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.isMedic ?? false}
                      onChange={(e) => updateField('isMedic', e.target.checked)}
                      className="rounded border-[#ff9900]/30"
                    />
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">Sanitäter:in</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 bg-white/80 p-2 rounded-lg hover:bg-white transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.canStaySober ?? false}
                      onChange={(e) => updateField('canStaySober', e.target.checked)}
                      className="rounded border-[#ff9900]/30"
                    />
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      <span className="text-sm">Nüchtern fahren</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 bg-white/80 p-2 rounded-lg hover:bg-white transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.wantsAwareness ?? false}
                      onChange={(e) => updateField('wantsAwareness', e.target.checked)}
                      className="rounded border-[#ff9900]/30"
                    />
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-purple-500" />
                      <span className="text-sm">Awareness-Team</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 bg-white/80 p-2 rounded-lg hover:bg-white transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.wantsKitchenHelp ?? false}
                      onChange={(e) => updateField('wantsKitchenHelp', e.target.checked)}
                      className="rounded border-[#ff9900]/30"
                    />
                    <div className="flex items-center gap-2">
                      <ChefHat className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Küchen-Hilfe</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 bg-white/80 p-2 rounded-lg hover:bg-white transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.allowsPhotos ?? false}
                      onChange={(e) => updateField('allowsPhotos', e.target.checked)}
                      className="rounded border-[#ff9900]/30"
                    />
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-gray-600" />
                      <span className="text-sm">Fotos erlaubt</span>
                    </div>
                  </label>
                </div>

                <div className="mt-4">
                  <label className="text-sm font-medium text-[#460b6c]">Programmpunkt</label>
                  <select
                    value={formData.programContribution || ''}
                    onChange={(e) => updateField('programContribution', e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-[#ff9900] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Programmpunkt wählen</option>
                    <option value="nein">Nein</option>
                    <option value="ja_ohne_idee">Ja, ohne Idee</option>
                    <option value="ja_mit_idee">Ja, mit Idee</option>
                  </select>
                </div>
              </div>

              {/* Beiträge */}
              <div className="bg-[#460b6c]/5 border border-[#ff9900]/20 rounded-xl p-5 space-y-4">
                <h3 className="font-semibold text-[#460b6c] flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-[#ff9900]" />
                  Beiträge
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-[#460b6c]">Workshop/Programm Idee</label>
                    <Textarea
                      value={formData.wantsToOfferWorkshop || ''}
                      onChange={(e) => updateField('wantsToOfferWorkshop', e.target.value)}
                      placeholder="Beschreibe deine Idee..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[#460b6c]">Line-Up Beitrag</label>
                    <Textarea
                      value={formData.lineupContribution || ''}
                      onChange={(e) => updateField('lineupContribution', e.target.value)}
                      placeholder="Beschreibe deinen Beitrag..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Zusätzliche Informationen */}
              <div className="bg-[#460b6c]/5 border border-[#ff9900]/20 rounded-xl p-5 space-y-4">
                <h3 className="font-semibold text-[#460b6c] flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#ff9900]" />
                  Zusätzliche Informationen
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-[#460b6c]">Allergien & Unverträglichkeiten</label>
                    <Textarea
                      value={formData.allergies || ''}
                      onChange={(e) => updateField('allergies', e.target.value)}
                      placeholder="z.B. Nussallergie, Laktoseintoleranz, vegetarisch, vegan..."
                      rows={2}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[#460b6c]">Equipment</label>
                    <Textarea
                      value={formData.equipment || ''}
                      onChange={(e) => updateField('equipment', e.target.value)}
                      placeholder="z.B. Musikanlage, Pavillon, Werkzeug..."
                      rows={2}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[#460b6c]">Anliegen</label>
                    <Textarea
                      value={formData.concerns || ''}
                      onChange={(e) => updateField('concerns', e.target.value)}
                      placeholder="Dein Anliegen..."
                      rows={2}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="bg-[#460b6c]/5 border border-[#ff9900]/20 rounded-xl p-5 space-y-4">
                <h3 className="font-semibold text-[#460b6c] flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#ff9900]" />
                  Status
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-2 bg-white/80 p-2 rounded-lg hover:bg-white transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.paid ?? false}
                      onChange={(e) => updateField('paid', e.target.checked)}
                      className="rounded border-[#ff9900]/30"
                    />
                    <div className="flex items-center gap-2">
                      <Euro className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Bezahlt</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 bg-white/80 p-2 rounded-lg hover:bg-white transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.checkedIn ?? false}
                      onChange={(e) => updateField('checkedIn', e.target.checked)}
                      className="rounded border-[#ff9900]/30"
                    />
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-orange-500" />
                      <span className="text-sm">Angemeldet</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6 gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              disabled={loading}
              className="border-[#ff9900] text-[#460b6c] hover:bg-[#ff9900]/10"
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-[#ff9900] text-[#460b6c] hover:bg-[#ff9900]/80"
            >
              {loading ? 'Speichern...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 