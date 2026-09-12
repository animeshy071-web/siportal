import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { facultyService } from '../../services/facultyService';

import { SearchBar } from '../../components/SearchBar';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Faculty } from '../../types';
import { Plus, Pencil, Trash2, Eye, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { DEPARTMENTS, DESIGNATIONS, EXPERIENCE_OPTIONS } from '../../constants';

const BLANK: Omit<Faculty, 'id'> = {
  name: '', email: '', phone: '', department: 'Computer Science & Engineering',
  designation: 'Assistant Professor', experience: '1–3 Years', subjects: [],
};
const PAGE_SIZE = 8;

export function AdminFaculty() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<keyof Faculty>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<'add' | 'edit' | 'view' | null>(null);
  const [selected, setSelected] = useState<Faculty | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Faculty | null>(null);
  const [form, setForm] = useState<Omit<Faculty, 'id'>>(BLANK);
  const [subjectInput, setSubjectInput] = useState('');
  const [newCredentials, setNewCredentials] = useState<{email: string, password: string, id: string} | null>(null);

  const { data: faculty = [], isLoading: loadingFaculty } = useQuery({
    queryKey: ['adminFaculty'],
    queryFn: () => facultyService.getFaculty()
  });



  const createMutation = useMutation({
    mutationFn: (newFaculty: any) => facultyService.createFaculty(newFaculty),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminFaculty'] });
      queryClient.invalidateQueries({ queryKey: ['faculty'] });
      setNewCredentials({
        email: data.email,
        password: 'faculty123',
        id: data.id,
      });
      setModal(null);
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to add faculty member');
    }
  });

  const updateMutation = useMutation({
    mutationFn: (updatedFaculty: any) => {
      const { id, ...data } = updatedFaculty;
      return facultyService.updateFaculty(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFaculty'] });
      queryClient.invalidateQueries({ queryKey: ['faculty'] });
      setModal(null);
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to update faculty member');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => facultyService.deleteFaculty(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFaculty'] });
      queryClient.invalidateQueries({ queryKey: ['faculty'] });
      setConfirmDelete(null);
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to delete faculty member');
    }
  });

  const sorted = useMemo(() => {
    const q = search.toLowerCase();
    return [...faculty]
      .filter((f: any) => 
        (f.name || '').toLowerCase().includes(q) || 
        (f.department || '').toLowerCase().includes(q) || 
        (f.email || f.user?.email || '').toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const av = String(a[sortKey] ?? ''), bv = String(b[sortKey] ?? '');
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      });
  }, [faculty, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const sort = (key: keyof Faculty) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };
  const SortIcon = ({ k }: { k: keyof Faculty }) => sortKey === k
    ? (sortDir === 'asc' ? <ChevronUp className="h-3 w-3 inline ml-1" /> : <ChevronDown className="h-3 w-3 inline ml-1" />)
    : null;

  const openAdd = () => { setForm(BLANK); setModal('add'); };
  const openEdit = (f: any) => { 
    setSelected(f); 
    setForm({ 
      name: f.name, 
      email: f.email || f.user?.email || '', 
      phone: f.phone || '', 
      department: f.department || 'Computer Science & Engineering', 
      designation: f.designation || 'Assistant Professor', 
      experience: f.experience || '2 Years', 
      subjects: f.subjects || [] 
    }); 
    setModal('edit'); 
  };
  const openView = (f: any) => { setSelected(f); setModal('view'); };

  const addSubject = () => {
    if (subjectInput.trim() && !form.subjects.includes(subjectInput.trim())) {
      setForm({ ...form, subjects: [...form.subjects, subjectInput.trim()] });
      setSubjectInput('');
    }
  };
  const removeSubject = (s: string) => {
    setForm({ ...form, subjects: form.subjects.filter(x => x !== s) });
  };

  const handleSave = () => {
    if (!form.name.trim()) { alert('Please enter faculty name.'); return; }
    if (!form.email.trim()) { alert('Please enter faculty email.'); return; }
    if (modal === 'add') {
      createMutation.mutate(form);
    }
    else if (modal === 'edit' && selected) {
      updateMutation.mutate({ ...form, id: selected.id || (selected as any).user_id });
    }
  };

  if (loadingFaculty) {
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
          <h1 className="page-title">Faculty Management</h1>
          <p className="page-subtitle">View, add, edit, or remove faculty members ({faculty.length} total)</p>
        </div>
        <div className="flex items-center gap-3">
          <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search faculty..." />
          <button className="btn-primary" onClick={openAdd}><Plus className="h-4 w-4" /> Add Faculty</button>
        </div>
      </div>

      <div className="card p-0">
        <div className="table-wrapper border-0">
          <table className="table-base">
            <thead className="table-head">
              <tr>
                <th className="px-4 py-3 cursor-pointer" onClick={() => sort('name')}>Faculty <SortIcon k="name" /></th>
                <th className="px-4 py-3 cursor-pointer" onClick={() => sort('department')}>Department <SortIcon k="department" /></th>
                <th className="px-4 py-3 cursor-pointer" onClick={() => sort('designation')}>Designation <SortIcon k="designation" /></th>
                <th className="px-4 py-3">Experience</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {paged.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-slate-400">No faculty found</td></tr>
              ) : paged.map((f: any) => (
                <tr key={f.id || f.user_id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      {f.avatar
                        ? <img src={f.avatar} className="h-8 w-8 rounded-full object-cover" alt={f.name} />
                        : <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-sm font-semibold text-indigo-700 dark:text-indigo-300">{f.name?.charAt(0)}</div>
                      }
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{f.name}</p>
                        <p className="text-xs text-slate-400">{f.email || f.user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">{f.department}</td>
                  <td className="table-cell">{f.designation}</td>
                  <td className="table-cell">{f.experience}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      <button title="View" onClick={() => openView(f)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"><Eye className="h-4 w-4 text-slate-500" /></button>
                      <button title="Edit" onClick={() => openEdit(f)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"><Pencil className="h-4 w-4 text-slate-500" /></button>
                      <button title="Delete" onClick={() => setConfirmDelete(f)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 className="h-4 w-4 text-red-500" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500">Showing {Math.min((page-1)*PAGE_SIZE+1, sorted.length)}–{Math.min(page*PAGE_SIZE, sorted.length)} of {sorted.length}</p>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i+1)} className={`w-8 h-8 rounded-lg text-sm transition-colors ${page === i+1 ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>{i+1}</button>
            ))}
          </div>
        </div>
      </div>

      <Modal open={modal === 'add' || modal === 'edit'} onClose={() => setModal(null)} title={modal === 'add' ? 'Add New Faculty' : 'Edit Faculty'} size="lg"
        footer={<><button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn-primary" disabled={createMutation.isPending || updateMutation.isPending} onClick={handleSave}>{modal === 'add' ? (createMutation.isPending ? 'Adding...' : 'Add Faculty') : 'Save Changes'}</button></>}
      >
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Full Name</label><input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
          <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required /></div>
          <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
          <div>
            <label className="label">Department</label>
            <select className="input" value={form.department} onChange={e => setForm({...form, department: e.target.value})}>
              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Designation</label>
            <select className="input" value={form.designation} onChange={e => setForm({...form, designation: e.target.value})}>
              {DESIGNATIONS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Experience</label>
            <select className="input" value={form.experience} onChange={e => setForm({...form, experience: e.target.value})}>
              {EXPERIENCE_OPTIONS.map(e => <option key={e}>{e}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Subjects Taught</label>
            <div className="flex gap-2 mb-2">
              <input className="input" value={subjectInput} onChange={e => setSubjectInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSubject())} placeholder="Type subject and press Add" />
              <button type="button" className="btn-secondary" onClick={addSubject}>Add</button>
            </div>
            <div className="flex flex-wrap gap-1">
              {form.subjects?.map(s => (
                <span key={s} className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-full text-xs flex items-center gap-1">
                  {s}
                  <button type="button" onClick={() => removeSubject(s)} className="text-indigo-400 hover:text-indigo-600">×</button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <Modal open={modal === 'view'} onClose={() => setModal(null)} title="Faculty Details" size="lg"
        footer={<><button className="btn-secondary" onClick={() => setModal(null)}>Close</button><button className="btn-primary" onClick={() => { setModal('edit'); setForm({...selected!}); }}>Edit</button></>}
      >
        {selected && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            {([
              ['Name', selected.name], 
              ['Email', selected.email || (selected as any).user?.email], 
              ['Phone', selected.phone], 
              ['Department', selected.department], 
              ['Designation', selected.designation], 
              ['Experience', selected.experience]
            ] as [string,string][]).map(([k,v]) => (
              <div key={k}>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{k}</p>
                <p className="text-slate-800 dark:text-slate-200 font-medium">{v || '—'}</p>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Faculty Member"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => { deleteMutation.mutate(confirmDelete?.id || (confirmDelete as any)?.user_id); setConfirmDelete(null); }}
        onClose={() => setConfirmDelete(null)}
      />

      <Modal open={!!newCredentials} onClose={() => setNewCredentials(null)} title="Faculty Account Created" size="md"
        footer={<button className="btn-primary w-full" onClick={() => setNewCredentials(null)}>Done</button>}
      >
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 mb-4">
            <Eye className="h-6 w-6 text-emerald-600" />
          </div>
          <p className="text-sm text-slate-500 mb-2">The new faculty account has been created successfully. The faculty member can use these credentials to log in immediately.</p>
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
