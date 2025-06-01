"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { toast } from "react-hot-toast";
import { updateGroupAction } from '../../actions/groupActions';
import type { GroupData } from '../../types';
import { Dices } from 'lucide-react';

interface EditGroupDialogProps {
  group: GroupData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupUpdated: (group: GroupData) => void;
}

// Zufällige Farbe generieren
function generateRandomColor() {
  const colors = [
    '#ff9900', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f39c12',
    '#e67e22', '#1abc9c', '#34495e', '#95a5a6', '#d35400', '#8e44ad',
    '#2980b9', '#27ae60', '#c0392b', '#16a085', '#2c3e50', '#7f8c8d'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function EditGroupDialog({ group, open, onOpenChange, onGroupUpdated }: EditGroupDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    color: '#ff9900',
    isAssignable: true
  });
  const [isLoading, setIsLoading] = useState(false);

  // Formular mit Gruppendaten initialisieren wenn sich die Gruppe ändert
  useEffect(() => {
    if (group && open) {
      setFormData({
        name: group.name,
        color: group.color,
        isAssignable: group.isAssignable
      });
    }
  }, [group, open]);

  if (!group) return null;

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Gruppenname ist erforderlich');
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateGroupAction(group.id, {
        name: formData.name.trim(),
        color: formData.color,
        isAssignable: formData.isAssignable
      });

      if (result.success && result.data) {
        onGroupUpdated(result.data);
        onOpenChange(false);
        toast.success('Gruppe erfolgreich aktualisiert');
      } else {
        toast.error(result.error || 'Fehler beim Aktualisieren der Gruppe');
      }
    } catch (error) {
      toast.error('Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    // Formular zurücksetzen
    if (group) {
      setFormData({
        name: group.name,
        color: group.color,
        isAssignable: group.isAssignable
      });
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
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="z.B. Küche, Technik, Orga..."
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Farbe</label>
            <div className="space-y-3">
              {/* Color Picker mit zufälliger Farbe Button */}
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="colorPicker"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color: generateRandomColor() }))}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors flex items-center gap-2"
                  title="Zufällige Farbe generieren"
                  disabled={isLoading}
                >
                  <Dices className="w-4 h-4" />
                  Zufällig
                </button>
              </div>
              
              {/* Schnellauswahl beliebter Farben */}
              <div className="flex gap-2 flex-wrap">
                {['#ff9900', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f39c12', '#e67e22', '#1abc9c'].map(color => (
                <button
                  key={color}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formData.color === color ? 'border-gray-800 scale-110' : 'border-gray-300 hover:border-gray-500'
                  }`}
                  style={{ backgroundColor: color }}
                    disabled={isLoading}
                />
              ))}
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Nur manuelle Zuweisung</label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="editManualOnly"
                checked={!formData.isAssignable}
                onChange={(e) => setFormData(prev => ({ ...prev, isAssignable: !e.target.checked }))}
                disabled={isLoading}
              />
              <label htmlFor="editManualOnly" className="text-sm text-gray-600">
                Benutzer können nur manuell zu dieser Gruppe hinzugefügt werden
              </label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !formData.name.trim()}>
            {isLoading ? 'Speichere...' : 'Speichern'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 