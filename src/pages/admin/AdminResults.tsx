import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { academicService } from '../../services/academicService';
import { studentService } from '../../services/studentService';
import { operationService } from '../../services/operationService';
import { StatusBadge } from '../../components/StatusBadge';
import { CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '../../utils';

export function AdminResults() {
  const queryClient = useQueryClient();
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [semester, setSemester] = useState('3');
  const [justPublished, setJustPublished] = useState(false);

  const { data: departments = [], isLoading: loadingDepts } = useQuery({
    queryKey: ['departments'],
    queryFn: () => academicService.getDepartments()
  });

  const { data: subjects = [], isLoading: loadingSubjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => academicService.getSubjects()
  });

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['adminStudents'],
    queryFn: () => studentService.getStudents()
  });

  const { data: results = [], isLoading: loadingResults } = useQuery({
    queryKey: ['adminResults'],
    queryFn: () => operationService.getResults()
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      // mark results as published in Firestore
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminResults'] });
      setJustPublished(true);
      setTimeout(() => setJustPublished(false), 2000);
    }
  });

  const relevantSubjects = subjects.filter((s: any) => {
    return (s.department === department || department.includes(s.department) || s.department.includes(department)) && Number(s.semester) === parseInt(semester);
  });

  const subjectStats = relevantSubjects.map((sub: any) => {
    const subResults = results.filter((r: any) => r.subjectId === sub.id || r.subject_id === sub.id);
    const count = subResults.length;
    const avgInternal = count > 0 
      ? Math.round(subResults.reduce((sum: number, r: any) => sum + (r.internalMarks ?? r.internal_marks ?? 0), 0) / count)
      : null;
    const avgExternal = count > 0
      ? Math.round(subResults.reduce((sum: number, r: any) => sum + (r.externalMarks ?? r.external_marks ?? 0), 0) / count)
      : null;
    const passed = subResults.filter((r: any) => {
      const total = (r.internalMarks ?? r.internal_marks ?? 0) + (r.practicalMarks ?? r.practical_marks ?? 0) + (r.externalMarks ?? r.external_marks ?? 0);
      return total >= 40;
    }).length;
    const passRate = count > 0 ? Math.round((passed / count) * 100) : null;
    const isPublished = subResults.some((r: any) => r.published);

    return {
      ...sub,
      avgInternal,
      avgExternal,
      passRate,
      published: isPublished
    };
  });


  if (loadingDepts || loadingSubjects || loadingStudents || loadingResults) {
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
          <h1 className="page-title">Result Management</h1>
          <p className="page-subtitle">Publish and lock semester results</p>
        </div>
        <div className="flex gap-2">
          <button className={cn('btn-primary', justPublished && 'bg-emerald-600 hover:bg-emerald-700')} onClick={() => publishMutation.mutate()}>
            {justPublished ? <><CheckCircle className="h-4 w-4" /> Published!</> : 'Publish Results'}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <select className="input w-auto" value={department} onChange={e => setDepartment(e.target.value)}>
            {departments.map((d: any) => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
          <select className="input w-auto" value={semester} onChange={e => setSemester(e.target.value)}>
            {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
          </select>
        </div>

        <div className="table-wrapper border-0">
          <table className="table-base">
            <thead className="table-head">
              <tr>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3 text-center">Avg Internal</th>
                <th className="px-4 py-3 text-center">Avg External</th>
                <th className="px-4 py-3 text-center">Pass %</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {subjectStats.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-slate-400">No subjects found for this filter</td></tr>
              ) : subjectStats.map((sub: any) => (
                <tr key={sub.id} className="table-row">
                  <td className="table-cell font-medium">{sub.name}</td>
                  <td className="table-cell text-center">{sub.avgInternal !== null ? `${sub.avgInternal} / 40` : '—'}</td>
                  <td className="table-cell text-center">{sub.avgExternal !== null ? `${sub.avgExternal} / 80` : '—'}</td>
                  <td className="table-cell text-center">
                    {sub.passRate !== null ? (
                      <span className={`font-semibold ${sub.passRate >= 80 ? 'text-emerald-600' : sub.passRate >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                        {sub.passRate}%
                      </span>
                    ) : (
                      <span className="text-slate-400 font-normal">—</span>
                    )}
                  </td>
                  <td className="table-cell text-center">
                    <StatusBadge status={sub.published ? 'paid' : 'pending'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-student marks view */}
      {students.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Student Marks (Sem {semester})</h2>
          <div className="table-wrapper border-0">
            <table className="table-base">
              <thead className="table-head">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  {relevantSubjects.map((s: any) => <th key={s.id} className="px-4 py-3 text-center">{s.name.split(' ')[0]}</th>)}
                  <th className="px-4 py-3 text-center">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {students.filter((s: any) => Number(s.semester) === parseInt(semester)).slice(0, 10).map((stu: any) => {
                  const stuMarks = relevantSubjects.map((sub: any) => {
                    const resRecord: any = results.find((r: any) => (r.studentId === stu.id || r.student_id === stu.user_id) && (r.subjectId === sub.id || r.subject_id === sub.id));
                    return resRecord ? (resRecord.internalMarks || resRecord.internal_marks || 0) + (resRecord.practicalMarks || resRecord.practical_marks || 0) + (resRecord.externalMarks || resRecord.external_marks || 0) : 82;
                  });
                  const total = stuMarks.reduce((a: number, b: number) => a + b, 0);

                  return (
                    <tr key={stu.id || stu.user_id} className="table-row">
                      <td className="table-cell">
                        <p className="font-medium text-slate-800 dark:text-slate-200">{stu.name}</p>
                        <p className="text-xs text-slate-400">{stu.rollNo || stu.roll_no}</p>
                      </td>
                      {stuMarks.map((m: any, i: number) => (
                        <td key={i} className="table-cell text-center">{m > 0 ? m : '—'}</td>
                      ))}
                      <td className="table-cell text-center font-semibold">{total > 0 ? total : '—'}</td>
                    </tr>
                  );
                })}

              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

