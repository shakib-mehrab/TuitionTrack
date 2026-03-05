import { create } from 'zustand';
import type {
  Tuition,
  ClassLog,
  ActivityLog,
  Homework,
  HomeworkComment,
  PaymentStatus,
  TuitionStatus,
} from '@/types';

// ─── Mock seed data ────────────────────────────────────────────────
const MOCK_TUITIONS: Tuition[] = [
  {
    id: 't1',
    teacherId: 'teacher_1',
    subject: 'Mathematics',
    startTime: '5:00 PM',
    endTime: '6:00 PM',
    schedule: 'Mon, Wed, Fri',
    datesPerWeek: 3,
    plannedClassesPerMonth: 12,
    studentName: 'Arjun Kumar',
    studentEmail: 'arjun@example.com',
    studentId: 'student_1',
    salary: 2000,
    status: 'active',
    paymentStatus: 'not_paid',
    createdAt: '2025-01-05T00:00:00.000Z',
  },
  {
    id: 't2',
    teacherId: 'teacher_1',
    subject: 'Physics',
    startTime: '6:00 PM',
    endTime: '7:00 PM',
    schedule: 'Tue, Thu',
    datesPerWeek: 2,
    plannedClassesPerMonth: 8,
    studentName: 'Arjun Kumar',
    studentEmail: 'arjun@example.com',
    studentId: 'student_1',
    salary: 1800,
    status: 'active',
    paymentStatus: 'paid',
    createdAt: '2025-01-05T00:00:00.000Z',
  },
  {
    id: 't3',
    teacherId: 'teacher_1',
    subject: 'Chemistry',
    startTime: '4:00 PM',
    endTime: '5:00 PM',
    schedule: 'Mon, Wed',
    datesPerWeek: 2,
    plannedClassesPerMonth: 10,
    studentName: 'Priya Patel',
    studentEmail: 'priya@example.com',
    studentId: 's2',
    salary: 2000,
    status: 'active',
    paymentStatus: 'partial',
    createdAt: '2025-01-10T00:00:00.000Z',
  },
  {
    id: 't4',
    teacherId: 'teacher_1',
    subject: 'Mathematics',
    startTime: '7:00 PM',
    endTime: '8:00 PM',
    schedule: 'Mon – Sat',
    datesPerWeek: 6,
    plannedClassesPerMonth: 24,
    studentName: 'Rohan Singh',
    studentId: 's3',
    salary: 2500,
    status: 'active',
    paymentStatus: 'not_paid',
    createdAt: '2025-02-01T00:00:00.000Z',
  },
];

const MOCK_CLASS_LOGS: ClassLog[] = [
  // t1 - 8 of 12
  { id: 'cl1',  tuitionId: 't1', date: '2025-03-03', createdAt: '2025-03-03T17:05:00.000Z' },
  { id: 'cl2',  tuitionId: 't1', date: '2025-03-05', createdAt: '2025-03-05T17:02:00.000Z' },
  { id: 'cl3',  tuitionId: 't1', date: '2025-03-10', createdAt: '2025-03-10T17:01:00.000Z' },
  { id: 'cl4',  tuitionId: 't1', date: '2025-03-12', createdAt: '2025-03-12T17:03:00.000Z' },
  { id: 'cl5',  tuitionId: 't1', date: '2025-03-17', createdAt: '2025-03-17T17:00:00.000Z' },
  { id: 'cl6',  tuitionId: 't1', date: '2025-03-19', createdAt: '2025-03-19T17:05:00.000Z' },
  { id: 'cl7',  tuitionId: 't1', date: '2025-03-24', createdAt: '2025-03-24T17:02:00.000Z' },
  { id: 'cl8',  tuitionId: 't1', date: '2025-03-26', createdAt: '2025-03-26T17:01:00.000Z' },
  // t2 - 4 of 8
  { id: 'cl9',  tuitionId: 't2', date: '2025-03-04', createdAt: '2025-03-04T18:05:00.000Z' },
  { id: 'cl10', tuitionId: 't2', date: '2025-03-06', createdAt: '2025-03-06T18:02:00.000Z' },
  { id: 'cl11', tuitionId: 't2', date: '2025-03-11', createdAt: '2025-03-11T18:01:00.000Z' },
  { id: 'cl12', tuitionId: 't2', date: '2025-03-13', createdAt: '2025-03-13T18:03:00.000Z' },
  // t3 - 3 of 10
  { id: 'cl13', tuitionId: 't3', date: '2025-03-03', createdAt: '2025-03-03T16:05:00.000Z' },
  { id: 'cl14', tuitionId: 't3', date: '2025-03-05', createdAt: '2025-03-05T16:02:00.000Z' },
  { id: 'cl15', tuitionId: 't3', date: '2025-03-10', createdAt: '2025-03-10T16:03:00.000Z' },
  // t4 - 5 of 24
  { id: 'cl16', tuitionId: 't4', date: '2025-03-03', createdAt: '2025-03-03T19:01:00.000Z' },
  { id: 'cl17', tuitionId: 't4', date: '2025-03-04', createdAt: '2025-03-04T19:02:00.000Z' },
  { id: 'cl18', tuitionId: 't4', date: '2025-03-05', createdAt: '2025-03-05T19:01:00.000Z' },
  { id: 'cl19', tuitionId: 't4', date: '2025-03-06', createdAt: '2025-03-06T19:03:00.000Z' },
  { id: 'cl20', tuitionId: 't4', date: '2025-03-07', createdAt: '2025-03-07T19:02:00.000Z' },
];

