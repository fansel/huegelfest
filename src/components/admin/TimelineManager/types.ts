export interface Category {
  _id: string;
  value: string;
  label: string;
  icon: string;
  isDefault: boolean;
}

export interface DeletingCategory {
  _id: string;
  eventCount: number;
}

export interface Event {
  time: string;
  title: string;
  description: string;
  categoryId: string;
  favorite?: boolean;
}

export interface Day {
  _id: string;
  title: string;
  description: string;
  date: Date;
  events: Event[];
  formattedDate?: string;
}

export interface TimelineData {
  _id: string;
  days: Day[];
  createdAt?: Date;
  updatedAt?: Date;
} 