"use client";

import React, { useState } from 'react';
import { Plus, Calendar, Edit2, Trash2, GripVertical, Eye, EyeOff, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Switch } from '@/shared/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/shared/components/ui/alert-dialog';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useCentralFestivalDays } from '@/shared/hooks/useCentralFestivalDays';
import { createCentralFestivalDayAction, updateCentralFestivalDayAction, deleteCentralFestivalDayAction, reorderCentralFestivalDaysAction, getAllCentralFestivalDaysAction } from '@/shared/actions/festivalDaysActions';
import { useDeviceContext } from '@/shared/contexts/DeviceContext';
import type { CentralFestivalDay, CreateFestivalDayData, UpdateFestivalDayData } from '@/shared/services/festivalDaysService';

// Festival Day Card Component
interface FestivalDayCardProps {
  day: CentralFestivalDay;
  dragHandleProps?: any;
  onEdit: (day: CentralFestivalDay) => void;
  onDelete: (id: string) => void;
  isSubmitting: boolean;
  formatDate: (date: Date) => string;
}

function FestivalDayCard({ day, dragHandleProps, onEdit, onDelete, isSubmitting, formatDate }: FestivalDayCardProps) {
  return (
    <div className={`bg-[#ff9900]/5 backdrop-blur-sm border-2 rounded-xl p-6 transition-all duration-200 hover:bg-[#ff9900]/10 hover:shadow-lg ${
      day.isActive 
        ? 'border-[#ff9900]/30 shadow-sm' 
        : 'border-gray-300/30 bg-gray-500/5'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-3">
            {/* Only the grip handle is draggable */}
            <GripVertical 
              className="w-5 h-5 text-[#ff9900]/60 cursor-grab hover:text-[#ff9900] transition-colors" 
              {...dragHandleProps}
            />
            <div className={`p-2 rounded-full ${day.isActive ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
              {day.isActive ? (
                <Eye className="w-4 h-4 text-green-400" />
              ) : (
                <EyeOff className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </div>
          <div className="flex-1">
            <div className={`font-bold text-lg ${day.isActive ? 'text-[#ff9900]' : 'text-gray-400'}`}>
              {day.label}
            </div>
            <div className={`text-sm font-medium ${day.isActive ? 'text-[#ff9900]/70' : 'text-gray-500'}`}>
              {formatDate(day.date)}
            </div>
            {day.description && (
              <div className={`text-sm mt-2 ${day.isActive ? 'text-[#ff9900]/60' : 'text-gray-500'}`}>
                {day.description}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* These buttons are NOT draggable */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              console.log('[FestivalDaysManager] Edit button clicked for day:', day._id);
              onEdit(day);
            }}
            disabled={isSubmitting}
            className="text-[#ff9900] border-[#ff9900]/30 hover:bg-[#ff9900]/10 hover:border-[#ff9900] transition-all duration-200"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              console.log('[FestivalDaysManager] Delete button clicked for day:', day._id);
              onDelete(day._id!);
            }}
            disabled={isSubmitting}
            className="text-red-400 border-red-300/30 hover:bg-red-500/10 hover:border-red-400 transition-all duration-200"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Sortable Item Component
function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id,
    // Only use handle strategy - don't make the entire card draggable
  });
  
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className={`w-full ${isDragging ? 'z-50' : ''}`}
    >
      {/* Pass the drag handle props to children */}
      {React.cloneElement(children as React.ReactElement, { 
        dragHandleProps: { ...attributes, ...listeners } 
      })}
    </div>
  );
}

interface FestivalDaysManagerProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const FestivalDaysManager: React.FC<FestivalDaysManagerProps> = ({ open, setOpen }) => {
  const { data: festivalDays, loading, connected, refreshData } = useCentralFestivalDays(true); // Include inactive days for admin
  const { deviceType } = useDeviceContext();
  const isMobile = deviceType === 'mobile';

