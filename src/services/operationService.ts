import { Notice, FeeRecord, LeaveApplication } from '../types';
import { FirestoreCollection } from './dbHelper';


const INITIAL_NOTICES: Notice[] = [];
const INITIAL_FEES: FeeRecord[] = [];
const INITIAL_RESULTS: any[] = [];
const INITIAL_LEAVES: LeaveApplication[] = [];

const noticeStore = new FirestoreCollection<Notice>('notices', INITIAL_NOTICES);
const feeStore = new FirestoreCollection<FeeRecord>('fees', INITIAL_FEES);
const resultStore = new FirestoreCollection<any>('results', INITIAL_RESULTS);
const leaveStore = new FirestoreCollection<LeaveApplication>('leaves', INITIAL_LEAVES);

export const operationService = {
  // ─── Notices ───
  async getNotices(): Promise<Notice[]> {
    return noticeStore.getAll();
  },

  async createNotice(data: Partial<Notice>): Promise<Notice> {
    const id = data.id || `not-${Date.now()}`;
    const notice: Notice = {
      id,
      title: data.title || 'New Notice',
      content: data.content || '',
      type: data.type || 'college',
      priority: data.priority || 'medium',
      publishedAt: new Date().toISOString().split('T')[0],
      publishedBy: data.publishedBy || 'Administration'
    };
    return noticeStore.add(notice);
  },

  async deleteNotice(id: string): Promise<void> {
    return noticeStore.remove(id);
  },

  // ─── Fees ───
  async getFees(studentId?: string): Promise<FeeRecord[]> {
    const all = await feeStore.getAll();
    return studentId ? all.filter(f => f.studentId === studentId) : all;
  },

  async createFee(data: Partial<FeeRecord>): Promise<FeeRecord> {
    const id = data.id || `fee-${Date.now()}`;
    const fee: FeeRecord = {
      id,
      studentId: data.studentId || 'std-1',
      studentName: data.studentName || 'Student Name',
      type: data.type || 'Semester Tuition Fee',
      amount: Number(data.amount) || 5000,
      status: data.status || 'pending',
      dueDate: data.dueDate || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      paidDate: data.paidDate,
      receiptNo: data.receiptNo
    };
    return feeStore.add(fee);
  },

  async updateFeeStatus(id: string, status: 'paid' | 'pending' | 'overdue'): Promise<void> {
    await feeStore.update(id, {
      status,
      paidDate: status === 'paid' ? new Date().toISOString().split('T')[0] : undefined,
      receiptNo: status === 'paid' ? `REC-${Date.now().toString().slice(-6)}` : undefined
    });
  },


  // ─── Results / Marks ───
  async getResults(studentId?: string): Promise<any[]> {
    const all = await resultStore.getAll();
    return studentId ? all.filter(r => !r.studentId || r.studentId === studentId) : all;
  },

  async saveResult(data: any): Promise<void> {
    const id = data.id || `res-${data.studentId || 'all'}-${data.subjectId || Date.now()}`;
    await resultStore.add({
      id,
      ...data,
      updatedAt: new Date().toISOString()
    });
  },

  // ─── Leave Applications ───
  async getLeaves(applicantId?: string): Promise<LeaveApplication[]> {
    const all = await leaveStore.getAll();
    return applicantId ? all.filter(l => l.applicantId === applicantId || (l as any).userId === applicantId) : all;
  },

  async applyLeave(data: Partial<LeaveApplication>): Promise<LeaveApplication> {
    const id = data.id || `leave-${Date.now()}`;
    const leave: LeaveApplication = {
      id,
      applicantId: data.applicantId || (data as any).userId || 'std-1',
      applicantName: data.applicantName || (data as any).userName || 'Applicant',
      type: data.type || 'casual',
      fromDate: data.fromDate || new Date().toISOString().split('T')[0],
      toDate: data.toDate || new Date().toISOString().split('T')[0],
      reason: data.reason || '',
      status: 'pending',
      appliedAt: new Date().toISOString().split('T')[0]
    };
    return leaveStore.add(leave);
  },

  async reviewLeave(id: string, status: 'approved' | 'rejected'): Promise<void> {
    await leaveStore.update(id, { status });
  },

  // ─── Settings ───
  async getSettings(): Promise<any> {
    const cached = localStorage.getItem('sis_settings');
    if (cached) {
      try { return JSON.parse(cached); } catch {}
    }
    const defaultSettings = {
      collegeName: 'National Institute of Technology & Science',
      collegeCode: 'NITS-2026',
      academicYear: '2025-2026',
      currentSemester: 'Odd Semester (Fall 2026)',
      emailNotifications: true,
      maintenanceMode: false
    };
    localStorage.setItem('sis_settings', JSON.stringify(defaultSettings));
    return defaultSettings;
  },

  async updateSettings(data: any): Promise<void> {
    const current = await this.getSettings();
    const updated = { ...current, ...data };
    localStorage.setItem('sis_settings', JSON.stringify(updated));
  }
};
