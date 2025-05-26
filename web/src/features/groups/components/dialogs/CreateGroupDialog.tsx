"use client";

import React, { useState, useEffect } from 'react';
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

// Tiernamen für Gruppen-Vorschläge
const ANIMAL_NAMES = [
  'Giraffen', 'Elefanten', 'Löwen', 'Tiger', 'Pandas', 'Koalas', 'Pinguine', 'Delfine',
  'Wale', 'Adler', 'Falken', 'Eulen', 'Papageien', 'Flamingos', 'Zebras', 'Nashörner',
  'Hippos', 'Kängurus', 'Affen', 'Gorillas', 'Bären', 'Wölfe', 'Füchse', 'Hasen',
  'Eichhörnchen', 'Igel', 'Schildkröten', 'Krokodile', 'Schlangen', 'Frösche'
];

// Generiert eine zufällige Hex-Farbe aus dem vollen RGB-Spektrum
// Aber nicht zu grell und nicht zu düster
function generateRandomColor(): string {
  // Verwende HSL für bessere Kontrolle über Helligkeit und Sättigung
  const hue = Math.floor(Math.random() * 360); // Vollständig zufälliger Farbton
  const saturation = Math.floor(Math.random() * 50) + 30; // 30-80% Sättigung (nicht zu grau, nicht zu knallig)
  const lightness = Math.floor(Math.random() * 30) + 40; // 40-70% Helligkeit (nicht zu dunkel, nicht zu hell)
  
  // Konvertiere HSL zu RGB
  const hslToRgb = (h: number, s: number, l: number) => {
    h = h / 360;
    s = s / 100;
    l = l / 100;
    
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h * 12) % 12;
      return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    };
    
    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
  };
  
  const [r, g, b] = hslToRgb(hue, saturation, lightness);
  
  // Konvertiere zu Hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Gibt einen zufälligen Tiernamen zurück
function getRandomAnimalName(): string {
  return ANIMAL_NAMES[Math.floor(Math.random() * ANIMAL_NAMES.length)];
}

export function CreateGroupDialog({ open, onOpenChange, onGroupCreated }: CreateGroupDialogProps) {
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#ff9900');
  const [newGroupIsAssignable, setNewGroupIsAssignable] = useState(true);
  const [placeholderName, setPlaceholderName] = useState('');

  // Generiere zufällige Farbe und Placeholder-Namen beim Öffnen des Dialogs
  useEffect(() => {
    if (open) {
      setNewGroupColor(generateRandomColor());
      setPlaceholderName(getRandomAnimalName());
    }
  }, [open]);

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
        setPlaceholderName('');
        onOpenChange(false);
        toast.success(`Gruppe "${result.data.name}" wurde erstellt`);
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
              placeholder={placeholderName}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Farbe</label>
            <div className="space-y-3">
              {/* Color Picker als einzige Farbanzeige */}
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="colorPicker"
                  value={newGroupColor}
                  onChange={(e) => setNewGroupColor(e.target.value)}
                  className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <button
                  onClick={() => setNewGroupColor(generateRandomColor())}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  title="Zufällige Farbe generieren"
                >
                  🎲 Zufällig
                </button>
              </div>
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