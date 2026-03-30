import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Award, EyeOff, Sparkles, Loader2 } from 'lucide-react';
import api from '../lib/api';

interface Badge {
  id: string;
  name: string;
  description: string;
  category: string;
  iconUrl: string;
  criteriaType: string;
  criteriaThreshold: number;
  hidden: boolean;
}

interface BadgeFormData {
  name: string;
  description: string;
  category: string;
  iconUrl: string;
  criteriaType: string;
  criteriaThreshold: number;
  hidden: boolean;
}

const CATEGORIES = ['attendance', 'discipline', 'competition', 'social', 'secret'];
const CRITERIA_TYPES = [
  { value: 'attendance_count', label: 'Total Classes' },
  { value: 'streak', label: 'Streak Days' },
  { value: 'xp_total', label: 'XP Earned' },
  { value: 'discipline_classes', label: 'Discipline-Specific Classes' },
  { value: 'referrals', label: 'Referrals' },
  { value: 'custom', label: 'Custom / Manual' },
];

const CATEGORY_COLORS: Record<string, string> = {
  attendance: 'bg-green-500/10 text-green-400',
  discipline: 'bg-blue-500/10 text-blue-400',
  competition: 'bg-purple-500/10 text-purple-400',
  social: 'bg-pink-500/10 text-pink-400',
  secret: 'bg-warm-accent/10 text-warm-accent',
};

/* ─── Badge Emoji Icons ─── */
const BADGE_EMOJI_MAP: Record<string, string> = {
  // Name-based mappings
  'First Class': '🥋',
  '10-Class Warrior': '⚔️',
  '50-Class Veteran': '🛡️',
  '100-Class Legend': '👑',
  '7-Day Warrior': '🔥',
  '30-Day Machine': '⚡',
  '100-Day Legend': '💎',
  'XP Rookie': '⭐',
  'XP Warrior': '🌟',
  'XP Elite': '✨',
  'Night Owl': '🦉',
};

const CATEGORY_EMOJI: Record<string, string> = {
  attendance: '🏆',
  discipline: '🥊',
  competition: '🏅',
  social: '🤝',
  secret: '🔮',
};

const CRITERIA_EMOJI: Record<string, string> = {
  attendance_count: '📊',
  streak: '🔥',
  xp_total: '⭐',
  discipline_classes: '🥋',
  referrals: '🤝',
  custom: '✨',
};

function getBadgeEmoji(badge: Badge): string {
  // Try exact name match first
  if (BADGE_EMOJI_MAP[badge.name]) return BADGE_EMOJI_MAP[badge.name];
  // Try criteria-based
  if (badge.criteriaType && CRITERIA_EMOJI[badge.criteriaType]) return CRITERIA_EMOJI[badge.criteriaType];
  // Fall back to category
  return CATEGORY_EMOJI[badge.category] || '🏆';
}

/* ─── AI Badge Generator ─── */
interface GeneratedBadge {
  name: string;
  description: string;
  category: string;
  criteriaType: string;
  criteriaThreshold: number;
  emoji: string;
  hidden: boolean;
}

