export interface Category {
  _id: string;
  name: string;
  label: string;
  value: string;
  icon: string;
  color: string;
  description?: string;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeletingCategory {
  value: string;
  eventCount: number;
}

export interface Event {
  _id?: { $oid: string };
  time: string;
  title: string;
  description: string;
  categoryId: string | { $oid: string };
  favorite?: boolean;
}

export interface Day {
  _id?: { $oid: string };
  title: string;
  description: string;
  date: Date;
  events: Event[];
  formattedDate?: string;
}

export interface TimelineData {
  _id?: { $oid: string };
  days: Day[];
  createdAt?: Date;
  updatedAt?: Date;
}
