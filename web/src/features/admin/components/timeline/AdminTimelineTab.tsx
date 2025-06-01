import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Pencil, Check, X, Loader2, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/shared/components/ui/sheet';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Button } from '@/shared/components/ui/button';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/shared/components/ui/alert-dialog';
import { useWindowWidth } from '@/shared/hooks/useWindowWidth';
import { useDeviceContext } from '@/shared/contexts/DeviceContext';
import toast from 'react-hot-toast';
import { DatePicker } from '@/shared/components/ui/date-picker';
import { createEventAction } from '@/features/timeline/actions/createEventAction';
import { updateEvent } from '@/features/timeline/actions/updateEvent';
import { removeEvent } from '@/features/timeline/actions/removeEvent';
import { moderateEvent } from '@/features/timeline/actions/moderateEvent';
import clsx from 'clsx';
import * as LucideIcons from 'lucide-react';
import { formatDateBerlin } from '@/shared/utils/formatDateBerlin';
import { useCentralFestivalDays } from '@/shared/hooks/useCentralFestivalDays';
import { useGlobalWebSocket } from '@/shared/hooks/useGlobalWebSocket';
import { fetchEventsByDayAdmin } from '@/features/timeline/actions/fetchEventsByDayAdmin';
import { getCategoriesAction } from '@/features/categories/actions/getCategories';
import { setTimelineCustomTitleAction, deleteTimelineCustomTitleAction } from '@/features/timeline/actions/timelineCustomTitleActions';
import { getAllTimelineCustomTitles } from '@/features/timeline/services/timelineCustomTitleService';

// Props-Interface - jetzt minimal da wir Hooks verwenden
interface AdminTimelineTabProps {
  // Optional initial data für SSR
  initialDays?: any[];
  initialEventsByDay?: Record<string, any[]>;
  initialCategories?: any[];
}

// Hilfsfunktion: ObjectId zu String konvertieren
function getIdString(id: any) {
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && ('$oid' in id)) return id.$oid;
  return String(id);
}

// Hilfsfunktion: Tage chronologisch nach Datum sortieren
function sortDays(days: any[]) {
  return [...days].sort((a, b) => {
    // Tage ohne Datum ans Ende
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    
    // Chronologisch nach Datum sortieren
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });
}
// Hilfsfunktion: Events nach Zeit (oder Titel) sortieren (optional)
function sortEvents(events: any[]) {
  return [...events].sort((a, b) => a.time?.localeCompare?.(b.time) || 0);
}

// Hilfsfunktion für dynamisches Icon
const getIconComponent = (iconName: string) => {
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent || LucideIcons.HelpCircle;
};

