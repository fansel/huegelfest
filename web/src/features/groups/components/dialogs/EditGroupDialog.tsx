"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { toast } from "react-hot-toast";
import { updateGroupAction } from '../../actions/groupActions';
import type { GroupData } from '../../types';

interface EditGroupDialogProps {
  group: GroupData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupUpdated: (group: GroupData) => void;
}

export function EditGroupDialog({ group, open, onOpenChange, onGroupUpdated }: EditGroupDialogProps) {
  if (!group) return null;

  const handleSave = async () => {
    try {
      const result = await updateGroupAction(group.id, {
        name: group.name.trim(),
        color: group.color,
        isAssignable: group.isAssignable
      });

      if (result.success && result.data) {
        onGroupUpdated(result.data);
      } else {
        toast.error(result.error || 'Fehler beim Aktualisieren der Gruppe');
      }
    } catch (error) {
      toast.error('Ein unerwarteter Fehler ist aufgetreten');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle>Gruppe bearbeiten</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Gruppenname</label>
            <Input
              value={group.name}
              onChange={(e) => {
                // This needs to be handled by parent component
                // For now, we'll just show the current value
              }}
              placeholder="z.B. Küche, Technik, Orga..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Farbe</label>
            <div className="flex gap-2">
              {['#ff9900', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f39c12'].map(color => (
                <button
                  key={color}
                  onClick={() => {
                    // This needs to be handled by parent component
                  }}
                  className={`w-8 h-8 rounded-full border-2 ${
                    group.color === color ? 'border-gray-800' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nur manuelle Zuweisung</label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="editManualOnly"
                checked={!group.isAssignable}
                onChange={(e) => {
                  // This needs to be handled by parent component
                }}
              />
              <label htmlFor="editManualOnly" className="text-sm text-gray-600">
                Benutzer können nur manuell zu dieser Gruppe hinzugefügt werden
              </label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSave}>
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 