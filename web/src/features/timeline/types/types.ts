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
  /**
   * Status des Events: 'pending' (eingereicht, wartet auf Freigabe),
   * 'approved' (freigegeben), 'rejected' (abgelehnt)
   */
  status?: 'pending' | 'approved' | 'rejected';
  /**
   * Optionaler Kommentar des Admins bei Ablehnung oder Änderung
   */
  moderationComment?: string;
  /**
   * Zeitpunkt der Einreichung (ISO-String)
   */
  submittedAt?: string;
  /**
   * True, wenn das Event von einem Admin erstellt wurde (dann auto-approved)
   */
  submittedByAdmin?: boolean;
  /**
   * Optional: Wer bietet das Event an (z.B. Name, Gruppe)
   */
  offeredBy?: string;
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
