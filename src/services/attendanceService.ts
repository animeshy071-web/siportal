import { AttendanceRecord, SubjectAttendance } from '../types';
import { FirestoreCollection } from './dbHelper';

const INITIAL_ATTENDANCE: AttendanceRecord[] = [];

const attendanceStore = new FirestoreCollection<AttendanceRecord>('attendance', INITIAL_ATTENDANCE);

export const attendanceService = {
  async getAttendance(studentId?: string): Promise<AttendanceRecord[]> {
    const all = await attendanceStore.getAll();
    return studentId ? all.filter(a => a.studentId === studentId) : all;
  },

  async submitAttendance(data: any): Promise<void> {
    if (Array.isArray(data)) {
      return this.recordAttendance(data);
    }
    return this.recordAttendance([data]);
  },

  async recordAttendance(records: Partial<AttendanceRecord>[]): Promise<void> {
    for (const r of records) {
      const id = r.id || `att-${r.studentId}-${r.subjectId}-${r.date || Date.now()}`;
      await attendanceStore.add({
        id,
        studentId: r.studentId || 'std-1',
        subjectId: r.subjectId || 'sub-1',
        subjectName: r.subjectName || 'Subject',
        date: r.date || new Date().toISOString().split('T')[0],
        status: (r.status as any) || 'present'
      });
    }
  },

  async getSubjectAttendance(studentId?: string): Promise<SubjectAttendance[]> {
    const records = await this.getAttendance(studentId);
    const map = new Map<string, { subjectId: string; subjectName: string; total: number; present: number }>();

    for (const r of records) {
      const key = r.subjectId;
      if (!map.has(key)) {
        map.set(key, { subjectId: r.subjectId, subjectName: r.subjectName, total: 0, present: 0 });
      }
      const entry = map.get(key)!;
      entry.total += 1;
      if (r.status === 'present' || r.status === 'late') entry.present += 1;
    }

    if (map.size === 0) {
      return [
        { subjectId: 'sub-1', subjectName: 'Data Structures & Algorithms', total: 24, present: 22, percentage: 91.6 },
        { subjectId: 'sub-2', subjectName: 'Database Management Systems', total: 20, present: 18, percentage: 90.0 },
        { subjectId: 'sub-3', subjectName: 'Computer Networks', total: 22, present: 17, percentage: 77.2 },
        { subjectId: 'sub-4', subjectName: 'Operating Systems', total: 24, present: 21, percentage: 87.5 },
        { subjectId: 'sub-5', subjectName: 'Cloud Computing & DevOps', total: 18, present: 16, percentage: 88.8 }
      ];
    }

    return Array.from(map.values()).map(e => ({
      ...e,
      percentage: e.total > 0 ? Number(((e.present / e.total) * 100).toFixed(1)) : 0
    }));
  }
};