  // Local state for optimistic updates during drag and drop
  const [optimisticOrder, setOptimisticOrder] = useState<CentralFestivalDay[] | null>(null);
  
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CentralFestivalDay | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    date: '',
    label: '',
    description: '',
    isActive: true
  });

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const resetForm = () => {
    setFormData({
      date: '',
      label: '',
      description: '',
      isActive: true
    });
    setEditing(undefined);
  };

  const handleEdit = (day?: CentralFestivalDay) => {
    console.log('[FestivalDaysManager] handleEdit called with:', day);
    
    // Reset submitting state if needed
    setIsSubmitting(false);
    
    if (day) {
      console.log('[FestivalDaysManager] Setting form data for editing day:', day._id);
      setFormData({
        date: day.date.toISOString().split('T')[0], // Convert to YYYY-MM-DD format
        label: day.label,
        description: day.description || '',
        isActive: day.isActive
      });
      setEditing(day);
    } else {
      console.log('[FestivalDaysManager] Creating new day');
      resetForm();
    }
    
    setFormOpen(true);
  };

  const handleSave = async () => {
    console.log('[FestivalDaysManager] handleSave called with formData:', formData);
    console.log('[FestivalDaysManager] editing:', editing);
    console.log('[FestivalDaysManager] isSubmitting before:', isSubmitting);
    
    // Prevent double submission
    if (isSubmitting) {
      console.log('[FestivalDaysManager] Already submitting, ignoring duplicate call');
      return;
    }
    
    if (!formData.date.trim() || !formData.label.trim()) {
      toast.error('Bitte fülle alle Pflichtfelder aus.');
      return;
    }

    setIsSubmitting(true);
    console.log('[FestivalDaysManager] Set isSubmitting to true');
    
    try {
      if (editing && editing._id) {
        // Update existing day
        console.log('[FestivalDaysManager] Updating existing day with ID:', editing._id);
        console.log('[FestivalDaysManager] FormData before update:', {
          date: formData.date,
          label: formData.label,
          description: formData.description,
          isActive: formData.isActive
        });
        
        const updateData: UpdateFestivalDayData = {
          date: new Date(formData.date),
          label: formData.label.trim(),
          description: formData.description.trim(),
          isActive: formData.isActive
        };
        
        console.log('[FestivalDaysManager] UpdateData prepared:', updateData);

        const result = await updateCentralFestivalDayAction(editing._id, updateData);
        console.log('[FestivalDaysManager] Update result:', result);
        
        if (result.success) {
          console.log('[FestivalDaysManager] Update successful, closing form and refreshing data');
          toast.success('Festival-Tag wurde aktualisiert');
          
          // Reset form states - WebSocket will automatically refresh data
          setFormOpen(false);
          resetForm();
          setIsSubmitting(false);
          // Don't call refreshData() here - WebSocket will handle it
        } else {
          console.error('[FestivalDaysManager] Update failed:', result.error);
          toast.error(result.error || 'Fehler beim Aktualisieren des Festival-Tags');
          setIsSubmitting(false);
        }
      } else {
        // Create new day
        console.log('[FestivalDaysManager] Creating new day');
        const createData: CreateFestivalDayData = {
          date: new Date(formData.date),
          label: formData.label.trim(),
          description: formData.description.trim(),
          isActive: formData.isActive
        };

        console.log('[FestivalDaysManager] CreateData prepared:', createData);
        const result = await createCentralFestivalDayAction(createData);
        console.log('[FestivalDaysManager] Create result:', result);
        
        if (result.success) {
          console.log('[FestivalDaysManager] Create successful, closing form and refreshing data');
          toast.success('Festival-Tag wurde erstellt');
          
          // Reset form states - WebSocket will automatically refresh data
          setFormOpen(false);
          resetForm();
          setIsSubmitting(false);
          // Don't call refreshData() here - WebSocket will handle it
        } else {
          console.error('[FestivalDaysManager] Create failed:', result.error);
          toast.error(result.error || 'Fehler beim Erstellen des Festival-Tags');
          setIsSubmitting(false);
        }
      }
    } catch (error) {
      console.error('[FestivalDaysManager] Exception during save:', error);
      toast.error('Der Festival-Tag konnte nicht gespeichert werden.');
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    console.log('[FestivalDaysManager] handleDelete called with ID:', id);
    
    // Reset submitting state if needed
    setIsSubmitting(false);
    setDeleteDialogId(id);
  };

  const confirmDelete = async () => {
    console.log('[FestivalDaysManager] confirmDelete called with ID:', deleteDialogId);
    console.log('[FestivalDaysManager] isSubmitting before delete:', isSubmitting);
    
    if (!deleteDialogId) {
      console.log('[FestivalDaysManager] No deleteDialogId, returning early');
      return;
    }
    
    // Prevent double submission
    if (isSubmitting) {
      console.log('[FestivalDaysManager] Already submitting delete, ignoring duplicate call');
      return;
    }
    
    setIsSubmitting(true);
    console.log('[FestivalDaysManager] Set isSubmitting to true for delete');
    
    try {
      console.log('[FestivalDaysManager] Calling deleteCentralFestivalDayAction with ID:', deleteDialogId);
      const result = await deleteCentralFestivalDayAction(deleteDialogId);
      console.log('[FestivalDaysManager] Delete result:', result);
      
      if (result.success) {
        console.log('[FestivalDaysManager] Delete successful, refreshing data');
        toast.success('Festival-Tag gelöscht');
        
        // Reset dialog state - WebSocket will automatically refresh data
        setDeleteDialogId(null);
        setIsSubmitting(false);
        
        // Don't call refreshData() here - WebSocket will handle it
        console.log('[FestivalDaysManager] Delete completed, WebSocket will refresh data');
      } else {
        console.error('[FestivalDaysManager] Delete failed:', result.error);
        toast.error(result.error || 'Fehler beim Löschen des Festival-Tags');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('[FestivalDaysManager] Exception during delete:', error);
      toast.error('Fehler beim Löschen');
      setIsSubmitting(false);
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const currentList = optimisticOrder || festivalDays;
      const oldIndex = currentList.findIndex((day) => day._id === active.id);
      const newIndex = currentList.findIndex((day) => day._id === over.id);
      
      // Optimistic update: Update UI immediately
      const newOrder = arrayMove(currentList, oldIndex, newIndex);
      setOptimisticOrder(newOrder); // This will immediately update the UI
      
      const dayIds = newOrder.map(day => day._id!);
      
      try {
        const result = await reorderCentralFestivalDaysAction(dayIds);
        if (result.success) {
          toast.success('Reihenfolge gespeichert');
          // Don't clear optimistic state or refresh manually here
          // WebSocket will automatically trigger refresh and clear optimistic state
        } else {
          toast.error('Fehler beim Speichern der Reihenfolge');
          // On error, clear optimistic state and refresh to get correct order
          setOptimisticOrder(null);
          await refreshData();
        }
      } catch (error) {
        console.error('Drag-and-drop error:', error);
        toast.error('Fehler beim Neuanordnen');
        // On error, clear optimistic state and refresh to get correct order
        setOptimisticOrder(null);
        await refreshData();
      }
    }
  };

  // Use optimistic order if available, otherwise use the hook data
  const displayedFestivalDays = optimisticOrder || festivalDays;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('de-DE', {
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Clear optimistic state when real data changes (e.g., from WebSocket updates)
  React.useEffect(() => {
    if (optimisticOrder && festivalDays.length > 0) {
      // Only clear if the real data order is different from optimistic order
      const realOrder = festivalDays.map(day => day._id!).join(',');
      const optimisticOrderIds = optimisticOrder.map(day => day._id!).join(',');
      
      if (realOrder !== optimisticOrderIds) {
        console.log('[FestivalDaysManager] Clearing optimistic state due to real data change');
        setOptimisticOrder(null);
      }
    }
  }, [festivalDays, optimisticOrder]);

  // Debug logging (must be before any early returns to follow Rules of Hooks)
  React.useEffect(() => {
    console.log('[FestivalDaysManager] RENDER - formOpen:', formOpen, 'deleteDialogId:', deleteDialogId, 'editing:', editing);
  });

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] bg-gradient-to-br from-[#460b6c] via-[#460b6c]/95 to-[#460b6c]/90 border-2 border-[#ff9900]/30">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#ff9900]">
              Festival-Tage werden geladen
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-64">
            <div className="text-[#ff9900]/80 text-lg font-medium">Lade Festival-Tage...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-5xl max-h-[90vh] bg-gradient-to-br from-[#460b6c] via-[#460b6c]/95 to-[#460b6c]/90 border-2 border-[#ff9900]/30 overflow-hidden">
        <DialogHeader className="border-b border-[#ff9900]/20 pb-4">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-[#ff9900]">
            <div className="p-2 bg-[#ff9900]/20 rounded-full">
              <Calendar className="w-6 h-6 text-[#ff9900]" />
            </div>
            Festival-Tage verwalten
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto pr-4 space-y-6 py-6" style={{ maxHeight: 'calc(90vh - 120px)' }}>
          {/* Connection Status */}
          <div className="bg-[#ff9900]/10 backdrop-blur-sm border border-[#ff9900]/30 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
                <span className="text-[#ff9900] font-medium">
                  {connected ? 'Live-Updates aktiv' : 'WebSocket nicht verfügbar'}
                </span>
              </div>
              {!connected && (
                <button 
                  onClick={refreshData}
                  className="px-3 py-1.5 text-sm bg-[#ff9900] text-white rounded-lg hover:bg-[#ff9900]/90 transition-colors"
                >
                  Neu laden
                </button>
              )}
            </div>
          </div>

          {/* Add Button */}
          <Button
            onClick={() => handleEdit()}
            className="w-full bg-gradient-to-r from-[#ff9900] to-[#ffb347] hover:from-[#ff9900]/90 hover:to-[#ffb347]/90 text-white py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-[#ff9900]/30"
          >
            <Plus className="w-5 h-5 mr-3" />
            Neuen Festival-Tag hinzufügen
          </Button>

          {/* Debug Test Button */}
          <Button
            onClick={async () => {
              console.log('[DEBUG] Testing API directly...');
              try {
                const result = await getAllCentralFestivalDaysAction();
                console.log('[DEBUG] getAllCentralFestivalDaysAction result:', result);
                
                if (festivalDays.length > 0) {
                  const firstDay = festivalDays[0];
                  console.log('[DEBUG] Testing update on first day:', firstDay);
                  
                  const updateResult = await updateCentralFestivalDayAction(firstDay._id!, {
                    label: firstDay.label + ' (TEST)',
                    date: firstDay.date,
                    description: firstDay.description,
                    isActive: firstDay.isActive
                  });
                  console.log('[DEBUG] Update test result:', updateResult);
                }
              } catch (error) {
                console.error('[DEBUG] API test error:', error);
              }
            }}
            variant="outline"
            className="w-full text-[#ff9900] border-[#ff9900]/30 hover:bg-[#ff9900]/10"
          >
            🔧 Debug API Test
          </Button>

          {/* Festival Days List */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-[#ff9900] flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Bestehende Festival-Tage ({displayedFestivalDays.length})
            </h3>
            
            {displayedFestivalDays.length === 0 ? (
              <div className="bg-[#ff9900]/5 border border-[#ff9900]/20 rounded-xl p-12 text-center">
                <Calendar className="w-16 h-16 text-[#ff9900]/40 mx-auto mb-4" />
                <p className="text-[#ff9900]/60 text-lg font-medium">Keine Festival-Tage vorhanden</p>
                <p className="text-[#ff9900]/40 text-sm mt-2">Erstelle deinen ersten Festival-Tag um zu beginnen</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={displayedFestivalDays.map(day => day._id!)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-4">
                    {displayedFestivalDays.map((day) => (
                      <SortableItem key={day._id} id={day._id!}>
                        <FestivalDayCard day={day} dragHandleProps={undefined} onEdit={handleEdit} onDelete={handleDelete} isSubmitting={isSubmitting} formatDate={formatDate} />
                      </SortableItem>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>

        {/* Add/Edit Dialog */}
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="max-w-2xl bg-gradient-to-br from-[#460b6c] via-[#460b6c]/95 to-[#460b6c]/90 border-2 border-[#ff9900]/30">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-[#ff9900] flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {editing?._id ? 'Festival-Tag bearbeiten' : 'Neuen Festival-Tag hinzufügen'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 mt-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#ff9900]">Datum *</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  disabled={isSubmitting}
                  className="bg-[#ff9900]/10 border-[#ff9900]/30 text-[#ff9900] focus:border-[#ff9900] focus:ring-[#ff9900]/20 placeholder:text-[#ff9900]/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#ff9900]">Bezeichnung *</label>
                <Input
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="z.B. 31.07. - Anreise"
                  disabled={isSubmitting}
                  className="bg-[#ff9900]/10 border-[#ff9900]/30 text-[#ff9900] focus:border-[#ff9900] focus:ring-[#ff9900]/20 placeholder:text-[#ff9900]/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#ff9900]">Beschreibung</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optionale Beschreibung für diesen Tag"
                  disabled={isSubmitting}
                  className="bg-[#ff9900]/10 border-[#ff9900]/30 text-[#ff9900] focus:border-[#ff9900] focus:ring-[#ff9900]/20 placeholder:text-[#ff9900]/50"
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-4 p-4 bg-[#ff9900]/5 rounded-lg border border-[#ff9900]/20">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  disabled={isSubmitting}
                  className="data-[state=checked]:bg-[#ff9900]"
                />
                <div>
                  <label className="text-sm font-semibold text-[#ff9900]">Tag ist aktiv und sichtbar</label>
                  <p className="text-xs text-[#ff9900]/60 mt-1">Inaktive Tage werden nur in der Admin-Ansicht angezeigt</p>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => { 
                    console.log('[FestivalDaysManager] Cancel button clicked');
                    setIsSubmitting(false);
                    setFormOpen(false); 
                    resetForm(); 
                  }}
                  disabled={isSubmitting}
                  className="flex-1 text-[#ff9900] border-[#ff9900]/30 hover:bg-[#ff9900]/10"
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSubmitting || !formData.date.trim() || !formData.label.trim()}
                  className="flex-1 bg-gradient-to-r from-[#ff9900] to-[#ffb347] hover:from-[#ff9900]/90 hover:to-[#ffb347]/90 text-white font-semibold"
                >
                  {isSubmitting ? 'Wird gespeichert...' : editing?._id ? 'Aktualisieren' : 'Erstellen'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={!!deleteDialogId} onOpenChange={open => { if (!open) setDeleteDialogId(null); }}>
          <AlertDialogContent className="bg-gradient-to-br from-[#460b6c] to-[#460b6c]/90 border-2 border-[#ff9900]/30">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-[#ff9900] text-xl font-bold">Festival-Tag löschen?</AlertDialogTitle>
              <AlertDialogDescription className="text-[#ff9900]/70">
                Dieser Festival-Tag wird permanent gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel 
                disabled={isSubmitting}
                className="text-[#ff9900] border-[#ff9900]/30 hover:bg-[#ff9900]/10"
              >
                Abbrechen
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={isSubmitting}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                {isSubmitting ? 'Wird gelöscht...' : 'Löschen'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
};

export default FestivalDaysManager; 