'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Calendar, Clock, Users, Bell, Trash2, Pencil, AlertCircle, Crown } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import toast from 'react-hot-toast';
import { useDeviceContext } from '@/shared/contexts/DeviceContext';
import { useDeviceId } from '@/shared/hooks/useDeviceId';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/shared/components/ui/alert-dialog';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useActivitiesRealtime } from '../hooks/useActivitiesRealtime';
import { createActivityAction } from '../actions/createActivity';
import { updateActivityAction } from '../actions/updateActivity';
import { deleteActivityAction } from '../actions/deleteActivity';
import { sendReminderAction } from '../actions/sendReminder';
import type { ActivityWithCategoryAndTemplate, CreateActivityData } from '../types';
import { Badge } from '@/shared/components/ui/badge';
import { fetchGroupUsersAction } from '../actions/fetchActivitiesData';
import type { GroupUser } from '../actions/fetchActivitiesData';
import { formatActivityTime } from '../utils/timeUtils';

interface ActivityManagerProps {}

interface FestivalDay {
  date: Date;
  label: string;
  activities: ActivityWithCategoryAndTemplate[];
}

// Helper to get festival days (example: 3 days starting from today)
const getFestivalDays = (): FestivalDay[] => {
  const today = new Date();
  const days: FestivalDay[] = [];
  
  for (let i = 0; i < 3; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    const dayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    const dayName = dayNames[date.getDay()];
    const dateStr = format(date, 'dd.MM.yyyy', { locale: de });
    
    days.push({
      date,
      label: `${dayName}, ${dateStr}`,
      activities: []
    });
  }
  
  return days;
};

