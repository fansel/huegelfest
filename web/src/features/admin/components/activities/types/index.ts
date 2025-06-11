// Activity Category Interfaces
export interface ActivityCategory {
  _id: string;
  name: string;
  icon: string; // Lucide icon name
  color: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateActivityCategoryData {
  name: string;
  icon: string;
  color?: string;
}

export interface UpdateActivityCategoryData {
  name?: string;
  icon?: string;
  color?: string;
}

// Activity Template Interfaces
export interface ActivityTemplate {
  _id: string;
  name: string;
  categoryId: string;
  defaultDescription: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateActivityTemplateData {
  name: string;
  categoryId: string;
  defaultDescription: string;
}

// Activity Interfaces
export interface Activity {
  _id: string;
  date: string; // ISO date string
  startTime: string; // HH:MM format (e.g., "08:00") - required
  endTime?: string; // HH:MM format (e.g., "10:00") - optional
  categoryId: string;
  templateId?: string; // Optional: reference to template
  customName?: string; // If not using template
  description?: string; // Optional description
  groupId?: string; // Assigned group (optional)
  responsibleUsers?: string[]; // IDs der hauptverantwortlichen Benutzer
  createdBy: string; // Admin ID
  agendaJobId?: string; // For push reminders
  responsiblePushJobId?: string; // For responsible users push reminders
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
}

export interface CreateActivityData {
  date: string | Date;
  startTime: string; // HH:MM format - required
  endTime?: string; // HH:MM format - optional
  categoryId: string;
  templateId?: string;
  customName?: string;
  description?: string; // Optional description
  groupId?: string;
  responsibleUsers?: string[]; // IDs der hauptverantwortlichen Benutzer
}

export interface UpdateActivityData {
  date?: string | Date;
  startTime?: string; // HH:MM format
  endTime?: string; // HH:MM format
  categoryId?: string;
  templateId?: string;
  customName?: string;
  description?: string; // Optional description
  groupId?: string;
  responsibleUsers?: string[]; // IDs der hauptverantwortlichen Benutzer
  responsibleUsersData?: {
    _id: string;
    name: string;
    email?: string;
  }[];
}

// Extended interfaces with populated data
export interface ActivityWithCategory extends Activity {
  category: ActivityCategory;
}

export interface ActivityWithTemplate extends Activity {
  template?: ActivityTemplate;
}

export interface ActivityWithCategoryAndTemplate extends Activity {
  category: ActivityCategory;
  template?: ActivityTemplate;
  group?: {
    _id: string;
    name: string;
    color: string;
  };
  responsibleUsersData?: {
    _id: string;
    name: string;
    email?: string;
  }[];
  lastMessageAt?: string;
}

// Activity assignment interface
export interface ActivityAssignment {
  activityId: string;
  groupId: string;
  assignedAt: string;
  assignedBy: string;
}

// Festival day interface for activities
export interface ActivityDay {
  date: string;
  dayName: string;
  activities: ActivityWithCategoryAndTemplate[];
}

// Festival day management
export interface FestivalDay {
  _id?: string;
  date: Date;
  label: string;
  description?: string;
  isActive: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFestivalDayData {
  date: Date;
  label: string;
  description?: string;
  isActive?: boolean;
  order?: number;
}

export interface UpdateFestivalDayData {
  date?: Date;
  label?: string;
  description?: string;
  isActive?: boolean;
  order?: number;
}

// User status for activities (extends existing UserStatus)
export interface UserStatus {
  isRegistered: boolean;
  name?: string;
  groupId?: string;
  groupName?: string;
  groupColor?: string;
}

export interface UserActivityStatus extends UserStatus {
  assignedActivities: ActivityWithCategoryAndTemplate[];
  upcomingActivities: ActivityWithCategoryAndTemplate[];
}

// Activity status helpers
export interface ActivityTimeStatus {
  isActive: boolean; // Currently happening
  hasStarted: boolean; // Has started (past start time)
  hasEnded: boolean; // Has ended (past end time or 1 hour after start if no end time)
  canSendReminder: boolean; // Can send reminder (has started)
  timeRemaining?: string; // Human readable time remaining
}

// Activity view modes
export type ActivityViewMode = 'all' | 'today' | 'upcoming' | 'past';

// Activity filter options
export interface ActivityFilters {
  groupId?: string;
  categoryId?: string;
  hasResponsibleUsers?: boolean;
  timeStatus?: 'upcoming' | 'active' | 'past';
} 