function generateBadgeFromPrompt(prompt: string): GeneratedBadge | null {
  const lower = prompt.toLowerCase();

  // Parse numbers from the prompt
  const numberMatch = lower.match(/(\d+)/);
  const num = numberMatch ? parseInt(numberMatch[1]) : 0;

  // Streak patterns
  if (lower.includes('streak') || lower.includes('consecutive') || lower.includes('days in a row')) {
    const threshold = num || 14;
    const tierName = threshold >= 100 ? 'Legendary' : threshold >= 60 ? 'Unstoppable' : threshold >= 30 ? 'Iron' : threshold >= 14 ? 'Dedicated' : 'Rising';
    return {
      name: `${tierName} Streak`,
      description: `Maintain a ${threshold}-day training streak. Consistency is the key to mastery.`,
      category: 'attendance',
      criteriaType: 'streak',
      criteriaThreshold: threshold,
      emoji: threshold >= 60 ? '💎' : threshold >= 30 ? '⚡' : '🔥',
      hidden: false,
    };
  }

  // Attendance / class count patterns
  if (lower.includes('class') || lower.includes('attend') || lower.includes('session') || lower.includes('train')) {
    const threshold = num || 25;
    const names: Record<number, string> = { 5: 'Getting Started', 10: 'Committed', 25: 'Warrior', 50: 'Veteran', 100: 'Centurion', 200: 'Legend', 500: 'Hall of Fame' };
    const closest = Object.keys(names).map(Number).reduce((a, b) => Math.abs(b - threshold) < Math.abs(a - threshold) ? b : a);
    const name = names[closest] || `${threshold}-Class Achievement`;
    return {
      name,
      description: `Attend ${threshold} classes. Every session makes you stronger.`,
      category: 'attendance',
      criteriaType: 'attendance_count',
      criteriaThreshold: threshold,
      emoji: threshold >= 100 ? '👑' : threshold >= 50 ? '🛡️' : threshold >= 25 ? '⚔️' : '🥋',
      hidden: false,
    };
  }

  // XP patterns
  if (lower.includes('xp') || lower.includes('points') || lower.includes('experience')) {
    const threshold = num || 5000;
    return {
      name: threshold >= 50000 ? 'XP God' : threshold >= 25000 ? 'XP Master' : threshold >= 10000 ? 'XP Hunter' : 'XP Collector',
      description: `Earn ${threshold.toLocaleString()} XP through training. The grind pays off.`,
      category: 'discipline',
      criteriaType: 'xp_total',
      criteriaThreshold: threshold,
      emoji: threshold >= 25000 ? '✨' : threshold >= 10000 ? '🌟' : '⭐',
      hidden: false,
    };
  }

  // Discipline-specific patterns
  if (lower.includes('bjj') || lower.includes('jiu') || lower.includes('grappl')) {
    const threshold = num || 20;
    return {
      name: `BJJ ${threshold >= 50 ? 'Master' : threshold >= 20 ? 'Specialist' : 'Explorer'}`,
      description: `Attend ${threshold} BJJ classes. The gentle art rewards the patient.`,
      category: 'discipline',
      criteriaType: 'discipline_classes',
      criteriaThreshold: threshold,
      emoji: '🥋',
      hidden: false,
    };
  }
  if (lower.includes('muay thai') || lower.includes('striking') || lower.includes('kickbox')) {
    const threshold = num || 20;
    return {
      name: `Muay Thai ${threshold >= 50 ? 'Master' : threshold >= 20 ? 'Warrior' : 'Student'}`,
      description: `Attend ${threshold} Muay Thai classes. The art of eight limbs.`,
      category: 'discipline',
      criteriaType: 'discipline_classes',
      criteriaThreshold: threshold,
      emoji: '🥊',
      hidden: false,
    };
  }
  if (lower.includes('wrestling') || lower.includes('takedown')) {
    const threshold = num || 20;
    return {
      name: `Wrestling ${threshold >= 50 ? 'Champion' : threshold >= 20 ? 'Grappler' : 'Rookie'}`,
      description: `Attend ${threshold} wrestling classes. Control the fight.`,
      category: 'discipline',
      criteriaType: 'discipline_classes',
      criteriaThreshold: threshold,
      emoji: '🤼',
      hidden: false,
    };
  }
  if (lower.includes('mma') || lower.includes('mixed martial')) {
    const threshold = num || 20;
    return {
      name: `MMA ${threshold >= 50 ? 'Fighter' : threshold >= 20 ? 'Warrior' : 'Prospect'}`,
      description: `Attend ${threshold} MMA classes. The complete martial artist.`,
      category: 'discipline',
      criteriaType: 'discipline_classes',
      criteriaThreshold: threshold,
      emoji: '👊',
      hidden: false,
    };
  }

  // Secret / special patterns
  if (lower.includes('secret') || lower.includes('hidden') || lower.includes('surprise') || lower.includes('easter egg')) {
    return {
      name: 'Mystery Unlocked',
      description: prompt.charAt(0).toUpperCase() + prompt.slice(1),
      category: 'secret',
      criteriaType: 'custom',
      criteriaThreshold: 1,
      emoji: '🔮',
      hidden: true,
    };
  }

  // Night / morning patterns
  if (lower.includes('night') || lower.includes('late') || lower.includes('after hours')) {
    return {
      name: 'Night Warrior',
      description: 'Train after hours. The mat is always there for you.',
      category: 'secret',
      criteriaType: 'custom',
      criteriaThreshold: num || 5,
      emoji: '🌙',
      hidden: true,
    };
  }
  if (lower.includes('morning') || lower.includes('early') || lower.includes('dawn') || lower.includes('6am') || lower.includes('5am')) {
    return {
      name: 'Early Bird',
      description: 'Train at the crack of dawn. Champions are made before sunrise.',
      category: 'secret',
      criteriaType: 'custom',
      criteriaThreshold: num || 5,
      emoji: '🌅',
      hidden: false,
    };
  }

  // Referral patterns
  if (lower.includes('referr') || lower.includes('invite') || lower.includes('friend') || lower.includes('bring')) {
    const threshold = num || 3;
    return {
      name: threshold >= 10 ? 'Ambassador' : threshold >= 5 ? 'Recruiter' : 'Team Builder',
      description: `Refer ${threshold} friends to the gym. Build the community.`,
      category: 'social',
      criteriaType: 'referrals',
      criteriaThreshold: threshold,
      emoji: '🤝',
      hidden: false,
    };
  }

  // Competition patterns
  if (lower.includes('compet') || lower.includes('tournament') || lower.includes('fight') || lower.includes('match')) {
    return {
      name: num ? `${num}-Time Competitor` : 'Competitor',
      description: `${num ? `Enter ${num} competitions` : 'Step on the competition stage'}. Test yourself against the best.`,
      category: 'competition',
      criteriaType: 'custom',
      criteriaThreshold: num || 1,
      emoji: '🏅',
      hidden: false,
    };
  }

  // Generic fallback — use the prompt as description
  return {
    name: 'Custom Badge',
    description: prompt.charAt(0).toUpperCase() + prompt.slice(1),
    category: 'attendance',
    criteriaType: 'custom',
    criteriaThreshold: num || 1,
    emoji: '🏆',
    hidden: false,
  };
}

