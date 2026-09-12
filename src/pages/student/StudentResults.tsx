import { useQuery } from '@tanstack/react-query';
import { operationService } from '../../services/operationService';
import { academicService } from '../../services/academicService';
import { useAuth } from '../../hooks/useAuth';
import { TrendingUp, Award, Loader2 } from 'lucide-react';

function getGrade(marks: number, max: number = 100) {
  const pct = (marks / max) * 100;
  if (pct >= 90) return { grade: 'O', color: 'text-emerald-600' };
  if (pct >= 80) return { grade: 'A+', color: 'text-green-600' };
  if (pct >= 70) return { grade: 'A', color: 'text-blue-600' };
  if (pct >= 60) return { grade: 'B+', color: 'text-indigo-600' };
  if (pct >= 50) return { grade: 'B', color: 'text-amber-600' };
  if (pct >= 40) return { grade: 'C', color: 'text-orange-600' };
  return { grade: 'F', color: 'text-red-600' };
}

export function StudentResults() {
  const { user } = useAuth();

  const { data: results = [], isLoading: loadingResults } = useQuery({
    queryKey: ['studentResults', user?.id],
    queryFn: () => operationService.getResults(user?.id)
  });

  const { data: subjectsList = [], isLoading: loadingSubjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => academicService.getSubjects()
  });

  const publishedMarks = results;

  const subjects = publishedMarks.map((r: any) => {
    const sub = subjectsList.find((s: any) => s.id === r.subjectId || s.id === r.subject_id);
    const internal = r.internalMarks ?? r.internal_marks ?? 0;
    const practical = r.practicalMarks ?? r.practical_marks ?? 0;
    const external = r.externalMarks ?? r.external_marks ?? 0;
    const total = internal + practical + external;
    const { grade, color } = getGrade(total);
    const pass = total >= 40;
    return {
      id: r.id,
      name: r.subjectName || r.subject_name || sub?.name || 'Subject',
      code: sub?.code || 'SUB',
      credits: sub?.credits || 3,
      internal,
      practical,
      external,
      total,
      grade,
      color,
      pass
    };
  });


  const totalMarks = subjects.reduce((s: number, sub: any) => s + sub.total, 0);
  const maxPossible = subjects.length * 100;
  const percentage = maxPossible > 0 ? Math.round((totalMarks / maxPossible) * 100) : 0;

  const sgpa = subjects.length > 0
    ? (subjects.reduce((s: number, sub: any) => {
        const pts = sub.grade === 'O' ? 10 : sub.grade === 'A+' ? 9 : sub.grade === 'A' ? 8 : sub.grade === 'B+' ? 7 : sub.grade === 'B' ? 6 : sub.grade === 'C' ? 5 : 0;
        return s + pts * sub.credits;
      }, 0) / subjects.reduce((s: number, sub: any) => s + sub.credits, 0)).toFixed(2)
    : '–';


  if (loadingResults || loadingSubjects) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Academic Results</h1>
          <p className="page-subtitle">Your semester-wise academic performance</p>
        </div>
      </div>

      {publishedMarks.length === 0 ? (
        <div className="card text-center py-16">
          <TrendingUp className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Results not yet published</p>
          <p className="text-slate-400 text-sm mt-1">Your faculty/admin will publish results after evaluation</p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card text-center">
              <div className="text-4xl font-bold text-indigo-600 mb-1">{sgpa}</div>
              <p className="text-slate-500 text-sm">SGPA</p>
            </div>
            <div className="card text-center">
              <div className="text-4xl font-bold text-emerald-600 mb-1">{percentage}%</div>
              <p className="text-slate-500 text-sm">Overall Percentage</p>
            </div>
            <div className="card text-center">
              <div className={`text-4xl font-bold mb-1 ${subjects.every((s: any) => s.pass) ? 'text-emerald-600' : 'text-red-500'}`}>
                {subjects.filter((s: any) => s.pass).length}/{subjects.length}
              </div>
              <p className="text-slate-500 text-sm">Subjects Passed</p>
            </div>
          </div>

          {/* Subject marks */}
          <div className="card">
            <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
              <Award className="h-4 w-4 text-indigo-600" /> Subject-wise Marks
            </h2>
            <div className="table-wrapper">
              <table className="table-base">
                <thead className="table-head">
                  <tr>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3 text-center">Internal (40)</th>
                    <th className="px-4 py-3 text-center">Practical (25)</th>
                    <th className="px-4 py-3 text-center">External (35)</th>
                    <th className="px-4 py-3 text-center">Total (100)</th>
                    <th className="px-4 py-3 text-center">Grade</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                  {subjects.map((sub: any) => (

                    <tr key={sub.id} className="table-row">
                      <td className="table-cell">
                        <p className="font-medium text-slate-800 dark:text-slate-200">{sub.name}</p>
                        <p className="text-xs text-slate-400">{sub.code}</p>
                      </td>
                      <td className="table-cell text-center">{sub.internal}</td>
                      <td className="table-cell text-center">{sub.practical}</td>
                      <td className="table-cell text-center">{sub.external}</td>
                      <td className="table-cell text-center font-semibold">{sub.total}</td>
                      <td className="table-cell text-center">
                        <span className={`text-lg font-bold ${sub.color}`}>{sub.grade}</span>
                      </td>
                      <td className="table-cell text-center">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sub.pass ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                          {sub.pass ? 'PASS' : 'FAIL'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

