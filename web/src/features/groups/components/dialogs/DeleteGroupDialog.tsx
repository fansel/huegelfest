"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Button } from "@/shared/components/ui/button";
import { toast } from "react-hot-toast";
import { deleteGroupAction } from '../../actions/groupActions';

interface DeleteGroupDialogProps {
  groupId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupDeleted: () => void;
}

export function DeleteGroupDialog({ groupId, open, onOpenChange, onGroupDeleted }: DeleteGroupDialogProps) {
  const handleDelete = async () => {
    if (!groupId) return;
    
    try {
      const result = await deleteGroupAction(groupId);
      if (result.success) {
        onGroupDeleted();
      } else {
        toast.error(result.error || 'Fehler beim Löschen');
      }
    } catch (error) {
      toast.error('Ein unerwarteter Fehler ist aufgetreten');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>Gruppe löschen</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          Möchtest du diese Gruppe wirklich löschen? Alle Benutzer werden aus der Gruppe entfernt. Diese Aktion kann nicht rückgängig gemacht werden.
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