const MOCK_ACTIVITY_LOGS: ActivityLog[] = [
  { id: 'a1', tuitionId: 't1', type: 'class_added', description: 'Class added for Mar 3', timestamp: '2025-03-03T17:05:00.000Z' },
  { id: 'a2', tuitionId: 't1', type: 'class_added', description: 'Class added for Mar 5', timestamp: '2025-03-05T17:02:00.000Z' },
  { id: 'a3', tuitionId: 't1', type: 'homework_added', description: 'Homework: Quadratic Practice Set', timestamp: '2025-03-05T17:30:00.000Z' },
];

const MOCK_HOMEWORK: Homework[] = [
  {
    id: 'h1',
    tuitionId: 't1',
    teacherId: 'teacher_1',
    subject: 'Mathematics',
    chapter: 'Chapter 3 – Quadratic Equations',
    task: 'Solve exercises 3.1 to 3.5 from the textbook. Show all working.',
    dueDate: '2025-03-10',
    notes: 'Focus on discriminant method',
    completed: true,
    comments: [
      {
        id: 'c1', userId: 'student_1', userName: 'Arjun Kumar', role: 'student',
        text: 'I completed all exercises. Question 3.4 was tricky.',
        timestamp: '2025-03-09T10:00:00.000Z',
      },
      {
        id: 'c2', userId: 'teacher_1', userName: 'Rahul Sharma', role: 'teacher',
        text: 'Great work! Yes, 3.4 requires careful sign handling.',
        timestamp: '2025-03-09T11:30:00.000Z',
      },
    ],
    createdAt: '2025-03-05T17:30:00.000Z',
  },
  {
    id: 'h2',
    tuitionId: 't1',
    teacherId: 'teacher_1',
    subject: 'Mathematics',
    chapter: 'Chapter 8 – Trigonometry',
    task: 'Learn sin, cos, tan tables. Solve 10 problems from the exercises.',
    dueDate: '2025-03-20',
    completed: false,
    comments: [],
    createdAt: '2025-03-12T17:30:00.000Z',
  },
  {
    id: 'h3',
    tuitionId: 't3',
    teacherId: 'teacher_1',
    subject: 'Chemistry',
    chapter: 'Chapter 2 – Periodic Table',
    task: 'Memorize first 20 elements with symbols and atomic numbers.',
    dueDate: '2025-03-15',
    completed: false,
    comments: [
      {
        id: 'c3', userId: 's2', userName: 'Priya Patel', role: 'student',
        text: 'Do we need to memorize electron configuration too?',
        timestamp: '2025-03-11T09:00:00.000Z',
      },
    ],
    createdAt: '2025-03-08T16:30:00.000Z',
  },
];

// ─── Store Interface ────────────────────────────────────────────────
interface TeacherState {
  tuitions: Tuition[];
  classLogs: ClassLog[];
  activityLogs: ActivityLog[];
  homework: Homework[];

  // Tuition CRUD
  addTuition: (data: Omit<Tuition, 'id' | 'createdAt'>) => void;
  updateTuition: (id: string, data: Partial<Tuition>) => void;
  deleteTuition: (id: string) => void;

  // Class log CRUD
  addClassLog: (tuitionId: string, date: string) => void;
  deleteClassLog: (logId: string) => void;
  resetClassLogs: (tuitionId: string) => void;

  // Payment
  updatePaymentStatus: (tuitionId: string, status: PaymentStatus) => void;

  // Homework CRUD
  addHomework: (hw: Omit<Homework, 'id' | 'createdAt' | 'completed' | 'comments'>) => void;
  updateHomework: (id: string, data: Partial<Homework>) => void;
  deleteHomework: (id: string) => void;
  markHomeworkComplete: (id: string, completed: boolean) => void;
  addComment: (homeworkId: string, comment: Omit<HomeworkComment, 'id' | 'timestamp'>) => void;

  // Selectors
  getLogsForTuition: (tuitionId: string) => ClassLog[];
  getHomeworkForTuition: (tuitionId: string) => Homework[];
  getActivityForTuition: (tuitionId: string) => ActivityLog[];
  getTuitionById: (id: string) => Tuition | undefined;
  getClassCountForMonth: (tuitionId: string, month: string) => number;
}

