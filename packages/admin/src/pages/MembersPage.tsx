import { useState, useEffect, useCallback, Fragment } from 'react';
import { Search, ChevronLeft, ChevronRight, X, Save } from 'lucide-react';
import api from '../lib/api';

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  belt: string;
  stripes: number;
  xp: number;
  streak: number;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

const BELT_COLORS: Record<string, string> = {
  white: 'bg-white',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  brown: 'bg-amber-700',
  black: 'bg-gray-900 border border-white/20',
  none: 'bg-gray-600',
};

const BELT_OPTIONS = ['white', 'blue', 'purple', 'brown', 'black'];
const ROLE_OPTIONS = ['member', 'coach', 'admin'];
const STRIPE_OPTIONS = [0, 1, 2, 3, 4];

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-500/10 text-red-400',
  coach: 'bg-blue-500/10 text-blue-400',
  member: 'bg-warm-accent/10 text-warm-accent',
};

export function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, perPage: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ role: string; belt: string; stripes: number } | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchMembers = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), perPage: '20' });
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      const res = await api.get(`/admin/members?${params}`);
      const data = res.data.data;
      setMembers(data.members || data.items || data || []);
      if (data.pagination) {
        setPagination(data.pagination);
      } else {
        setPagination({ page, perPage: 20, total: (data.members || data.items || data).length, totalPages: 1 });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    const timer = setTimeout(() => fetchMembers(1), 300);
    return () => clearTimeout(timer);
  }, [fetchMembers]);

  const handleRowClick = (member: Member) => {
    if (expandedId === member.id) {
      setExpandedId(null);
      setEditData(null);
    } else {
      setExpandedId(member.id);
      setEditData({ role: member.role, belt: member.belt || 'white', stripes: member.stripes || 0 });
    }
  };

  const handleSave = async (memberId: string) => {
    if (!editData) return;
    setSaving(true);
    try {
      await api.patch(`/admin/members/${memberId}`, editData);
      setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, ...editData } : m)));
      setExpandedId(null);
      setEditData(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update member');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-3xl text-off-white tracking-wider">Members</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-steel" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-dark-grey border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-off-white focus:outline-none focus:border-warm-accent transition-colors"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-dark-grey border border-white/10 rounded-lg px-4 py-2.5 text-sm text-off-white focus:outline-none focus:border-warm-accent transition-colors"
        >
          <option value="">All Roles</option>
          <option value="member">Member</option>
          <option value="coach">Coach</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
          {error}
          <button onClick={() => fetchMembers()} className="ml-3 underline hover:no-underline">Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-dark-grey rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-3 px-4 text-xs text-steel uppercase tracking-widest font-medium">Name</th>
                <th className="text-left py-3 px-4 text-xs text-steel uppercase tracking-widest font-medium">Email</th>
                <th className="text-left py-3 px-4 text-xs text-steel uppercase tracking-widest font-medium">Belt</th>
                <th className="text-left py-3 px-4 text-xs text-steel uppercase tracking-widest font-medium">Role</th>
                <th className="text-left py-3 px-4 text-xs text-steel uppercase tracking-widest font-medium">XP</th>
                <th className="text-left py-3 px-4 text-xs text-steel uppercase tracking-widest font-medium">Streak</th>
                <th className="text-left py-3 px-4 text-xs text-steel uppercase tracking-widest font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="py-3 px-4"><div className="h-4 bg-white/5 rounded animate-pulse w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-steel">No members found</td>
                </tr>
              ) : (
                members.map((member) => (
                  <Fragment key={member.id}>
                    <tr
                      onClick={() => handleRowClick(member)}
                      className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 text-off-white font-medium">{member.name}</td>
                      <td className="py-3 px-4 text-steel">{member.email}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${BELT_COLORS[member.belt] || BELT_COLORS.none}`} />
                          <span className="text-off-white capitalize">{member.belt || 'None'}</span>
                          {member.stripes > 0 && (
                            <span className="text-xs text-steel">({member.stripes} stripe{member.stripes > 1 ? 's' : ''})</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[member.role] || ROLE_COLORS.member}`}>
                          {member.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-warm-accent font-medium">{(member.xp ?? 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-off-white">{member.streak ?? 0} days</td>
                      <td className="py-3 px-4 text-steel">{member.createdAt ? new Date(member.createdAt).toLocaleDateString() : '-'}</td>
                    </tr>
                    {expandedId === member.id && editData && (
                      <tr className="border-b border-white/5 bg-charcoal/50">
                        <td colSpan={7} className="p-4">
                          <div className="flex flex-wrap items-end gap-6">
                            <div>
                              <label className="block text-xs text-steel uppercase tracking-widest mb-1">Role</label>
                              <select
                                value={editData.role}
                                onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                                className="bg-dark-grey border border-white/10 rounded-lg px-3 py-2 text-sm text-off-white focus:outline-none focus:border-warm-accent"
                              >
                                {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-steel uppercase tracking-widest mb-1">Belt</label>
                              <select
                                value={editData.belt}
                                onChange={(e) => setEditData({ ...editData, belt: e.target.value })}
                                className="bg-dark-grey border border-white/10 rounded-lg px-3 py-2 text-sm text-off-white focus:outline-none focus:border-warm-accent"
                              >
                                {BELT_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-steel uppercase tracking-widest mb-1">Stripes</label>
                              <select
                                value={editData.stripes}
                                onChange={(e) => setEditData({ ...editData, stripes: Number(e.target.value) })}
                                className="bg-dark-grey border border-white/10 rounded-lg px-3 py-2 text-sm text-off-white focus:outline-none focus:border-warm-accent"
                              >
                                {STRIPE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSave(member.id)}
                                disabled={saving}
                                className="flex items-center gap-2 bg-warm-accent text-charcoal px-4 py-2 rounded-lg text-sm font-medium hover:bg-warm-accent/90 transition-colors disabled:opacity-50"
                              >
                                <Save size={14} />
                                {saving ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                onClick={() => { setExpandedId(null); setEditData(null); }}
                                className="flex items-center gap-2 bg-white/5 text-steel px-4 py-2 rounded-lg text-sm hover:bg-white/10 transition-colors"
                              >
                                <X size={14} />
                                Cancel
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
            <p className="text-xs text-steel">
              Showing {((pagination.page - 1) * pagination.perPage) + 1} to {Math.min(pagination.page * pagination.perPage, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchMembers(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-2 rounded-lg text-steel hover:text-off-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-off-white">Page {pagination.page} of {pagination.totalPages}</span>
              <button
                onClick={() => fetchMembers(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-2 rounded-lg text-steel hover:text-off-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
