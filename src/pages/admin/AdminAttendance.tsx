import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { academicService } from '../../services/academicService';
import { facultyService } from '../../services/facultyService';
import { attendanceService } from '../../services/attendanceService';
import { SearchBar } from '../../components/SearchBar';
import { StatusBadge } from '../../components/StatusBadge';
import { getAttendanceColor } from '../../utils';
import { Loader2 } from 'lucide-react';

export function AdminAttendance() {
  const [search, setSearch] = useState('');

  const { data: subjects = [], isLoading: loadingSubjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => academicService.getSubjects()
  });

  const { data: faculty = [], isLoading: loadingFaculty } = useQuery({
    queryKey: ['adminFaculty'],
    queryFn: () => facultyService.getFaculty()
  });

  const { data: attendanceRecords = [], isLoading: loadingAttendance } = useQuery({
    queryKey: ['adminAttendanceRecords'],
    queryFn: () => attendanceService.getAttendance()
  });

  // Calculate real subject-wise aggregated attendance from actual records
  const subjectAttendance = subjects.map((sub: any) => {
    const records = attendanceRecords.filter((a: any) => a.subjectId === sub.id || a.subject_id === sub.id);
    const total = records.length;
    const present = records.filter((a: any) => a.status === 'present').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    return {
      subjectId: sub.id,
      subjectName: sub.name,
      total,
      present,
      percentage
    };
  });


  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return subjectAttendance.filter((sa: any) => sa.subjectName.toLowerCase().includes(q));
  }, [subjectAttendance, search]);

  if (loadingSubjects || loadingFaculty || loadingAttendance) {
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
          <h1 className="page-title">Attendance Management</h1>
          <p className="page-subtitle">Department-wide attendance tracking and defaulter reports</p>
        </div>
        <SearchBar value={search} onChange={setSearch} placeholder="Filter by subject name..." />
      </div>

      <div className="card p-0">
        <div className="table-wrapper border-0">
          <table className="table-base">
            <thead className="table-head">
              <tr>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Faculty</th>
                <th className="px-4 py-3 text-right">Records Marked</th>
                <th className="px-4 py-3 text-right">Present</th>
                <th className="px-4 py-3 text-right">Avg Attendance</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400 text-sm">
                    No subjects or attendance data found
                  </td>
                </tr>
              ) : (
                filtered.map((sa: any) => {
                  const sub = subjects.find((s: any) => s.id === sa.subjectId);
                  const fac = faculty.find((f: any) => f.id === sub?.facultyId || f.user_id === (sub as any)?.faculty_id);
                  return (

                  <tr key={sa.subjectId} className="table-row">
                    <td className="table-cell font-medium">{sa.subjectName}</td>
                    <td className="table-cell">{fac?.name ?? '–'}</td>
                    <td className="table-cell text-right">{sa.total}</td>
                    <td className="table-cell text-right">{sa.present}</td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${sa.percentage >= 75 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${sa.percentage}%` }} />
                        </div>
                        <span className={`font-semibold ${getAttendanceColor(sa.percentage)}`}>{sa.percentage}%</span>
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View detailed student attendance */}
      <div className="card">
        <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Live Attendance Logs ({attendanceRecords.length})</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {attendanceRecords.length === 0 ? (
            <div className="flex justify-center items-center h-24 text-slate-400">
              No attendance records logged yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {attendanceRecords.map((rec: any) => (
                <div key={rec.id} className="py-2 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{rec.student_name || rec.student_id}</span>
                    <span className="text-slate-400 text-xs ml-2">({rec.subject_name || rec.subject_id})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">{rec.date}</span>
                    <StatusBadge status={rec.status === 'present' ? 'paid' : rec.status === 'late' ? 'pending' : 'overdue'} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

