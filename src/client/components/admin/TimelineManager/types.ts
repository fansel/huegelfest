export interface Category {
  name: string;
  icon: string;
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
