import { Department, Subject, TimetableSlot } from '../types';
import { FirestoreCollection } from './dbHelper';

const INITIAL_DEPARTMENTS: Department[] = [];
const INITIAL_SUBJECTS: Subject[] = [];
const INITIAL_TIMETABLE: TimetableSlot[] = [];

const deptStore = new FirestoreCollection<Department>('departments', INITIAL_DEPARTMENTS);
const subjectStore = new FirestoreCollection<Subject>('subjects', INITIAL_SUBJECTS);
const timetableStore = new FirestoreCollection<TimetableSlot>('timetable', INITIAL_TIMETABLE);

export const academicService = {
  // ─── Departments ───
  async getDepartments(): Promise<Department[]> {
    return deptStore.getAll();
  },

  async createDepartment(data: Partial<Department>): Promise<Department> {
    const id = data.id || `dept-${Date.now()}`;
    const dept: Department = {
      id,
      name: data.name || 'New Department',
      code: data.code || 'DEPT',
      hod: data.hod || 'TBD',
      totalStudents: Number(data.totalStudents) || 0,
      totalFaculty: Number(data.totalFaculty) || 0
    };
    return deptStore.add(dept);
  },

  async updateDepartment(id: string, data: Partial<Department>): Promise<Department> {
    return deptStore.update(id, data);
  },

  async deleteDepartment(id: string): Promise<void> {
    return deptStore.remove(id);
  },

  // ─── Subjects ───
  async getSubjects(): Promise<Subject[]> {
    return subjectStore.getAll();
  },

  async createSubject(data: Partial<Subject>): Promise<Subject> {
    const id = data.id || `sub-${Date.now()}`;
    const sub: Subject = {
      id,
      name: data.name || 'New Subject',
      code: data.code || 'CS000',
      credits: Number(data.credits) || 3,
      department: data.department || 'Computer Science',
      semester: Number(data.semester) || 1,
      facultyId: data.facultyId || '',
      facultyName: data.facultyName || 'TBD'
    };
    return subjectStore.add(sub);
  },

  async updateSubject(id: string, data: Partial<Subject>): Promise<Subject> {
    return subjectStore.update(id, data);
  },

  async deleteSubject(id: string): Promise<void> {
    return subjectStore.remove(id);
  },

  // ─── Timetable ───
  async getTimetable(): Promise<TimetableSlot[]> {
    return timetableStore.getAll();
  },

  async createTimetableSlot(data: Partial<TimetableSlot>): Promise<TimetableSlot> {
    const id = data.id || `tt-${Date.now()}`;
    const slot: TimetableSlot = {
      id,
      day: data.day || 'Monday',
      startTime: data.startTime || '09:00',
      endTime: data.endTime || '10:00',
      subjectId: data.subjectId || '',
      subjectName: data.subjectName || 'Subject',
      facultyName: data.facultyName || 'Faculty',
      room: data.room || 'Room 101',
      department: data.department || 'Computer Science',
      semester: Number(data.semester) || 1
    };
    return timetableStore.add(slot);
  },

  async updateTimetableSlot(id: string, data: Partial<TimetableSlot>): Promise<TimetableSlot> {
    return timetableStore.update(id, data);
  },

  async deleteTimetableSlot(id: string): Promise<void> {
    return timetableStore.remove(id);
  }
};
