import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Flame, Zap, CalendarCheck, Award, TrendingUp } from 'lucide-react';
import api from '../lib/api';
import { BRAND } from '../brand';

interface Pr {
  id: string;
  movementName: string;
  valueNumeric: number;
  valueUnit: string;
  loggedAt: string;
  isAllTimePr: boolean;
}
interface Attendance {
  id: string;
  className: string;
  discipline: string;
  checkedInAt: string;
}
interface Member {
  id: string;
  name: string;
  email: string;
  beltRank?: string;
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  joinedAt: string;
  attendanceRecords?: Attendance[];
  userBadges?: unknown[];
}

export function MemberDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [prs, setPrs] = useState<Pr[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [m, p] = await Promise.all([
          api.get(`/admin/members/${id}`),
          api.get(`/personal-records/user/${id}?category=lift`),
        ]);
        setMember(m.data.data);
        setPrs(
          (p.data.data || []).map((r: any) => ({ ...r, valueNumeric: Number(r.valueNumeric) })),
        );
      } catch (e: any) {
        setError(e.response?.data?.error?.message || e.message || 'Failed to load member');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const byMovement = useMemo(() => {
    const g: Record<string, Pr[]> = {};
    for (const r of prs) (g[r.movementName] ||= []).push(r);
    for (const k in g) g[k].sort((a, b) => +new Date(a.loggedAt) - +new Date(b.loggedAt));
    return g;
  }, [prs]);

  const checkins = member?.attendanceRecords?.length ?? 0;
  const badges = member?.userBadges?.length ?? 0;
  const recentCheckins = useMemo(
    () =>
      [...(member?.attendanceRecords ?? [])]
        .sort((a, b) => +new Date(b.checkedInAt) - +new Date(a.checkedInAt))
        .slice(0, 8),
    [member],
  );

  if (loading)
    return <div className="text-warm-accent">Loading member…</div>;
  if (error)
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
        {error}
      </div>
    );
  if (!member) return null;

  const Stat = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) => (
    <div className="bg-dark-grey rounded-xl border border-white/5 p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-warm-accent/10 flex items-center justify-center">
        <Icon size={18} className="text-warm-accent" />
      </div>
      <div>
        <p className="text-off-white text-lg font-bold leading-none">{value}</p>
        <p className="text-steel text-xs uppercase tracking-widest mt-1">{label}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/members')}
        className="flex items-center gap-2 text-steel hover:text-off-white text-sm"
      >
        <ArrowLeft size={16} /> Back to members
      </button>

      <div>
        <h1 className="font-heading text-3xl text-off-white tracking-wider">{member.name}</h1>
        <p className="text-steel text-sm">
          {member.email}
          {member.beltRank ? ` · ${member.beltRank} belt` : ''} · joined{' '}
          {new Date(member.joinedAt).toLocaleDateString()}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon={Zap} label="Total XP" value={(member.totalXp ?? 0).toLocaleString()} />
        <Stat icon={Flame} label="Current Streak" value={`${member.currentStreak ?? 0} d`} />
        <Stat icon={CalendarCheck} label="Check-ins" value={checkins} />
        <Stat icon={Award} label="Badges" value={badges} />
      </div>

      {/* Lift progression */}
      <div>
        <h2 className="flex items-center gap-2 text-off-white font-heading text-xl tracking-wider mb-3">
          <TrendingUp size={18} className="text-warm-accent" /> Lifting Progress
        </h2>
        {Object.keys(byMovement).length === 0 ? (
          <div className="bg-dark-grey rounded-xl border border-white/5 p-8 text-center text-steel">
            No lifts logged yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Object.entries(byMovement).map(([movement, recs]) => {
              const best = Math.max(...recs.map((r) => r.valueNumeric));
              const unit = recs[0].valueUnit;
              const first = recs[0].valueNumeric;
              const gain = best - first;
              const data = recs.map((r) => ({
                date: new Date(r.loggedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                value: r.valueNumeric,
              }));
              return (
                <div key={movement} className="bg-dark-grey rounded-xl border border-white/5 p-4">
                  <div className="flex items-baseline justify-between mb-2">
                    <p className="text-off-white font-medium text-sm">{movement}</p>
                    <p className="text-warm-accent font-bold">
                      {best}
                      {unit}
                    </p>
                  </div>
                  <p className="text-xs text-steel mb-2">
                    {gain > 0 ? `▲ +${Math.round(gain * 10) / 10}${unit} all-time` : 'Tracking'}
                  </p>
                  <ResponsiveContainer width="100%" height={120}>
                    <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <XAxis dataKey="date" tick={{ fill: '#B0B5B8', fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: '#B0B5B8', fontSize: 10 }} tickLine={false} axisLine={false} domain={['dataMin - 5', 'dataMax + 5']} />
                      <Tooltip
                        contentStyle={{ background: '#1E1E1E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                        labelStyle={{ color: '#B0B5B8' }}
                        formatter={(v: any) => [`${v}${unit}`, movement]}
                      />
                      <Line type="monotone" dataKey="value" stroke={BRAND.accentHex} strokeWidth={2} dot={{ r: 3, fill: BRAND.accentHex }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent attendance */}
      <div>
        <h2 className="text-off-white font-heading text-xl tracking-wider mb-3">Recent Check-ins</h2>
        <div className="bg-dark-grey rounded-xl border border-white/5 divide-y divide-white/5">
          {recentCheckins.length === 0 ? (
            <p className="p-4 text-steel text-sm">No check-ins yet.</p>
          ) : (
            recentCheckins.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <CalendarCheck size={16} className="text-warm-accent" />
                  <span className="text-off-white text-sm">{a.className}</span>
                  <span className="text-steel text-xs capitalize">{a.discipline}</span>
                </div>
                <span className="text-steel text-xs">{new Date(a.checkedInAt).toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
