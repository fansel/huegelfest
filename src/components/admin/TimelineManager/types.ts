export interface Category {
  _id?: string;
  value: string;
  label: string;
  icon: string;
  isDefault: boolean;
}

export interface DeletingCategory {
  value: string;
  eventCount: number;
}

export interface Event {
  time: string;
  title: string;
  description: string;
  category: string;
  favorite?: boolean;
}

export interface Day {
  title: string;
  description: string;
  date?: Date;
  events: Event[];
}

export interface TimelineData {
  days: Day[];
} 