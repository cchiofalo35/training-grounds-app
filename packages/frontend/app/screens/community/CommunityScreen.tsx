import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing, borderRadius } from '@training-grounds/shared';
import type { Discipline } from '@training-grounds/shared';
import api from '../../services/api';

interface Channel {
  id: string;
  name: string;
  description: string | null;
  category: string;
  discipline: Discipline | null;
  iconEmoji: string | null;
  isPinned: boolean;
  isReadOnly: boolean;
  sortOrder: number;
}

interface ChannelMessage {
  id: string;
  channelId: string;
  userId: string;
  userName: string;
  userBeltRank: string;
  userRole: string;
  content: string;
  mediaUrls: string[] | null;
  parentId: string | null;
  isEdited: boolean;
  isPinned: boolean;
  replyCount: number;
  reactions: Array<{ emoji: string; count: number; userIds: string[] }>;
  createdAt: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  general: 'chatbubble-ellipses',
  discipline: 'fitness',
  training: 'barbell',
  announcements: 'megaphone',
  media: 'videocam',
};

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  discipline: 'Disciplines',
  training: 'Training',
  announcements: 'Announcements',
  media: 'Media',
};

const BELT_COLORS: Record<string, string> = {
  white: '#FFFFFF',
  blue: '#1E40AF',
  purple: '#7C3AED',
  brown: '#92400E',
  black: '#1F2937',
};

type ViewMode = 'channels' | 'chat';

