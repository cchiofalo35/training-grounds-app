import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import api from '../lib/api';

interface ClassItem {
  id: string;
  name: string;
  discipline: string;
  dayOfWeek: number;
  startTime: string;
  durationMinutes: number;
  capacity: number;
  level: string;
  instructorName: string | null;
  instructor: { name: string } | null;
}

interface ClassFormData {
  name: string;
  discipline: string;
  dayOfWeek: number;
  startTime: string;
  durationMinutes: number;
  capacity: number;
  level: string;
  instructorName: string;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DISCIPLINES = ['BJJ', 'Muay Thai', 'Boxing', 'Wrestling', 'MMA', 'No-Gi', 'Kickboxing', 'Judo', 'Open Mat'];
const LEVELS = ['All Levels', 'Beginner', 'Intermediate', 'Advanced', 'Competition'];

const DISCIPLINE_COLORS: Record<string, string> = {
  'bjj-gi': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'bjj-nogi': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'muay-thai': 'bg-red-500/20 text-red-400 border-red-500/30',
  boxing: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  wrestling: 'bg-green-500/20 text-green-400 border-green-500/30',
  mma: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'open-mat': 'bg-warm-accent/20 text-warm-accent border-warm-accent/30',
  BJJ: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Muay Thai': 'bg-red-500/20 text-red-400 border-red-500/30',
  Boxing: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Wrestling: 'bg-green-500/20 text-green-400 border-green-500/30',
  MMA: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'No-Gi': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'Open Mat': 'bg-warm-accent/20 text-warm-accent border-warm-accent/30',
};

const defaultForm: ClassFormData = {
  name: '',
  discipline: 'BJJ',
  dayOfWeek: 1,
  startTime: '09:00',
  durationMinutes: 60,
  capacity: 30,
  level: 'All Levels',
  instructorName: '',
};

export function ClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ClassFormData>(defaultForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchClasses = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/classes');
      setClasses(res.data.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClasses(); }, []);

  const openCreate = () => {
    setForm(defaultForm);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (cls: ClassItem) => {
    setForm({
      name: cls.name,
      discipline: cls.discipline,
      dayOfWeek: cls.dayOfWeek,
      startTime: cls.startTime,
      durationMinutes: cls.durationMinutes,
      capacity: cls.capacity ?? 30,
      level: cls.level,
      instructorName: cls.instructorName ?? cls.instructor?.name ?? '',
    });
    setEditingId(cls.id);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await api.patch(`/admin/classes/${editingId}`, form);
      } else {
        await api.post('/admin/classes', form);
      }
      setModalOpen(false);
      fetchClasses();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save class');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this class?')) return;
    try {
      await api.delete(`/admin/classes/${id}`);
      setClasses((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete class');
    }
  };

  const classesByDay = DAYS.map((_, dayIndex) =>
    classes.filter((c) => c.dayOfWeek === dayIndex).sort((a, b) => a.startTime.localeCompare(b.startTime))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl text-off-white tracking-wider">Class Schedule</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-warm-accent text-charcoal px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-warm-accent/90 transition-colors"
        >
          <Plus size={16} />
          Add Class
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
          {error}
          <button onClick={fetchClasses} className="ml-3 underline hover:no-underline">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-7 gap-3">
          {DAYS.map((day) => (
            <div key={day} className="space-y-2">
              <div className="text-xs text-steel uppercase tracking-widest text-center py-2">{day}</div>
              <div className="bg-dark-grey rounded-lg p-3 h-40 animate-pulse border border-white/5" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-3">
          {DAYS.map((day, dayIndex) => (
            <div key={day} className="space-y-2">
              <div className="text-xs text-steel uppercase tracking-widest text-center py-2 border-b border-white/5">{day}</div>
              <div className="space-y-2 min-h-[200px]">
                {classesByDay[dayIndex].length === 0 ? (
                  <div className="text-xs text-steel/50 text-center py-8">No classes</div>
                ) : (
                  classesByDay[dayIndex].map((cls) => (
                    <div
                      key={cls.id}
                      className={`rounded-lg p-3 border text-xs ${DISCIPLINE_COLORS[cls.discipline] || 'bg-white/5 text-steel border-white/10'}`}
                    >
                      <p className="font-semibold text-sm mb-1">{cls.name}</p>
                      <p className="opacity-80">{cls.startTime} - {cls.durationMinutes}min</p>
                      <p className="opacity-70 mt-1">{cls.instructorName ?? cls.instructor?.name ?? ''}</p>
                      <p className="opacity-60 mt-0.5">{cls.level}</p>
                      <div className="flex gap-1 mt-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEdit(cls); }}
                          className="p-1 rounded hover:bg-white/10 transition-colors"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(cls.id); }}
                          className="p-1 rounded hover:bg-red-500/20 text-red-400/70 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-grey rounded-xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-lg font-semibold text-off-white">{editingId ? 'Edit Class' : 'Add Class'}</h2>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-steel uppercase tracking-widest mb-1">Discipline</label>
                  <select
                    value={form.discipline}
                    onChange={(e) => setForm({ ...form, discipline: e.target.value })}
                    className="w-full bg-charcoal border border-white/10 rounded-lg px-3 py-2.5 text-sm text-off-white focus:outline-none focus:border-warm-accent"
                  >
                    {DISCIPLINES.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-steel uppercase tracking-widest mb-1">Day of Week</label>
                  <select
                    value={form.dayOfWeek}
                    onChange={(e) => setForm({ ...form, dayOfWeek: Number(e.target.value) })}
                    className="w-full bg-charcoal border border-white/10 rounded-lg px-3 py-2.5 text-sm text-off-white focus:outline-none focus:border-warm-accent"
                  >
                    {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-steel uppercase tracking-widest mb-1">Start Time</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full bg-charcoal border border-white/10 rounded-lg px-3 py-2.5 text-sm text-off-white focus:outline-none focus:border-warm-accent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-steel uppercase tracking-widest mb-1">Duration (min)</label>
                  <input
                    type="number"
                    value={form.durationMinutes}
                    onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
                    className="w-full bg-charcoal border border-white/10 rounded-lg px-3 py-2.5 text-sm text-off-white focus:outline-none focus:border-warm-accent"
                    min={15}
                    max={180}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-steel uppercase tracking-widest mb-1">Capacity</label>
                  <input
                    type="number"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                    className="w-full bg-charcoal border border-white/10 rounded-lg px-3 py-2.5 text-sm text-off-white focus:outline-none focus:border-warm-accent"
                    min={1}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-steel uppercase tracking-widest mb-1">Level</label>
                  <select
                    value={form.level}
                    onChange={(e) => setForm({ ...form, level: e.target.value })}
                    className="w-full bg-charcoal border border-white/10 rounded-lg px-3 py-2.5 text-sm text-off-white focus:outline-none focus:border-warm-accent"
                  >
                    {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-steel uppercase tracking-widest mb-1">Instructor</label>
                <input
                  type="text"
                  value={form.instructorName}
                  onChange={(e) => setForm({ ...form, instructorName: e.target.value })}
                  className="w-full bg-charcoal border border-white/10 rounded-lg px-3 py-2.5 text-sm text-off-white focus:outline-none focus:border-warm-accent"
                  required
                />
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
                  {submitting ? 'Saving...' : editingId ? 'Update Class' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
