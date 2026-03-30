import { useState, useEffect } from 'react';
import { Users, UserCheck, UserPlus, ClipboardCheck, TrendingUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../lib/api';

interface OverviewData {
  totalMembers: number;
  activeMembers: number;
  newThisMonth: number;
  checkInsThisWeek: number;
  checkInsThisMonth: number;
}

interface AttendancePoint {
  date: string;
  count: number;
}

interface DisciplineData {
  discipline: string;
  count: number;
}

interface RecentCheckIn {
  id: string;
  memberName: string;
  className: string;
  discipline: string;
  checkedInAt: string;
}

const statCards = [
  { key: 'totalMembers', label: 'Total Members', icon: Users, color: 'text-warm-accent' },
  { key: 'activeMembers', label: 'Active Members', icon: UserCheck, color: 'text-green-400' },
  { key: 'newThisMonth', label: 'New This Month', icon: UserPlus, color: 'text-blue-400' },
  { key: 'checkInsThisWeek', label: 'Check-ins (Week)', icon: ClipboardCheck, color: 'text-purple-400' },
  { key: 'checkInsThisMonth', label: 'Check-ins (Month)', icon: TrendingUp, color: 'text-orange-400' },
] as const;

export function DashboardPage() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [attendance, setAttendance] = useState<AttendancePoint[]>([]);
  const [disciplines, setDisciplines] = useState<DisciplineData[]>([]);
  const [recentCheckIns, setRecentCheckIns] = useState<RecentCheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [overviewRes, attendanceRes, disciplinesRes] = await Promise.allSettled([
          api.get('/admin/analytics/overview'),
          api.get('/admin/analytics/attendance?days=30'),
          api.get('/admin/analytics/disciplines'),
        ]);

        if (overviewRes.status === 'fulfilled') {
          const data = overviewRes.value.data.data;
          setOverview(data);
          if (data.recentCheckIns) {
            setRecentCheckIns(data.recentCheckIns);
          }
        }

        if (attendanceRes.status === 'fulfilled') {
          setAttendance(attendanceRes.value.data.data || []);
        }

        if (disciplinesRes.status === 'fulfilled') {
          setDisciplines(disciplinesRes.value.data.data || []);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-3xl text-off-white tracking-wider">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-dark-grey rounded-xl p-5 border border-white/5 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-24 mb-3" />
              <div className="h-8 bg-white/10 rounded w-16" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-dark-grey rounded-xl p-6 border border-white/5 h-80 animate-pulse" />
          <div className="bg-dark-grey rounded-xl p-6 border border-white/5 h-80 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-3xl text-off-white tracking-wider">Dashboard</h1>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-red-400">
          <p className="font-medium">Failed to load dashboard</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-sm bg-red-500/20 px-4 py-2 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const overviewValues: Record<string, number> = {
    totalMembers: overview?.totalMembers ?? 0,
    activeMembers: overview?.activeMembers ?? 0,
    newThisMonth: overview?.newThisMonth ?? 0,
    checkInsThisWeek: overview?.checkInsThisWeek ?? 0,
    checkInsThisMonth: overview?.checkInsThisMonth ?? 0,
  };

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-3xl text-off-white tracking-wider">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map(({ key, label, icon: Icon, color }) => (
          <div key={key} className="bg-dark-grey rounded-xl p-5 border border-white/5 hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-steel uppercase tracking-widest">{label}</span>
              <Icon size={16} className={color} />
            </div>
            <p className="text-2xl font-bold text-off-white">{overviewValues[key].toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <div className="bg-dark-grey rounded-xl p-6 border border-white/5">
          <h2 className="text-lg font-semibold text-off-white mb-4">Attendance Trend (30 Days)</h2>
          {attendance.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={attendance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="date"
                  stroke="#B0B5B8"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) => {
                    const d = new Date(val);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis stroke="#B0B5B8" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#2A2A2A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#FAFAF8' }}
                  labelFormatter={(val) => new Date(val).toLocaleDateString()}
                />
                <Line type="monotone" dataKey="count" stroke="#C9A87C" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#C9A87C' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-steel text-sm">No attendance data available</div>
          )}
        </div>

        {/* Discipline Breakdown */}
        <div className="bg-dark-grey rounded-xl p-6 border border-white/5">
          <h2 className="text-lg font-semibold text-off-white mb-4">Discipline Breakdown</h2>
          {disciplines.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={disciplines} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                <XAxis type="number" stroke="#B0B5B8" tick={{ fontSize: 11 }} />
                <YAxis dataKey="discipline" type="category" stroke="#B0B5B8" tick={{ fontSize: 11 }} width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#2A2A2A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#FAFAF8' }}
                />
                <Bar dataKey="count" fill="#C9A87C" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-steel text-sm">No discipline data available</div>
          )}
        </div>
      </div>

      {/* Recent Check-ins */}
      <div className="bg-dark-grey rounded-xl p-6 border border-white/5">
        <h2 className="text-lg font-semibold text-off-white mb-4">Recent Check-ins</h2>
        {recentCheckIns.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-3 px-4 text-xs text-steel uppercase tracking-widest font-medium">Member</th>
                  <th className="text-left py-3 px-4 text-xs text-steel uppercase tracking-widest font-medium">Class</th>
                  <th className="text-left py-3 px-4 text-xs text-steel uppercase tracking-widest font-medium">Discipline</th>
                  <th className="text-left py-3 px-4 text-xs text-steel uppercase tracking-widest font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentCheckIns.map((checkIn) => (
                  <tr key={checkIn.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 text-off-white">{checkIn.memberName}</td>
                    <td className="py-3 px-4 text-steel">{checkIn.className}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-full text-xs bg-warm-accent/10 text-warm-accent">
                        {checkIn.discipline}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-steel">{new Date(checkIn.checkedInAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-steel text-sm">No recent check-ins</p>
        )}
      </div>
    </div>
  );
}
