import { useState, useEffect } from 'react';
import { Plus, Megaphone, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '../lib/api';

interface Announcement {
  id: string;
  title: string;
  body: string;
  createdByName: string | null;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/announcements');
      setItems(res.data.data || []);
    } catch (e: any) {
      setError(e.response?.data?.error?.message || e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = { title: title.trim(), body: body.trim() };
      if (expiresAt) payload.expiresAt = new Date(expiresAt).toISOString();
      await api.post('/announcements', payload);
      setTitle('');
      setBody('');
      setExpiresAt('');
      fetchItems();
    } catch (e: any) {
      alert(e.response?.data?.error?.message || 'Failed to post announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (a: Announcement) => {
    try {
      await api.patch(`/announcements/${a.id}`, { isActive: !a.isActive });
      setItems((prev) => prev.map((x) => (x.id === a.id ? { ...x, isActive: !x.isActive } : x)));
    } catch {
      alert('Failed to update');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch {
      alert('Failed to delete');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-heading text-3xl text-off-white tracking-wider">Announcements</h1>
        <p className="text-sm text-steel mt-1">
          Post one important update — it shows as a banner on every member's home screen, separate
          from the community channels.
        </p>
      </div>

      {/* Composer */}
      <form onSubmit={handleCreate} className="bg-dark-grey rounded-xl border border-white/5 p-5 space-y-4">
        <div>
          <label className="block text-xs text-steel uppercase tracking-widest mb-1">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder="Gym closed Monday for the public holiday"
            className="w-full bg-charcoal border border-white/10 rounded-lg px-3 py-2.5 text-sm text-off-white focus:outline-none focus:border-warm-accent"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-steel uppercase tracking-widest mb-1">Message</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="We'll be closed Monday — back to normal hours Tuesday. Enjoy the long weekend!"
            className="w-full bg-charcoal border border-white/10 rounded-lg px-3 py-2.5 text-sm text-off-white focus:outline-none focus:border-warm-accent resize-none"
            required
          />
        </div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <label className="block text-xs text-steel uppercase tracking-widest mb-1">
              Auto-hide after (optional)
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="bg-charcoal border border-white/10 rounded-lg px-3 py-2.5 text-sm text-off-white focus:outline-none focus:border-warm-accent"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 bg-warm-accent text-charcoal px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-warm-accent/90 transition-colors disabled:opacity-50"
          >
            <Plus size={16} />
            {submitting ? 'Posting…' : 'Post Announcement'}
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
          {error}
          <button onClick={fetchItems} className="ml-3 underline hover:no-underline">Retry</button>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-steel text-sm">Loading…</div>
        ) : items.length === 0 ? (
          <div className="bg-dark-grey rounded-xl border border-white/5 p-8 text-center text-steel">
            <Megaphone size={40} className="mx-auto text-steel/30 mb-3" />
            No announcements yet. Post one above.
          </div>
        ) : (
          items.map((a) => (
            <div
              key={a.id}
              className={`bg-dark-grey rounded-xl border p-4 ${a.isActive ? 'border-warm-accent/40' : 'border-white/5 opacity-60'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Megaphone size={16} className="text-warm-accent" />
                    <p className="text-off-white font-semibold">{a.title}</p>
                    {a.isActive && (
                      <span className="text-[10px] uppercase tracking-widest bg-warm-accent/15 text-warm-accent px-2 py-0.5 rounded-full">
                        Live
                      </span>
                    )}
                  </div>
                  <p className="text-steel text-sm mt-1 whitespace-pre-wrap">{a.body}</p>
                  <p className="text-steel/60 text-xs mt-2">
                    {a.createdByName ? `${a.createdByName} · ` : ''}
                    {new Date(a.createdAt).toLocaleDateString()}
                    {a.expiresAt ? ` · hides ${new Date(a.expiresAt).toLocaleDateString()}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleActive(a)}
                    title={a.isActive ? 'Hide from home' : 'Show on home'}
                    className={`p-1.5 rounded-lg ${a.isActive ? 'text-green-400 hover:bg-green-500/20' : 'text-steel hover:bg-white/10'}`}
                  >
                    {a.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  </button>
                  <button
                    onClick={() => remove(a.id)}
                    className="p-1.5 rounded-lg text-steel hover:text-red-400 hover:bg-red-500/20"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
