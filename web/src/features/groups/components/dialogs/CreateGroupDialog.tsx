"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { toast } from "react-hot-toast";
import { createGroupAction } from '../../actions/groupActions';
import type { GroupData } from '../../types';

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupCreated: (group: GroupData) => void;
}

export function CreateGroupDialog({ open, onOpenChange, onGroupCreated }: CreateGroupDialogProps) {
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#ff9900');
  const [newGroupIsAssignable, setNewGroupIsAssignable] = useState(true);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error('Gruppenname ist erforderlich');
      return;
    }

    try {
      const result = await createGroupAction({
        name: newGroupName.trim(),
        color: newGroupColor,
        isAssignable: newGroupIsAssignable
      });

      if (result.success && result.data) {
        onGroupCreated(result.data);
        setNewGroupName('');
        setNewGroupColor('#ff9900');
        setNewGroupIsAssignable(true);
        onOpenChange(false);
      } else {
        toast.error(result.error || 'Fehler beim Erstellen der Gruppe');
      }
    } catch (error) {
      toast.error('Ein unerwarteter Fehler ist aufgetreten');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle>Neue Gruppe erstellen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Gruppenname</label>
            <Input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="z.B. Küche, Technik, Orga..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Farbe</label>
            <div className="flex gap-2">
              {['#ff9900', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f39c12'].map(color => (
                <button
                  key={color}
                  onClick={() => setNewGroupColor(color)}
                  className={`w-8 h-8 rounded-full border-2 ${
                    newGroupColor === color ? 'border-gray-800' : 'border-gray-300'
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
                id="manualOnly"
                checked={!newGroupIsAssignable}
                onChange={(e) => setNewGroupIsAssignable(!e.target.checked)}
              />
              <label htmlFor="manualOnly" className="text-sm text-gray-600">
                Benutzer können nur manuell zu dieser Gruppe hinzugefügt werden
              </label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleCreateGroup}>
            Erstellen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 