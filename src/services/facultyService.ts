import { Faculty } from '../types';
import { authService } from './authService';
import { FirestoreCollection } from './dbHelper';

const INITIAL_FACULTY: Faculty[] = [];

const collectionStore = new FirestoreCollection<Faculty>('faculty', INITIAL_FACULTY);

export const facultyService = {
  async getFaculty(): Promise<Faculty[]> {
    return collectionStore.getAll();
  },

  async getFacultyById(id: string): Promise<Faculty | null> {
    const faculty = await collectionStore.getById(id);
    if (faculty) return faculty;
    const all = await collectionStore.getAll();
    return all.find(f => f.id === id || f.email === id) || null;
  },

  async createFaculty(data: Partial<Faculty> & { password?: string }): Promise<Faculty> {
    const email = data.email || `faculty_${Date.now()}@sis.edu`;
    const password = data.password || 'faculty123';
    const name = data.name || 'New Faculty';

    const { uid } = await authService.createAccountByAdmin(email, password, 'faculty', name, data);

    const newFaculty: Faculty = {
      id: uid,
      name,
      email,
      phone: data.phone || '+91 98000 00000',
      department: data.department || 'Computer Science',
      designation: data.designation || 'Assistant Professor',
      experience: data.experience || '2 Years',
      subjects: data.subjects || ['Computer Fundamentals'],
      avatar: data.avatar || ''
    };

    return collectionStore.add(newFaculty);
  },

  async updateFaculty(id: string, data: Partial<Faculty>): Promise<Faculty> {
    return collectionStore.update(id, data);
  },

  async deleteFaculty(id: string): Promise<void> {
    return collectionStore.remove(id);
  }
};
