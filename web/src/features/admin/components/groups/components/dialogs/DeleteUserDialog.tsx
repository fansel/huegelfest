"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Button } from "@/shared/components/ui/button";
import { toast } from "react-hot-toast";
import { deleteUserAction } from '../../../../../auth/actions/userActions';

interface DeleteUserDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserDeleted: () => void;
}

export function DeleteUserDialog({ userId, open, onOpenChange, onUserDeleted }: DeleteUserDialogProps) {
  const handleDelete = async () => {
    if (!userId) return;
    
    const res = await deleteUserAction(userId);
    if (res.success) {
      onUserDeleted();
    } else {
      toast.error(res.error || 'Fehler beim Löschen.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>Benutzer löschen</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          Möchtest du diesen Benutzer wirklich löschen? Dabei wird auch die zugehörige Anmeldung gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Löschen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 