export const useTeacherStore = create<TeacherState>((set, get) => ({
  tuitions: MOCK_TUITIONS,
  classLogs: MOCK_CLASS_LOGS,
  activityLogs: MOCK_ACTIVITY_LOGS,
  homework: MOCK_HOMEWORK,

  // ── Tuition ──
  addTuition: (data) =>
    set((s) => ({
      tuitions: [...s.tuitions, { ...data, id: `t_${Date.now()}`, createdAt: new Date().toISOString() }],
    })),

  updateTuition: (id, data) =>
    set((s) => ({
      tuitions: s.tuitions.map((t) => (t.id === id ? { ...t, ...data } : t)),
    })),

  deleteTuition: (id) =>
    set((s) => ({
      tuitions: s.tuitions.filter((t) => t.id !== id),
      classLogs: s.classLogs.filter((l) => l.tuitionId !== id),
      homework: s.homework.filter((h) => h.tuitionId !== id),
    })),

  // ── Class Logs ──
  addClassLog: (tuitionId, date) => {
    const now = new Date().toISOString();
    const newLog: ClassLog = { id: `cl_${Date.now()}`, tuitionId, date, createdAt: now };
    const tuition = get().tuitions.find((t) => t.id === tuitionId);
    const activity: ActivityLog = {
      id: `a_${Date.now()}`,
      tuitionId,
      type: 'class_added',
      description: `Class added for ${new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`,
      timestamp: now,
    };
    set((s) => ({
      classLogs: [...s.classLogs, newLog],
      activityLogs: [activity, ...s.activityLogs],
    }));
  },

  deleteClassLog: (logId) => {
    const log = get().classLogs.find((l) => l.id === logId);
    if (!log) return;
    const activity: ActivityLog = {
      id: `a_${Date.now()}`,
      tuitionId: log.tuitionId,
      type: 'class_deleted',
      description: `Class removed for ${new Date(log.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
      timestamp: new Date().toISOString(),
    };
    set((s) => ({
      classLogs: s.classLogs.filter((l) => l.id !== logId),
      activityLogs: [activity, ...s.activityLogs],
    }));
  },

  resetClassLogs: (tuitionId) => {
    const activity: ActivityLog = {
      id: `a_${Date.now()}`,
      tuitionId,
      type: 'reset',
      description: 'Monthly class log reset',
      timestamp: new Date().toISOString(),
    };
    set((s) => ({
      classLogs: s.classLogs.filter((l) => l.tuitionId !== tuitionId),
      activityLogs: [activity, ...s.activityLogs],
    }));
  },

  // ── Payment ──
  updatePaymentStatus: (tuitionId, status) => {
    const activity: ActivityLog = {
      id: `a_${Date.now()}`,
      tuitionId,
      type: 'payment_updated',
      description: `Payment status updated to ${status.replace('_', ' ')}`,
      timestamp: new Date().toISOString(),
    };
    set((s) => ({
      tuitions: s.tuitions.map((t) => (t.id === tuitionId ? { ...t, paymentStatus: status } : t)),
      activityLogs: [activity, ...s.activityLogs],
    }));
  },

  // ── Homework ──
  addHomework: (data) => {
    const now = new Date().toISOString();
    const hw: Homework = {
      ...data,
      id: `h_${Date.now()}`,
      createdAt: now,
      completed: false,
      comments: [],
    };
    const activity: ActivityLog = {
      id: `a_${Date.now()}`,
      tuitionId: data.tuitionId,
      type: 'homework_added',
      description: `Homework assigned: ${data.chapter}`,
      timestamp: now,
    };
    set((s) => ({
      homework: [...s.homework, hw],
      activityLogs: [activity, ...s.activityLogs],
    }));
  },

  updateHomework: (id, data) =>
    set((s) => ({ homework: s.homework.map((h) => (h.id === id ? { ...h, ...data } : h)) })),

  deleteHomework: (id) =>
    set((s) => ({ homework: s.homework.filter((h) => h.id !== id) })),

  markHomeworkComplete: (id, completed) =>
    set((s) => ({ homework: s.homework.map((h) => (h.id === id ? { ...h, completed } : h)) })),

  addComment: (homeworkId, comment) => {
    const newComment: HomeworkComment = {
      ...comment,
      id: `cmt_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    set((s) => ({
      homework: s.homework.map((h) =>
        h.id === homeworkId ? { ...h, comments: [...h.comments, newComment] } : h
      ),
    }));
  },

  // ── Selectors ──
  getLogsForTuition: (tuitionId) =>
    get().classLogs.filter((l) => l.tuitionId === tuitionId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),

  getHomeworkForTuition: (tuitionId) =>
    get().homework.filter((h) => h.tuitionId === tuitionId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),

  getActivityForTuition: (tuitionId) =>
    get().activityLogs.filter((a) => a.tuitionId === tuitionId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),

  getTuitionById: (id) => get().tuitions.find((t) => t.id === id),

  getClassCountForMonth: (tuitionId, month) =>
    get().classLogs.filter((l) => l.tuitionId === tuitionId && l.date.startsWith(month)).length,
}));
