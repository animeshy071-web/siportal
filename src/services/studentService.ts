import { Student } from '../types';
import { authService } from './authService';
import { FirestoreCollection } from './dbHelper';

const INITIAL_STUDENTS: Student[] = [];

const collectionStore = new FirestoreCollection<Student>('students', INITIAL_STUDENTS);

export const studentService = {
  async getStudents(): Promise<Student[]> {
    return collectionStore.getAll();
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

    return collectionStore.add(newStudent);
  },

  async updateStudent(id: string, data: Partial<Student>): Promise<Student> {
    return collectionStore.update(id, data);
  },

  async deleteStudent(id: string): Promise<void> {
    return collectionStore.remove(id);
  }
};
