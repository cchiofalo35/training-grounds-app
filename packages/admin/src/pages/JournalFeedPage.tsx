import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Send, ChevronDown, ChevronUp, User, BookOpen, RefreshCw } from 'lucide-react';
import api from '../lib/api';

interface JournalComment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
}

interface JournalEntry {
  id: string;
  userId: string;
  userName: string;
  userBeltRank: string;
  className: string | null;
  discipline: string | null;
  exploration: string;
  challenge: string;
  worked: string;
  takeaways: string;
  nextSession: string;
  isSharedWithCoach: boolean;
  createdAt: string;
  comments: JournalComment[];
}

const BELT_COLORS: Record<string, string> = {
  white: '#FFFFFF',
  blue: '#1E40AF',
  purple: '#7C3AED',
  brown: '#92400E',
  black: '#1F2937',
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

const DISCIPLINE_COLORS: Record<string, string> = {
  'bjj-gi': 'bg-blue-600',
  'bjj-nogi': 'bg-purple-600',
  'muay-thai': 'bg-red-600',
  wrestling: 'bg-yellow-600',
  mma: 'bg-orange-600',
  boxing: 'bg-red-800',
  'open-mat': 'bg-gray-600',
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function JournalFeedPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/journal-feed', {
        params: { page, perPage: 15 },
      });
      setEntries(res.data.data.entries);
      setTotal(res.data.data.total);
    } catch (err) {
      console.error('Failed to fetch journal feed:', err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const toggleExpand = (id: string) => {
    setExpandedEntries((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleComment = async (entryId: string) => {
    const content = commentInputs[entryId]?.trim();
    if (!content) return;

    setSubmitting((prev) => ({ ...prev, [entryId]: true }));
    try {
      const res = await api.post(`/admin/journal-feed/${entryId}/comments`, { content });
      const newComment = res.data.data;

      setEntries((prev) =>
        prev.map((e) =>
          e.id === entryId
            ? {
                ...e,
                comments: [
                  ...e.comments,
                  {
                    id: newComment.id,
                    authorId: newComment.authorId,
                    authorName: newComment.author?.name ?? 'You',
                    authorRole: 'coach',
                    content: newComment.content,
                    createdAt: newComment.createdAt,
                  },
                ],
              }
            : e,
        ),
      );
      setCommentInputs((prev) => ({ ...prev, [entryId]: '' }));
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setSubmitting((prev) => ({ ...prev, [entryId]: false }));
    }
  };

  const totalPages = Math.ceil(total / 15);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-warm-accent" />
            Journal Feed
          </h1>
          <p className="text-steel mt-1">
            Review member journal entries shared with coaches. Comment to provide feedback.
          </p>
        </div>
        <button
          onClick={fetchFeed}
          className="flex items-center gap-2 px-4 py-2 bg-charcoal-light border border-border-dark rounded-lg text-white hover:bg-charcoal-lighter transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-charcoal-light border border-border-dark rounded-xl p-4">
          <p className="text-steel text-sm">Shared Entries</p>
          <p className="text-2xl font-bold text-white mt-1">{total}</p>
        </div>
        <div className="bg-charcoal-light border border-border-dark rounded-xl p-4">
          <p className="text-steel text-sm">Awaiting Response</p>
          <p className="text-2xl font-bold text-warm-accent mt-1">
            {entries.filter((e) => e.comments.length === 0).length}
          </p>
        </div>
        <div className="bg-charcoal-light border border-border-dark rounded-xl p-4">
          <p className="text-steel text-sm">Responded</p>
          <p className="text-2xl font-bold text-green-400 mt-1">
            {entries.filter((e) => e.comments.length > 0).length}
          </p>
        </div>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-warm-accent" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-steel">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg">No shared journal entries yet</p>
          <p className="text-sm mt-1">
            Members can share entries with coaches from the app
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => {
            const isExpanded = expandedEntries.has(entry.id);

            return (
              <div
                key={entry.id}
                className="bg-charcoal-light border border-border-dark rounded-xl overflow-hidden"
              >
                {/* Entry header */}
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-charcoal flex items-center justify-center">
                        <User className="w-5 h-5 text-steel" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">
                            {entry.userName}
                          </span>
                          <span
                            className="w-3 h-3 rounded-full border border-gray-500 inline-block"
                            style={{
                              backgroundColor:
                                BELT_COLORS[entry.userBeltRank] ?? '#6B7280',
                            }}
                          />
                          {entry.discipline && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full text-white ${
                                DISCIPLINE_COLORS[entry.discipline] ?? 'bg-gray-600'
                              }`}
                            >
                              {DISCIPLINE_LABELS[entry.discipline] ??
                                entry.discipline}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-steel">
                          <span>{timeAgo(entry.createdAt)}</span>
                          {entry.className && (
                            <>
                              <span>·</span>
                              <span>{entry.className}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {entry.comments.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
                          <MessageSquare className="w-3 h-3" />
                          {entry.comments.length}
                        </span>
                      )}
                      {entry.comments.length === 0 && (
                        <span className="text-xs text-warm-accent bg-warm-accent/10 px-2 py-1 rounded-full">
                          Awaiting response
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Main content - always show exploration */}
                  <div className="mt-4 space-y-3">
                    <div>
                      <p className="text-xs font-medium text-warm-accent uppercase tracking-wider mb-1">
                        What I explored
                      </p>
                      <p className="text-white text-sm leading-relaxed">
                        {entry.exploration}
                      </p>
                    </div>

                    {!isExpanded && (
                      <button
                        onClick={() => toggleExpand(entry.id)}
                        className="flex items-center gap-1 text-sm text-warm-accent hover:text-warm-accent/80 transition-colors"
                      >
                        <ChevronDown className="w-4 h-4" />
                        Show full entry
                      </button>
                    )}

                    {isExpanded && (
                      <>
                        <div>
                          <p className="text-xs font-medium text-red-400 uppercase tracking-wider mb-1">
                            Challenge
                          </p>
                          <p className="text-white text-sm leading-relaxed">
                            {entry.challenge}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-green-400 uppercase tracking-wider mb-1">
                            What worked
                          </p>
                          <p className="text-white text-sm leading-relaxed">
                            {entry.worked}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-blue-400 uppercase tracking-wider mb-1">
                            Key takeaways
                          </p>
                          <p className="text-white text-sm leading-relaxed">
                            {entry.takeaways}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-purple-400 uppercase tracking-wider mb-1">
                            Next session focus
                          </p>
                          <p className="text-white text-sm leading-relaxed">
                            {entry.nextSession}
                          </p>
                        </div>
                        <button
                          onClick={() => toggleExpand(entry.id)}
                          className="flex items-center gap-1 text-sm text-steel hover:text-white transition-colors"
                        >
                          <ChevronUp className="w-4 h-4" />
                          Collapse
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Comments section */}
                {entry.comments.length > 0 && (
                  <div className="border-t border-border-dark bg-charcoal/50 px-5 py-3 space-y-3">
                    {entry.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <div className="w-7 h-7 rounded-full bg-warm-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <MessageSquare className="w-3.5 h-3.5 text-warm-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-warm-accent">
                              {comment.authorName}
                            </span>
                            <span className="text-xs text-steel capitalize">
                              {comment.authorRole}
                            </span>
                            <span className="text-xs text-steel">
                              · {timeAgo(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-white mt-0.5 leading-relaxed">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Comment input */}
                <div className="border-t border-border-dark px-5 py-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Write a comment..."
                      value={commentInputs[entry.id] ?? ''}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({
                          ...prev,
                          [entry.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleComment(entry.id);
                        }
                      }}
                      className="flex-1 bg-charcoal border border-border-dark rounded-lg px-3 py-2 text-sm text-white placeholder-steel focus:outline-none focus:border-warm-accent"
                    />
                    <button
                      onClick={() => handleComment(entry.id)}
                      disabled={
                        !commentInputs[entry.id]?.trim() ||
                        submitting[entry.id]
                      }
                      className="p-2 bg-warm-accent rounded-lg text-charcoal hover:bg-warm-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-charcoal-light border border-border-dark rounded-lg text-white disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-steel text-sm">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-charcoal-light border border-border-dark rounded-lg text-white disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
