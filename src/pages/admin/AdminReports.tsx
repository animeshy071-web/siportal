import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { studentService } from '../../services/studentService';
import { facultyService } from '../../services/facultyService';
import { operationService } from '../../services/operationService';
import { attendanceService } from '../../services/attendanceService';
import { FileText, Download, Loader2 } from 'lucide-react';

export function AdminReports() {
  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['adminStudents'],
    queryFn: () => studentService.getStudents()
  });

  const { data: faculty = [], isLoading: loadingFaculty } = useQuery({
    queryKey: ['adminFaculty'],
    queryFn: () => facultyService.getFaculty()
  });

  const { data: fees = [], isLoading: loadingFees } = useQuery({
    queryKey: ['fees'],
    queryFn: () => operationService.getFees()
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ['attendance'],
    queryFn: () => attendanceService.getAttendance()
  });

  const attendance75 = useMemo(() => {
    const map = new Map<string, { subjectId: string; subjectName: string; total: number; present: number }>();
    attendance.forEach((a: any) => {
      const subId = a.subjectId || a.subject_id;
      if (!subId) return;
      if (!map.has(subId)) {
        map.set(subId, { subjectId: subId, subjectName: a.subjectName || a.subject_name || 'Subject', total: 0, present: 0 });
      }
      const entry = map.get(subId)!;
      entry.total++;
      if (a.status === 'present' || a.status === 'late') entry.present++;
    });
    return Array.from(map.values())
      .map(e => ({ ...e, percentage: e.total > 0 ? Math.round((e.present / e.total) * 100) : 0 }))
      .filter(e => e.total > 0 && e.percentage < 75);
  }, [attendance]);

  const feeDefaulters = fees.filter((f: any) => f.status !== 'paid');

  const generateCSV = (headers: string[], rows: string[][]): void => {
    const content = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const reports = [
    {
      title: 'Student Attendance Defaulters',
      desc: `${attendance75.length} subjects below 75%`,
      type: 'attendance',
      count: attendance75.length,
      download: () => generateCSV(
        ['Subject ID', 'Subject Name', 'Total Classes', 'Present', 'Percentage'],
        attendance75.map(a => [a.subjectId, a.subjectName, String(a.total), String(a.present), `${a.percentage}%`])
      ),
    },
    {
      title: 'Fee Defaulters',
      desc: `${feeDefaulters.length} pending/overdue payments`,
      type: 'finance',
      count: feeDefaulters.length,
      download: () => generateCSV(
        ['Student ID', 'Fee Type', 'Amount', 'Status', 'Due Date'],
        feeDefaulters.map((f: any) => [f.studentId || f.student_id, f.type, `₹${f.amount}`, f.status, f.dueDate || f.due_date])
      ),
    },
    {
      title: 'All Students List',
      desc: `${students.length} students enrolled`,
      type: 'academic',
      count: students.length,
      download: () => generateCSV(
        ['Name', 'Roll No', 'Department', 'Semester', 'Email', 'Phone'],
        students.map((s: any) => [s.name, s.rollNo || s.roll_no, s.department, String(s.semester), s.email, s.phone || ''])
      ),
    },
    {
      title: 'Faculty Workload Report',
      desc: `${faculty.length} faculty members`,
      type: 'administrative',
      count: faculty.length,
      download: () => generateCSV(
        ['Name', 'Department', 'Designation', 'Experience'],
        faculty.map((f: any) => [f.name, f.department, f.designation, f.experience || ''])
      ),
    },
  ];


  if (loadingStudents || loadingFaculty || loadingFees) {
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
          <h1 className="page-title">System Reports</h1>
          <p className="page-subtitle">Generate and download administrative reports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((r, i) => (
          <div key={i} className="card flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex-shrink-0">
              <FileText className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">{r.title}</h3>
              <p className="text-sm text-slate-500 mt-1">{r.desc}</p>
              <div className="flex items-center gap-3 mt-3">
                <span className="text-2xl font-bold text-indigo-600">{r.count}</span>
                <button onClick={r.download} className="text-sm text-indigo-600 hover:underline flex items-center gap-1 font-medium">
                  <Download className="h-4 w-4" /> Download CSV
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
