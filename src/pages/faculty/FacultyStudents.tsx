import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { studentService } from '../../services/studentService';
import { attendanceService } from '../../services/attendanceService';
import { SearchBar } from '../../components/SearchBar';
import { Modal } from '../../components/Modal';
import { getAttendanceColor } from '../../utils';
import { Eye, Loader2 } from 'lucide-react';

export function FacultyStudents() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any | null>(null);

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['facultyStudents'],
    queryFn: () => studentService.getStudents()
  });

  const { data: attendanceRecords = [], isLoading: loadingAttendance } = useQuery({
    queryKey: ['attendance'],
    queryFn: () => attendanceService.getAttendance()
  });

  const isLoading = loadingStudents || loadingAttendance;

  const filtered = students.filter((s: any) =>
    (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.rollNo || s.roll_no || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.department || '').toLowerCase().includes(search.toLowerCase())
  );

  const getStudentAttendance = (studentId: string): number | null => {
    const studentRecs = attendanceRecords.filter((a: any) => a.studentId === studentId || a.student_id === studentId);
    if (studentRecs.length === 0) return null;
    const present = studentRecs.filter((a: any) => a.status === 'present' || a.status === 'late').length;
    return Math.round((present / studentRecs.length) * 100);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Students</h1>
          <p className="page-subtitle">{students.length} students in your assigned sections</p>
        </div>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name or roll no..." />
      </div>

      <div className="card p-0">
        <div className="table-wrapper border-0">
          <table className="table-base">
            <thead className="table-head">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Roll No</th>
                <th className="px-4 py-3">Section</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Avg Attendance</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 text-sm">
                    No students found
                  </td>
                </tr>
              ) : (
                filtered.map((s: any) => {
                  const avg = getStudentAttendance(s.id);
                  return (
                    <tr key={s.id} className="table-row">
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 font-semibold text-sm">{(s.name || 'S').charAt(0)}</div>
                          <div>
                            <p className="font-medium text-slate-800 dark:text-slate-200">{s.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell font-mono text-sm">{s.rollNo || s.roll_no}</td>
                      <td className="table-cell">{s.section || 'A'}</td>
                      <td className="table-cell">{s.department}</td>
                      <td className="table-cell">
                        {avg !== null ? (
                          <span className={`font-semibold ${getAttendanceColor(avg)}`}>{avg}%</span>
                        ) : (
                          <span className="text-slate-400 text-xs font-medium">—</span>
                        )}
                      </td>
                      <td className="table-cell">
                        <button onClick={() => setSelected(s)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                          <Eye className="h-4 w-4 text-slate-500" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Student Profile" size="lg"
        footer={<button className="btn-secondary" onClick={() => setSelected(null)}>Close</button>}
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-2xl font-bold text-indigo-700">{(selected.name || 'S').charAt(0)}</div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">{selected.name}</h3>
                <p className="text-slate-500">{selected.rollNo || selected.roll_no} · {selected.department} Sem {selected.semester}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              {[
                ['Email', selected.email],
                ['Section', selected.section || 'A'],
                ['Batch', selected.batch || '2022-2026'],
              ].map(([l, v]) => (
                <div key={l as string}>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">{l as string}</p>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-0.5">{v as string || '—'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

