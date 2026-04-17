/**
 * Shared TypeScript types for Training Grounds app
 * Used by both backend and frontend packages
 */

// ==================== Gym & Tenant ====================

export type GymPlan = 'starter' | 'pro' | 'enterprise';

export type GymMemberRole = 'member' | 'coach' | 'admin' | 'owner';

export interface Gym {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  surfaceColor: string;
  textPrimary: string;
  textMuted: string;
  headingFont: string;
  bodyFont: string;
  timezone: string;
  currency: string;
  streakFreezeEnabled: boolean;
  maxStreakFreezesPerMonth: number;
  referralProgramEnabled: boolean;
  communityEnabled: boolean;
  videoLibraryEnabled?: boolean;
  journalEnabled?: boolean;
  coachesCornerEnabled?: boolean;
  leaderboardsEnabled?: boolean;
  prTrackingEnabled?: boolean;
  benchmarkWodEnabled?: boolean;
  plan: GymPlan;
  trialEndsAt?: string;
  address?: string;
  city?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GymMembership {
  id: string;
  gymId: string;
  userId: string;
  role: GymMemberRole;
  joinedAt: string;
  isActive: boolean;
}

export interface GymTheme {
  primaryColor: string;   // Accent color (CTAs, active states) — replaces colors.warmAccent
  secondaryColor: string; // Background color — replaces colors.charcoal
  surfaceColor: string;   // Card/surface bg — replaces colors.darkGrey
  textPrimary: string;    // Primary text — replaces colors.offWhite
  textMuted: string;      // Muted text — replaces colors.steel
  headingFont: string;
  bodyFont: string;
  logoUrl?: string;
}

// ==================== User & Auth ====================

export type UserRole = 'member' | 'coach' | 'admin';

export type BeltRank = 'white' | 'blue' | 'purple' | 'brown' | 'black';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  beltRank: BeltRank;
  stripes: number;
  role: UserRole;
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  referralCode: string;
  joinedAt: string;
  lastActiveAt: string;
}

// ==================== Attendance ====================

export type Discipline = 'bjj-gi' | 'bjj-nogi' | 'muay-thai' | 'wrestling' | 'mma' | 'boxing' | 'open-mat' | 'crossfit' | 'crossfit-kids' | 'weightlifting' | 'hyrox' | 'open-gym';

export type TrainingIntensity = 'light' | 'moderate' | 'high' | 'all-out';

export interface ClassSession {
  id: string;
  name: string;
  discipline: Discipline;
  instructorId: string;
  instructorName: string;
  scheduledAt: string;
  durationMinutes: number;
  capacity: number;
  enrolledCount: number;
  level: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  classId: string;
  checkedInAt: string;
  intensityRating?: TrainingIntensity;
  xpEarned: number;
  className: string;
  discipline: Discipline;
}

// ==================== Gamification ====================

export type BadgeCategory = 'attendance' | 'discipline' | 'competition' | 'social' | 'secret';

export type LeagueType = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'black-belt-elite';

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  category: BadgeCategory;
  criteriaJson: Record<string, unknown>;
  isHidden: boolean;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  badge: Badge;
  earnedAt: string;
}

export type LeaderboardPeriod = 'weekly' | 'monthly' | 'all-time';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  avatarUrl?: string;
  beltRank: BeltRank;
  xp: number;
  league: LeagueType;
  rankChange: number; // positive = moved up, negative = moved down
}

export interface BadgeCatalogEntry extends Badge {
  earned: boolean;
  earnedAt: string | null;
}

export interface QuestWithProgress {
  quest: Quest;
  progress: number;
  completedAt: string | null;
}

export interface XpGuideAction {
  action: string;
  xp: number;
  description: string;
}

export interface StreakMilestone {
  days: number;
  xp: number;
  freezes: number;
}

export interface XpGuide {
  actions: XpGuideAction[];
  streakMultipliers: Array<{ streak: number; multiplier: number }>;
  streakMilestones: StreakMilestone[];
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastCheckinDate: string;
  freezesAvailable: number;
  freezesUsed: number;
  isActive: boolean;
}

// ==================== Referral ====================

export type ReferralStatus = 'invited' | 'trial-booked' | 'trial-completed' | 'signed-up' | 'active-30-days';

export interface Referral {
  id: string;
  referrerId: string;
  refereeEmail: string;
  refereeId?: string;
  refereeName?: string;
  status: ReferralStatus;
  createdAt: string;
  completedAt?: string;
  rewardId?: string;
}

export interface RewardTier {
  id: string;
  name: string;
  description: string;
  referralThreshold: number;
  iconUrl: string;
}

// ==================== Community ====================

