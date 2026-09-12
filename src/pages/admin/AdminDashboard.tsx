import { useQuery } from '@tanstack/react-query';
import { studentService } from '../../services/studentService';
import { facultyService } from '../../services/facultyService';
import { operationService } from '../../services/operationService';
import { assignmentService } from '../../services/assignmentService';
import { attendanceService } from '../../services/attendanceService';
import { DashboardCard } from '../../components/DashboardCard';
import { Users, GraduationCap, CalendarCheck, ClipboardList, ArrowRight, Loader2, UserPlus, FilePlus, CheckSquare, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AdminDashboard() {
  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['adminStudents'],
    queryFn: () => studentService.getStudents()
  });

  const { data: faculty = [], isLoading: loadingFaculty } = useQuery({
    queryKey: ['adminFaculty'],
    queryFn: () => facultyService.getFaculty()
  });

  const { data: notices = [], isLoading: loadingNotices } = useQuery({
    queryKey: ['notices'],
    queryFn: () => operationService.getNotices()
  });

  const { data: assignments = [], isLoading: loadingAssignments } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => assignmentService.getAssignments()
  });

  const { data: attendance = [], isLoading: loadingAttendance } = useQuery({
    queryKey: ['attendance'],
    queryFn: () => attendanceService.getAttendance()
  });

  const isLoading = loadingStudents || loadingFaculty || loadingNotices || loadingAssignments || loadingAttendance;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const studentCount = students.length;
  const facultyCount = faculty.length;
  const pendingAssignmentsCount = assignments.filter((a: any) => !a.status || a.status === 'pending' || a.status === 'active').length;

  const attendanceRate = attendance.length > 0
    ? `${Math.round((attendance.filter((a: any) => a.status === 'present').length / attendance.length) * 100)}%`
    : '0%';

  // Department counts
  const deptMap: Record<string, number> = {};
  students.forEach((s: any) => {
    const dept = s.department || 'General';
    deptMap[dept] = (deptMap[dept] || 0) + 1;
  });

  const deptColors = ['bg-blue-600', 'bg-indigo-500', 'bg-violet-500', 'bg-sky-400', 'bg-emerald-500'];
  const deptEntries = Object.entries(deptMap);

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-10">
      {/* Top Title & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Overview of institute operations, attendance, and activity.</p>
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard 
          title="Total Students" 
          value={studentCount.toLocaleString()} 
          icon={GraduationCap} 
          subtitle="Enrolled students"
          colorClass="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <DashboardCard 
          title="Total Faculty" 
          value={facultyCount.toLocaleString()} 
          icon={Users} 
          subtitle="Teaching faculty"
          colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
        />
        <DashboardCard 
          title="Attendance Today" 
          value={attendanceRate} 
          icon={CalendarCheck} 
          subtitle="Overall presence"
          colorClass="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
        />
        <DashboardCard 
          title="Active Assignments" 
          value={pendingAssignmentsCount.toString()} 
          icon={ClipboardList} 
          subtitle="Pending submissions"
          colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
        />
      </div>

      {/* Middle Row: Attendance Chart + Department Donut Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Overview Chart */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Attendance Overview</h2>
              <p className="text-xs text-slate-400 mt-0.5">Weekly student presence analysis</p>
            </div>
            <select className="text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none">
              <option>This Week</option>
              <option>Last Week</option>
              <option>This Month</option>
            </select>
          </div>

          {attendance.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
              <CalendarCheck className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No attendance data recorded yet</p>
              <p className="text-xs text-slate-400 mt-1">Mark attendance from the Attendance page to populate charts.</p>
              <Link to="/admin/attendance" className="mt-3 text-xs font-semibold text-blue-600 hover:underline">
                Mark Attendance →
              </Link>
            </div>
          ) : (
            <div className="h-64 w-full relative flex flex-col justify-end">
              <div className="flex justify-between items-end h-48 px-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <div key={day} className="flex flex-col items-center gap-2">
                    <div className="w-8 bg-blue-500/20 rounded-t-md h-24 hover:bg-blue-600 transition-colors" />
                    <span className="text-xs text-slate-400 font-medium">{day}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Students by Department Breakdown */}
        <div className="card flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Students by Department</h2>
            
            {studentCount === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <GraduationCap className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="font-semibold text-slate-600 dark:text-slate-300 text-sm">No students registered</p>
                <p className="mt-1">Add students to see departmental distribution.</p>
                <Link to="/admin/students" className="mt-3 inline-block text-xs font-semibold text-blue-600 hover:underline">
                  Add Student →
                </Link>
              </div>
            ) : (
              <div>
                <div className="flex justify-center items-center relative py-4">
                  <div className="w-36 h-36 rounded-full border-8 border-blue-500/20 flex flex-col items-center justify-center">
                    <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{studentCount}</span>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Total</span>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-700/60">
                  {deptEntries.map(([deptName, count], idx) => {
                    const pct = Math.round((count / studentCount) * 100);
                    return (
                      <div key={deptName} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate max-w-[180px]">
                          <span className={`w-2.5 h-2.5 rounded-full ${deptColors[idx % deptColors.length]}`} />
                          <span className="font-medium text-slate-600 dark:text-slate-300 truncate">{deptName}</span>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">{pct}% ({count})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Notices + Upcoming Events + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Notices */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Notices</h2>
            <Link to="/admin/notices" className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {notices.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No notices published yet.</p>
            ) : (
              notices.slice(0, 3).map((n: any) => (
                <div key={n.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{n.title}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{n.publishedAt || 'Today'}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 flex-shrink-0">
                    New
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Events from Notices */}
        <div className="card">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">Upcoming Events</h2>
          <div className="space-y-3">
            {notices.filter((n: any) => n.type === 'exam' || n.type === 'college').length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <Calendar className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p>No upcoming events scheduled.</p>
              </div>
            ) : (
              notices.filter((n: any) => n.type === 'exam' || n.type === 'college').slice(0, 3).map((ev: any) => (
                <div key={ev.id} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                  <div className="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex flex-col items-center justify-center font-extrabold flex-shrink-0 leading-tight">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{ev.title}</p>
                    <p className="text-[11px] text-slate-400">{ev.publishedAt || 'Upcoming'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="card flex flex-col justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/admin/students" className="w-full py-3 px-4 rounded-full bg-gradient-to-r from-blue-700 to-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-[0.99]">
              <UserPlus className="h-4 w-4" /> Add Student
            </Link>
            <Link to="/admin/faculty" className="w-full py-3 px-4 rounded-full bg-gradient-to-r from-blue-700 to-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-[0.99]">
              <UserPlus className="h-4 w-4" /> Add Faculty
            </Link>
            <Link to="/admin/attendance" className="w-full py-3 px-4 rounded-full bg-gradient-to-r from-blue-700 to-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-[0.99]">
              <CheckSquare className="h-4 w-4" /> Mark Attendance
            </Link>
            <Link to="/admin/notices" className="w-full py-3 px-4 rounded-full bg-gradient-to-r from-blue-700 to-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-[0.99]">
              <FilePlus className="h-4 w-4" /> Create Notice
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
