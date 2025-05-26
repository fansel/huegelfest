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
  time?: string; // Optional: "08:00-10:00" format
  categoryId: string;
  templateId?: string; // Optional: reference to template
  customName?: string; // If not using template
  description: string;
  groupId?: string; // Assigned group (optional)
  responsibleUsers?: string[]; // IDs der hauptverantwortlichen Benutzer
  createdBy: string; // Admin ID
  agendaJobId?: string; // For push reminders
  createdAt: string;
  updatedAt: string;
}

export interface CreateActivityData {
  date: string | Date;
  time?: string;
  categoryId: string;
  templateId?: string;
  customName?: string;
  description: string;
  groupId?: string;
  responsibleUsers?: string[]; // IDs der hauptverantwortlichen Benutzer
}

export interface UpdateActivityData {
  date?: string | Date;
  time?: string;
  categoryId?: string;
  templateId?: string;
  customName?: string;
  description?: string;
  groupId?: string;
  responsibleUsers?: string[]; // IDs der hauptverantwortlichen Benutzer
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
    deviceId: string;
  }[];
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