"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { toast } from "react-hot-toast";
import { updateRegistrationAction } from '../../../registration/actions/updateRegistration';
import type { RegistrationWithId } from '../types';

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
  if (!registration) return null;

  const handleSave = async () => {
    const result = await updateRegistrationAction(registration._id, {
      name: registration.name,
      days: registration.days,
      priceOption: registration.priceOption,
      isMedic: registration.isMedic,
      travelType: registration.travelType,
      sleepingPreference: registration.sleepingPreference,
      equipment: registration.equipment,
      concerns: registration.concerns,
      wantsToOfferWorkshop: registration.wantsToOfferWorkshop,
      lineupContribution: registration.lineupContribution,
      paid: registration.paid,
      checkedIn: registration.checkedIn
    });

    if (result.success) {
      onRegistrationUpdated(registration);
    } else {
      toast.error(result.error || 'Fehler beim Speichern');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px] w-[90vw] p-6 bg-white max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">
            Anmeldung bearbeiten: {registration.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              value={registration.name}
              onChange={(e) => {
                // This would need to be handled by parent component
                // For now, just showing current value
              }}
            />
          </div>
          {/* Add other fields as needed */}
        </div>
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            onClick={handleSave}
            className="bg-[#ff9900] text-[#2d0066] hover:bg-[#ff9900]/80"
          >
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 