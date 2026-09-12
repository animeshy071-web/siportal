import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentService } from '../../services/studentService';

import { SearchBar } from '../../components/SearchBar';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Student } from '../../types';
import { Plus, Pencil, Trash2, Eye, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { DEPARTMENTS, SEMESTERS, SECTIONS, BATCHES, GENDERS } from '../../constants';

const BLANK: Omit<Student, 'id'> = {
  name: '', email: '', rollNo: '', phone: '', department: 'Computer Science & Engineering',
  semester: 1, section: 'A', batch: '2024-2028', dob: '', gender: 'Male',
  address: '', parentName: '', parentPhone: '',
};

const PAGE_SIZE = 8;

export function AdminStudents() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<keyof Student>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<'add' | 'edit' | 'view' | null>(null);
  const [selected, setSelected] = useState<Student | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Student | null>(null);
  const [form, setForm] = useState<Omit<Student, 'id'>>(BLANK);
  const [newCredentials, setNewCredentials] = useState<{email: string, password: string, id: string} | null>(null);

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['adminStudents'],
    queryFn: () => studentService.getStudents()
  });


  const createMutation = useMutation({
    mutationFn: (newStudent: any) => studentService.createStudent(newStudent),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminStudents'] });
      queryClient.invalidateQueries({ queryKey: ['facultyStudents'] });
      setNewCredentials({
        email: data.email,
        password: 'student123',
        id: data.id,
      });
      setModal(null);
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to add student');
    }
  });

  const updateMutation = useMutation({
    mutationFn: (updatedStudent: any) => {
      const { id, ...data } = updatedStudent;
      return studentService.updateStudent(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminStudents'] });
      queryClient.invalidateQueries({ queryKey: ['facultyStudents'] });
      setModal(null);
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to update student');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => studentService.deleteStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminStudents'] });
      queryClient.invalidateQueries({ queryKey: ['facultyStudents'] });
      setConfirmDelete(null);
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to delete student');
    }
  });



  const sorted = useMemo(() => {
    const q = search.toLowerCase();
    return [...students]
      .filter((s: any) => 
        (s.name || '').toLowerCase().includes(q) || 
        (s.rollNo || s.roll_no || '').toLowerCase().includes(q) || 
        (s.department || '').toLowerCase().includes(q) || 
        (s.email || s.user?.email || '').toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const av = String(a[sortKey] ?? ''), bv = String(b[sortKey] ?? '');
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      });
  }, [students, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const sort = (key: keyof Student) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };
  const SortIcon = ({ k }: { k: keyof Student }) => sortKey === k
    ? (sortDir === 'asc' ? <ChevronUp className="h-3 w-3 inline ml-1" /> : <ChevronDown className="h-3 w-3 inline ml-1" />)
    : null;

  const openAdd = () => { setForm(BLANK); setModal('add'); };
  const openEdit = (s: any) => { 
    setSelected(s); 
    setForm({ 
      name: s.name, 
      email: s.email || s.user?.email || '', 
      rollNo: s.rollNo || s.roll_no || '', 
      phone: s.phone || '', 
      department: s.department || 'Computer Science & Engineering', 
      semester: Number(s.semester) || 1, 
      section: s.section || 'A', 
      batch: s.batch || '2024-28', 
      dob: s.dob || '', 
      gender: s.gender || 'Male', 
      address: s.address || '', 
      parentName: s.parentName || s.parent_name || '', 
      parentPhone: s.parentPhone || s.parent_phone || ''
    }); 
    setModal('edit'); 
  };
  const openView = (s: any) => { setSelected(s); setModal('view'); };

  const handleSave = () => {
    if (!form.name.trim()) { alert('Please enter student name.'); return; }
    if (!form.email.trim()) { alert('Please enter student email.'); return; }
    if (modal === 'add') {
      createMutation.mutate(form);
    }
    else if (modal === 'edit' && selected) {
      updateMutation.mutate({ ...form, id: selected.id || (selected as any).user_id });
    }
  };

  if (loadingStudents) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Student Management</h1>
          <p className="page-subtitle">View, add, edit, or remove students ({students.length} total)</p>
        </div>
        <div className="flex items-center gap-3">
          <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search students..." />
          <button className="btn-primary" onClick={openAdd}><Plus className="h-4 w-4" /> Add Student</button>
        </div>
      </div>

      <div className="card p-0">
        <div className="table-wrapper border-0">
          <table className="table-base">
            <thead className="table-head">
              <tr>
                <th className="px-4 py-3 cursor-pointer" onClick={() => sort('name')}>Student <SortIcon k="name" /></th>
                <th className="px-4 py-3 cursor-pointer" onClick={() => sort('rollNo')}>Roll No <SortIcon k="rollNo" /></th>
                <th className="px-4 py-3 cursor-pointer" onClick={() => sort('department')}>Department <SortIcon k="department" /></th>
                <th className="px-4 py-3 cursor-pointer" onClick={() => sort('semester')}>Sem / Sec <SortIcon k="semester" /></th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {paged.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-slate-400">No students found</td></tr>
              ) : paged.map((s: any) => (
                <tr key={s.id || s.user_id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      {s.avatar
                        ? <img src={s.avatar} className="h-8 w-8 rounded-full object-cover" alt={s.name} />
                        : <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-sm font-semibold text-indigo-700 dark:text-indigo-300">{s.name?.charAt(0)}</div>
                      }
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{s.name}</p>
                        <p className="text-xs text-slate-400">{s.email || s.user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell font-mono">{s.rollNo || s.roll_no}</td>
                  <td className="table-cell">{s.department}</td>
                  <td className="table-cell">Sem {s.semester} / {s.section}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      <button title="View" onClick={() => openView(s)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"><Eye className="h-4 w-4 text-slate-500" /></button>
                      <button title="Edit" onClick={() => openEdit(s)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"><Pencil className="h-4 w-4 text-slate-500" /></button>
                      <button title="Delete" onClick={() => setConfirmDelete(s)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 className="h-4 w-4 text-red-500" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500">Showing {Math.min((page-1)*PAGE_SIZE+1, sorted.length)}–{Math.min(page*PAGE_SIZE, sorted.length)} of {sorted.length}</p>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i+1)} className={`w-8 h-8 rounded-lg text-sm transition-colors ${page === i+1 ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>{i+1}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modal === 'add' || modal === 'edit'} onClose={() => setModal(null)} title={modal === 'add' ? 'Add New Student' : 'Edit Student'} size="lg"
        footer={<><button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn-primary" disabled={createMutation.isPending || updateMutation.isPending} onClick={handleSave}>{modal === 'add' ? (createMutation.isPending ? 'Adding...' : 'Add Student') : 'Save Changes'}</button></>}
      >
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Full Name</label><input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
          <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required /></div>
          <div><label className="label">Roll Number</label><input className="input" value={form.rollNo} onChange={e => setForm({...form, rollNo: e.target.value})} required /></div>
          <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
          <div>
            <label className="label">Department</label>
            <select className="input" value={form.department} onChange={e => setForm({...form, department: e.target.value})}>
              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Semester</label>
            <select className="input" value={form.semester} onChange={e => setForm({...form, semester: +e.target.value})}>
              {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Section</label>
            <select className="input" value={form.section} onChange={e => setForm({...form, section: e.target.value})}>
              {SECTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Batch</label>
            <select className="input" value={form.batch} onChange={e => setForm({...form, batch: e.target.value})}>
              {BATCHES.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div><label className="label">Date of Birth</label><input type="date" className="input" value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} /></div>
          <div>
            <label className="label">Gender</label>
            <select className="input" value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
              {GENDERS.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div className="col-span-2"><label className="label">Address</label><input className="input" value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
          <div><label className="label">Parent Name</label><input className="input" value={form.parentName} onChange={e => setForm({...form, parentName: e.target.value})} /></div>
          <div><label className="label">Parent Phone</label><input className="input" value={form.parentPhone} onChange={e => setForm({...form, parentPhone: e.target.value})} /></div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={modal === 'view'} onClose={() => setModal(null)} title="Student Details" size="lg"
        footer={<><button className="btn-secondary" onClick={() => setModal(null)}>Close</button><button className="btn-primary" onClick={() => { setModal('edit'); setForm({...selected!}); }}>Edit</button></>}
      >
        {selected && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            {([
              ['Name', selected.name], 
              ['Roll No', selected.rollNo || (selected as any).roll_no], 
              ['Email', selected.email || (selected as any).user?.email], 
              ['Phone', selected.phone], 
              ['Department', selected.department], 
              ['Semester', `Sem ${selected.semester}`], 
              ['Section', selected.section], 
              ['Batch', selected.batch], 
              ['DOB', selected.dob], 
              ['Gender', selected.gender], 
              ['Address', selected.address], 
              ['Parent', selected.parentName || (selected as any).parent_name], 
              ['Parent Phone', selected.parentPhone || (selected as any).parent_phone]
            ] as [string,string][]).map(([k,v]) => (
              <div key={k}>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{k}</p>
                <p className="text-slate-800 dark:text-slate-200 font-medium">{v || '—'}</p>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Student"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => { deleteMutation.mutate(confirmDelete?.id || (confirmDelete as any)?.user_id); setConfirmDelete(null); }}
        onClose={() => setConfirmDelete(null)}
      />


      {/* Success Dialog */}
      <Modal open={!!newCredentials} onClose={() => setNewCredentials(null)} title="Student Account Created" size="md"
        footer={<button className="btn-primary w-full" onClick={() => setNewCredentials(null)}>Done</button>}
      >
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 mb-4">
            <Eye className="h-6 w-6 text-emerald-600" />
          </div>
          <p className="text-sm text-slate-500 mb-2">The new student account has been created successfully. Please copy the credentials below. The student can use these to log in immediately.</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3 font-mono text-sm">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Username / Email:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{newCredentials?.email}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Temp Password:</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{newCredentials?.password}</span>
          </div>
        </div>
      </Modal>
    </div>
  );
}