const AdminTimelineTab: React.FC<AdminTimelineTabProps> = ({ 
  initialDays = [],
  initialEventsByDay = {},
  initialCategories = []
}) => {
  // Use central festival days hook with admin mode (includes inactive days)
  const { data: centralFestivalDays, loading: daysLoading, connected, refreshData } = useCentralFestivalDays(true);
  
  // State für Events, Kategorien und Custom Titles
  const [eventsByDay, setEventsByDay] = useState<Record<string, any[]>>(initialEventsByDay);
  const [categories, setCategories] = useState<any[]>(initialCategories);
  const [customTitles, setCustomTitles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load custom titles
  const loadCustomTitles = async () => {
    try {
      const titles = await getAllTimelineCustomTitles();
      setCustomTitles(titles);
    } catch (error) {
      console.error('Error loading custom titles:', error);
    }
  };

  // WebSocket für Echtzeit-Updates
  useGlobalWebSocket({
    topicFilter: [
      'event-created', 
      'event-updated', 
      'event-deleted',
      'event-moderated',
      'category-created', 
      'category-updated', 
      'category-deleted',
      'festival-day-updated'
    ],
    onMessage: async (message: any) => {
      console.log('[AdminTimelineTab] WebSocket message:', message);
      
      switch (message.topic) {
        case 'event-created':
        case 'event-updated':
        case 'event-moderated':
          if (message.payload?.dayId) {
            await reloadEventsForDay(message.payload.dayId);
          }
          break;
        
        case 'event-deleted':
          if (message.payload?.dayId && message.payload?.eventId) {
            handleEventDeleteWebSocket(message.payload.eventId, message.payload.dayId);
          }
          break;

        case 'category-created':
        case 'category-updated':
        case 'category-deleted':
          await reloadCategories();
          break;

        case 'festival-day-updated':
          // Central festival days hook will handle this automatically
          refreshData();
          break;
      }
    }
  });

  // Helper: Events für einen Tag neu laden
  const reloadEventsForDay = async (dayId: string) => {
    try {
      const events = await fetchEventsByDayAdmin(dayId);
      setEventsByDay(prev => ({
        ...prev,
        [dayId]: events || []
      }));
    } catch (error) {
      console.error(`Error reloading events for day ${dayId}:`, error);
    }
  };

  // Helper: Event via WebSocket löschen
  const handleEventDeleteWebSocket = (eventId: string, dayId: string) => {
    setEventsByDay(prev => ({
      ...prev,
      [dayId]: (prev[dayId] || []).filter(event => 
        getIdString(event._id) !== eventId
      )
    }));
    toast.success('Event wurde gelöscht');
  };

  // Helper: Kategorien neu laden
  const reloadCategories = async () => {
    try {
      const cats = await getCategoriesAction();
      setCategories(cats);
    } catch (error) {
      console.error('Error reloading categories:', error);
    }
  };

  // Initiale Daten laden
  useEffect(() => {
    const loadInitialData = async () => {
      if (categories.length === 0) {
        await reloadCategories();
      }
      // Load custom titles
      await loadCustomTitles();
    };
    loadInitialData();
  }, []);

  // Events für alle Tage laden wenn sich Tage ändern
  useEffect(() => {
    const loadEventsForAllDays = async () => {
      if (!centralFestivalDays?.length) return;
      
      const newEventsByDay: Record<string, any[]> = { ...eventsByDay };
      
      for (const day of centralFestivalDays) {
        if (day._id && !newEventsByDay[day._id]) {
          try {
            const events = await fetchEventsByDayAdmin(day._id);
            newEventsByDay[day._id] = events || [];
          } catch (error) {
            console.error(`Error loading events for day ${day._id}:`, error);
            newEventsByDay[day._id] = [];
          }
        }
      }
      
      setEventsByDay(newEventsByDay);
    };

    loadEventsForAllDays();
  }, [centralFestivalDays]);

  // Combine central festival days with custom titles for display
  const daysWithCustomTitles = centralFestivalDays?.map(day => {
    const dayId = day._id;
    const customTitle = dayId ? customTitles[dayId] : undefined;
    const baseTitle = day.label || 'Unbenannter Tag';
    
    return {
      ...day,
      title: customTitle || baseTitle, // Use custom title if available, otherwise fallback
      timelineCustomTitle: customTitle // Store for editing
    };
  }) || initialDays;

  // Verwende combined days anstatt central festival days direkt
  const days = daysWithCustomTitles;
  const setDays = () => {
    // Days werden über central festival days verwaltet - redirect to management
    toast('Tage können über die Festival-Tage Verwaltung bearbeitet werden');
  };

  // --- State ---
  const [showDayModal, setShowDayModal] = useState(false);
  const [editDayId, setEditDayId] = useState<string | null>(null);
  const [dayForm, setDayForm] = useState<{ title: string; description: string; date: Date | null }>({ title: '', description: '', date: null });
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventForm, setEventForm] = useState<{ time: string; title: string; description: string; categoryId: string }>({ time: '', title: '', description: '', categoryId: '' });
  const [eventToEdit, setEventToEdit] = useState<any | null>(null);
  const [eventDayId, setEventDayId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'day' | 'event'; id: string; parentId?: string } | null>(null);
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [formType, setFormType] = useState<'day' | 'event'>('event');
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());
  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [editingDayTitle, setEditingDayTitle] = useState<string>('');
  const { deviceType } = useDeviceContext();
  const isMobile = deviceType === 'mobile';
  const dayTitleRef = useRef<HTMLInputElement>(null);
  const eventTitleRef = useRef<HTMLInputElement>(null);
  const inlineDayTitleRef = useRef<HTMLInputElement>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Drag and Drop State für Mobile
  const [draggedEvent, setDraggedEvent] = useState<{ eventId: string; dayId: string } | null>(null);
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);

  // --- Form Reset ---
  useEffect(() => {
    if (!showDayModal) {
      setEditDayId(null);
      setDayForm({ title: '', description: '', date: null });
    }
  }, [showDayModal]);
  useEffect(() => {
    if (!showEventModal) {
      setEventToEdit(null);
      setEventDayId(null);
      setEventForm({ time: '', title: '', description: '', categoryId: '' });
    }
  }, [showEventModal]);

  // --- Focus Handling ---
  useEffect(() => {
    if (showDayModal && dayTitleRef.current && !isDatePickerOpen) {
      setTimeout(() => dayTitleRef.current?.focus(), 50);
    }
  }, [showDayModal, isDatePickerOpen]);
  useEffect(() => {
    if (showEventModal && eventTitleRef.current) {
      // Längeres Timeout für Mobile Sheet Animation
      const timeout = isMobile ? 300 : 50;
      setTimeout(() => {
        eventTitleRef.current?.focus();
        // Zusätzlich für Mobile: Cursor an das Ende setzen
        if (isMobile && eventTitleRef.current) {
          const input = eventTitleRef.current;
          const length = input.value.length;
          input.setSelectionRange(length, length);
        }
      }, timeout);
    }
  }, [showEventModal, isMobile]);

  // --- Handler: Tag (nur Custom Title) ---
  const handleDayFormSubmit = async () => {
    if (!dayForm.title) {
      toast.error('Titel ist erforderlich');
      return;
    }
    if (editDayId) {
      await handleUpdateDayCustomTitle(editDayId, dayForm.title);
    }
    setShowDayModal(false);
  };
  
  const handleEditDay = (day: any) => {
    setEditDayId(getIdString(day._id));
    // Verwende den Custom Title falls vorhanden, sonst den Central Title als Basis
    setDayForm({ 
      title: day.timelineCustomTitle || day.title, 
      description: day.description || '', 
      date: day.date ? new Date(day.date) : null 
    });
    setShowDayModal(true);
  };

  // --- Handler: Event ---
  const handleEditEvent = (event: any, dayId: string) => {
    setEventToEdit(event);
    setEventDayId(dayId);
    setEventForm({
      time: event.time,
      title: event.title,
      description: event.description,
      categoryId: event.categoryId || (categories[0]?._id ?? ''),
    });
    if (isMobile) setShowEventModal(true);
  };
  const handleEventFormSubmit = async () => {
    if (!eventForm.title || !eventForm.time || !eventForm.categoryId) {
      toast.error('Titel, Zeit und Kategorie sind erforderlich');
      return;
    }
    if (eventToEdit && eventDayId) {
      // Wichtig: Füge eventDayId als dayId zum Update hinzu für Desktop Tag-Wechsel
      await handleUpdateEvent(getIdString(eventToEdit._id), { ...eventForm, dayId: eventDayId }, eventDayId);
    } else if (eventDayId) {
      await handleCreateEvent({ ...eventForm }, eventDayId);
    }
    if (isMobile) setShowEventModal(false);
    else {
      // Reset form for next entry
      setEventForm({ time: '', title: '', description: '', categoryId: getIdString(categories[0]?._id) || '' });
      setEventToEdit(null);
      setEventDayId(null);
    }
  };
  const handleCancelEventForm = () => {
    setEventToEdit(null);
    setEventDayId(null);
    setEventForm({ time: '', title: '', description: '', categoryId: '' });
  };

  // Kategorie-Auswahl im Event-Formular initialisieren, falls leer und Kategorien vorhanden
  useEffect(() => {
    if ((showEventModal || !isMobile) && categories.length > 0 && !eventForm.categoryId) {
      setEventForm(f => ({ ...f, categoryId: getIdString(categories[0]._id) }));
    }
  }, [showEventModal, categories, eventForm.categoryId, isMobile]);

  // Tag Custom Title aktualisieren
  const handleUpdateDayCustomTitle = async (festivalDayId: string, customTitle: string) => {
    try {
      const result = await setTimelineCustomTitleAction({
        festivalDayId,
        customTitle
      });
      
      if (result.success) {
        toast.success('Timeline-Titel aktualisiert');
        // Reload custom titles and timeline data
        await loadCustomTitles();
        refreshData();
      } else {
        toast.error(result.error || 'Fehler beim Aktualisieren des Titels');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Fehler beim Aktualisieren des Titels');
    }
  };

  // Tag Custom Title löschen (zurück zum Central Title)
  const handleDeleteDayCustomTitle = async (festivalDayId: string) => {
    try {
      const result = await deleteTimelineCustomTitleAction(festivalDayId);
      
      if (result.success) {
        toast.success('Custom Titel gelöscht - verwendet wieder zentralen Titel');
        // Reload custom titles and timeline data
        await loadCustomTitles();
        refreshData();
      } else {
        toast.error(result.error || 'Fehler beim Löschen des Custom Titels');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Fehler beim Löschen des Custom Titels');
    }
  };

  // Optimistisches Hinzufügen eines Tages - now disabled
  const handleCreateDay = async (dayForm: any) => {
    toast.error('Neue Tage können nur über die Festival-Tage Verwaltung erstellt werden');
  };

  // Tag aktualisieren - redirect to central management  
  const handleUpdateDay = async (id: string, update: any) => {
    toast('Grund-Eigenschaften von Tagen können über die Festival-Tage Verwaltung bearbeitet werden');
  };

  // Tag löschen - now disabled
  const handleDeleteDay = async (id: string) => {
    const day = days.find(d => getIdString(d._id) === id);
    if (day && 'timelineCustomTitle' in day && day.timelineCustomTitle) {
      // Wenn Custom Title existiert, diesen löschen
      await handleDeleteDayCustomTitle(id);
    } else {
      toast.error('Tage können nur über die Festival-Tage Verwaltung gelöscht werden');
    }
  };

  // Optimistisches Hinzufügen eines Events
  const handleCreateEvent = async (eventForm: any, dayId: string) => {
    const optimisticEvent = { ...eventForm, _id: 'optimistic-' + Math.random(), status: 'approved', submittedByAdmin: true };
    const prevEvents = eventsByDay[dayId] || [];
    setEventsByDay({ ...eventsByDay, [dayId]: sortEvents([...prevEvents, optimisticEvent]) });
    try {
      const result = await createEventAction({ 
        ...eventForm, 
        dayId,
        status: 'approved',
        submittedByAdmin: true
      });
      if (result.success && result.event) {
        setEventsByDay({ ...eventsByDay, [dayId]: sortEvents([...prevEvents, result.event]) });
        toast.success('Event angelegt');
      } else {
        setEventsByDay({ ...eventsByDay, [dayId]: prevEvents });
        toast.error(result.error || 'Fehler beim Anlegen des Events');
      }
    } catch (err: any) {
      setEventsByDay({ ...eventsByDay, [dayId]: prevEvents });
      toast.error(err?.message || 'Fehler beim Anlegen des Events');
    }
  };

  // Optimistisches Bearbeiten eines Events - FIXED mit getIdString und Day-Wechsel
  const handleUpdateEvent = async (eventId: string, update: any, dayId: string) => {
    const prevEvents = eventsByDay[dayId] || [];
    const originalEvent = prevEvents.find(ev => getIdString(ev._id) === eventId);
    
    // Prüfe ob sich der Tag ändert
    const newDayId = update.dayId || dayId;
    const dayChanged = newDayId !== dayId;
    
    if (dayChanged) {
      // Entferne Event vom alten Tag (optimistisch)
      setEventsByDay(prev => ({
        ...prev,
        [dayId]: prev[dayId]?.filter(ev => getIdString(ev._id) !== eventId) || [],
        [newDayId]: sortEvents([...(prev[newDayId] || []), { ...originalEvent, ...update }])
      }));
    } else {
      // Update im gleichen Tag
      setEventsByDay(prev => ({
        ...prev,
        [dayId]: sortEvents(prev[dayId]?.map(ev => getIdString(ev._id) === eventId ? { ...ev, ...update } : ev) || [])
      }));
    }
    
    try {
      const result = await updateEvent(eventId, update);
      if (result && result._id) {
        if (dayChanged) {
          // Erfolgreiche Verschiebung - aktualisiere beide Tage
          setEventsByDay(prev => ({
            ...prev,
            [dayId]: prev[dayId]?.filter(ev => getIdString(ev._id) !== eventId) || [],
            [newDayId]: sortEvents([...(prev[newDayId]?.filter(ev => getIdString(ev._id) !== eventId) || []), result])
          }));
          // Form zurücksetzen da Event verschoben wurde
          setEventForm({ time: '', title: '', description: '', categoryId: getIdString(categories[0]?._id) || '' });
          setEventToEdit(null);
          setEventDayId(null);
          toast.success(`Event zu "${days.find(d => getIdString(d._id) === newDayId)?.title || 'anderem Tag'}" verschoben`);
        } else {
          // Update im gleichen Tag
          setEventsByDay(prev => ({
            ...prev,
            [dayId]: sortEvents(prev[dayId]?.map(ev => getIdString(ev._id) === eventId ? result : ev) || [])
          }));
          toast.success('Event aktualisiert');
        }
      } else {
        // Rollback bei Fehler
        setEventsByDay(prev => ({
          ...prev,
          [dayId]: prevEvents,
          ...(dayChanged ? { [newDayId]: prev[newDayId]?.filter(ev => getIdString(ev._id) !== eventId) || [] } : {})
        }));
        toast.error('Fehler beim Aktualisieren des Events');
      }
    } catch (err: any) {
      // Rollback bei Fehler
      setEventsByDay(prev => ({
        ...prev,
        [dayId]: prevEvents,
        ...(dayChanged ? { [newDayId]: prev[newDayId]?.filter(ev => getIdString(ev._id) !== eventId) || [] } : {})
      }));
      toast.error(err?.message || 'Fehler beim Aktualisieren des Events');
    }
  };

  // Optimistisches Löschen eines Events - FIXED mit getIdString
  const handleDeleteEvent = async (eventId: string, dayId: string) => {
    const prevEvents = eventsByDay[dayId] || [];
    setEventsByDay({ ...eventsByDay, [dayId]: sortEvents(prevEvents.filter(ev => getIdString(ev._id) !== eventId)) });
    try {
      await removeEvent(eventId);
      toast.success('Event gelöscht');
    } catch (err: any) {
      setEventsByDay({ ...eventsByDay, [dayId]: prevEvents });
      toast.error(err?.message || 'Fehler beim Löschen des Events');
    }
  };

  // --- Event bestätigen (pending -> approved) --- FIXED to use moderateEvent
  const handleApproveEvent = async (eventId: string, dayId: string) => {
    const prevEvents = eventsByDay[dayId] || [];
    setEventsByDay({
      ...eventsByDay,
      [dayId]: prevEvents.map(ev => getIdString(ev._id) === eventId ? { ...ev, status: 'approved' } : ev)
    });
    try {
      const result = await moderateEvent(eventId, 'approved');
      if (result.success) {
        toast.success('Event bestätigt');
      } else {
        setEventsByDay({ ...eventsByDay, [dayId]: prevEvents });
        toast.error(result.error || 'Fehler beim Bestätigen');
      }
    } catch (err: any) {
      setEventsByDay({ ...eventsByDay, [dayId]: prevEvents });
      toast.error('Fehler beim Bestätigen');
    }
  };

  // --- Tag einklappen/ausklappen ---
  const toggleDayCollapse = (dayId: string) => {
    const newCollapsed = new Set(collapsedDays);
    if (newCollapsed.has(dayId)) {
      newCollapsed.delete(dayId);
    } else {
      newCollapsed.add(dayId);
    }
    setCollapsedDays(newCollapsed);
  };

  // Inline Tag-Bearbeitung starten
  const handleStartInlineEdit = (day: any) => {
    const dayId = getIdString(day._id);
    setEditingDayId(dayId);
    setEditingDayTitle(day.timelineCustomTitle || '');
    setTimeout(() => inlineDayTitleRef.current?.focus(), 50);
  };

  // Inline Tag-Bearbeitung abbrechen
  const handleCancelInlineEdit = () => {
    setEditingDayId(null);
    setEditingDayTitle('');
  };

  // Inline Tag-Bearbeitung speichern
  const handleSaveInlineEdit = async () => {
    if (editingDayId) {
      if (editingDayTitle.trim()) {
        await handleUpdateDayCustomTitle(editingDayId, editingDayTitle.trim());
      } else {
        await handleDeleteDayCustomTitle(editingDayId);
      }
      setEditingDayId(null);
      setEditingDayTitle('');
    }
  };

  // Enter/Escape Handling für Inline-Edit
  const handleInlineEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveInlineEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelInlineEdit();
    }
  };

  // Drag and Drop Handlers für Mobile
  const handleEventDragStart = (eventId: string, dayId: string) => {
    setDraggedEvent({ eventId, dayId });
  };

  const handleEventDragEnd = () => {
    setDraggedEvent(null);
    setDragOverDay(null);
  };

  const handleDayDragOver = (dayId: string) => {
    setDragOverDay(dayId);
  };

  const handleDayDragLeave = () => {
    setDragOverDay(null);
  };

  const handleEventDrop = async (targetDayId: string) => {
    if (!draggedEvent || draggedEvent.dayId === targetDayId) {
      handleEventDragEnd();
      return;
    }

    const { eventId, dayId: sourceDayId } = draggedEvent;
    const event = (eventsByDay[sourceDayId] || []).find(ev => getIdString(ev._id) === eventId);
    
    if (!event) {
      handleEventDragEnd();
      return;
    }

    // Event zwischen Tagen verschieben
    await handleUpdateEvent(eventId, { dayId: targetDayId }, sourceDayId);
    handleEventDragEnd();
  };

  // ... UI-Rendering (mobil & desktop) ...
  if (isMobile) {
    return (
      <div className="max-w-lg mx-auto w-full">
        <div className="flex items-center mb-4 px-4">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-[#460b6c]">Timeline</h3>
            {/* Süßes Status-Label für unbestätigte Events */}
            {days.some((day: any) => day._id && (eventsByDay[day._id] || []).some((ev: any) => ev.status === 'pending' && !ev.submittedByAdmin)) && (
              <div className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 animate-pulse">
                <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                Neue Events
              </div>
            )}
          </div>
        </div>
        {/* Liste der Tage und Events */}
        <ul className="space-y-4 px-4">
          {sortDays(days).map(day => {
            const dayId = getIdString(day._id);
            const hasPending = (eventsByDay[dayId] || []).some(ev => ev.status === 'pending' && !ev.submittedByAdmin);
            const isCollapsed = collapsedDays.has(dayId);
            return (
            <li key={dayId} className="bg-white shadow rounded-xl px-4 py-3">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleDayCollapse(dayId)}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center gap-2">
                    {isCollapsed ? (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                    <div className="flex flex-col">
                      <span className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                        {editingDayId === dayId ? (
                          <Input
                            id="inline-day-title"
                            placeholder="Custom Titel für Timeline (optional)"
                            value={editingDayTitle}
                            onChange={e => setEditingDayTitle(e.target.value)}
                            className="w-full mt-1"
                            autoFocus
                            ref={inlineDayTitleRef}
                            onKeyDown={handleInlineEditKeyDown}
                          />
                        ) : (
                          <span className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                            {day.title}
                            {hasPending && <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" title="Unbestätigte Events"></span>}
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-gray-500">{day.date ? formatDateBerlin(day.date, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  {editingDayId === dayId ? (
                    <>
                      <Button variant="default" size="icon" onClick={handleSaveInlineEdit} aria-label="Speichern"><Check className="h-4 w-4" /></Button>
                      <Button variant="secondary" size="icon" onClick={handleCancelInlineEdit} aria-label="Abbrechen"><X className="h-4 w-4" /></Button>
                    </>
                  ) : (
                    <>
                      <Button variant="secondary" size="icon" onClick={() => handleStartInlineEdit(day)} aria-label="Bearbeiten"><Pencil className="h-4 w-4" /></Button>
                      <Button variant="destructive" size="icon" onClick={() => setConfirmDelete({ type: 'day', id: dayId })} aria-label="Löschen"><Trash2 className="h-4 w-4" /></Button>
                    </>
                  )}
                </div>
              </div>
              {/* Events - nur anzeigen wenn nicht eingeklappt */}
              {!isCollapsed && (
                <div
                  className={clsx(
                    "mt-2",
                    dragOverDay === dayId && "bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-2"
                  )}
                  onDragOver={(e) => {
                    e.preventDefault();
                    handleDayDragOver(dayId);
                  }}
                  onDragLeave={handleDayDragLeave}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleEventDrop(dayId);
                  }}
                >
                  <ul className="space-y-2">
                    {(eventsByDay[dayId] || []).map(event => {
                      const eventId = getIdString(event._id);
                      const category = categories.find((cat) => getIdString(cat._id) === event.categoryId);
                      const IconComponent = category ? getIconComponent(category.icon) : LucideIcons.HelpCircle;
                      return (
                        <li 
                          key={eventId} 
                          className={clsx(
                            "flex items-center justify-between bg-gray-50 rounded-lg p-3 cursor-move",
                            event.status === 'pending' && !event.submittedByAdmin && 'border-l-4 border-yellow-400',
                            draggedEvent?.eventId === eventId && "opacity-50"
                          )}
                          draggable
                          onDragStart={() => handleEventDragStart(eventId, dayId)}
                          onDragEnd={handleEventDragEnd}
                        >
                          <div className="flex items-center gap-3">
                            <div className="bg-[#ff9900]/20 rounded-full p-2 flex items-center justify-center">
                              <IconComponent className="text-[#ff9900] text-lg" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{event.title}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="inline h-4 w-4" />{event.time}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1 items-center">
                            {event.status === 'pending' && !event.submittedByAdmin && (
                              <Button variant="ghost" size="icon" onClick={() => handleApproveEvent(eventId, dayId)} aria-label="Bestätigen" title="Event bestätigen">
                                <Check className="h-4 w-4 text-yellow-500" />
                              </Button>
                            )}
                            <Button variant="secondary" size="icon" onClick={() => handleEditEvent(event, dayId)} aria-label="Bearbeiten"><Pencil className="h-4 w-4" /></Button>
                            <Button variant="destructive" size="icon" onClick={() => setConfirmDelete({ type: 'event', id: eventId, parentId: dayId })} aria-label="Löschen"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </li>
                      );})}
                  </ul>
                  {/* Event hinzufügen Button für diesen Tag */}
                  <div className="mt-4 flex justify-center">
                    <Button
                      variant="default"
                      size="icon"
                      onClick={() => {
                        setEventDayId(dayId);
                        setEventForm({ time: '', title: '', description: '', categoryId: getIdString(categories[0]?._id) || '' });
                        setShowEventModal(true);
                      }}
                      aria-label="Neues Event hinzufügen"
                      className="bg-gradient-to-br from-[#ff9900] to-[#ffb84d] text-white shadow-3xl border-2 border-white"
                    >
                      <Plus className="h-6 w-6" />
                    </Button>
                  </div>
                </div>
              )}
            </li>
          );})}
        </ul>
        {/* Floating-Button für neuen Tag - entfernt da über zentrale Verwaltung */}
        {/* Event hinzufügen Buttons sind in den einzelnen Tagen */}
        {/* Modal für Tag Custom Title bearbeiten */}
        <Sheet open={showDayModal} onOpenChange={setShowDayModal}>
          <SheetContent side="bottom" className="max-w-lg mx-auto rounded-t-3xl h-[40vh]">
            <SheetHeader>
              <SheetTitle>Timeline-Titel bearbeiten</SheetTitle>
              <p className="text-sm text-gray-600">
                Setze einen benutzerdefinierten Titel für die Timeline. 
                Leer lassen, um den zentralen Festival-Tag Titel zu verwenden.
              </p>
            </SheetHeader>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleDayFormSubmit();
              }}
              className="w-full max-w-md mx-auto flex flex-col gap-4 px-4 py-8 h-full"
            >
              <div className="flex-1 overflow-y-auto space-y-4">
                <div>
                  <label htmlFor="day-title" className="text-sm font-medium text-gray-700">
                    Timeline-spezifischer Titel
                  </label>
                  <Input
                    id="day-title"
                    placeholder="Custom Titel für Timeline (optional)"
                    value={dayForm.title}
                    onChange={e => setDayForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full mt-1"
                    autoFocus
                    ref={dayTitleRef}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Datum und Beschreibung werden über die Festival-Tage Verwaltung geändert
                  </p>
                </div>
              </div>
              <div className="border-t pt-4 bg-white">
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="bg-gradient-to-br from-[#ff9900] to-[#ffb84d] text-white shadow-3xl border-2 border-white w-full"
                >
                  {loading ? <Loader2 className="animate-spin" /> : 'Speichern'}
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
        {/* Modal für Event anlegen/bearbeiten */}
        <Sheet open={showEventModal} onOpenChange={setShowEventModal}>
          <SheetContent side="bottom" className="max-w-lg mx-auto rounded-t-3xl h-[70vh] flex flex-col">
            <SheetHeader>
              <SheetTitle>{eventToEdit ? 'Event bearbeiten' : 'Event anlegen'}</SheetTitle>
            </SheetHeader>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleEventFormSubmit();
              }}
              className="flex flex-col h-full"
            >
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                <div>
                  <label htmlFor="event-title" className="text-sm font-medium text-gray-700">Titel</label>
                  <Input
                    id="event-title"
                    placeholder="Titel"
                    value={eventForm.title}
                    onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))}
                    required
                    className="w-full mt-1"
                    ref={eventTitleRef}
                  />
                </div>
                <div>
                  <label htmlFor="mobile-event-day" className="text-sm font-medium text-gray-700">Tag</label>
                  <select
                    id="mobile-event-day"
                    value={eventDayId || ''}
                    onChange={e => setEventDayId(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1 text-base focus:outline-none focus:ring-2 focus:ring-[#ff9900] focus:border-transparent"
                    required
                  >
                    <option value="" disabled>Tag wählen</option>
                    {sortDays(days).map(day => (
                      <option key={getIdString(day._id)} value={getIdString(day._id)}>{day.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="event-time" className="text-sm font-medium text-gray-700">Zeit</label>
                  <input
                    type="time"
                    id="event-time"
                    value={eventForm.time}
                    onChange={e => setEventForm(f => ({ ...f, time: e.target.value }))}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#ff9900] focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="event-category" className="text-sm font-medium text-gray-700">Kategorie</label>
                  <select
                    id="event-category"
                    value={eventForm.categoryId}
                    onChange={e => setEventForm(f => ({ ...f, categoryId: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1 text-base focus:outline-none focus:ring-2 focus:ring-[#ff9900] focus:border-transparent"
                    required
                  >
                    <option value="" disabled>Kategorie wählen</option>
                    {categories.map(cat => (
                      <option key={getIdString(cat._id)} value={getIdString(cat._id)}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="event-description" className="text-sm font-medium text-gray-700">Beschreibung</label>
                  <Textarea
                    id="event-description"
                    placeholder="Beschreibung (optional)"
                    value={eventForm.description}
                    onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full mt-1"
                    rows={3}
                    onKeyDown={(e) => {
                      // Verhindern, dass Enter das Formular absendet
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.stopPropagation();
                      }
                    }}
                  />
                </div>
              </div>
              <div className="border-t bg-white p-4">
                <Button 
                  type="submit" 
                  disabled={loading || !eventForm.title || !eventForm.time || !eventForm.categoryId} 
                  className="bg-gradient-to-br from-[#ff9900] to-[#ffb84d] text-white shadow-3xl border-2 border-white w-full"
                >
                  {loading ? <Loader2 className="animate-spin" /> : (eventToEdit ? 'Speichern' : 'Anlegen')}
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
        {/* Delete-Dialog */}
        <AlertDialog open={!!confirmDelete} onOpenChange={open => !open && setConfirmDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Löschen bestätigen</AlertDialogTitle>
              <AlertDialogDescription>
                {confirmDelete?.type === 'day' ? 'Diesen Tag' : 'Dieses Event'} wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction
                className="bg-[#ff9900] text-white hover:bg-[#ffb84d] focus:ring-2 focus:ring-[#ff9900]"
                onClick={async () => {
                  if (confirmDelete?.type === 'day') await handleDeleteDay(confirmDelete.id);
                  if (confirmDelete?.type === 'event' && confirmDelete.parentId) await handleDeleteEvent(confirmDelete.id, confirmDelete.parentId);
                  setConfirmDelete(null);
                }}
              >
                Löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Desktop-Version
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-[#460b6c]">Timeline</h3>
        {/* Süßes Status-Label für unbestätigte Events */}
        {days.some((day: any) => day._id && (eventsByDay[day._id] || []).some((ev: any) => ev.status === 'pending' && !ev.submittedByAdmin)) && (
          <div className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-pulse">
            <span className="w-2 h-2 bg-white rounded-full"></span>
            Neue Events
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Linke Spalte: Event-Formular */}
        <div className="bg-white shadow rounded-xl p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Event anlegen</h4>
          {/* Event-Formular */}
          <div className="flex flex-col gap-4">
            <label htmlFor="event-day" className="text-sm font-medium text-gray-700">Tag</label>
            <select
              id="event-day"
              value={eventDayId || ''}
              onChange={e => setEventDayId(e.target.value)}
              className="w-full border rounded px-2 py-1"
              required
            >
              <option value="" disabled>Tag wählen</option>
              {sortDays(days).map(day => (
                <option key={getIdString(day._id)} value={getIdString(day._id)}>{day.title}</option>
              ))}
            </select>
            <label htmlFor="event-title" className="text-sm font-medium text-gray-700">Titel</label>
            <Input
              id="event-title"
              placeholder="Titel"
              value={eventForm.title}
              onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))}
              required
              className="w-full"
              ref={eventTitleRef}
            />
            <label htmlFor="event-time" className="text-sm font-medium text-gray-700">Zeit</label>
            <input
              type="time"
              id="event-time"
              value={eventForm.time}
              onChange={e => setEventForm(f => ({ ...f, time: e.target.value }))}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#ff9900] focus:border-transparent"
            />
            <label htmlFor="event-category" className="text-sm font-medium text-gray-700">Kategorie</label>
            <select
              id="event-category"
              value={eventForm.categoryId}
              onChange={e => setEventForm(f => ({ ...f, categoryId: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1 text-base focus:outline-none focus:ring-2 focus:ring-[#ff9900] focus:border-transparent"
              required
            >
              <option value="" disabled>Kategorie wählen</option>
              {categories.map(cat => (
                <option key={getIdString(cat._id)} value={getIdString(cat._id)}>{cat.name}</option>
              ))}
            </select>
            <label htmlFor="event-description" className="text-sm font-medium text-gray-700">Beschreibung</label>
            <Textarea
              id="event-description"
              placeholder="Beschreibung (optional)"
              value={eventForm.description}
              onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))}
              className="w-full"
              rows={2}
            />
            <div className="flex gap-2 mt-4">
              {eventToEdit && (
                <Button
                  variant="secondary"
                  onClick={handleCancelEventForm}
                  className="flex-1"
                >
                  Abbrechen
                </Button>
              )}
              <Button
                variant="default"
                onClick={handleEventFormSubmit}
                disabled={loading || !eventDayId}
                className="bg-[#ff9900] text-white flex-1"
              >
                {loading ? <Loader2 className="animate-spin" /> : (eventToEdit ? 'Event speichern' : 'Event anlegen')}
              </Button>
            </div>
          </div>
        </div>

        {/* Rechte Spalte: Liste */}
        <div className="bg-white shadow rounded-xl p-6">
          <div className="max-h-96 overflow-y-auto">
            <ul className="space-y-4">
              {sortDays(days).map(day => {
                const dayId = getIdString(day._id);
                const hasPending = (eventsByDay[dayId] || []).some(ev => ev.status === 'pending' && !ev.submittedByAdmin);
                const isCollapsed = collapsedDays.has(dayId);
                return (
                <li key={dayId} className="border rounded-lg p-4">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleDayCollapse(dayId)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center gap-2">
                        {isCollapsed ? (
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                        <div className="flex flex-col">
                          <span className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                            {editingDayId === dayId ? (
                              <Input
                                id="inline-day-title"
                                placeholder="Custom Titel für Timeline (optional)"
                                value={editingDayTitle}
                                onChange={e => setEditingDayTitle(e.target.value)}
                                className="w-full mt-1"
                                autoFocus
                                ref={inlineDayTitleRef}
                                onKeyDown={handleInlineEditKeyDown}
                              />
                            ) : (
                              <span className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                                {day.title}
                                {hasPending && <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" title="Unbestätigte Events"></span>}
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-gray-500">{day.date ? formatDateBerlin(day.date, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      {editingDayId === dayId ? (
                        <>
                          <Button variant="default" size="icon" onClick={handleSaveInlineEdit} aria-label="Speichern"><Check className="h-4 w-4" /></Button>
                          <Button variant="secondary" size="icon" onClick={handleCancelInlineEdit} aria-label="Abbrechen"><X className="h-4 w-4" /></Button>
                        </>
                      ) : (
                        <>
                          <Button variant="secondary" size="icon" onClick={() => handleStartInlineEdit(day)} aria-label="Bearbeiten"><Pencil className="h-4 w-4" /></Button>
                          <Button variant="destructive" size="icon" onClick={() => setConfirmDelete({ type: 'day', id: dayId })} aria-label="Löschen"><Trash2 className="h-4 w-4" /></Button>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Events */}
                  {!isCollapsed && (
                    <>
                      <div
                        className={clsx(
                          "mt-2",
                          dragOverDay === dayId && "bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-2"
                        )}
                        onDragOver={(e) => {
                          e.preventDefault();
                          handleDayDragOver(dayId);
                        }}
                        onDragLeave={handleDayDragLeave}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleEventDrop(dayId);
                        }}
                      >
                        <ul className="space-y-2">
                          {(eventsByDay[dayId] || []).map(event => {
                            const eventId = getIdString(event._id);
                            const category = categories.find((cat) => getIdString(cat._id) === event.categoryId);
                            const IconComponent = category ? getIconComponent(category.icon) : LucideIcons.HelpCircle;
                            return (
                              <li 
                                key={eventId} 
                                className={clsx(
                                  "flex items-center justify-between bg-gray-50 rounded-lg p-3 cursor-move",
                                  event.status === 'pending' && !event.submittedByAdmin && 'border-l-4 border-yellow-400',
                                  draggedEvent?.eventId === eventId && "opacity-50"
                                )}
                                draggable
                                onDragStart={() => handleEventDragStart(eventId, dayId)}
                                onDragEnd={handleEventDragEnd}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="bg-[#ff9900]/20 rounded-full p-2 flex items-center justify-center">
                                    <IconComponent className="text-[#ff9900] text-lg" />
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900">{event.title}</div>
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                      <Clock className="inline h-4 w-4" />{event.time}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-1 items-center">
                                  {event.status === 'pending' && !event.submittedByAdmin && (
                                    <Button variant="ghost" size="icon" onClick={() => handleApproveEvent(eventId, dayId)} aria-label="Bestätigen" title="Event bestätigen">
                                      <Check className="h-4 w-4 text-yellow-500" />
                                    </Button>
                                  )}
                                  <Button variant="secondary" size="icon" onClick={() => handleEditEvent(event, dayId)} aria-label="Bearbeiten"><Pencil className="h-4 w-4" /></Button>
                                  <Button variant="destructive" size="icon" onClick={() => setConfirmDelete({ type: 'event', id: eventId, parentId: dayId })} aria-label="Löschen"><Trash2 className="h-4 w-4" /></Button>
                                </div>
                              </li>
                            );})}
                        </ul>
                      </div>
                    </>
                  )}
                </li>
              );})}
            </ul>
          </div>
        </div>
      </div>

      {/* Delete-Dialog */}
      <AlertDialog open={!!confirmDelete} onOpenChange={open => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Löschen bestätigen</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete?.type === 'day' ? 'Diesen Tag' : 'Dieses Event'} wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#ff9900] text-white hover:bg-[#ffb84d] focus:ring-2 focus:ring-[#ff9900]"
              onClick={async () => {
                if (confirmDelete?.type === 'day') await handleDeleteDay(confirmDelete.id);
                if (confirmDelete?.type === 'event' && confirmDelete.parentId) await handleDeleteEvent(confirmDelete.id, confirmDelete.parentId);
                setConfirmDelete(null);
              }}
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminTimelineTab; 