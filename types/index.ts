// ─── User / Auth ───────────────────────────────────────────────────
export type UserRole = 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

// ─── Tuition ───────────────────────────────────────────────────────
export type TuitionStatus = 'active' | 'paused' | 'ended';
export type PaymentStatus = 'paid' | 'not_paid' | 'partial';

export interface Tuition {
  id: string;
  teacherId: string;
  // Core fields
  subject: string;
  startTime: string;              // e.g. "5:00 PM"
  endTime: string;                // e.g. "6:00 PM"
  schedule: string;               // e.g. "Mon, Wed, Fri"
  datesPerWeek: number;
  plannedClassesPerMonth: number;
  // Student info — optional, can be added later
  studentName?: string;
  studentEmail?: string;
  studentId?: string;             // populated when student accepts invite
  salary?: number;                // monthly tuition fee
  // Status
  status: TuitionStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
}

// ─── Class Log ─────────────────────────────────────────────────────
// A class log is just a date entry — no complex status
export interface ClassLog {
  id: string;
  tuitionId: string;
  date: string;       // "2025-03-05"
  createdAt: string;  // exact timestamp when entry was added
}

// ─── Activity Log ──────────────────────────────────────────────────
export type ActivityLogType =
  | 'class_added'
  | 'class_deleted'
  | 'reset'
  | 'homework_added'
  | 'payment_updated';

export interface ActivityLog {
  id: string;
  tuitionId: string;
  type: ActivityLogType;
  description: string;
  timestamp: string;
}

// ─── Homework ──────────────────────────────────────────────────────
export interface HomeworkComment {
  id: string;
  userId: string;
  userName: string;
  role: 'teacher' | 'student';
  text: string;
  timestamp: string;
}

export interface Homework {
  id: string;
  tuitionId: string;
  teacherId: string;
  subject: string;
  chapter: string;
  task: string;
  dueDate: string;
  notes?: string;
  completed: boolean;
  comments: HomeworkComment[];
  createdAt: string;
}
