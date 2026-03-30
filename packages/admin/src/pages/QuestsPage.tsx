import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Swords, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '../lib/api';

interface Quest {
  id: string;
  name: string;
  description: string;
  type: string;
  criteriaType: string;
  criteriaThreshold: number;
  xpReward: number;
  status: string;
  startDate: string;
  endDate: string;
}

interface QuestFormData {
  name: string;
  description: string;
  type: string;
  criteriaType: string;
  criteriaThreshold: number;
  xpReward: number;
  startDate: string;
  endDate: string;
}

const QUEST_TYPES = ['weekly', 'monthly', 'special'];
const CRITERIA_TYPES = [
  { value: 'check_ins', label: 'Check-ins' },
  { value: 'classes_attended', label: 'Classes Attended' },
  { value: 'streak', label: 'Streak Days' },
  { value: 'discipline_variety', label: 'Different Disciplines' },
  { value: 'specific_class', label: 'Specific Class Attendance' },
  { value: 'xp_earned', label: 'XP Earned' },
];

const TYPE_COLORS: Record<string, string> = {
  weekly: 'bg-blue-500/10 text-blue-400',
  monthly: 'bg-purple-500/10 text-purple-400',
  special: 'bg-warm-accent/10 text-warm-accent',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500/10 text-green-400',
  inactive: 'bg-gray-500/10 text-gray-400',
  completed: 'bg-warm-accent/10 text-warm-accent',
};

const defaultForm: QuestFormData = {
  name: '',
  description: '',
  type: 'weekly',
  criteriaType: 'check_ins',
  criteriaThreshold: 3,
  xpReward: 100,
  startDate: '',
  endDate: '',
};

