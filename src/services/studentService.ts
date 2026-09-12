import { Student } from '../types';
import { authService } from './authService';
import { FirestoreCollection } from './dbHelper';
import api from './api';

const INITIAL_STUDENTS: Student[] = [];

const collectionStore = new FirestoreCollection<Student>('students', INITIAL_STUDENTS);

export const studentService = {
  async getStudents(): Promise<Student[]> {
    const local = await collectionStore.getAll();
    // Silent background sync with FastAPI backend if available
    api.get<any[]>('/admin/students')
      .then(res => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          res.data.forEach((s: any) => {
            const mapped: Student = {
              id: s.user_id || s.id,
              name: s.name,
              email: s.email,
              rollNo: s.roll_no || s.rollNo || '',
              phone: s.phone || '',
              department: s.department || '',
              semester: Number(s.semester) || 1,
              section: s.section || 'A',
              batch: s.batch || '2024-2028',
              dob: s.dob || '',
              gender: s.gender || 'Male',
              address: s.address || '',
              parentName: s.parent_name || s.parentName || '',
              parentPhone: s.parent_phone || s.parentPhone || '',
              avatar: s.avatar || ''
            };
            collectionStore.add(mapped);
          });
        }
      })
      .catch(() => { /* offline / backend not running */ });
    return local;
  },

  async getStudentById(id: string): Promise<Student | null> {
    const student = await collectionStore.getById(id);
    if (student) return student;
    const all = await collectionStore.getAll();
    return all.find(s => s.id === id || s.email === id) || null;
  },

  async createStudent(data: Partial<Student> & { password?: string }): Promise<Student> {
    const email = data.email || `student_${Date.now()}@sis.edu`;
    const password = data.password || 'student123';
    const name = data.name || 'New Student';
    
    const { uid } = await authService.createAccountByAdmin(email, password, 'student', name, data);
    
    const newStudent: Student = {
      id: uid,
      name,
      email,
      rollNo: data.rollNo || `24CS${Math.floor(100 + Math.random() * 900)}`,
      phone: data.phone || '+91 90000 00000',
      department: data.department || 'Computer Science & Engineering',
      semester: Number(data.semester) || 1,
      section: data.section || 'A',
      batch: data.batch || '2024-2028',
      dob: data.dob || '2005-01-01',
      gender: data.gender || 'Male',
      address: data.address || '',
      parentName: data.parentName || '',
      parentPhone: data.parentPhone || '',
      avatar: data.avatar || ''
    };

    // 1. Instant local persistence
    const saved = await collectionStore.add(newStudent);

    // 2. Background sync with backend if running
    api.post('/admin/students', {
      name: newStudent.name,
      email: newStudent.email,
      roll_no: newStudent.rollNo,
      phone: newStudent.phone,
      department: newStudent.department,
      semester: newStudent.semester,
      section: newStudent.section,
      batch: newStudent.batch,
      dob: newStudent.dob,
      gender: newStudent.gender,
      address: newStudent.address,
      parent_name: newStudent.parentName,
      parent_phone: newStudent.parentPhone
    }).catch(() => { /* backend offline or standalone */ });

    return saved;
  },

  async updateStudent(id: string, data: Partial<Student>): Promise<Student> {
    const res = await collectionStore.update(id, data);
    api.put(`/admin/students/${id}`, {
      ...data,
      roll_no: data.rollNo,
      parent_name: data.parentName,
      parent_phone: data.parentPhone
    }).catch(() => {});
    return res;
  },

  async deleteStudent(id: string): Promise<void> {
    await collectionStore.remove(id);
    api.delete(`/admin/students/${id}`).catch(() => {});
  }
};
