export interface Category {
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
  categoryId: string;
  favorite?: boolean;
}

export interface Day {
  id: string;
  title: string;
  description: string;
  date: Date;
  events: Event[];
  formattedDate?: string;
}

export interface TimelineData {
  id: string;
  days: Day[];
  createdAt?: Date;
  updatedAt?: Date;
}
