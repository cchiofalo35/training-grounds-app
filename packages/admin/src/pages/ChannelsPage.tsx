import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, MessageSquare, Pin, Hash, Lock } from 'lucide-react';
import api from '../lib/api';

interface ChannelItem {
  id: string;
  name: string;
  description: string;
  category: string;
  discipline: string | null;
  iconEmoji: string;
  sortOrder: number;
  isPinned: boolean;
  isReadOnly: boolean;
  messageCount: number;
}

interface ChannelFormData {
  name: string;
  description: string;
  category: string;
  discipline: string;
  iconEmoji: string;
  sortOrder: number;
  isPinned: boolean;
  isReadOnly: boolean;
}

const CATEGORIES = ['general', 'discipline', 'training', 'announcements', 'media'];
const DISCIPLINES = ['', 'bjj-gi', 'bjj-nogi', 'muay-thai', 'wrestling', 'mma', 'boxing', 'open-mat'];
const FILTER_TABS = ['All', 'General', 'Discipline', 'Training', 'Announcements', 'Media'];

const CATEGORY_COLORS: Record<string, string> = {
  general: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  discipline: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  training: 'bg-green-500/20 text-green-400 border-green-500/30',
  announcements: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  media: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const DISCIPLINE_LABELS: Record<string, string> = {
  'bjj-gi': 'BJJ Gi',
  'bjj-nogi': 'BJJ No-Gi',
  'muay-thai': 'Muay Thai',
  wrestling: 'Wrestling',
  mma: 'MMA',
  boxing: 'Boxing',
  'open-mat': 'Open Mat',
};

const defaultForm: ChannelFormData = {
  name: '',
  description: '',
  category: 'general',
  discipline: '',
  iconEmoji: '',
  sortOrder: 0,
  isPinned: false,
  isReadOnly: false,
};

export function ChannelsPage() {
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ChannelFormData>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');

  const fetchChannels = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/community/channels/stats');
      setChannels(res.data.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load channels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchChannels(); }, []);

  const openCreate = () => {
    setForm(defaultForm);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (channel: ChannelItem) => {
    setForm({
      name: channel.name,
      description: channel.description || '',
      category: channel.category,
      discipline: channel.discipline || '',
      iconEmoji: channel.iconEmoji || '',
      sortOrder: channel.sortOrder ?? 0,
      isPinned: channel.isPinned ?? false,
      isReadOnly: channel.isReadOnly ?? false,
    });
    setEditingId(channel.id);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      ...form,
      discipline: form.discipline || null,
    };
    try {
      if (editingId) {
        await api.patch(`/community/channels/${editingId}`, payload);
      } else {
        await api.post('/community/channels', payload);
      }
      setModalOpen(false);
      fetchChannels();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save channel');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to archive this channel?')) return;
    try {
      await api.delete(`/community/channels/${id}`);
      setChannels((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to archive channel');
    }
  };

  const filteredChannels = activeFilter === 'All'
    ? channels
    : channels.filter((c) => c.category === activeFilter.toLowerCase());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl text-off-white tracking-wider">Channels</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-warm-accent text-charcoal px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-warm-accent/90 transition-colors"
        >
          <Plus size={16} />
          Add Channel
        </button>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-3">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === tab
                ? 'bg-warm-accent/10 text-warm-accent'
                : 'text-steel hover:text-off-white hover:bg-white/5'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
          {error}
          <button onClick={fetchChannels} className="ml-3 underline hover:no-underline">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-dark-grey rounded-lg p-4 h-16 animate-pulse border border-white/5" />
          ))}
        </div>
      ) : (
        <div className="bg-dark-grey rounded-xl border border-white/5 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs text-steel uppercase tracking-widest px-6 py-3">Channel</th>
                <th className="text-left text-xs text-steel uppercase tracking-widest px-6 py-3">Category</th>
                <th className="text-left text-xs text-steel uppercase tracking-widest px-6 py-3">Discipline</th>
                <th className="text-left text-xs text-steel uppercase tracking-widest px-6 py-3">Messages</th>
                <th className="text-center text-xs text-steel uppercase tracking-widest px-6 py-3">Pinned</th>
                <th className="text-center text-xs text-steel uppercase tracking-widest px-6 py-3">Order</th>
                <th className="text-center text-xs text-steel uppercase tracking-widest px-6 py-3">Read-Only</th>
                <th className="text-right text-xs text-steel uppercase tracking-widest px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredChannels.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-steel/50 py-12">No channels found</td>
                </tr>
              ) : (
                filteredChannels.map((channel) => (
                  <tr key={channel.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{channel.iconEmoji || <Hash size={16} className="text-steel" />}</span>
                        <span className="text-off-white font-medium">{channel.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium border ${CATEGORY_COLORS[channel.category] || 'bg-white/5 text-steel border-white/10'}`}>
                        {channel.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-steel">
                      {channel.discipline ? DISCIPLINE_LABELS[channel.discipline] || channel.discipline : '--'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-steel">
                        <MessageSquare size={14} />
                        {channel.messageCount ?? 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {channel.isPinned && <Pin size={14} className="text-warm-accent inline-block" />}
                    </td>
                    <td className="px-6 py-4 text-center text-steel">
                      {channel.sortOrder ?? 0}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {channel.isReadOnly && <Lock size={14} className="text-yellow-400 inline-block" />}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(channel)}
                          className="p-1.5 rounded hover:bg-white/10 text-steel hover:text-off-white transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(channel.id)}
                          className="p-1.5 rounded hover:bg-red-500/20 text-red-400/70 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-grey rounded-xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-lg font-semibold text-off-white">{editingId ? 'Edit Channel' : 'Add Channel'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-steel hover:text-off-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-steel uppercase tracking-widest mb-1">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-charcoal border border-white/10 rounded-lg px-3 py-2.5 text-sm text-off-white focus:outline-none focus:border-warm-accent"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-steel uppercase tracking-widest mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-charcoal border border-white/10 rounded-lg px-3 py-2.5 text-sm text-off-white focus:outline-none focus:border-warm-accent resize-none"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-steel uppercase tracking-widest mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-charcoal border border-white/10 rounded-lg px-3 py-2.5 text-sm text-off-white focus:outline-none focus:border-warm-accent"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-steel uppercase tracking-widest mb-1">Discipline (optional)</label>
                  <select
                    value={form.discipline}
                    onChange={(e) => setForm({ ...form, discipline: e.target.value })}
                    className="w-full bg-charcoal border border-white/10 rounded-lg px-3 py-2.5 text-sm text-off-white focus:outline-none focus:border-warm-accent"
                  >
                    <option value="">None</option>
                    {DISCIPLINES.filter(Boolean).map((d) => <option key={d} value={d}>{DISCIPLINE_LABELS[d] || d}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-steel uppercase tracking-widest mb-1">Icon Emoji</label>
                  <input
                    type="text"
                    value={form.iconEmoji}
                    onChange={(e) => setForm({ ...form, iconEmoji: e.target.value })}
                    className="w-full bg-charcoal border border-white/10 rounded-lg px-3 py-2.5 text-sm text-off-white focus:outline-none focus:border-warm-accent"
                    placeholder="e.g. 💬"
                  />
                </div>
                <div>
                  <label className="block text-xs text-steel uppercase tracking-widest mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                    className="w-full bg-charcoal border border-white/10 rounded-lg px-3 py-2.5 text-sm text-off-white focus:outline-none focus:border-warm-accent"
                    min={0}
                  />
                </div>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isPinned}
                    onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
                    className="w-4 h-4 rounded border-white/10 bg-charcoal text-warm-accent focus:ring-warm-accent focus:ring-offset-0"
                  />
                  <span className="text-sm text-off-white">Pinned</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isReadOnly}
                    onChange={(e) => setForm({ ...form, isReadOnly: e.target.checked })}
                    className="w-4 h-4 rounded border-white/10 bg-charcoal text-warm-accent focus:ring-warm-accent focus:ring-offset-0"
                  />
                  <span className="text-sm text-off-white">Read-Only</span>
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 text-sm text-steel hover:text-off-white bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2.5 text-sm font-medium bg-warm-accent text-charcoal rounded-lg hover:bg-warm-accent/90 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingId ? 'Update Channel' : 'Create Channel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
