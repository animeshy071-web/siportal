import { useQuery } from '@tanstack/react-query';
import { operationService } from '../../services/operationService';
import { assignmentService } from '../../services/assignmentService';
import { academicService } from '../../services/academicService';
import { attendanceService } from '../../services/attendanceService';
import { useAuth } from '../../hooks/useAuth';
import { DashboardCard } from '../../components/DashboardCard';
import { StatusBadge } from '../../components/StatusBadge';
import {
  CalendarCheck, ClipboardList, CreditCard, Bell,
  TrendingUp, Clock, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate } from '../../utils';

export function StudentDashboard() {
  const { user } = useAuth();

  const { data: notices = [] } = useQuery({
    queryKey: ['notices'],
    queryFn: () => operationService.getNotices()
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => assignmentService.getAssignments()
  });

  const { data: timetable = [] } = useQuery({
    queryKey: ['timetable'],
    queryFn: () => academicService.getTimetable()
  });

  const { data: fees = [] } = useQuery({
    queryKey: ['studentFees'],
    queryFn: () => operationService.getFees(user?.id)
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ['studentAttendance', user?.id],
    queryFn: () => attendanceService.getAttendance(user?.id)
  });

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todaySlots = timetable.filter((t: any) => t.day === today);

  const overallPct = attendance.length > 0
    ? Math.round((attendance.filter((a: any) => a.status === 'present' || a.status === 'late').length / attendance.length) * 100)
    : 0;

  const pendingAssignments = assignments.filter((a: any) => {
    const dueDate = a.dueDate || a.due_date;
    return dueDate ? new Date(dueDate) >= new Date() : true;
  }).length;

  const pendingFees = fees.filter((f: any) => f.status !== 'paid').reduce((s: number, f: any) => s + Number(f.amount || 0), 0);

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-10">
      {/* Welcome Hero */}
      <div className="bg-gradient-to-r from-[#1733A0] via-[#1E3BB6] to-[#2563EB] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-600/15">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Good morning, {user?.name || user?.email?.split('@')[0]}! 👋</h1>
        <p className="text-blue-100 mt-2 text-sm sm:text-base font-normal">Here's your academic summary and daily schedule for {today}.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <DashboardCard title="Overall Attendance" value={`${overallPct}%`} icon={CalendarCheck}
          colorClass={attendance.length === 0 ? 'bg-slate-50 text-slate-500 dark:bg-slate-800' : overallPct >= 75 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' : 'bg-red-50 text-red-600'}
          subtitle={attendance.length === 0 ? 'No records yet' : overallPct >= 75 ? 'Good standing' : 'Below threshold!'} />
        <DashboardCard title="Pending Assignments" value={pendingAssignments} icon={ClipboardList} colorClass="bg-amber-50 text-amber-600 dark:bg-amber-900/30" subtitle="Due soon" trend="Active" trendUp={false} />
        <DashboardCard title="Fees Due" value={`₹${pendingFees.toLocaleString('en-IN')}`} icon={CreditCard} colorClass="bg-blue-50 text-blue-600 dark:bg-blue-900/30" subtitle="Pay before due date" />
        <DashboardCard title="Active Notices" value={notices.length} icon={Bell} colorClass="bg-violet-50 text-violet-600 dark:bg-violet-900/30" subtitle="Latest updates" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Classes */}
        <div className="card lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-600" /> Today's Classes
            </h2>
            <Link to="/student/timetable" className="text-xs text-indigo-600 hover:underline flex items-center gap-0.5">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {todaySlots.length === 0 ? (
            <p className="text-slate-400 text-sm">No classes today</p>
          ) : (
            <div className="space-y-3">
              {todaySlots.map((slot: any) => (
                <div key={slot.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400 w-20 flex-shrink-0">
                    {slot.startTime || slot.start_time} – {slot.endTime || slot.end_time}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{slot.subjectName || slot.subject_name}</p>
                    <p className="text-xs text-slate-400">{slot.room}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attendance Overview */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-600" /> Attendance Overview
            </h2>
            <Link to="/student/attendance" className="text-xs text-indigo-600 hover:underline flex items-center gap-0.5">
              Details <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Current Semester Attendance</p>
                <p className="text-xs text-slate-400 mt-0.5">Threshold requirement is 75%</p>
              </div>
              <div className="text-right">
                <span className={`text-lg font-bold ${attendance.length === 0 ? 'text-slate-400' : overallPct >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>{overallPct}%</span>
                <p className="text-xs text-slate-400">{attendance.length === 0 ? 'No records' : overallPct >= 75 ? 'Safe Zone' : 'Needs Attention'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Assignments */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-indigo-600" /> Pending Assignments
            </h2>
            <Link to="/student/assignments" className="text-xs text-indigo-600 hover:underline flex items-center gap-0.5">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {assignments.slice(0, 3).map((a: any) => (
              <div key={a.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{a.title}</p>
                  <p className="text-xs text-slate-400">{a.subjectName || a.subject_name} · Due: {formatDate(a.dueDate || a.due_date)}</p>
                </div>
                <StatusBadge status={a.status || 'pending'} />
              </div>
            ))}
            {assignments.length === 0 && <p className="text-slate-400 text-sm">All assignments submitted!</p>}
          </div>
        </div>

        {/* Recent Notices */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Bell className="h-4 w-4 text-indigo-600" /> Recent Notices
            </h2>
            <Link to="/student/notices" className="text-xs text-indigo-600 hover:underline flex items-center gap-0.5">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {notices.slice(0, 3).map((n: any) => (
              <div key={n.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{n.title}</p>
                  <StatusBadge status={n.priority || 'info'} className="flex-shrink-0" />
                </div>
                <p className="text-xs text-slate-400 mt-1">{formatDate(n.publishedAt || n.created_at)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