export function QuestsPage() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<QuestFormData>(defaultForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchQuests = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/quests');
      setQuests(res.data.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load quests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQuests(); }, []);

  const openCreate = () => {
    setForm(defaultForm);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (quest: Quest) => {
    setForm({
      name: quest.name,
      description: quest.description,
      type: quest.type,
      criteriaType: quest.criteriaType || 'check_ins',
      criteriaThreshold: quest.criteriaThreshold || 1,
      xpReward: quest.xpReward,
      startDate: quest.startDate ? quest.startDate.split('T')[0] : '',
      endDate: quest.endDate ? quest.endDate.split('T')[0] : '',
    });
    setEditingId(quest.id);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        criteria: { type: form.criteriaType, threshold: form.criteriaThreshold },
      };
      if (editingId) {
        await api.patch(`/admin/quests/${editingId}`, payload);
      } else {
        await api.post('/admin/quests', payload);
      }
      setModalOpen(false);
      fetchQuests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save quest');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quest?')) return;
    try {
      await api.delete(`/admin/quests/${id}`);
      setQuests((prev) => prev.filter((q) => q.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete quest');
    }
  };

  const handleToggleStatus = async (quest: Quest) => {
    const newStatus = quest.status === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/admin/quests/${quest.id}`, { status: newStatus });
      setQuests((prev) => prev.map((q) => (q.id === quest.id ? { ...q, status: newStatus } : q)));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update quest status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl text-off-white tracking-wider">Quests</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-warm-accent text-charcoal px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-warm-accent/90 transition-colors"
        >
          <Plus size={16} />
          Create Quest
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
          {error}
          <button onClick={fetchQuests} className="ml-3 underline hover:no-underline">Retry</button>
        </div>
      )}

      <div className="bg-dark-grey rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-3 px-4 text-xs text-steel uppercase tracking-widest font-medium">Name</th>
                <th className="text-left py-3 px-4 text-xs text-steel uppercase tracking-widest font-medium">Type</th>
                <th className="text-left py-3 px-4 text-xs text-steel uppercase tracking-widest font-medium">Criteria</th>
                <th className="text-left py-3 px-4 text-xs text-steel uppercase tracking-widest font-medium">XP Reward</th>
                <th className="text-left py-3 px-4 text-xs text-steel uppercase tracking-widest font-medium">Status</th>
                <th className="text-left py-3 px-4 text-xs text-steel uppercase tracking-widest font-medium">Date Range</th>
                <th className="text-left py-3 px-4 text-xs text-steel uppercase tracking-widest font-medium">Actions</th>
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
              ) : quests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <Swords size={48} className="mx-auto text-steel/30 mb-4" />
                    <p className="text-steel">No quests yet. Create your first quest!</p>
                  </td>
                </tr>
              ) : (
                quests.map((quest) => (
                  <tr key={quest.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-off-white font-medium">{quest.name}</p>
                        <p className="text-xs text-steel mt-0.5 line-clamp-1">{quest.description}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${TYPE_COLORS[quest.type] || 'bg-white/5 text-steel'}`}>
                        {quest.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-steel">
                      {quest.criteriaThreshold}x {(quest.criteriaType || '').replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-warm-accent font-medium">{quest.xpReward} XP</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[quest.status] || 'bg-white/5 text-steel'}`}>
                        {quest.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-steel text-xs">
                      {quest.startDate ? (
                        <>
                          {new Date(quest.startDate).toLocaleDateString()} - {quest.endDate ? new Date(quest.endDate).toLocaleDateString() : 'Ongoing'}
                        </>
                      ) : (
                        'No dates set'
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleStatus(quest)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            quest.status === 'active'
                              ? 'text-green-400 hover:bg-green-500/20'
                              : 'text-steel hover:bg-white/10'
                          }`}
                          title={quest.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          {quest.status === 'active' ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        </button>
                        <button
                          onClick={() => openEdit(quest)}
                          className="p-1.5 rounded-lg text-steel hover:text-off-white hover:bg-white/10 transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(quest.id)}
                          className="p-1.5 rounded-lg text-steel hover:text-red-400 hover:bg-red-500/20 transition-colors"
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
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-grey rounded-xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-lg font-semibold text-off-white">{editingId ? 'Edit Quest' : 'Create Quest'}</h2>
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
                  placeholder="Weekly Warrior"
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
                  placeholder="Complete 5 training sessions this week..."
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-steel uppercase tracking-widest mb-1">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full bg-charcoal border border-white/10 rounded-lg px-3 py-2.5 text-sm text-off-white focus:outline-none focus:border-warm-accent"
                  >
                    {QUEST_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-steel uppercase tracking-widest mb-1">XP Reward</label>
                  <input
                    type="number"
                    value={form.xpReward}
                    onChange={(e) => setForm({ ...form, xpReward: Number(e.target.value) })}
                    className="w-full bg-charcoal border border-white/10 rounded-lg px-3 py-2.5 text-sm text-off-white focus:outline-none focus:border-warm-accent"
                    min={1}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-steel uppercase tracking-widest mb-1">Criteria Type</label>
                  <select
                    value={form.criteriaType}
                    onChange={(e) => setForm({ ...form, criteriaType: e.target.value })}
                    className="w-full bg-charcoal border border-white/10 rounded-lg px-3 py-2.5 text-sm text-off-white focus:outline-none focus:border-warm-accent"
                  >
                    {CRITERIA_TYPES.map((ct) => <option key={ct.value} value={ct.value}>{ct.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-steel uppercase tracking-widest mb-1">Threshold</label>
                  <input
                    type="number"
                    value={form.criteriaThreshold}
                    onChange={(e) => setForm({ ...form, criteriaThreshold: Number(e.target.value) })}
                    className="w-full bg-charcoal border border-white/10 rounded-lg px-3 py-2.5 text-sm text-off-white focus:outline-none focus:border-warm-accent"
                    min={1}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-steel uppercase tracking-widest mb-1">Start Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full bg-charcoal border border-white/10 rounded-lg px-3 py-2.5 text-sm text-off-white focus:outline-none focus:border-warm-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-steel uppercase tracking-widest mb-1">End Date</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full bg-charcoal border border-white/10 rounded-lg px-3 py-2.5 text-sm text-off-white focus:outline-none focus:border-warm-accent"
                  />
                </div>
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
                  {submitting ? 'Saving...' : editingId ? 'Update Quest' : 'Create Quest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