const ActivityManager: React.FC<ActivityManagerProps> = () => {
  const { deviceType } = useDeviceContext();
  const deviceId = useDeviceId();
  const isMobile = deviceType === 'mobile';

  // Use realtime hook
  const { data, loading, connected, refreshData } = useActivitiesRealtime();
  const { activities, categories, templates, groups } = data;

  // State
  const [selectedDay, setSelectedDay] = useState(0);
  const [festivalDays, setFestivalDays] = useState<FestivalDay[]>(getFestivalDays());
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityWithCategoryAndTemplate | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [groupUsers, setGroupUsers] = useState<GroupUser[]>([]);
  const previousGroupIdRef = useRef<string>('');

  // Form state
  const [activityForm, setActivityForm] = useState<CreateActivityData>({
    date: new Date(),
    startTime: '',
    endTime: '',
    categoryId: '',
    templateId: '',
    customName: '',
    description: '',
    groupId: '',
    responsibleUsers: [],
  });

  // Organize activities by day
  useEffect(() => {
    const updatedDays = festivalDays.map(day => {
      const dayActivities = activities.filter((activity) => {
        const activityDate = new Date(activity.date);
        return activityDate.toDateString() === day.date.toDateString();
      });

      return {
        ...day,
        activities: dayActivities
      };
    });

    setFestivalDays(updatedDays);
  }, [activities]);

  // Load group users when group is selected OR when editing activity
  useEffect(() => {
    const loadGroupUsers = async () => {
      if (activityForm.groupId && activityForm.groupId !== '') {
        try {
          const users = await fetchGroupUsersAction(activityForm.groupId);
          setGroupUsers(users);
          
          // Only filter responsible users if group actually changed
          if (previousGroupIdRef.current !== '' && previousGroupIdRef.current !== activityForm.groupId) {
            // Filter existing responsible users to only keep those in the new group
            if (activityForm.responsibleUsers && activityForm.responsibleUsers.length > 0) {
              const userIds = users.map(user => user._id);
              const validResponsibleUsers = activityForm.responsibleUsers.filter(userId => 
                userIds.includes(userId)
              );
              
              // Update form if some responsible users were removed
              if (validResponsibleUsers.length !== activityForm.responsibleUsers.length) {
                setActivityForm(prev => ({
                  ...prev,
                  responsibleUsers: validResponsibleUsers
                }));
              }
            }
          }
          
          previousGroupIdRef.current = activityForm.groupId;
        } catch (error) {
          console.error('Error loading group users:', error);
          setGroupUsers([]);
        }
      } else {
        setGroupUsers([]);
        // Clear responsible users if no group is selected
        if (previousGroupIdRef.current !== '') {
          setActivityForm(prev => ({
            ...prev,
            responsibleUsers: []
          }));
        }
        previousGroupIdRef.current = '';
      }
    };

    loadGroupUsers();
  }, [activityForm.groupId]);

  // Form handlers
  const resetForm = () => {
    setActivityForm({
      date: new Date(),
      startTime: '',
      endTime: '',
      categoryId: '',
      templateId: '',
      customName: '',
      description: '',
      groupId: '',
      responsibleUsers: [],
    });
    setEditingActivity(null);
    setGroupUsers([]);
    previousGroupIdRef.current = '';
  };

  const populateForm = (activity: ActivityWithCategoryAndTemplate) => {
    setActivityForm({
      date: activity.date ? new Date(activity.date) : new Date(),
      startTime: activity.startTime || '',
      endTime: activity.endTime || '',
      categoryId: activity.categoryId,
      templateId: activity.templateId || '',
      customName: activity.customName || '',
      description: activity.description || '',
      groupId: activity.groupId || '',
      responsibleUsers: activity.responsibleUsers || [],
    });
    // Set the ref to avoid filtering on initial population
    previousGroupIdRef.current = activity.groupId || '';
  };

  const handleCreateActivity = async () => {
    if (!activityForm.categoryId) {
      toast.error('Bitte wähle eine Kategorie');
      return;
    }

    if (!activityForm.startTime.trim()) {
      toast.error('Bitte gib eine Startzeit ein');
      return;
    }

    if (!deviceId) {
      toast.error('Device ID nicht verfügbar');
      return;
    }

    try {
      const selectedDate = festivalDays[selectedDay].date;
      
      if (editingActivity) {
        // Update existing activity
        const result = await updateActivityAction(editingActivity._id, {
          date: selectedDate,
          startTime: activityForm.startTime,
          endTime: activityForm.endTime || undefined,
          categoryId: activityForm.categoryId,
          templateId: activityForm.templateId || undefined,
          customName: activityForm.customName || undefined,
          description: activityForm.description || undefined,
          groupId: activityForm.groupId || undefined,
          responsibleUsers: activityForm.responsibleUsers || undefined,
        });

        if (result.success) {
          toast.success('Aktivität aktualisiert');
          setShowActivityModal(false);
          resetForm();
        } else {
          toast.error(result.error || 'Fehler beim Aktualisieren der Aktivität');
        }
      } else {
        // Create new activity
        const result = await createActivityAction({
          date: selectedDate,
          startTime: activityForm.startTime,
          endTime: activityForm.endTime || undefined,
          categoryId: activityForm.categoryId,
          templateId: activityForm.templateId || undefined,
          customName: activityForm.customName || undefined,
          description: activityForm.description || undefined,
          groupId: activityForm.groupId || undefined,
          responsibleUsers: activityForm.responsibleUsers || undefined,
        }, deviceId);

        if (result.success) {
          toast.success('Aktivität erstellt');
          setShowActivityModal(false);
          resetForm();
        } else {
          toast.error(result.error || 'Fehler beim Erstellen der Aktivität');
        }
      }
    } catch (error) {
      console.error('Error creating/updating activity:', error);
      toast.error('Ein unerwarteter Fehler ist aufgetreten');
    }
  };

  const handleEditActivity = (activity: ActivityWithCategoryAndTemplate) => {
    setEditingActivity(activity);
    populateForm(activity);
    setShowActivityModal(true);
  };

  const handleDeleteActivity = async (activityId: string) => {
    try {
      const result = await deleteActivityAction(activityId);
      if (result.success) {
        toast.success('Aktivität gelöscht');
      } else {
        toast.error((result as any).error || 'Fehler beim Löschen der Aktivität');
      }
    } catch (error) {
      toast.error('Fehler beim Löschen der Aktivität');
    }
    setConfirmDelete(null);
  };

  const handleSendReminder = async (activityId: string) => {
    try {
      const result = await sendReminderAction(activityId);
      if (result.success) {
        toast.success(`Erinnerung an ${result.sent} Teilnehmer gesendet`);
      } else {
        toast.error((result as any).error || 'Fehler beim Senden der Erinnerung');
      }
    } catch (error) {
      toast.error('Fehler beim Senden der Erinnerung');
    }
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent || LucideIcons.HelpCircle;
  };

  const currentDay = festivalDays[selectedDay];

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="sticky top-0 z-10 bg-[#460b6c]/90 backdrop-blur-sm py-4 px-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-[#ff9900]" />
            <h2 className="text-xl font-bold text-[#ff9900]">Aufgaben verwalten</h2>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-[#ff9900]/70">Lade Daten...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#460b6c]/90 backdrop-blur-sm py-4 px-4">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-[#ff9900]" />
          <h2 className="text-xl font-bold text-[#ff9900]">Aufgaben verwalten</h2>
          {connected && (
            <div className="ml-auto">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Live verbunden" />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full px-2 sm:px-6 mt-4 sm:mt-6">
        {/* Day Selector */}
        <div className="flex space-x-2 overflow-x-auto pb-2 mb-6">
          {festivalDays.map((day, index) => (
            <button
              key={index}
              onClick={() => setSelectedDay(index)}
              className={`flex-shrink-0 px-4 py-2 rounded-full transition-colors duration-200 text-sm font-medium ${
                selectedDay === index
                  ? 'bg-[#ff9900] text-[#460b6c]'
                  : 'bg-[#460b6c] text-[#ff9900] border border-[#ff9900]/20'
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>

        {/* Current Day Activities */}
        <div className="space-y-4">
          {/* Day Header with Add Button */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#ff9900]">
              {currentDay?.label}
            </h3>
            <Button
              onClick={() => setShowActivityModal(true)}
              className="bg-[#ff9900] hover:bg-orange-600 text-[#460b6c] font-medium"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Aufgabe
            </Button>
          </div>

          {/* Activities List */}
          <div className="space-y-3">
            {currentDay?.activities.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-[#ff9900]/20 p-6 text-center">
                <AlertCircle className="h-8 w-8 mx-auto mb-3 text-[#ff9900]/60" />
                <p className="text-[#ff9900]/80 text-sm">
                  Noch keine Aufgaben für diesen Tag geplant.
                </p>
              </div>
            ) : (
              currentDay?.activities.map((activity) => {
                const IconComponent = activity.category ? getIconComponent(activity.category.icon) : LucideIcons.HelpCircle;
                const group = activity.group || groups.find((g: any) => (g._id || g.id) === activity.groupId);

                return (
                  <div
                    key={activity._id}
                    className="bg-white/10 backdrop-blur-sm rounded-lg border border-[#ff9900]/20 p-4"
                  >
                    <div className="flex items-start gap-3">
                      {/* Category Icon */}
                      <div 
                        className="flex-shrink-0 p-2 rounded-full"
                        style={{ backgroundColor: `${activity.category?.color || '#ff9900'}20` }}
                      >
                        <IconComponent 
                          className="h-5 w-5" 
                          style={{ color: activity.category?.color || '#ff9900' }}
                        />
                      </div>

                      {/* Activity Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-[#ff9900] text-sm">
                              {activity.template?.name || activity.customName}
                            </h4>
                            
                            {/* Time */}
                            {activity.startTime && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="h-3 w-3" />
                                {formatActivityTime(activity)}
                              </div>
                            )}
                            
                            {/* Group Label */}
                            {activity.groupId && (
                              <div className="flex items-center gap-1 text-xs text-[#ff9900]/70 mt-1">
                                <Users className="h-3 w-3" />
                                <span 
                                  className="px-2 py-0.5 rounded text-white text-xs font-medium"
                                  style={{ backgroundColor: group?.color || '#6b7280' }}
                                >
                                  {group?.name || 'Unbekannte Gruppe'}
                                </span>
                              </div>
                            )}
                            
                            {/* Responsible Users */}
                            {activity.responsibleUsers && activity.responsibleUsers.length > 0 && (
                              <div className="flex items-center gap-1 text-xs text-[#ff9900]/70 mt-1">
                                <Crown className="h-3 w-3" />
                                <Badge variant="outline" className="text-xs px-1 py-0 border-[#ff9900]/30">
                                  {activity.responsibleUsers.length} Hauptverantwortliche
                                </Badge>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-1">
                            {activity.groupId && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleSendReminder(activity._id)}
                                className="h-8 w-8 text-[#ff9900]/70 hover:text-[#ff9900] hover:bg-[#ff9900]/10"
                                title="Erinnerung senden"
                              >
                                <Bell className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditActivity(activity)}
                              className="h-8 w-8 text-[#ff9900]/70 hover:text-[#ff9900] hover:bg-[#ff9900]/10"
                              title="Bearbeiten"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setConfirmDelete(activity._id)}
                              className="h-8 w-8 text-red-400/70 hover:text-red-400 hover:bg-red-400/10"
                              title="Löschen"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-[#ff9900]/60 mt-2">
                          {activity.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Activity Modal */}
      <Sheet open={showActivityModal} onOpenChange={(open) => {
        setShowActivityModal(open);
        if (!open) resetForm();
      }}>
        <SheetContent side="bottom" className="max-w-lg mx-auto rounded-t-3xl h-[80vh]">
          <SheetHeader>
            <SheetTitle>
              {editingActivity ? 'Aufgabe bearbeiten' : 'Neue Aufgabe erstellen'}
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-4 px-4 py-6 h-full overflow-y-auto">
            {/* Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Startzeit *
                </label>
                <input
                  type="time"
                  step="60"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ff9900] focus:border-transparent"
                  value={activityForm.startTime || ''}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, startTime: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Endzeit (optional)
                </label>
                <input
                  type="time"
                  step="60"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ff9900] focus:border-transparent"
                  value={activityForm.endTime || ''}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Kategorie *
              </label>
              <Select 
                value={activityForm.categoryId} 
                onValueChange={(value) => setActivityForm(prev => ({ ...prev, categoryId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kategorie wählen" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => {
                    const IconComponent = getIconComponent(category.icon);
                    return (
                      <SelectItem key={category._id} value={category._id}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" style={{ color: category.color }} />
                          {category.name}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Name */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Aufgaben-Name
              </label>
              <Input
                placeholder="z.B. Frühstück zubereiten"
                value={activityForm.customName}
                onChange={(e) => setActivityForm(prev => ({ ...prev, customName: e.target.value }))}
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Beschreibung (optional)
              </label>
              <Textarea
                placeholder="Was soll gemacht werden?"
                value={activityForm.description}
                onChange={(e) => setActivityForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Group Assignment */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Gruppe zuweisen (optional)
              </label>
              <Select 
                value={activityForm.groupId || "none"} 
                onValueChange={(value) => setActivityForm(prev => ({ 
                  ...prev, 
                  groupId: value === "none" ? "" : value 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Gruppe wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keine Gruppe</SelectItem>
                  {groups.map((group: any) => (
                    <SelectItem key={group._id || group.id} value={group._id || group.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: group.color }}
                        />
                        <span>{group.name}</span>
                        {!group.isAssignable && (
                          <span className="text-xs text-orange-600 ml-1">(gesperrt)</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Responsible Users */}
            {activityForm.groupId && groupUsers.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Hauptverantwortliche (optional)
                </label>
                <div className="space-y-2">
                  {groupUsers.map((user) => (
                    <label key={user._id} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activityForm.responsibleUsers?.includes(user._id) || false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const currentIds = activityForm.responsibleUsers || [];
                          const newIds = checked 
                            ? [...currentIds, user._id]
                            : currentIds.filter(id => id !== user._id);
                          setActivityForm(prev => ({
                            ...prev,
                            responsibleUsers: newIds
                          }));
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{user.name}</span>
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        <Crown className="h-3 w-3" />
                        Verantwortlich
                      </Badge>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 mt-auto">
              <Button 
                variant="secondary" 
                onClick={() => {
                  setShowActivityModal(false);
                  resetForm();
                }}
                className="flex-1"
              >
                Abbrechen
              </Button>
              <Button 
                onClick={handleCreateActivity}
                className="flex-1 bg-[#ff9900] hover:bg-orange-600"
              >
                {editingActivity ? 'Speichern' : 'Erstellen'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      {confirmDelete && (
        <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Aufgabe löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Möchtest du diese Aufgabe wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel asChild>
                <Button variant="secondary">Abbrechen</Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button 
                  variant="destructive" 
                  onClick={() => handleDeleteActivity(confirmDelete)}
                >
                  Löschen
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default ActivityManager; 