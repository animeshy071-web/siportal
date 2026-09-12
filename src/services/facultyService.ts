import { Faculty } from '../types';
import { authService } from './authService';
import { FirestoreCollection } from './dbHelper';
import api from './api';

const INITIAL_FACULTY: Faculty[] = [];

const collectionStore = new FirestoreCollection<Faculty>('faculty', INITIAL_FACULTY);

export const facultyService = {
  async getFaculty(): Promise<Faculty[]> {
    const local = await collectionStore.getAll();
    // Silent background sync with FastAPI backend if available
    api.get<any[]>('/admin/faculty')
      .then(res => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          res.data.forEach((f: any) => {
            const mapped: Faculty = {
              id: f.user_id || f.id,
              name: f.name,
              email: f.email,
              phone: f.phone || '',
              department: f.department || '',
              designation: f.designation || '',
              experience: f.experience || '',
              avatar: f.avatar || '',
              subjects: f.subjects || ['Computer Fundamentals']
            };
            collectionStore.add(mapped);
          });
        }
      })
      .catch(() => { /* offline / backend not running */ });
    return local;
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
      subjects: data.subjects && data.subjects.length > 0 ? data.subjects : ['Computer Fundamentals'],
      avatar: data.avatar || ''
    };

    // 1. Instant local persistence
    const saved = await collectionStore.add(newFaculty);

    // 2. Background sync with backend if running
    api.post('/admin/faculty', {
      name: newFaculty.name,
      email: newFaculty.email,
      phone: newFaculty.phone,
      department: newFaculty.department,
      designation: newFaculty.designation,
      experience: newFaculty.experience
    }).catch(() => { /* backend offline or standalone */ });

    return saved;
  },

  async updateFaculty(id: string, data: Partial<Faculty>): Promise<Faculty> {
    const res = await collectionStore.update(id, data);
    api.put(`/admin/faculty/${id}`, data).catch(() => {});
    return res;
  },

  async deleteFaculty(id: string): Promise<void> {
    await collectionStore.remove(id);
    api.delete(`/admin/faculty/${id}`).catch(() => {});
  }
};