export type ChannelCategory = 'general' | 'disciplines' | 'training' | 'media';

export interface Channel {
  id: string;
  name: string;
  description: string;
  category: ChannelCategory;
  discipline?: Discipline;
  memberCount: number;
  unreadCount: number;
  isPinned: boolean;
}

export interface Message {
  id: string;
  channelId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userBelt: BeltRank;
  content: string;
  mediaUrls?: string[];
  createdAt: string;
  parentId?: string; // for threads
  reactions: Record<string, number>; // emoji -> count
  replyCount: number;
}

// ==================== Video Library ====================

export type VideoCategory = 'game-demos' | 'live-rounds' | 'coach-insights' | 'member-highlights' | 'rolling-footage';

export interface Video {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: number; // seconds
  category: VideoCategory;
  discipline?: Discipline;
  uploaderId: string;
  uploaderName: string;
  viewCount: number;
  createdAt: string;
  isPinned: boolean;
}

// ==================== Journal ====================

export interface JournalEntry {
  id: string;
  userId: string;
  attendanceId?: string;
  className?: string;
  discipline?: Discipline;
  exploration: string;    // "What did I explore today?"
  challenge: string;      // "What felt challenging?"
  worked: string;         // "What seemed to work?"
  takeaways: string;      // "1-2 key takeaways"
  nextSession: string;    // "What do I want to explore next?"
  isSharedWithCoach: boolean;
  coachFeedback?: string;
  createdAt: string;
}

// ==================== Progress Tracking ====================

export interface SkillRating {
  category: string; // standup, ground-game, takedowns, submissions, defense
  rating: number;   // 0-100
  lastUpdated: string;
}

export interface Goal {
  id: string;
  userId: string;
  name: string;
  description?: string;
  category: string;
  currentValue: number;
  targetValue: number;
  deadline?: string;
  completedAt?: string;
  createdAt: string;
}

export interface BeltProgression {
  belt: BeltRank;
  stripes: number;
  promotedAt: string;
  promotedBy: string; // coach name
}

// ==================== Coaches Corner ====================

export interface ClassPlan {
  id: string;
  coachId: string;
  title: string;
  discipline: Discipline;
  techniques: ClassPlanBlock[];
  totalDuration: number;
  isTemplate: boolean;
  publishedToChannel?: string;
  createdAt: string;
}

export interface ClassPlanBlock {
  id: string;
  type: 'warmup' | 'technique' | 'drill' | 'positional' | 'sparring' | 'cooldown';
  name: string;
  description?: string;
  durationMinutes: number;
  order: number;
}

// ==================== WebSocket Events ====================

export interface WsEvent<T = unknown> {
  event: string;
  data: T;
  timestamp: string;
}

export type WsEventType =
  | 'message.new'
  | 'message.reaction'
  | 'badge.earned'
  | 'streak.updated'
  | 'xp.gained'
  | 'leaderboard.updated'
  | 'referral.status_changed'
  | 'checkin.confirmed'
  | 'class_plan.published'
  | 'journal.coach_feedback'
  | 'presence.update';

// ==================== Class Schedule ====================

export type ClassLevel = 'all-levels' | 'beginner' | 'intermediate' | 'advanced';

export type QuestType = 'weekly' | 'monthly' | 'special';

export interface ClassSchedule {
  id: string;
  name: string;
  discipline: Discipline;
  instructorId: string | null;
  dayOfWeek: number;
  startTime: string;
  durationMinutes: number;
  capacity: number | null;
  level: ClassLevel;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  type: QuestType;
  criteriaJson: Record<string, unknown>;
  xpReward: number;
  badgeRewardId: string | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface UserQuest {
  id: string;
  userId: string;
  questId: string;
  quest: Quest;
  progress: number;
  completedAt: string | null;
  createdAt: string;
}

export interface Course {
  id: string;
  name: string;
  description: string;
  discipline: Discipline;
  beltLevel: string | null;
  isPublished: boolean;
  modules: CourseModule[];
  createdAt: string;
  updatedAt: string;
}

export interface CourseModule {
  id: string;
  courseId: string;
  name: string;
  description: string | null;
  order: number;
  techniques: Array<{ name: string; description?: string }>;
  createdAt: string;
}

// ==================== Analytics ====================

export interface AdminOverview {
  totalMembers: number;
  activeMembers: number;
  newMembersThisMonth: number;
  checkInsThisWeek: number;
  checkInsThisMonth: number;
}

export interface AttendanceTrend {
  date: string;
  count: number;
}

export interface DisciplineBreakdown {
  discipline: Discipline;
  count: number;
  percentage: number;
}

// ==================== API Response ====================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