export const CommunityScreen: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('channels');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchChannels = useCallback(async () => {
    try {
      const res = await api.get('/community/channels');
      setChannels(res.data.data ?? []);
    } catch (err) {
      console.error('Failed to fetch channels:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const fetchMessages = useCallback(async (channelId: string, cursor?: string) => {
    try {
      const params: any = { limit: 50 };
      if (cursor) params.cursor = cursor;
      const res = await api.get(`/community/channels/${channelId}/messages`, { params });
      const data = res.data.data;
      if (cursor) {
        setMessages((prev) => [...data.messages, ...prev]);
      } else {
        setMessages(data.messages ?? []);
      }
      setHasMore(data.hasMore ?? false);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoadingMore(false);
    }
  }, []);

  const openChannel = (channel: Channel) => {
    setSelectedChannel(channel);
    setViewMode('chat');
    setMessages([]);
    setLoading(true);
    fetchMessages(channel.id).finally(() => setLoading(false));
  };

  const goBack = () => {
    setViewMode('channels');
    setSelectedChannel(null);
    setMessages([]);
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedChannel || sending) return;
    setSending(true);
    try {
      const res = await api.post(`/community/channels/${selectedChannel.id}/messages`, {
        content: messageText.trim(),
      });
      const newMsg = res.data.data;
      setMessages((prev) => [
        ...prev,
        {
          id: newMsg.id,
          channelId: newMsg.channelId,
          userId: newMsg.userId,
          userName: newMsg.user?.name ?? 'You',
          userBeltRank: newMsg.user?.beltRank ?? 'white',
          userRole: newMsg.user?.role ?? 'member',
          content: newMsg.content,
          mediaUrls: newMsg.mediaUrls,
          parentId: newMsg.parentId,
          isEdited: false,
          isPinned: false,
          replyCount: 0,
          reactions: [],
          createdAt: newMsg.createdAt,
        },
      ]);
      setMessageText('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    try {
      await api.post(`/community/messages/${messageId}/reactions`, { emoji });
      // Optimistically update
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const existing = m.reactions.find((r) => r.emoji === emoji);
          if (existing) {
            return {
              ...m,
              reactions: m.reactions.map((r) =>
                r.emoji === emoji ? { ...r, count: r.count + 1 } : r,
              ),
            };
          }
          return {
            ...m,
            reactions: [...m.reactions, { emoji, count: 1, userIds: [] }],
          };
        }),
      );
    } catch (err) {
      console.error('Failed to add reaction:', err);
    }
  };

  const loadOlderMessages = () => {
    if (!hasMore || loadingMore || messages.length === 0) return;
    setLoadingMore(true);
    fetchMessages(selectedChannel!.id, messages[0].id);
  };

  const timeAgo = (dateStr: string): string => {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  // ==================== Channel List ====================
  if (viewMode === 'channels') {
    const grouped = channels.reduce<Record<string, Channel[]>>((acc, ch) => {
      const cat = ch.category || 'general';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(ch);
      return acc;
    }, {});

    const categories = Object.keys(grouped).sort((a, b) => {
      const order = ['announcements', 'general', 'discipline', 'training', 'media'];
      return order.indexOf(a) - order.indexOf(b);
    });

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Community</Text>
          <Ionicons name="chatbubbles" size={24} color={colors.warmAccent} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.warmAccent} />
          </View>
        ) : channels.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.steel} />
            <Text style={styles.emptyText}>No channels yet</Text>
            <Text style={styles.emptySubtext}>Channels will appear here once created by a coach</Text>
          </View>
        ) : (
          <FlatList
            data={categories}
            keyExtractor={(item) => item}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); fetchChannels(); }}
                tintColor={colors.warmAccent}
              />
            }
            renderItem={({ item: category }) => (
              <View style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <Ionicons
                    name={(CATEGORY_ICONS[category] ?? 'chatbubble') as any}
                    size={14}
                    color={colors.steel}
                  />
                  <Text style={styles.categoryTitle}>
                    {CATEGORY_LABELS[category] ?? category.toUpperCase()}
                  </Text>
                </View>
                {grouped[category].map((channel) => (
                  <Pressable
                    key={channel.id}
                    style={styles.channelRow}
                    onPress={() => openChannel(channel)}
                  >
                    <View style={styles.channelIcon}>
                      <Text style={styles.channelEmoji}>
                        {channel.iconEmoji ?? '#'}
                      </Text>
                    </View>
                    <View style={styles.channelInfo}>
                      <View style={styles.channelNameRow}>
                        <Text style={styles.channelName}>{channel.name}</Text>
                        {channel.isPinned && (
                          <Ionicons name="pin" size={12} color={colors.warmAccent} />
                        )}
                        {channel.isReadOnly && (
                          <Ionicons name="lock-closed" size={12} color={colors.steel} />
                        )}
                      </View>
                      {channel.description && (
                        <Text style={styles.channelDesc} numberOfLines={1}>
                          {channel.description}
                        </Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.steel} />
                  </Pressable>
                ))}
              </View>
            )}
          />
        )}
      </SafeAreaView>
    );
  }

  // ==================== Chat View ====================
  const QUICK_REACTIONS = ['\u{1F44D}', '\u{1F525}', '\u{1F4AA}', '\u{1F3C6}', '\u{1F64F}'];

  return (
    <SafeAreaView style={styles.container}>
      {/* Chat Header */}
      <View style={styles.chatHeader}>
        <Pressable onPress={goBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.offWhite} />
        </Pressable>
        <View style={styles.chatHeaderInfo}>
          <Text style={styles.chatHeaderEmoji}>
            {selectedChannel?.iconEmoji ?? '#'}
          </Text>
          <Text style={styles.chatHeaderTitle} numberOfLines={1}>
            {selectedChannel?.name}
          </Text>
        </View>
      </View>

      {/* Messages */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.warmAccent} />
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          inverted={false}
          onStartReached={loadOlderMessages}
          onStartReachedThreshold={0.1}
          ListHeaderComponent={
            loadingMore ? (
              <ActivityIndicator size="small" color={colors.steel} style={{ marginVertical: 8 }} />
            ) : hasMore ? (
              <Pressable onPress={loadOlderMessages} style={styles.loadMoreBtn}>
                <Text style={styles.loadMoreText}>Load older messages</Text>
              </Pressable>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-outline" size={48} color={colors.steel} />
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Be the first to say something!</Text>
            </View>
          }
          renderItem={({ item: msg }) => (
            <View style={styles.messageContainer}>
              <View style={styles.messageAvatar}>
                <View
                  style={[
                    styles.avatarCircle,
                    { borderColor: BELT_COLORS[msg.userBeltRank] ?? colors.steel },
                  ]}
                >
                  <Text style={styles.avatarLetter}>
                    {msg.userName?.[0]?.toUpperCase() ?? '?'}
                  </Text>
                </View>
              </View>
              <View style={styles.messageBubble}>
                <View style={styles.messageHeaderRow}>
                  <Text style={styles.messageSender}>{msg.userName}</Text>
                  {msg.userRole === 'coach' || msg.userRole === 'admin' ? (
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleBadgeText}>
                        {msg.userRole === 'coach' ? 'Coach' : 'Admin'}
                      </Text>
                    </View>
                  ) : null}
                  <Text style={styles.messageTime}>{timeAgo(msg.createdAt)}</Text>
                </View>
                <Text style={styles.messageContent}>{msg.content}</Text>

                {/* Media */}
                {msg.mediaUrls && msg.mediaUrls.length > 0 && (
                  <View style={styles.mediaContainer}>
                    {msg.mediaUrls.map((url, i) => (
                      <View key={i} style={styles.mediaThumbnail}>
                        <Ionicons
                          name={url.includes('video') ? 'videocam' : 'image'}
                          size={24}
                          color={colors.warmAccent}
                        />
                        <Text style={styles.mediaLabel}>
                          {url.includes('video') ? 'Video' : 'Image'}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Reactions */}
                {msg.reactions.length > 0 && (
                  <View style={styles.reactionsRow}>
                    {msg.reactions.map((r) => (
                      <Pressable
                        key={r.emoji}
                        style={styles.reactionPill}
                        onPress={() => addReaction(msg.id, r.emoji)}
                      >
                        <Text style={styles.reactionEmoji}>{r.emoji}</Text>
                        <Text style={styles.reactionCount}>{r.count}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}

                {/* Quick reactions */}
                <View style={styles.quickReactions}>
                  {QUICK_REACTIONS.map((emoji) => (
                    <Pressable
                      key={emoji}
                      onPress={() => addReaction(msg.id, emoji)}
                      style={styles.quickReactionBtn}
                    >
                      <Text style={{ fontSize: 12 }}>{emoji}</Text>
                    </Pressable>
                  ))}
                  {msg.replyCount > 0 && (
                    <Text style={styles.replyCountText}>
                      {msg.replyCount} {msg.replyCount === 1 ? 'reply' : 'replies'}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}
        />
      )}

      {/* Composer */}
      {!selectedChannel?.isReadOnly && (
        <View style={styles.composer}>
          <Pressable style={styles.composerAttach}>
            <Ionicons name="add-circle" size={28} color={colors.warmAccent} />
          </Pressable>
          <View style={styles.composerInputWrap}>
            <TextInput
              style={styles.composerInput}
              placeholder="Message..."
              placeholderTextColor={colors.steel}
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={2000}
            />
          </View>
          <Pressable
            style={[styles.composerSend, !messageText.trim() && styles.composerSendDisabled]}
            onPress={sendMessage}
            disabled={!messageText.trim() || sending}
          >
            <Ionicons
              name="send"
              size={20}
              color={messageText.trim() ? colors.charcoal : colors.steel}
            />
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.charcoal,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontFamily: fonts.heading,
    fontSize: 28,
    color: colors.offWhite,
    letterSpacing: 1,
  },

  // Loading & Empty
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: colors.offWhite,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.steel,
    marginTop: spacing.xs,
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  // Category
  categorySection: {
    marginBottom: spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  categoryTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.steel,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // Channel Row
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    gap: 12,
  },
  channelIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.darkGrey,
    justifyContent: 'center',
    alignItems: 'center',
  },
  channelEmoji: {
    fontSize: 20,
    fontFamily: 'System',
  },
  channelInfo: {
    flex: 1,
  },
  channelNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  channelName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.offWhite,
  },
  channelDesc: {
    fontSize: 13,
    color: colors.steel,
    marginTop: 2,
  },

  // Chat Header
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
    gap: 8,
  },
  backButton: {
    padding: 4,
  },
  chatHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  chatHeaderEmoji: {
    fontSize: 20,
  },
  chatHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.offWhite,
    flex: 1,
  },

  // Messages
  messagesList: {
    paddingHorizontal: spacing.md,
    paddingBottom: 8,
  },
  loadMoreBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  loadMoreText: {
    fontSize: 13,
    color: colors.warmAccent,
  },
  messageContainer: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 10,
  },
  messageAvatar: {},
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.darkGrey,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.offWhite,
  },
  messageBubble: {
    flex: 1,
  },
  messageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  messageSender: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.offWhite,
  },
  roleBadge: {
    backgroundColor: colors.warmAccent + '30',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.warmAccent,
  },
  messageTime: {
    fontSize: 11,
    color: colors.steel,
  },
  messageContent: {
    fontSize: 15,
    color: colors.offWhite,
    lineHeight: 22,
  },

  // Media
  mediaContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  mediaThumbnail: {
    width: 80,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.darkGrey,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaLabel: {
    fontSize: 10,
    color: colors.steel,
    marginTop: 2,
  },

  // Reactions
  reactionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  reactionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.darkGrey,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 12,
    color: colors.steel,
    fontWeight: '600',
  },
  quickReactions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
    opacity: 0.5,
  },
  quickReactionBtn: {
    padding: 4,
  },
  replyCountText: {
    fontSize: 11,
    color: colors.warmAccent,
    marginLeft: 8,
    fontWeight: '600',
  },

  // Composer
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderDark,
    backgroundColor: colors.charcoal,
    gap: 8,
  },
  composerAttach: {
    paddingBottom: 4,
  },
  composerInputWrap: {
    flex: 1,
    backgroundColor: colors.darkGrey,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 120,
  },
  composerInput: {
    fontSize: 15,
    color: colors.offWhite,
    maxHeight: 100,
  },
  composerSend: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.warmAccent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  composerSendDisabled: {
    backgroundColor: colors.darkGrey,
  },
});