const defaultForm: BadgeFormData = {
  name: '',
  description: '',
  category: 'attendance',
  iconUrl: '',
  criteriaType: 'attendance_count',
  criteriaThreshold: 1,
  hidden: false,
};

export function BadgesPage() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BadgeFormData>(defaultForm);
  const [submitting, setSubmitting] = useState(false);

  // AI Generator state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPreview, setAiPreview] = useState<GeneratedBadge | null>(null);

  const fetchBadges = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/badges');
      setBadges(res.data.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load badges');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBadges(); }, []);

  const openCreate = () => {
    setForm(defaultForm);
    setEditingId(null);
    setAiPreview(null);
    setAiPrompt('');
    setModalOpen(true);
  };

  const openEdit = (badge: Badge) => {
    setForm({
      name: badge.name,
      description: badge.description,
      category: badge.category,
      iconUrl: badge.iconUrl || '',
      criteriaType: badge.criteriaType || 'custom',
      criteriaThreshold: badge.criteriaThreshold || 1,
      hidden: badge.hidden || false,
    });
    setEditingId(badge.id);
    setAiPreview(null);
    setAiPrompt('');
    setModalOpen(true);
  };

  const handleAiGenerate = () => {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    // Small delay to feel like it's "thinking"
    setTimeout(() => {
      const result = generateBadgeFromPrompt(aiPrompt);
      if (result) {
        setAiPreview(result);
        setForm({
          name: result.name,
          description: result.description,
          category: result.category,
          iconUrl: '',
          criteriaType: result.criteriaType,
          criteriaThreshold: result.criteriaThreshold,
          hidden: result.hidden,
        });
      }
      setAiGenerating(false);
    }, 600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        category: form.category,
        iconUrl: form.iconUrl || `emoji:${aiPreview?.emoji || '🏆'}`,
        criteriaJson: { type: form.criteriaType, threshold: form.criteriaThreshold },
        isHidden: form.hidden,
      };
      if (editingId) {
        await api.patch(`/admin/badges/${editingId}`, payload);
      } else {
        await api.post('/admin/badges', payload);
      }
      setModalOpen(false);
      fetchBadges();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save badge');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this badge?')) return;
    try {
      await api.delete(`/admin/badges/${id}`);
      setBadges((prev) => prev.filter((b) => b.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete badge');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl text-off-white tracking-wider">Badges</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-warm-accent text-charcoal px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-warm-accent/90 transition-colors"
        >
          <Plus size={16} />
          Create Badge
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
          {error}
          <button onClick={fetchBadges} className="ml-3 underline hover:no-underline">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-dark-grey rounded-xl p-5 border border-white/5 h-48 animate-pulse" />
          ))}
        </div>
      ) : badges.length === 0 ? (
        <div className="bg-dark-grey rounded-xl p-12 border border-white/5 text-center">
          <Award size={48} className="mx-auto text-steel/30 mb-4" />
          <p className="text-steel">No badges yet. Create your first badge!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {badges.map((badge) => (
            <div key={badge.id} className="bg-dark-grey rounded-xl p-5 border border-white/5 hover:border-white/10 transition-colors group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-14 h-14 rounded-xl bg-warm-accent/10 flex items-center justify-center text-3xl">
                  {getBadgeEmoji(badge)}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(badge)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-steel hover:text-off-white transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(badge.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-steel hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <h3 className="text-off-white font-semibold mb-1 flex items-center gap-2">
                {badge.name}
                {badge.hidden && <EyeOff size={12} className="text-steel" />}
              </h3>
              <p className="text-steel text-sm mb-3 line-clamp-2">{badge.description}</p>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[badge.category] || 'bg-white/5 text-steel'}`}>
                  {badge.category}
                </span>
                {badge.criteriaType && badge.criteriaType !== 'custom' && badge.criteriaType !== 'manual' && (
                  <span className="text-xs text-steel">
                    {badge.criteriaThreshold}x {badge.criteriaType.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-grey rounded-xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-lg font-semibold text-off-white">{editingId ? 'Edit Badge' : 'Create Badge'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-steel hover:text-off-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* AI Generator */}
            {!editingId && (
              <div className="px-6 pt-5 pb-2">
                <div className="bg-charcoal rounded-xl p-4 border border-warm-accent/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={16} className="text-warm-accent" />
                    <span className="text-sm font-medium text-warm-accent">AI Badge Generator</span>
                  </div>
                  <p className="text-xs text-steel mb-3">
                    Describe the badge you want and we'll generate it for you.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
                      placeholder="e.g. Award for attending 50 BJJ classes..."
                      className="flex-1 bg-dark-grey border border-white/10 rounded-lg px-3 py-2 text-sm text-off-white focus:outline-none focus:border-warm-accent placeholder:text-steel/50"
                    />
                    <button
                      onClick={handleAiGenerate}
                      disabled={aiGenerating || !aiPrompt.trim()}
                      className="flex items-center gap-2 bg-warm-accent text-charcoal px-4 py-2 rounded-lg text-sm font-medium hover:bg-warm-accent/90 transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      {aiGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      Generate
                    </button>
                  </div>
                  {/* Quick suggestions */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {['30-day streak', '50 BJJ classes', 'Refer 5 friends', 'Secret night owl', 'Enter 3 competitions', '10,000 XP'].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => { setAiPrompt(suggestion); }}
                        className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-steel hover:text-off-white hover:bg-white/10 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                  {/* AI Preview */}
                  {aiPreview && (
                    <div className="mt-4 p-3 rounded-lg bg-warm-accent/5 border border-warm-accent/10 flex items-start gap-3">
                      <span className="text-3xl">{aiPreview.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-off-white">{aiPreview.name}</p>
                        <p className="text-xs text-steel mt-0.5">{aiPreview.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[aiPreview.category] || 'bg-white/5 text-steel'}`}>
                            {aiPreview.category}
                          </span>
                          <span className="text-xs text-steel">
                            {aiPreview.criteriaThreshold}x {aiPreview.criteriaType.replace(/_/g, ' ')}
                          </span>
                          {aiPreview.hidden && <span className="text-xs text-warm-accent">Hidden</span>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-steel uppercase tracking-widest mb-1">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-charcoal border border-white/10 rounded-lg px-3 py-2.5 text-sm text-off-white focus:outline-none focus:border-warm-accent"
                  placeholder="Iron Will"
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
                  placeholder="Awarded for consistent training..."
                  required
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
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
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
              </div>
              <div>
                <label className="block text-xs text-steel uppercase tracking-widest mb-1">Threshold</label>
                <input
                  type="number"
                  value={form.criteriaThreshold}
                  onChange={(e) => setForm({ ...form, criteriaThreshold: Number(e.target.value) })}
                  className="w-full bg-charcoal border border-white/10 rounded-lg px-3 py-2.5 text-sm text-off-white focus:outline-none focus:border-warm-accent"
                  min={1}
                  disabled={form.criteriaType === 'custom'}
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.hidden}
                  onChange={(e) => setForm({ ...form, hidden: e.target.checked })}
                  className="w-4 h-4 rounded border-white/10 bg-charcoal accent-warm-accent"
                />
                <span className="text-sm text-off-white">Hidden badge (surprise unlock)</span>
              </label>
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
                  {submitting ? 'Saving...' : editingId ? 'Update Badge' : 'Create Badge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
