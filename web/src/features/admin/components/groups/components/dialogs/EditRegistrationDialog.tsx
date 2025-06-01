"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { toast } from "react-hot-toast";
import { updateRegistrationAction } from '../../../../../registration/actions/updateRegistration';
import type { RegistrationWithId } from '../types';
import { useFestivalDays } from '@/shared/hooks/useFestivalDays';

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

  if (!registration) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
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
        onRegistrationUpdated({ ...registration, ...formData } as RegistrationWithId);
        onOpenChange(false);
        toast.success('Anmeldung erfolgreich aktualisiert');
    } else {
      toast.error(result.error || 'Fehler beim Speichern');
    }
    } catch (error) {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[700px] w-[90vw] p-6 bg-white max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">
            Anmeldung bearbeiten: {registration.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Grunddaten */}
        <div className="space-y-4">
            <h3 className="font-semibold text-[#460b6c]">Grunddaten</h3>
            
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
                value={formData.name || ''}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Name eingeben"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Festival-Tage</label>
              <div className="space-y-2">
                {FESTIVAL_DAYS.map((day, index) => (
                  <label key={index} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.days?.includes(index) || false}
                      onChange={(e) => updateField('days', e.target.checked ? [...(formData.days || []), index].sort((a, b) => a - b) : formData.days?.filter(d => d !== index))}
                      className="mr-2"
                    />
                    {day}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Anreise</label>
                <Select value={formData.travelType || ''} onValueChange={(value) => updateField('travelType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Anreise wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="zug">Zug</SelectItem>
                    <SelectItem value="fahrrad">Fahrrad</SelectItem>
                    <SelectItem value="andere">Andere</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Schlafplatz</label>
                <Select value={formData.sleepingPreference || ''} onValueChange={(value) => updateField('sleepingPreference', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Schlafplatz wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bed">Bett</SelectItem>
                    <SelectItem value="tent">Zelt</SelectItem>
                    <SelectItem value="car">Auto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Kontakt */}
          <div className="space-y-4">
            <h3 className="font-semibold text-[#460b6c]">Kontakt</h3>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Kontakt-Art</label>
              <Select value={formData.contactType || ''} onValueChange={(value) => updateField('contactType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Kontakt-Art wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keine Angabe</SelectItem>
                  <SelectItem value="phone">Telefonnummer</SelectItem>
                  <SelectItem value="telegram">Telegram</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
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
              />
            </div>
          </div>

          {/* Engagement */}
          <div className="space-y-4">
            <h3 className="font-semibold text-[#460b6c]">Engagement</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isMedic"
                  checked={formData.isMedic ?? false}
                  onChange={(e) => updateField('isMedic', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="isMedic" className="text-sm">Sanitäter:in</label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="canStaySober"
                  checked={formData.canStaySober ?? false}
                  onChange={(e) => updateField('canStaySober', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="canStaySober" className="text-sm">Kann nüchtern fahren</label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="wantsAwareness"
                  checked={formData.wantsAwareness ?? false}
                  onChange={(e) => updateField('wantsAwareness', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="wantsAwareness" className="text-sm">Awareness-Team</label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="wantsKitchenHelp"
                  checked={formData.wantsKitchenHelp ?? false}
                  onChange={(e) => updateField('wantsKitchenHelp', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="wantsKitchenHelp" className="text-sm">Küchen-Hilfe</label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="allowsPhotos"
                  checked={formData.allowsPhotos ?? false}
                  onChange={(e) => updateField('allowsPhotos', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="allowsPhotos" className="text-sm">Fotos erlaubt</label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Programmpunkt</label>
              <Select value={formData.programContribution || ''} onValueChange={(value) => updateField('programContribution', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Programmpunkt wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nein">Nein</SelectItem>
                  <SelectItem value="ja_ohne_idee">Ja, ohne Idee</SelectItem>
                  <SelectItem value="ja_mit_idee">Ja, mit Idee</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Beiträge */}
          <div className="space-y-4">
            <h3 className="font-semibold text-[#460b6c]">Beiträge</h3>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Workshop/Programm Idee</label>
              <Textarea
                value={formData.wantsToOfferWorkshop || ''}
                onChange={(e) => updateField('wantsToOfferWorkshop', e.target.value)}
                placeholder="Beschreibe deine Idee..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Line-Up Beitrag</label>
              <Textarea
                value={formData.lineupContribution || ''}
                onChange={(e) => updateField('lineupContribution', e.target.value)}
                placeholder="Beschreibe deinen Beitrag..."
                rows={3}
              />
            </div>
          </div>

          {/* Zusätzliche Informationen */}
          <div className="space-y-4">
            <h3 className="font-semibold text-[#460b6c]">Zusätzliche Informationen</h3>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Allergien & Unverträglichkeiten</label>
              <Textarea
                value={formData.allergies || ''}
                onChange={(e) => updateField('allergies', e.target.value)}
                placeholder="z.B. Nussallergie, Laktoseintoleranz, vegetarisch, vegan..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Equipment</label>
              <Textarea
                value={formData.equipment || ''}
                onChange={(e) => updateField('equipment', e.target.value)}
                placeholder="z.B. Musikanlage, Pavillon, Werkzeug..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Anliegen</label>
              <Textarea
                value={formData.concerns || ''}
                onChange={(e) => updateField('concerns', e.target.value)}
                placeholder="Dein Anliegen..."
                rows={2}
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-4">
            <h3 className="font-semibold text-[#460b6c]">Status</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="paid"
                  checked={formData.paid ?? false}
                  onChange={(e) => updateField('paid', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="paid" className="text-sm">Bezahlt</label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="checkedIn"
                  checked={formData.checkedIn ?? false}
                  onChange={(e) => updateField('checkedIn', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="checkedIn" className="text-sm">Angemeldet</label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Abbrechen
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-[#ff9900] text-[#2d0066] hover:bg-[#ff9900]/80"
          >
            {loading ? 'Speichern...' : 'Speichern'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 