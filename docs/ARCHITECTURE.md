# Training Grounds: MMA Gym Retention App — Architecture Design Document

## 1. Executive Summary

Training Grounds is a mobile-first retention platform designed for multi-discipline MMA gyms. The app bridges disconnected systems and re-engages members through gamification inspired by Duolingo (streaks, XP, badges) and Whoop (training analytics, leaderboards). Core features include attendance rewards, streak tracking, a referral engine with real-time tracking, Discord-like community channels, member profiles, and competition media galleries.

**Business Goals:**
- Increase member retention by 25% through engagement mechanics
- Reduce churn with streak/habit-building features
- Drive organic growth via referral program
- Foster community through internal social features
- Provide coaches with member engagement visibility

**Technical Goals:**
- Cross-platform mobile app (iOS/Android)
- Real-time features (chat, notifications, leaderboard updates)
- Scalable backend supporting 5,000+ concurrent users
- Clean handoff to development team with minimal ambiguity

---

## 2. System Architecture Overview

### 2.1 Architecture Diagram (Conceptual)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                                  │
├─────────────────────────────────────────────────────────────────┤
│  React Native App (iOS/Android via Expo)                         │
│  - Attendance check-in                                           │
│  - Community chat (WebSocket)                                    │
│  - Leaderboards & badges                                         │
│  - Profile & referral management                                │
└─────────────────────┬───────────────────────────────────────────┘
                      │
        ┌─────────────┴──────────────────┐
        │                                │
        ▼                                ▼
┌──────────────────────┐      ┌──────────────────────┐
│   REST API Server    │      │   WebSocket Server   │
│   (NestJS)           │      │   (Socket.io)        │
│ - Auth & profiles    │      │ - Real-time chat     │
│ - Attendance         │      │ - Notifications      │
│ - Gamification       │      │ - Leaderboard sync   │
│ - Referrals          │      │ - Presence tracking  │
└──────────┬───────────┘      └──────────┬───────────┘
           │                             │
           └──────────────┬──────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌──────────────────┐ ┌─────────────┐ ┌──────────────┐
│  PostgreSQL DB   │ │ Redis Cache │ │ Message Queue│
│ - Relational     │ │ - Sessions  │ │ (BullMQ)     │
│ - Transactional  │ │ - Leaderboards
│ - Source of truth│ │ - Rate limits│ │ - Badge calc │
│                  │ │ - Streaks   │ │ - XP updates │
└──────────────────┘ └─────────────┘ └──────────────┘
        │
        └──────────────┬────────────────┐
                       ▼                ▼
            ┌────────────────────┐ ┌──────────────┐
            │   AWS S3/R2        │ │ Firebase     │
            │   Media Storage    │ │ Cloud Msg    │
            │ - Photos/videos    │ │ Push notif   │
            └────────────────────┘ └──────────────┘
```

### 2.2 Core Services

| Service | Technology | Purpose |
|---------|-----------|---------|
| REST API | NestJS + Express | Core business logic, CRUD operations |
| Real-time | Socket.io | Chat, notifications, live leaderboards |
| Database | PostgreSQL 14+ | Persistent relational data |
| Cache Layer | Redis | Sessions, leaderboards, rate limits |
| Media | AWS S3 / Cloudflare R2 | Photo/video storage with CDN |
| Auth | Firebase Auth / Auth0 | JWT + OAuth2 social login |
| Push Notifications | Firebase Cloud Messaging | Mobile push delivery |
| Task Queue | BullMQ + Redis | Async badge/XP calculations |
| Monitoring | Sentry + DataDog | Error tracking, performance monitoring |
| CI/CD | GitHub Actions | Automated testing, deployment |
| Hosting | AWS ECS/Fargate or Railway | Containerized backend deployment |

---

## 3. Core Feature Modules

### 3.1 Gamification Engine

#### 3.1.1 XP System

**XP Earning Mechanics:**

| Action | Base XP | Modifiers | Caps |
|--------|---------|-----------|------|
| Class attendance | 50 XP | +5 per intensity rating (1-10) | 100 XP max per class |
| Streak maintained | 10 XP bonus per consecutive day | 2x multiplier at 7/30/60/100 day milestones | +50 XP weekly bonus |
| Competition entry | 250 XP | +100 if placing (1st-3rd) | — |
| Helping others | 25 XP per interaction | Capped at 3 per week | 75 XP/week |
| Technique milestone | 100 XP | One-time per milestone | Per belt level |
| Badge earned | 50 XP | — | Per badge |

**XP Decay (optional):** No XP decay; lifetime progression. XP displayed as lifetime + seasonal (resetting monthly) to encourage ongoing engagement.

**Implementation:**
```javascript
// Backend event: classAttendanceLogged
async function calculateXP(attendance) {
  let baseXP = 50;
  const intensity = attendance.intensity_rating; // 1-10
  const intensityBonus = Math.min(intensity * 5, 50);

  // Streak multiplier
  const user = await User.findById(attendance.user_id);
  let streakMultiplier = 1;
  if (user.current_streak >= 100) streakMultiplier = 2;
  else if (user.current_streak >= 60) streakMultiplier = 1.75;
  else if (user.current_streak >= 30) streakMultiplier = 1.5;
  else if (user.current_streak >= 7) streakMultiplier = 1.25;

  const totalXP = Math.floor((baseXP + intensityBonus) * streakMultiplier);

  user.total_xp += totalXP;
  user.seasonal_xp += totalXP;
  await user.save();

  return { totalXP, multiplier: streakMultiplier };
}
```

#### 3.1.2 Streak System (Duolingo-Inspired)

**Streak Rules:**
- **Increment:** +1 day after checking in to any class (once per 24h, resets at UTC midnight)
- **Freeze:** Prevents streak loss on up to 2 missed days per month. Earned via:
  - Completing 7-day streak (earn 1 free freeze)
  - Completing 30-day streak (earn 2 free freezes)
  - Purchasing via in-app store (150 gems / $0.99)
- **Loss:** Streak resets to 0 if 2+ consecutive days missed AND no freeze available
- **Grace Period:** 48-hour gap between last check-in and next check-in without loss (applied once per month)
- **Milestones:**
  - 7 days: +50 XP, "First Week" badge, unlock Gold status
  - 30 days: +200 XP, "30-Day Legend" badge, +1 freeze, free merch store credit
  - 60 days: +300 XP, "Centurion" badge, +2 freezes
  - 100 days: +500 XP, "Ironclad" badge, "Ambassador" status, exclusive merch
  - 365 days: +2000 XP, "Full Circle" badge, lifetime gym merchandise access

**Data Model:**
```sql
CREATE TABLE streaks (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_checkin_at TIMESTAMP,
  freeze_count INTEGER DEFAULT 0,
  grace_period_used_this_month BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Streak Check-in Logic:**
```javascript
async function handleCheckIn(userId, classId) {
  const user = await User.findById(userId);
  const streak = await Streak.findOne({ user_id: userId });

  const lastCheckin = new Date(streak.last_checkin_at);
  const now = new Date();
  const hoursSince = (now - lastCheckin) / (1000 * 60 * 60);

  // Already checked in today
  if (hoursSince < 24) {
    return { status: 'already_checked_in', streak: streak.current_streak };
  }

  const daysSince = Math.floor(hoursSince / 24);

  if (daysSince === 1) {
    // Consecutive day
    streak.current_streak += 1;
  } else if (daysSince === 2 && streak.freeze_count > 0) {
    // Grace day with freeze
    streak.freeze_count -= 1;
  } else if (daysSince > 2 || (daysSince === 2 && !streak.grace_period_used_this_month)) {
    // Break streak or use grace period
    if (daysSince === 2 && !streak.grace_period_used_this_month) {
      streak.grace_period_used_this_month = true;
      streak.current_streak += 1;
    } else {
      streak.longest_streak = Math.max(streak.longest_streak, streak.current_streak);
      streak.current_streak = 1;
    }
  }

  streak.last_checkin_at = now;
  await streak.save();

  return { status: 'success', streak: streak.current_streak };
}
```

#### 3.1.3 Badges & Achievements

**Badge Categories:**

1. **Attendance Badges** (Tier system)
   - Warrior (5 classes)
   - Iron Will (30 classes)
   - Centurion (100 classes)
   - Legend (365+ days)

2. **Discipline Mastery** (Per martial art)
   - BJJ Explorer (10 BJJ classes)
   - Submission Specialist (50 BJJ classes)
   - Striker (10 Muay Thai classes)
   - Muay Master (50 Muay Thai classes)
   - Grappler (10 Wrestling classes)
   - MMA Generalist (10 classes each: BJJ, MT, MMA)

3. **Competition Badges**
   - First Comp (entered competition)
   - Podium Finisher (placed 1st-3rd)
   - Serial Competitor (3+ competitions)

4. **Social Badges**
   - Mentor (10 members helped)
   - Hype Machine (50 reactions/encouragements)
   - Community Builder (created/moderated channels)

5. **Secret Badges** (Hidden until earned)
   - "Midnight Warrior" (check in after 10 PM)
   - "Never Stop" (reached 365-day streak)
   - "Comeback Kid" (recovered from 0 streak to 30+ days)

**Badge Data Schema:**
```sql
CREATE TABLE badges (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url VARCHAR(500),
  category VARCHAR(50), -- attendance, discipline, competition, social, secret
  criteria_json JSONB, -- {type: 'class_count', value: 100, discipline: 'bjj'}
  is_hidden BOOLEAN DEFAULT FALSE,
  xp_reward INTEGER DEFAULT 50,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_badges (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  badge_id UUID NOT NULL REFERENCES badges(id),
  earned_at TIMESTAMP DEFAULT NOW(),
  progress INTEGER DEFAULT 0, -- for multi-tier badges
  UNIQUE(user_id, badge_id)
);
```

**Badge Calculation (Event-Driven):**
```javascript
// Trigger after each attendance
async function checkBadgeEligibility(userId) {
  const user = await User.findById(userId);
  const attendance = await Attendance.countByUser(userId);
  const badges = await Badge.find({});

  for (const badge of badges) {
    if (await isBadgeEarned(user, badge, attendance)) {
      await UserBadge.create({
        user_id: userId,
        badge_id: badge.id,
        earned_at: new Date()
      });

      // Award XP & notification
      await notifyBadgeEarned(userId, badge);
      await addXP(userId, badge.xp_reward);
    }
  }
}
```

#### 3.1.4 Leaderboards (Whoop-Inspired)

**League System (Dynamic Promotion/Demotion):**

1. **White Belt League** (0-499 XP)
2. **Blue Belt League** (500-1,999 XP)
3. **Purple Belt League** (2,000-4,999 XP)
4. **Brown Belt League** (5,000-9,999 XP)
5. **Black Belt League** (10,000+ XP)

**Leaderboard Types:**

| Type | Period | Scope | Reset |
|------|--------|-------|-------|
| Weekly XP | Mon-Sun | Individual | Weekly |
| Monthly Streak | Calendar month | Individual | Monthly |
| Team Class Count | Calendar month | By discipline (BJJ team, MT team, etc.) | Monthly |
| All-Time XP | Forever | Individual | Never |
| Monthly Referral | Calendar month | Individual | Monthly |

**Leaderboard Caching (Redis):**
```javascript
async function updateLeaderboard(type, period) {
  const key = `leaderboard:${type}:${period}`;
  const ttl = calculateTTL(period); // 1 hour for weekly, 1 day for monthly

  // Use Redis sorted set for O(log N) ranking
  const ranks = await getTopScores(type, period, 100);
  await redis.del(key);

  for (const rank of ranks) {
    await redis.zadd(
      key,
      rank.score,
      JSON.stringify({ user_id: rank.user_id, score: rank.score })
    );
  }

  await redis.expire(key, ttl);
}

// Quick rank lookup
async function getUserRank(userId, type, period) {
  const key = `leaderboard:${type}:${period}`;
  const rank = await redis.zrevrank(key, userId);
  return rank + 1; // Redis is 0-indexed
}
```

#### 3.1.5 Belt & Rank Progression Tracker

**Belt Progression Model:**
```
White Belt (0 classes) → Stripe 1 → Stripe 2 → Stripe 3
   → Blue Belt (50 classes) → Stripe 1 → Stripe 2 → Stripe 3
   → Purple Belt (150 classes) → ... → Brown Belt → Black Belt
```

**Tracking:**
```sql
CREATE TABLE belt_progression (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  discipline VARCHAR(50), -- bjj, muay_thai, wrestling, mma
  current_belt VARCHAR(50), -- white, blue, purple, brown, black
  current_stripe INTEGER DEFAULT 0, -- 0-3
  total_classes_this_belt INTEGER DEFAULT 0,
  promoted_at TIMESTAMP,
  time_at_belt_days INTEGER,
  technique_checklist_json JSONB -- {kimura: true, triangle: true, ...}
);

CREATE TABLE technique_milestones (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  discipline VARCHAR(50),
  belt_level VARCHAR(50),
  technique_name VARCHAR(100),
  demonstrated_at TIMESTAMP,
  notes TEXT
);
```

**Belt Timeline UI Data:**
```javascript
async function getBeltProgression(userId, discipline) {
  const progression = await BeltProgression.findOne({
    user_id: userId,
    discipline
  });

  return {
    currentBelt: progression.current_belt,
    currentStripe: progression.current_stripe,
    classesToNextRank: 50 - progression.total_classes_this_belt,
    promotionProgress: (progression.total_classes_this_belt / 50) * 100,
    timeAtCurrentBelt: daysElapsed(progression.promoted_at),
    techniqueChecklist: progression.technique_checklist_json,
    previousPromotions: await BeltProgression.findHistory(userId, discipline)
  };
}
```

---

## 4. Attendance & Check-in System

### 4.1 Check-in Methods

**Primary Methods:**
1. **QR Code** — Gym posts QR at entrance / on class board
2. **NFC Tag** — Members tap phone to NFC reader
3. **Manual Lookup** — Search class by name/time in app

**QR Code Flow:**
```
1. Gym generates dynamic QR for each class session
2. QR encodes: { classId, scheduleId, timestamp }
3. App scans QR → calls POST /attendance/check-in
4. Server validates timestamp (must be within 15 min of class start)
5. Automatic XP/streak updates
6. Real-time leaderboard refresh
```

### 4.2 Training Load Scoring (Whoop-Inspired)

**Post-Class Survey (1 min):**
```
Question: "How intense was today's training?"
Response: Slider 1-10 (visual: red = intense, green = light)

Question: "How did you feel?"
Options:
  - Strong & energized (recovery: high)
  - Normal day (recovery: medium)
  - Exhausted (recovery: low)
  - Injured / couldn't finish (recovery: critical)
```

**Training Load Calculation:**
```javascript
async function calculateTrainingLoad(attendanceId) {
  const attendance = await Attendance.findById(attendanceId);
  const intensity = attendance.intensity_rating; // 1-10
  const duration = attendance.class_duration_min; // typically 60-90
  const recovery = attendance.recovery_score; // 1-4

  // Formula: (intensity * duration * (recovery_inverse)) / 100
  const trainingLoad = Math.round(
    (intensity * (duration / 60) * (5 - recovery)) / 2
  );

  return {
    strain: trainingLoad,
    category: trainingLoad < 40 ? 'easy' : trainingLoad < 70 ? 'moderate' : 'hard'
  };
}
```

**Weekly/Monthly Reports:**
```javascript
async function getMonthlyReport(userId, month) {
  const attendance = await Attendance.find({
    user_id: userId,
    checked_in_at: { $gte: monthStart, $lte: monthEnd }
  });

  return {
    totalClasses: attendance.length,
    totalStrain: attendance.reduce((sum, a) => sum + a.training_load, 0),
    avgStrain: avgStrain / attendance.length,
    favoriteClass: mostFrequentDiscipline(attendance),
    recoveryTrend: calculateTrend(attendance.map(a => a.recovery_score)),
    recommendations: generateRecommendations(totalStrain, recoveryTrend)
  };
}
```

**Rest Recommendations Logic:**
```
If weekly strain > 350: recommend 1-2 rest days
If weekly strain > 500: recommend 2-3 rest days + active recovery
If trend shows declining recovery: prompt water intake, sleep, nutrition tips
```

### 4.3 Calendar Heatmap Visualization

**GitHub-style heatmap:**
- Y-axis: Days of week (Mon-Sun)
- X-axis: Weeks (52 weeks visible)
- Cell color: Intensity of training (light gray = no class, light green = 1 class, dark green = 3+ classes)
- Click cell: Show classes attended that day

**Data Structure:**
```sql
CREATE TABLE attendance_heatmap (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  class_count INTEGER DEFAULT 0,
  total_strain INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);

-- Daily aggregation trigger (runs at 11:59 PM daily)
CREATE OR REPLACE FUNCTION aggregate_daily_heatmap()
RETURNS void AS $$
BEGIN
  INSERT INTO attendance_heatmap (user_id, date, class_count, total_strain)
  SELECT
    user_id,
    DATE(checked_in_at),
    COUNT(*),
    COALESCE(SUM(training_load), 0)
  FROM attendance
  WHERE DATE(checked_in_at) = CURRENT_DATE - INTERVAL '1 day'
  GROUP BY user_id
  ON CONFLICT (user_id, date) DO UPDATE
  SET class_count = EXCLUDED.class_count, total_strain = EXCLUDED.total_strain;
END;
$$ LANGUAGE plpgsql;
```

---

## 5. Referral Program

### 5.1 Referral Pipeline & Status Tracking

**Status Flow:**
```
Invited
  → Trial Booked (within 7 days)
    → Trial Completed (showed up to trial class)
      → Signed Up (purchased membership)
        → Active (paid for 30+ days)
          → Lapsed (no payment after 30 days)
```

**Events & Notifications:**
```javascript
const referralPipeline = {
  'invited': {
    action: 'Referred sends unique link',
    delay: 0,
    notification: 'Your referral link is ready!',
    referee_email: true
  },
  'trial_booked': {
    action: 'Referee books trial class',
    delay: '7d timeout',
    notification: 'Your ref booked their trial!',
    reward_preview: 'Free merch credit pending...'
  },
  'trial_completed': {
    action: 'Referee attends trial',
    delay: 0,
    notification: 'Trial completed! Waiting for signup...',
    referrer_action: 'Message "How was it?" to encourage signup'
  },
  'signed_up': {
    action: 'Referee purchases membership',
    delay: 0,
    notification: 'They signed up! 🎉 Reward processing...',
    reward_grant: 'Immediate'
  },
  'active_30_days': {
    action: 'Referee maintains membership 30 days',
    delay: '30d',
    notification: 'Referral milestone! Full reward unlocked',
    reward_grant: 'Immediate'
  }
};
```

**Database Schema:**
```sql
CREATE TABLE referrals (
  id UUID PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES users(id),
  referee_email VARCHAR(255),
  referee_id UUID REFERENCES users(id),
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'invited', -- invited, trial_booked, trial_completed, signed_up, active, lapsed
  created_at TIMESTAMP DEFAULT NOW(),
  trial_booked_at TIMESTAMP,
  trial_completed_at TIMESTAMP,
  signed_up_at TIMESTAMP,
  active_30d_at TIMESTAMP,
  reward_id UUID REFERENCES rewards(id),
  reward_claimed_at TIMESTAMP,
  last_status_update TIMESTAMP DEFAULT NOW()
);

CREATE TABLE referral_status_log (
  id UUID PRIMARY KEY,
  referral_id UUID NOT NULL REFERENCES referrals(id),
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  changed_at TIMESTAMP DEFAULT NOW(),
  triggered_by VARCHAR(100), -- 'trial_booked_webhook', 'signup_webhook', 'manual', 'expiry_check'
  metadata JSONB
);
```

### 5.2 Tiered Rewards

```javascript
const referralRewards = [
  {
    threshold: 1,
    name: 'Starter Reward',
    description: '$25 merch store credit',
    type: 'store_credit',
    value: 2500, // cents
    icon: 'gift'
  },
  {
    threshold: 3,
    name: 'Training Grounds Hoodie',
    description: 'Custom gym hoodie (shipped)',
    type: 'physical_good',
    value: 0,
    inventory: true
  },
  {
    threshold: 5,
    name: 'Free Month',
    description: 'One free month of membership',
    type: 'membership_credit',
    value: 0,
    duration_days: 30
  },
  {
    threshold: 10,
    name: 'Ambassador Status',
    description: 'Lifetime status badge + perks',
    type: 'status',
    perks: ['free_merch_per_year', 'coach_visibility', 'featured_profile']
  }
];

async function claimReferralReward(userId, referralCount) {
  const applicableReward = referralRewards.find(r => r.threshold <= referralCount);

  if (!applicableReward) return null;

  if (applicableReward.type === 'store_credit') {
    await User.addMerchCredit(userId, applicableReward.value);
  } else if (applicableReward.type === 'membership_credit') {
    await User.extendMembership(userId, applicableReward.duration_days);
  } else if (applicableReward.type === 'status') {
    await User.grantAmbassadorStatus(userId);
  }

  return applicableReward;
}
```

### 5.3 Referral Leaderboard & Tracking

```javascript
async function getReferralLeaderboard(period = 'month') {
  const dateRange = getPeriodDateRange(period);

  const leaderboard = await sequelize.query(`
    SELECT
      u.id,
      u.name,
      u.avatar_url,
      COUNT(CASE WHEN r.status = 'active' THEN 1 END) as active_referrals,
      COUNT(CASE WHEN r.status IN ('active', 'signed_up', 'trial_completed') THEN 1 END) as qualified_referrals,
      COUNT(*) as total_referrals,
      SUM(CASE WHEN rr.type = 'membership_credit' THEN 1 ELSE 0 END) as free_months_earned
    FROM users u
    LEFT JOIN referrals r ON u.id = r.referrer_id AND r.created_at BETWEEN :start AND :end
    LEFT JOIN rewards rr ON r.reward_id = rr.id
    WHERE COUNT(*) > 0
    GROUP BY u.id, u.name, u.avatar_url
    ORDER BY active_referrals DESC, qualified_referrals DESC
    LIMIT 100
  `, { replacements: { start: dateRange.start, end: dateRange.end } });

  return leaderboard.map((user, index) => ({ ...user, rank: index + 1 }));
}
```

### 5.4 Social Sharing Integration

```javascript
// Client-side (React Native)
const shareReferralLink = async (userId, userName) => {
  const referralCode = await fetchReferralCode(userId);
  const deepLink = `tg://invite/${referralCode}`;
  const webLink = `https://training-grounds.app/join/${referralCode}`;

  const message = `Join me at Training Grounds! Use code ${referralCode} for a free trial. ${webLink}`;

  await Share.open({
    title: 'Join Training Grounds',
    message,
    url: webLink,
    social: ['instagram', 'facebook', 'twitter', 'email'],
    showAppsToView: true
  });
};
```

---

## 6. Community Hub (Discord-Like Architecture)

### 6.1 Channel System

**Channel Types:**

| Channel | Purpose | Members | Moderation |
|---------|---------|---------|-----------|
| #general | Gym announcements, general chat | All | Admins only post |
| #bjj | BJJ-specific training tips, competition talk | BJJ members | Coaches + ambassadors |
| #muay-thai | Muay Thai class discussion | MT members | Coaches + ambassadors |
| #mma | Mixed training, cross-discipline tips | All | Coaches |
| #competitions | Comp prep, results, video | Competitors | Coaches |
| #off-topic | Non-training chat, memes, events | All | Community |
| #introductions | New member intros | All | Auto-moderation |

**Channel Permissions Model:**
```javascript
const channelPermissions = {
  admin: {
    create_channel: true,
    delete_channel: true,
    edit_channel: true,
    pin_messages: true,
    moderate_all: true,
    delete_any_message: true
  },
  coach: {
    create_channel: false,
    pin_messages: true,
    moderate_assigned_channels: true,
    delete_inappropriate: true
  },
  ambassador: {
    pin_messages_in_community_channels: true,
    flag_inappropriate: true
  },
  member: {
    post_messages: true,
    upload_media: true,
    react_to_messages: true,
    create_threads: true
  },
  trial: {
    read_only_general: true,
    cannot_post: true
  }
};
```

### 6.2 Message Architecture

**Message Data Model:**
```sql
CREATE TABLE channels (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50), -- announcement, discipline, competition, social
  discipline VARCHAR(50), -- bjj, muay_thai, mma, wrestling, null
  is_private BOOLEAN DEFAULT FALSE,
  owner_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  media_urls TEXT[], -- JSON array of S3 URLs
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  parent_id UUID REFERENCES messages(id), -- for threads
  is_pinned BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP, -- soft delete
  FOREIGN KEY (channel_id) REFERENCES channels(id)
);

CREATE TABLE reactions (
  id UUID PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  emoji VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

CREATE TABLE channel_memberships (
  id UUID PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES channels(id),
  user_id UUID NOT NULL REFERENCES users(id),
  role VARCHAR(50) DEFAULT 'member', -- admin, coach, member
  joined_at TIMESTAMP DEFAULT NOW(),
  muted BOOLEAN DEFAULT FALSE,
  UNIQUE(channel_id, user_id)
);

CREATE TABLE thread_subscriptions (
  id UUID PRIMARY KEY,
  parent_message_id UUID NOT NULL REFERENCES messages(id),
  user_id UUID NOT NULL REFERENCES users(id),
  subscribed_at TIMESTAMP DEFAULT NOW(),
  unread_count INTEGER DEFAULT 0,
  UNIQUE(parent_message_id, user_id)
);
```

### 6.3 Real-time Features via WebSocket

**Socket.io Events:**

```javascript
// Client connects to chat server
socket.on('connect', (data) => {
  socket.join(`channel:${channelId}`);
  socket.join(`user:${userId}`); // DM room
});

// Message posting
socket.emit('message:send', {
  channel_id: channelId,
  content: 'Great session today!',
  media_urls: ['s3://...image.jpg']
});

socket.on('message:new', (data) => {
  // Broadcast to channel subscribers
  io.to(`channel:${data.channel_id}`).emit('message:created', {
    id: data.message_id,
    user: data.user,
    content: data.content,
    created_at: data.created_at,
    avatar: data.avatar_url
  });
});

// Typing indicator
socket.emit('typing:start', { channel_id: channelId });
io.to(`channel:${channelId}`).emit('user:typing', {
  user_id: userId,
  user_name: userName
  });

// Reactions (real-time)
socket.emit('reaction:add', {
  message_id: messageId,
  emoji: '🔥'
});

io.to(`channel:${channelId}`).emit('reaction:updated', {
  message_id: messageId,
  reactions: [{ emoji: '🔥', count: 5, users: [...] }]
});

// Thread notifications
socket.emit('thread:subscribe', { parent_message_id });
socket.on('thread:new_reply', (data) => {
  // Only sent to subscribers
});

// Presence tracking
io.to(`channel:${channelId}`).emit('presence:update', {
  online_members: 23,
  members_typing: ['john', 'jane']
});
```

### 6.4 Media Upload & Compression

**Photo/Video Upload Flow:**

```javascript
// Client (React Native)
const uploadMedia = async (media, channelId) => {
  // Compress before upload
  const compressed = await ImageResizer.createResizedImage(
    media.uri,
    1200, // max width
    1200, // max height
    'JPEG',
    85, // quality
    0
  );

  // Generate thumbnail
  const thumb = await generateThumbnail(media.uri, 200, 200);

  // Upload with progress
  const uploadResponse = await fetch('https://api.training-grounds.app/media/upload', {
    method: 'POST',
    body: formData, // includes compressed media + thumb
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const { mediaId, cdnUrl, thumbnailUrl } = await uploadResponse.json();

  // Post message with media reference
  await socket.emit('message:send', {
    channel_id: channelId,
    content: caption,
    media_id: mediaId
  });
};

// Server (NestJS)
@Controller('media')
export class MediaController {
  @Post('upload')
  async uploadMedia(@UploadedFile() file, @Body() body) {
    // Validate MIME type (image/jpeg, image/png, video/mp4 only)
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type');
    }

    // Scan for viruses (ClamAV integration)
    const isSafe = await scanForViruses(file.buffer);
    if (!isSafe) {
      throw new BadRequestException('File failed security scan');
    }

    // Upload to S3 with optimized settings
    const key = `media/${userId}/${uuidv4()}.${getExtension(file.mimetype)}`;
    await s3.putObject({
      Bucket: 'training-grounds-media',
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      CacheControl: 'max-age=31536000', // 1 year for immutable assets
      ServerSideEncryption: 'AES256'
    });

    // Store metadata
    const media = await Media.create({
      key,
      user_id: userId,
      channel_id: body.channel_id,
      file_size: file.size,
      mime_type: file.mimetype,
      cdn_url: `https://cdn.training-grounds.app/${key}`
    });

    return { mediaId: media.id, cdnUrl: media.cdn_url };
  }
}
```

### 6.5 Competition Media Gallery

**Dedicated Gallery Structure:**
```sql
CREATE TABLE competition_galleries (
  id UUID PRIMARY KEY,
  competition_id UUID NOT NULL REFERENCES competitions(id),
  title VARCHAR(255),
  description TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE gallery_media (
  id UUID PRIMARY KEY,
  gallery_id UUID NOT NULL REFERENCES competition_galleries(id),
  media_id UUID NOT NULL REFERENCES media(id),
  uploaded_by UUID NOT NULL REFERENCES users(id),
  caption TEXT,
  tags TEXT[], -- athlete names, techniques
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE gallery_media_likes (
  id UUID PRIMARY KEY,
  gallery_media_id UUID NOT NULL REFERENCES gallery_media(id),
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(gallery_media_id, user_id)
);
```

---


### 3.8 Class Plans & Study Materials

**Overview:**
Coaches share structured class plans, study materials, and topic-based resources. Students access materials organized by martial art discipline and topic, similar to a course syllabus system.

**Key Features:**
- Coaches upload class plans (PDFs, documents, images, links)
- Topic-based organization (e.g., "Guard Position Basics", "Striking Fundamentals")
- Materials tagged by discipline and difficulty level
- Students bookmark and download materials for offline access
- Search and filter by topic, discipline, coach
- Materials linked to specific classes for context

**Data Model:**
```sql
CREATE TABLE class_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES users(id),
  discipline_id UUID REFERENCES disciplines(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  topic VARCHAR(255),
  difficulty_level VARCHAR(50), -- beginner, intermediate, advanced
  material_type VARCHAR(50), -- pdf, video_link, image, document
  s3_key VARCHAR(500),
  cdn_url VARCHAR(500),
  file_size BIGINT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_materials_coach (coach_id),
  INDEX idx_materials_discipline (discipline_id),
  INDEX idx_materials_topic (topic)
);

CREATE TABLE class_material_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES class_materials(id) ON DELETE CASCADE,
  bookmarked_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, material_id)
);

CREATE TABLE class_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES users(id),
  class_id UUID REFERENCES classes(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date_assigned DATE,
  curriculum_week INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_class_plans_coach (coach_id)
);

CREATE TABLE class_plan_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_plan_id UUID NOT NULL REFERENCES class_plans(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES class_materials(id),
  position_order INTEGER,
  notes TEXT
);
```

---

### 3.9 Enhanced Progress Tracking

**Overview:**
Multi-level progress tracking including skill development (technique-level), session notes, belt/stripe history, and personal goal management.

**Skill Development Tracking:**
- Track techniques learned per class/session
- Granular skill progression (Not Started → Learning → Practicing → Proficient → Teaching)
- Coach can assign techniques to classes
- Students mark progress on techniques
- Personal technique library visible in profile

**Session Logs:**
- Auto-prompted journal entry after each class
- Reflections linked to specific class attendance
- Coach can add notes to student's session after class

**Belt/Stripe Record:**
- Complete promotion history (date, stripe level, discipline)
- Certificates/recognition shareable
- Progression timeline visible in profile
- Achievements highlighted in community

**Personal Goals:**
- Set discipline-specific goals (e.g., "Get blue belt in BJJ")
- Timeline and milestones
- Track progress toward goal
- Goals visible in profile (optionally private)
- Notifications when milestones achieved

**Data Model:**
```sql
CREATE TABLE techniques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  discipline_id UUID NOT NULL REFERENCES disciplines(id),
  description TEXT,
  difficulty_level VARCHAR(50),
  category VARCHAR(100),
  video_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_technique_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  technique_id UUID NOT NULL REFERENCES techniques(id),
  progress_level VARCHAR(50), -- not_started, learning, practicing, proficient, teaching
  first_learned_at TIMESTAMP,
  last_practiced_at TIMESTAMP,
  practice_count INTEGER DEFAULT 0,
  notes TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, technique_id)
);

CREATE TABLE session_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attendance_id UUID NOT NULL REFERENCES attendance(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id),
  explored TEXT, -- "What did I explore today?"
  challenging TEXT, -- "What felt challenging?"
  worked TEXT, -- "What seemed to work?"
  takeaways TEXT, -- "1-2 key takeaways"
  next_focus TEXT, -- "What do I want to explore next?"
  private BOOLEAN DEFAULT TRUE,
  shared_with_coach BOOLEAN DEFAULT FALSE,
  coach_feedback TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_session_logs_user (user_id),
  INDEX idx_session_logs_class (class_id)
);

CREATE TABLE belt_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  discipline_id UUID NOT NULL REFERENCES disciplines(id),
  previous_belt VARCHAR(50),
  previous_stripe INTEGER DEFAULT 0,
  new_belt VARCHAR(50) NOT NULL,
  new_stripe INTEGER DEFAULT 0,
  promoted_by UUID REFERENCES users(id),
  promoted_at TIMESTAMP DEFAULT NOW(),
  certificate_url VARCHAR(500),
  INDEX idx_promotions_user (user_id),
  INDEX idx_promotions_date (promoted_at)
);

CREATE TABLE personal_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  discipline_id UUID REFERENCES disciplines(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  goal_type VARCHAR(50), -- belt_level, competition, technique_mastery, attendance
  target_value VARCHAR(255),
  target_date DATE,
  progress_percent INTEGER DEFAULT 0,
  status VARCHAR(50), -- active, achieved, abandoned
  visibility VARCHAR(50) DEFAULT 'private', -- private, friends, public
  created_at TIMESTAMP DEFAULT NOW(),
  achieved_at TIMESTAMP,
  INDEX idx_goals_user (user_id),
  INDEX idx_goals_status (status)
);
```

---

### 3.10 Rolling / Video Library

**Overview:**
Centralized video library with game demonstrations, competition footage, live round breakdowns, coach commentary, member highlights, and peer feedback system.

**Features:**
- Game/competition demonstration videos
- Live round recordings with coach breakdown/commentary
- Coach insights and commentary overlays
- Member highlight reels
- Rolling footage upload with tagging
- Feedback system (peer and coach feedback on uploaded footage)
- Video library searchable by technique, opponent level, discipline
- Transcripts and timestamps for longer videos

**Data Model:**
```sql
CREATE TABLE rolling_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  discipline_id UUID REFERENCES disciplines(id),
  video_type VARCHAR(50), -- demo, competition, live_round, training, highlight
  s3_key VARCHAR(500) NOT NULL,
  cdn_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  duration_seconds INTEGER,
  tags TEXT[],
  techniques_featured TEXT[], -- array of technique names
  visibility VARCHAR(50) DEFAULT 'public', -- public, friends, private
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_rolling_videos_uploader (uploader_id),
  INDEX idx_rolling_videos_discipline (discipline_id),
  INDEX idx_rolling_videos_created (created_at)
);

CREATE TABLE video_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES rolling_videos(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feedback_text TEXT NOT NULL,
  timestamp_seconds INTEGER,
  is_coach_feedback BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_video_feedback_video (video_id)
);

CREATE TABLE video_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES rolling_videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(video_id, user_id)
);

CREATE TABLE coach_video_breakdowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES rolling_videos(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES users(id),
  breakdown_text TEXT,
  video_timestamp_start INTEGER,
  video_timestamp_end INTEGER,
  key_points TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_breakdown_coach (coach_id)
);
```

---

### 3.11 Coaches Corner (Coach-Only Tools)

**Overview:**
Dedicated coach dashboard with session planning, drill design, class templates, and ability to push plans to students.

**Features:**
- Session/class planning interface with timeline
- Drill builder (create positional games and drills with parameters)
- Class templates (reusable class structures/warm-ups)
- Push class plans to students (notifications)
- View student progress on assigned techniques
- Monitor attendance and engagement by student/class
- Feedback tools (mark technique progress, add notes)
- Curriculum builder (plan progressions across weeks/months)

**Data Model:**
```sql
CREATE TABLE drill_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  discipline_id UUID NOT NULL REFERENCES disciplines(id),
  drill_type VARCHAR(50), -- positional, live_rolling, cardio, combo
  duration_minutes INTEGER,
  difficulty_level VARCHAR(50),
  setup_instructions TEXT,
  technique_focus TEXT[], -- techniques targeted
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_drills_coach (coach_id)
);

CREATE TABLE class_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  discipline_id UUID NOT NULL REFERENCES disciplines(id),
  description TEXT,
  structure JSONB, -- {warmup, drills: [{drill_id, duration}], cooldown}
  default_duration_minutes INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_templates_coach (coach_id)
);

CREATE TABLE session_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES users(id),
  class_id UUID REFERENCES classes(id),
  planned_date DATE,
  title VARCHAR(255) NOT NULL,
  focus_technique VARCHAR(255),
  structure JSONB, -- {warmup, drills, cooldown, timing}
  notes TEXT,
  material_id UUID REFERENCES class_materials(id),
  pushed_to_students BOOLEAN DEFAULT FALSE,
  pushed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_session_plans_coach (coach_id),
  INDEX idx_session_plans_date (planned_date)
);

CREATE TABLE session_plan_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_plan_id UUID NOT NULL REFERENCES session_plans(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  received_at TIMESTAMP DEFAULT NOW(),
  viewed_at TIMESTAMP,
  UNIQUE(session_plan_id, student_id)
);
```

---

### 3.12 Deep Reflection Journal

**Overview:**
Prompted journaling system linked to each class, with private journaling, optional coach sharing, and coach feedback capabilities.

**Features:**
- Auto-prompted journal entries after class attendance
- 5 standard prompts (explore, challenge, worked, takeaways, next focus)
- Private by default, optionally shareable with coach
- Coach can request permission to review
- Coach feedback and comments on journal entries
- Entry history viewable by student
- Export journal entries (PDF/document)
- Searchable by date, class, topic

**Data Model:** (Already covered under 3.9 session_logs table)

---

### 3.13 Community Channels Enhancement

**Overview:**
Consolidate WhatsApp groups and enhance community features with app-native channels organized by class/group type.

**Features:**
- Class-specific channels (Lunch class, Open mat, Competition team, etc.)
- Organized channel categories/headings
- Rolling footage channel for feedback
- Feature to migrate WhatsApp conversations into channels
- Pinned class schedules and announcements
- Channel moderation (mute members, delete messages, pin content)
- Member mentions and notifications
- Channel notifications per user preference

**Data Model Enhancement:**
```sql
-- Add to channels table
ALTER TABLE channels ADD COLUMN channel_category VARCHAR(100); -- class, open_mat, competition, general, off_topic
ALTER TABLE channels ADD COLUMN is_rolling_feedback BOOLEAN DEFAULT FALSE;
ALTER TABLE channels ADD COLUMN class_id UUID REFERENCES classes(id);
ALTER TABLE channels ADD COLUMN class_type VARCHAR(100); -- lunch_class, open_mat, etc.

CREATE TABLE channel_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  position_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Link channels to categories
ALTER TABLE channels ADD COLUMN category_id UUID REFERENCES channel_categories(id);
```

---

---

## 7. Member Profiles

### 7.1 Profile Data Model

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  bio TEXT,
  belt_rank_bjj VARCHAR(50), -- white, blue, purple, brown, black
  belt_stripe_bjj INTEGER DEFAULT 0, -- 0-3
  joined_at TIMESTAMP DEFAULT NOW(),
  total_xp INTEGER DEFAULT 0,
  seasonal_xp INTEGER DEFAULT 0, -- resets monthly
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  membership_status VARCHAR(50), -- active, trial, lapsed, paused
  membership_end_date TIMESTAMP,
  referral_code VARCHAR(20) UNIQUE,
  is_coach BOOLEAN DEFAULT FALSE,
  is_ambassador BOOLEAN DEFAULT FALSE,
  privacy_level VARCHAR(50) DEFAULT 'friends', -- public, friends, private
  last_checkin_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_training_stats (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  total_classes_all_time INTEGER DEFAULT 0,
  total_classes_this_month INTEGER DEFAULT 0,
  total_classes_this_year INTEGER DEFAULT 0,
  total_training_load_this_month INTEGER DEFAULT 0,
  favorite_discipline VARCHAR(50),
  favorite_instructor VARCHAR(255),
  last_updated TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_badges_featured (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  badge_id UUID NOT NULL REFERENCES badges(id),
  position INTEGER, -- 0-5 (show max 6)
  UNIQUE(user_id, position)
);
```

### 7.2 Profile Display

```typescript
interface UserProfile {
  // Basic Info
  name: string;
  avatar_url: string;
  bio: string;
  joined_at: Date;

  // Belt & Discipline
  belt_info: {
    discipline: string;
    current_belt: string;
    current_stripe: number;
    time_at_belt_days: number;
    classes_to_next_rank: number;
  }[];

  // Gamification Stats
  stats: {
    total_classes: number;
    current_streak: number;
    longest_streak: number;
    total_xp: number;
    league: string; // "Black Belt League"
    rank_in_league: number;
  };

  // Featured Badges (max 6)
  featured_badges: Badge[];
  all_badges_count: number;

  // Recent Activity
  recent_activity: {
    type: string; // 'class_attended', 'badge_earned', 'referral_activated'
    description: string;
    timestamp: Date;
    icon: string;
  }[];

  // Referral Stats
  referral_stats: {
    code: string;
    total_invited: number;
    active_referrals: number;
    next_milestone_in: number;
    next_reward: string;
  };

  // Training Trend
  training_trend: {
    month: string;
    classes_attended: number;
    total_strain: number;
    avg_recovery: number;
  }[];

  // Privacy
  is_friend: boolean;
  is_blocked: boolean;
}
```

### 7.3 Privacy Controls

```javascript
const privacySettings = {
  public: {
    profile_visible: true,
    stats_visible: true,
    badge_showcase_visible: true,
    referral_code_visible: false,
    training_data_visible: true
  },
  friends: {
    profile_visible: true,
    stats_visible: true,
    badge_showcase_visible: true,
    referral_code_visible: false,
    training_data_visible: true,
    requires_approval: true
  },
  private: {
    profile_visible: true,
    stats_visible: false,
    badge_showcase_visible: false,
    referral_code_visible: false,
    training_data_visible: false
  }
};

// In chat/community, always show minimal profile (name + avatar)
// Click to view full profile respects privacy setting
```

---

## 8. Data Model / Database Schema (Complete)

### 8.1 Entity Relationship Diagram (Conceptual)

```
users (1) ──── (many) attendance
      ├──── (many) user_badges
      ├──── (many) streaks
      ├──── (1) referral_code
      ├──── (many) referrals (as referrer)
      ├──── (1) belt_progression (per discipline)
      ├──── (many) messages (in channels)
      ├──── (many) reactions
      ├──── (1) user_training_stats
      ├──── (many) session_logs
      ├──── (many) personal_goals
      ├──── (many) rolling_videos
      ├──── (many) video_feedback
      ├──── (many) belt_promotions
      ├──── (many) user_technique_progress
      ├──── (many) class_plan_recipients
      └──── (many) drill_templates

classes (1) ──── (many) attendance
       ├──── (1) instructor (user_id)
       ├──── (many) class_schedules
       ├──── (many) session_plans
       └──── (1) rolling_feedback_channel

attendance (many) ──── (1) user
                  ├──── (1) class
                  └──── (1) session_log

badges (1) ──── (many) user_badges

channels (many) ──── (many) users (via channel_memberships)
         ├──── (many) messages
         ├──── (1) owner (user_id)
         └──── (1) category

messages (1) ──── (many) reactions
         ├──── (1) user (author)
         ├──── (many) media
         └──── (many) messages (threads via parent_id)

rolling_videos (1) ──── (many) video_feedback
               ├──── (many) video_likes
               └──── (many) coach_video_breakdowns

class_materials (1) ──── (many) class_plan_materials
                  └──── (many) class_material_bookmarks

class_plans (1) ──── (many) class_plan_materials
            ├──── (many) session_plan_recipients
            └──── (1) class

techniques (1) ──── (many) user_technique_progress

personal_goals (1) ──── (many) goal_progress_updates
```


### 8.2 Full SQL Schema

```sql
-- ==================== USERS & AUTH ====================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  bio TEXT,
  firebase_uid VARCHAR(255) UNIQUE,
  joined_at TIMESTAMP DEFAULT NOW(),
  total_xp INTEGER DEFAULT 0,
  seasonal_xp INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  is_coach BOOLEAN DEFAULT FALSE,
  is_ambassador BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  privacy_level VARCHAR(50) DEFAULT 'friends',
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_users_email (email),
  INDEX idx_users_referral_code (referral_code)
);

-- ==================== CLASSES ====================

CREATE TABLE disciplines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  icon_url VARCHAR(500),
  color_hex VARCHAR(7)
);

CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL, -- future: multi-gym support
  name VARCHAR(255) NOT NULL,
  discipline_id UUID NOT NULL REFERENCES disciplines(id),
  description TEXT,
  instructor_id UUID REFERENCES users(id),
  capacity INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_classes_discipline (discipline_id),
  INDEX idx_classes_instructor (instructor_id)
);

CREATE TABLE class_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  day_of_week INTEGER, -- 0-6 (Mon-Sun)
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ==================== ATTENDANCE ====================

CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMP DEFAULT NOW(),
  checked_out_at TIMESTAMP,
  intensity_rating INTEGER CHECK (intensity_rating BETWEEN 1 AND 10),
  recovery_score INTEGER CHECK (recovery_score BETWEEN 1 AND 4),
  training_load INTEGER,
  xp_earned INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_attendance_user_date (user_id, DATE(checked_in_at)),
  INDEX idx_attendance_class (class_id)
);

-- ==================== STREAKS ====================

CREATE TABLE streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_checkin_at TIMESTAMP,
  freeze_count INTEGER DEFAULT 0,
  grace_period_used_this_month BOOLEAN DEFAULT FALSE,
  month_reset_date DATE,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ==================== GAMIFICATION ====================

CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url VARCHAR(500),
  category VARCHAR(50), -- attendance, discipline, competition, social, secret
  criteria_json JSONB NOT NULL, -- {type, value, discipline, etc}
  is_hidden BOOLEAN DEFAULT FALSE,
  xp_reward INTEGER DEFAULT 50,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP DEFAULT NOW(),
  progress INTEGER DEFAULT 0,
  UNIQUE(user_id, badge_id),
  INDEX idx_user_badges_user (user_id)
);

CREATE TABLE user_badges_featured (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  position INTEGER CHECK (position BETWEEN 0 AND 5),
  UNIQUE(user_id, position)
);

CREATE TABLE leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50), -- weekly_xp, monthly_streak, monthly_classes, alltimte_xp, monthly_referral
  period VARCHAR(50), -- week_of_2024_01, month_2024_01, alltime
  score BIGINT,
  rank INTEGER,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, type, period),
  INDEX idx_leaderboards_type_period_rank (type, period, rank)
);

-- ==================== BELT PROGRESSION ====================

CREATE TABLE belt_progression (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  discipline_id UUID NOT NULL REFERENCES disciplines(id),
  current_belt VARCHAR(50), -- white, blue, purple, brown, black
  current_stripe INTEGER DEFAULT 0,
  total_classes_this_belt INTEGER DEFAULT 0,
  promoted_at TIMESTAMP,
  time_at_belt_days INTEGER DEFAULT 0,
  technique_checklist_json JSONB,
  UNIQUE(user_id, discipline_id),
  INDEX idx_belt_progression_user (user_id)
);

CREATE TABLE technique_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  discipline_id UUID NOT NULL REFERENCES disciplines(id),
  belt_level VARCHAR(50),
  technique_name VARCHAR(100),
  demonstrated_at TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  INDEX idx_technique_milestones_user (user_id)
);

-- ==================== TRAINING STATS ====================

CREATE TABLE user_training_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  total_classes_all_time INTEGER DEFAULT 0,
  total_classes_this_month INTEGER DEFAULT 0,
  total_classes_this_year INTEGER DEFAULT 0,
  total_training_load_this_month INTEGER DEFAULT 0,
  favorite_discipline_id UUID REFERENCES disciplines(id),
  last_updated TIMESTAMP DEFAULT NOW()
);

-- ==================== REFERRALS ====================

CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50), -- store_credit, physical_good, membership_credit, status
  value INTEGER, -- cents for credits, days for membership
  referral_threshold INTEGER, -- 1, 3, 5, 10
  icon_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referee_email VARCHAR(255),
  referee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'invited', -- invited, trial_booked, trial_completed, signed_up, active, lapsed
  created_at TIMESTAMP DEFAULT NOW(),
  trial_booked_at TIMESTAMP,
  trial_completed_at TIMESTAMP,
  signed_up_at TIMESTAMP,
  active_30d_at TIMESTAMP,
  lapsed_at TIMESTAMP,
  reward_id UUID REFERENCES rewards(id),
  reward_claimed_at TIMESTAMP,
  last_status_update TIMESTAMP DEFAULT NOW(),
  INDEX idx_referrals_code (referral_code),
  INDEX idx_referrals_referrer (referrer_id),
  INDEX idx_referrals_status (status)
);

CREATE TABLE referral_status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  changed_at TIMESTAMP DEFAULT NOW(),
  triggered_by VARCHAR(100),
  metadata JSONB,
  INDEX idx_referral_status_log_referral (referral_id)
);

-- ==================== COMMUNITY ====================

CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(50), -- announcement, discipline, competition, social
  discipline_id UUID REFERENCES disciplines(id),
  is_private BOOLEAN DEFAULT FALSE,
  owner_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_channels_discipline (discipline_id)
);

CREATE TABLE channel_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member', -- admin, coach, member
  joined_at TIMESTAMP DEFAULT NOW(),
  muted BOOLEAN DEFAULT FALSE,
  UNIQUE(channel_id, user_id),
  INDEX idx_channel_memberships_user (user_id)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_ids UUID[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  parent_id UUID REFERENCES messages(id) ON DELETE CASCADE, -- for threads
  is_pinned BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,
  INDEX idx_messages_channel (channel_id),
  INDEX idx_messages_user (user_id),
  INDEX idx_messages_parent (parent_id),
  INDEX idx_messages_created (created_at DESC)
);

CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji),
  INDEX idx_reactions_message (message_id)
);

CREATE TABLE thread_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscribed_at TIMESTAMP DEFAULT NOW(),
  unread_count INTEGER DEFAULT 0,
  last_read_at TIMESTAMP,
  UNIQUE(parent_message_id, user_id)
);

-- ==================== MEDIA ====================

CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE SET NULL,
  s3_key VARCHAR(500) NOT NULL,
  cdn_url VARCHAR(500) NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(50),
  original_filename VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  INDEX idx_media_user (user_id),
  INDEX idx_media_channel (channel_id),
  INDEX idx_media_created (created_at)
);

-- ==================== COMPETITIONS ====================

CREATE TABLE competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  discipline_id UUID NOT NULL REFERENCES disciplines(id),
  date DATE NOT NULL,
  location VARCHAR(255),
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_competitions_date (date)
);

CREATE TABLE competition_galleries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  title VARCHAR(255),
  description TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE gallery_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID NOT NULL REFERENCES competition_galleries(id) ON DELETE CASCADE,
  media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  caption TEXT,
  tags TEXT[],
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_gallery_media_gallery (gallery_id)
);

CREATE TABLE gallery_media_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_media_id UUID NOT NULL REFERENCES gallery_media(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(gallery_media_id, user_id)
);

-- ==================== PUSH NOTIFICATIONS ====================

CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_token VARCHAR(500) NOT NULL,
  platform VARCHAR(50), -- ios, android
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, device_token),
  INDEX idx_push_subscriptions_user (user_id)
);

CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  badge_earned BOOLEAN DEFAULT TRUE,
  xp_milestone BOOLEAN DEFAULT TRUE,
  streak_reminder BOOLEAN DEFAULT TRUE,
  referral_status BOOLEAN DEFAULT TRUE,
  new_message BOOLEAN DEFAULT TRUE,
  mention BOOLEAN DEFAULT TRUE,
  leaderboard_update BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 9. API Design

### 9.1 Authentication & Auth Endpoints

```
POST /auth/register
  Body: { email, password, name }
  Response: { user_id, token, referral_code }

POST /auth/login
  Body: { email, password }
  Response: { user_id, token, expires_in }

POST /auth/social-login
  Body: { provider: 'google'|'apple', id_token }
  Response: { user_id, token, is_new_user }

POST /auth/refresh
  Body: { refresh_token }
  Response: { token, expires_in }

POST /auth/logout
  Headers: { Authorization: Bearer <token> }
  Response: {}
```

### 9.2 Attendance & Check-in Endpoints

```
POST /attendance/check-in
  Body: { class_id, qr_code? }
  Headers: { Authorization: Bearer <token> }
  Response: {
    success: true,
    xp_earned: 75,
    streak_updated: true,
    current_streak: 12,
    badges_earned: [{ id, name, icon_url }],
    leaderboard_rank: 23
  }

GET /attendance/calendar/:userId/:month
  Headers: { Authorization: Bearer <token> }
  Response: {
    month: "2024-01",
    heatmap: [
      { date: "2024-01-01", class_count: 2, strain: 145 },
      ...
    ],
    stats: {
      total_classes: 18,
      total_strain: 2450,
      avg_recovery: 2.3
    }
  }

GET /attendance/report/:userId/:period
  Query: { period: 'week'|'month'|'year' }
  Response: {
    period: "month_2024_01",
    total_classes: 18,
    total_strain: 2450,
    avg_strain_per_class: 136,
    favorite_discipline: "BJJ",
    recovery_trend: [2.1, 2.3, 2.2, ...],
    recommendations: ["Consider a rest day", "Great consistency!"]
  }
```

### 9.3 Gamification Endpoints

```
GET /gamification/xp/:userId
  Response: {
    total_xp: 5420,
    seasonal_xp: 1230,
    current_streak: 42,
    longest_streak: 127,
    league: "Black Belt League",
    rank_in_league: 8
  }

GET /gamification/badges/:userId
  Query: { featured_only?: boolean }
  Response: {
    total_badges: 23,
    featured: [ { id, name, icon_url, earned_at } ],
    all: [ { id, name, category, earned_at } ]
  }

GET /gamification/streaks/:userId
  Response: {
    current_streak: 42,
    longest_streak: 127,
    freeze_count: 1,
    last_checkin: "2024-01-25T19:30:00Z",
    milestones_reached: [7, 30, 60],
    next_milestone: { days: 100, days_away: 58 }
  }

POST /gamification/streak/use-freeze
  Headers: { Authorization: Bearer <token> }
  Response: { success: true, freeze_remaining: 0 }

GET /leaderboards/:type/:period
  Query: { page: 1, limit: 50 }
  Response: {
    type: "weekly_xp",
    period: "week_2024_w4",
    user_rank: 23,
    leaderboard: [
      { rank: 1, user_id, name, avatar_url, score: 3420, is_friend: false },
      ...
    ],
    your_position: { rank: 23, score: 1850 }
  }

GET /belt-progression/:userId/:discipline
  Response: {
    discipline: "bjj",
    current_belt: "purple",
    current_stripe: 2,
    classes_to_next_rank: 23,
    promotion_progress: 0.54,
    time_at_current: 180,
    technique_checklist: {
      armbar: true,
      triangle: true,
      kimura: false,
      ...
    },
    history: [
      { belt: "white", promoted_at: "2020-01-15", time_at_rank_days: 365 },
      { belt: "blue", promoted_at: "2021-01-15", time_at_rank_days: 730 },
      ...
    ]
  }
```

### 9.4 Referral Endpoints

```
GET /referrals/my-code
  Headers: { Authorization: Bearer <token> }
  Response: {
    referral_code: "ABC123XYZ",
    referral_link: "https://training-grounds.app/join/ABC123XYZ",
    total_invited: 8,
    active_referrals: 5,
    pending_referrals: 2,
    next_reward: {
      threshold: 5,
      at: 3,
      name: "One Free Month",
      is_claimed: false
    }
  }

GET /referrals/status
  Headers: { Authorization: Bearer <token> }
  Response: {
    stats: {
      total: 8,
      invited: 1,
      trial_booked: 1,
      trial_completed: 2,
      signed_up: 2,
      active_30d: 2
    },
    referrals: [
      {
        id: "ref_123",
        referee_email: "john@example.com",
        status: "signed_up",
        created_at: "2024-01-15T10:00:00Z",
        signed_up_at: "2024-01-22T15:00:00Z",
        reward: { id, name, type, value }
      },
      ...
    ],
    leaderboard_position: { rank: 12, active_referrals: 5 }
  }

GET /referrals/leaderboard/:period
  Query: { page: 1, limit: 50 }
  Response: {
    period: "month_2024_01",
    leaderboard: [
      { rank: 1, user_id, name, avatar_url, active_referrals: 12, qualified: 15 },
      ...
    ],
    your_position: { rank: 47, active_referrals: 2, qualified: 3 }
  }

POST /referrals/share
  Body: { method: 'sms'|'email'|'social' }
  Headers: { Authorization: Bearer <token> }
  Response: {
    success: true,
    share_url: "training-grounds.app/join/ABC123XYZ",
    message: "Join me at Training Grounds! Use code ABC123XYZ for a free trial."
  }
```

### 9.5 Community Endpoints

```
GET /channels
  Query: { category?: 'announcement'|'discipline', discipline_id?: UUID }
  Response: [
    {
      id: "chan_123",
      name: "general",
      description: "General gym chat",
      member_count: 234,
      unread_messages: 5,
      is_member: true
    },
    ...
  ]

POST /channels/:channelId/messages
  Body: { content: string, media_ids?: UUID[] }
  Headers: { Authorization: Bearer <token> }
  Response: {
    id: "msg_123",
    user: { id, name, avatar_url },
    content: "...",
    media: [ { id, url, type } ],
    created_at: "2024-01-25T19:30:00Z"
  }

GET /channels/:channelId/messages
  Query: { page: 1, limit: 50, before?: timestamp }
  Response: [
    {
      id: "msg_123",
      user: { id, name, avatar_url },
      content: "Great session!",
      reactions: [
        { emoji: "🔥", count: 5, reacted_by_me: true }
      ],
      media: [],
      created_at: "2024-01-25T19:30:00Z",
      thread_reply_count: 3
    },
    ...
  ]

GET /messages/:messageId/thread
  Query: { page: 1, limit: 50 }
  Response: [
    { id, user, content, reactions, media, created_at },
    ...
  ]

POST /messages/:messageId/reactions
  Body: { emoji: "🔥" }
  Response: { success: true, reaction_count: 6 }

DELETE /messages/:messageId/reactions/:emoji
  Response: { success: true }

POST /channels/:channelId/join
  Headers: { Authorization: Bearer <token> }
  Response: { success: true }

POST /channels/:channelId/leave
  Headers: { Authorization: Bearer <token> }
  Response: { success: true }

POST /media/upload
  Body: FormData { file, channel_id? }
  Headers: { Authorization: Bearer <token>, Content-Type: multipart/form-data }
  Response: {
    id: "media_123",
    cdn_url: "https://cdn.training-grounds.app/...",
    thumbnail_url: "https://cdn.training-grounds.app/..._thumb.jpg"
  }
```

### 9.6 Profile Endpoints

```
GET /profiles/:userId
  Headers: { Authorization: Bearer <token> }
  Response: {
    user: {
      id, name, avatar_url, bio, joined_at, membership_status
    },
    belt_info: [
      {
        discipline: "bjj",
        current_belt: "purple",
        current_stripe: 2,
        time_at_belt_days: 180
      }
    ],
    stats: {
      total_classes: 256,
      current_streak: 42,
      total_xp: 18420,
      rank_in_league: 8
    },
    featured_badges: [ { id, name, icon_url, earned_at } ],
    training_trend: [
      { month: "2024-01", classes: 18, strain: 2450 },
      ...
    ],
    is_friend: false,
    can_view_full_profile: true
  }

PUT /profiles/:userId
  Body: { name?, bio?, avatar_url?, privacy_level?, featured_badge_ids? }
  Headers: { Authorization: Bearer <token> }
  Response: { success: true }

GET /profiles/:userId/activity-feed
  Query: { page: 1, limit: 20 }
  Response: [
    { type: "class_attended", description: "...", timestamp, icon },
    { type: "badge_earned", description: "...", timestamp, badge_id },
    { type: "referral_activated", description: "...", timestamp }
  ]

POST /friends/:userId/add
  Headers: { Authorization: Bearer <token> }
  Response: { success: true, status: 'pending'|'accepted' }

DELETE /friends/:userId
  Headers: { Authorization: Bearer <token> }
  Response: { success: true }

POST /block/:userId
  Headers: { Authorization: Bearer <token> }
  Response: { success: true }
```

---

### 9.7 Class Materials & Study Endpoints

```
GET /materials
  Query: { discipline_id?, topic?, coach_id?, difficulty_level? }
  Response: {
    materials: [
      {
        id, title, description, topic, difficulty_level,
        material_type, s3_key, cdn_url, coach_name, created_at,
        bookmarked_by_user: boolean
      }
    ]
  }

GET /materials/:id
  Response: { id, title, description, topic, material_type, cdn_url, coach_id, created_at }

POST /materials
  Headers: { Authorization: Bearer <token> }
  Body: { title, description, topic, difficulty_level, material_type, file_or_url }
  Response: { id, cdn_url, created_at }

POST /materials/:id/bookmark
  Headers: { Authorization: Bearer <token> }
  Response: { success: true, bookmarked: true }

DELETE /materials/:id/bookmark
  Headers: { Authorization: Bearer <token> }
  Response: { success: true }

GET /class-plans
  Query: { coach_id?, class_id?, week? }
  Response: {
    plans: [
      {
        id, title, description, coach_id, class_id, date_assigned,
        materials: [{ id, title }]
      }
    ]
  }

POST /class-plans
  Headers: { Authorization: Bearer <token> (coach) }
  Body: { title, description, class_id, date_assigned, material_ids: [] }
  Response: { id, created_at }

POST /class-plans/:id/push-to-students
  Headers: { Authorization: Bearer <token> (coach) }
  Response: { success: true, notified_students: number }
```

### 9.8 Progress Tracking Endpoints

```
GET /progress/techniques
  Headers: { Authorization: Bearer <token> }
  Query: { user_id?, discipline_id? }
  Response: {
    techniques: [
      {
        id, name, progress_level, first_learned_at,
        last_practiced_at, practice_count, discipline
      }
    ]
  }

PATCH /progress/technique/:technique_id
  Headers: { Authorization: Bearer <token> }
  Body: { progress_level, notes? }
  Response: { id, progress_level, updated_at }

GET /session-logs/:userId
  Headers: { Authorization: Bearer <token> }
  Query: { month?, limit?: 20 }
  Response: {
    logs: [
      {
        id, class_id, class_name, attendance_id, explored, challenging,
        worked, takeaways, next_focus, created_at, private, shared_with_coach
      }
    ]
  }

GET /session-logs/:sessionLogId
  Headers: { Authorization: Bearer <token> }
  Response: {
    id, class_id, attendance_id, explored, challenging, worked, takeaways,
    next_focus, private, shared_with_coach, coach_feedback, created_at
  }

POST /session-logs
  Headers: { Authorization: Bearer <token> }
  Body: { attendance_id, class_id, explored, challenging, worked, takeaways, next_focus, private }
  Response: { id, created_at }

PATCH /session-logs/:id
  Headers: { Authorization: Bearer <token> }
  Body: { explored?, challenging?, worked?, takeaways?, next_focus?, private?, shared_with_coach? }
  Response: { id, updated_at }

POST /session-logs/:id/share-with-coach
  Headers: { Authorization: Bearer <token> }
  Response: { success: true, coach_notified: true }

GET /belt-promotions/:userId
  Headers: { Authorization: Bearer <token> }
  Response: {
    promotions: [
      {
        id, discipline, previous_belt, previous_stripe, new_belt, new_stripe,
        promoted_at, promoted_by, certificate_url
      }
    ]
  }

POST /belt-promotions
  Headers: { Authorization: Bearer <token> (coach) }
  Body: { student_id, discipline_id, new_belt, new_stripe, certificate_file? }
  Response: { id, promoted_at }

GET /goals
  Headers: { Authorization: Bearer <token> }
  Query: { user_id?, status?: 'active'|'achieved'|'abandoned' }
  Response: {
    goals: [
      {
        id, title, description, goal_type, target_value, target_date,
        progress_percent, status, discipline, visibility
      }
    ]
  }

POST /goals
  Headers: { Authorization: Bearer <token> }
  Body: { title, description, goal_type, target_value, target_date?, discipline_id?, visibility }
  Response: { id, created_at, status: 'active' }

PATCH /goals/:id
  Headers: { Authorization: Bearer <token> }
  Body: { progress_percent?, status?, target_date? }
  Response: { id, updated_at, status }
```

### 9.9 Rolling / Video Library Endpoints

```
GET /videos
  Query: { discipline_id?, video_type?, technique?, sort?: 'recent'|'popular', limit?: 20 }
  Response: {
    videos: [
      {
        id, title, description, uploader_id, uploader_name, thumbnail_url,
        duration_seconds, disciplines, techniques_featured, created_at,
        like_count, feedback_count, visibility
      }
    ]
  }

GET /videos/:id
  Headers: { Authorization: Bearer <token> }
  Response: {
    id, title, description, cdn_url, uploader_id, video_type,
    discipline_id, tags, techniques_featured, duration_seconds,
    feedback: [{ author_id, author_name, text, timestamp_seconds, is_coach }],
    like_count, user_liked: boolean, created_at, coach_breakdown: { text, key_points }
  }

POST /videos
  Headers: { Authorization: Bearer <token> }
  Body: { title, description, video_file, discipline_id?, video_type, techniques?, visibility, tags? }
  Response: { id, cdn_url, created_at }

POST /videos/:id/feedback
  Headers: { Authorization: Bearer <token> }
  Body: { feedback_text, timestamp_seconds? }
  Response: { id, feedback_id, created_at }

POST /videos/:id/like
  Headers: { Authorization: Bearer <token> }
  Response: { success: true, like_count: number }

DELETE /videos/:id/like
  Headers: { Authorization: Bearer <token> }
  Response: { success: true, like_count: number }

POST /videos/:id/breakdown
  Headers: { Authorization: Bearer <token> (coach) }
  Body: { breakdown_text, timestamp_start, timestamp_end, key_points: [] }
  Response: { id, created_at }
```

### 9.10 Coaches Corner Endpoints

```
GET /coach/drills
  Headers: { Authorization: Bearer <token> (coach) }
  Query: { discipline_id?, difficulty_level? }
  Response: {
    drills: [
      {
        id, name, description, drill_type, duration_minutes,
        difficulty_level, technique_focus, created_at
      }
    ]
  }

POST /coach/drills
  Headers: { Authorization: Bearer <token> (coach) }
  Body: { name, description, discipline_id, drill_type, duration_minutes, difficulty_level, setup_instructions, technique_focus }
  Response: { id, created_at }

GET /coach/class-templates
  Headers: { Authorization: Bearer <token> (coach) }
  Response: {
    templates: [
      { id, name, description, discipline_id, default_duration_minutes, structure, created_at }
    ]
  }

POST /coach/class-templates
  Headers: { Authorization: Bearer <token> (coach) }
  Body: { name, discipline_id, description, structure, default_duration_minutes }
  Response: { id, created_at }

GET /coach/session-plans
  Headers: { Authorization: Bearer <token> (coach) }
  Query: { planned_date?, class_id? }
  Response: {
    plans: [
      {
        id, class_id, title, focus_technique, planned_date, notes,
        structure, pushed_to_students, pushed_at, created_at
      }
    ]
  }

POST /coach/session-plans
  Headers: { Authorization: Bearer <token> (coach) }
  Body: { class_id?, planned_date, title, focus_technique?, structure, notes?, material_id? }
  Response: { id, created_at }

PATCH /coach/session-plans/:id
  Headers: { Authorization: Bearer <token> (coach) }
  Body: { title?, structure?, notes?, focus_technique? }
  Response: { id, updated_at }

POST /coach/session-plans/:id/push
  Headers: { Authorization: Bearer <token> (coach) }
  Body: { student_ids?: [] } (if empty, push to all class members)
  Response: { success: true, notified_count: number }

GET /coach/student-progress/:studentId
  Headers: { Authorization: Bearer <token> (coach) }
  Response: {
    student_name, discipline_id, technique_progress: [
      { technique, progress_level, last_practiced_at, practice_count }
    ],
    recent_sessions: [{ date, session_log_summary }],
    goals: [{ title, progress_percent, target_date }]
  }

POST /coach/student-feedback/:studentId/:sessionLogId
  Headers: { Authorization: Bearer <token> (coach) }
  Body: { feedback_text }
  Response: { success: true }
```

### 9.11 Journal & Reflection Endpoints

```
GET /journal
  Headers: { Authorization: Bearer <token> }
  Query: { user_id?, month?, class_id? }
  Response: {
    entries: [
      {
        id, class_id, class_name, attendance_id, explored, challenging,
        worked, takeaways, next_focus, private, shared_with_coach,
        coach_feedback, created_at
      }
    ]
  }

GET /journal/:id
  Headers: { Authorization: Bearer <token> }
  Response: {
    id, class_id, attendance_id, explored, challenging, worked,
    takeaways, next_focus, private, shared_with_coach, coach_feedback,
    created_at, coach_id, coach_name
  }

POST /journal
  Headers: { Authorization: Bearer <token> }
  Body: { attendance_id, class_id, explored, challenging, worked, takeaways, next_focus }
  Response: { id, created_at }

PATCH /journal/:id
  Headers: { Authorization: Bearer <token> }
  Body: { explored?, challenging?, worked?, takeaways?, next_focus?, private? }
  Response: { id, updated_at }

POST /journal/:id/request-coach-access
  Headers: { Authorization: Bearer <token> }
  Body: { coach_id }
  Response: { success: true, request_sent: true }

POST /journal/:id/grant-coach-access
  Headers: { Authorization: Bearer <token> }
  Body: { coach_id }
  Response: { success: true, shared_with_coach: true }

POST /journal/:id/coach-feedback
  Headers: { Authorization: Bearer <token> (coach) }
  Body: { feedback_text }
  Response: { success: true, coach_feedback_added: true }

GET /journal/:id/export
  Headers: { Authorization: Bearer <token> }
  Query: { format: 'pdf'|'markdown' }
  Response: Downloads journal entries as file
```

### 9.12 Community Channels Enhancement Endpoints

```
GET /channels/categories
  Headers: { Authorization: Bearer <token> }
  Response: {
    categories: [
      { id, name, description, position_order, channels_count }
    ]
  }

POST /channels
  Headers: { Authorization: Bearer <token> (coach) }
  Body: {
    name, description, channel_type, category_id?,
    class_id?, class_type?, is_rolling_feedback?: false
  }
  Response: { id, name, created_at }

GET /channels/:id
  Headers: { Authorization: Bearer <token> }
  Response: {
    id, name, description, channel_type, channel_category,
    class_id, class_type, is_rolling_feedback, members_count,
    created_at, owner_id
  }

POST /channels/:id/push-announcement
  Headers: { Authorization: Bearer <token> (coach/owner) }
  Body: { message, type: 'schedule'|'update'|'general' }
  Response: { success: true }
```

---

## 10. Real-time Architecture

### 10.1 WebSocket Events (Socket.io)

**Client Connection:**
```javascript
import io from 'socket.io-client';

const socket = io('wss://api.training-grounds.app', {
  auth: { token: jwtToken },
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});

socket.on('connect', () => {
  socket.join(`user:${userId}`);
  socket.join(`channel:general`);
  socket.emit('presence:online', { user_id: userId });
});

socket.on('disconnect', () => {
  // Automatic reconnection
});
```

**Event Types:**

```javascript
// ========== CHAT EVENTS ==========
socket.emit('message:send', {
  channel_id: channelId,
  content: 'Great session!',
  media_ids: []
});

socket.on('message:created', (data) => {
  // { id, channel_id, user, content, media, reactions, created_at }
});

socket.emit('typing:start', { channel_id: channelId });
socket.on('user:typing', (data) => {
  // { user_id, user_name }
});

socket.emit('typing:stop', { channel_id: channelId });

// ========== REACTIONS ==========
socket.emit('reaction:add', {
  message_id: messageId,
  emoji: '🔥'
});

socket.on('reaction:updated', (data) => {
  // { message_id, reactions: [{ emoji, count, reacted_by_me }] }
});

// ========== THREADS ==========
socket.emit('thread:subscribe', { parent_message_id: messageId });

socket.on('thread:new_reply', (data) => {
  // { message_id, parent_id, user, content, created_at }
  // Only sent to subscribers
});

socket.emit('thread:unsubscribe', { parent_message_id: messageId });

// ========== NOTIFICATIONS ==========
socket.on('notification:badge_earned', (data) => {
  // { badge_id, badge_name, badge_icon, xp_earned }
  // Real-time badge celebration
});

socket.on('notification:streak_milestone', (data) => {
  // { current_streak: 30, next_freeze_earned: true }
});

socket.on('notification:referral_status', (data) => {
  // { referral_code, referee_name, new_status, reward_if_claimed }
});

socket.on('notification:mention', (data) => {
  // { message_id, message_preview, channel_id, author }
});

// ========== LEADERBOARD UPDATES ==========
socket.on('leaderboard:rank_change', (data) => {
  // { leaderboard_type, period, new_rank, previous_rank, score }
  // Sent only if user's rank changed
});

socket.on('leaderboard:top_update', (data) => {
  // { leaderboard_type, period, top_10: [...] }
  // Periodic update (every 5 min)
});

// ========== PRESENCE ==========
socket.on('presence:update', (data) => {
  // { channel_id, online_count, typing_users: ['john', 'jane'] }
});

// ========== CHANNEL MANAGEMENT ==========
socket.on('channel:created', (data) => {
  // { channel_id, channel_name, description }
});

socket.on('channel:deleted', (data) => {
  // { channel_id }
});
```


// Study & Materials events
'material:shared': (data) => {
  // Coach shares new study material
  // { material_id, title, topic, discipline_id, coach_id, timestamp }
},

'class_plan:assigned': (data) => {
  // Coach assigns class plan to students
  // { plan_id, class_id, student_ids, title, coach_id, timestamp }
},

'class_plan:pushed': (data) => {
  // Coach pushes session plan to class
  // { session_plan_id, class_id, title, timestamp }
},

// Progress Tracking events
'skill:progressed': (data) => {
  // User progresses on a technique
  // { user_id, technique_id, progress_level, timestamp }
},

'journal:entry_created': (data) => {
  // New journal entry after class
  // { user_id, attendance_id, class_id, timestamp }
},

'journal:shared_with_coach': (data) => {
  // Student shares journal entry with coach
  // { user_id, journal_id, coach_id, timestamp }
},

'promotion:announced': (data) => {
  // Belt promotion celebrated in community
  // { user_id, user_name, discipline, new_belt, promoted_at, timestamp }
},

'goal:achieved': (data) => {
  // User achieves personal goal
  // { user_id, goal_id, goal_title, timestamp }
},

// Video Library events
'video:uploaded': (data) => {
  // New rolling footage uploaded
  // { video_id, uploader_id, uploader_name, title, video_type, timestamp }
},

'video:feedback_added': (data) => {
  // Feedback comment added to video
  // { video_id, author_id, author_name, is_coach, feedback_text, timestamp }
},

'video:breakdown_added': (data) => {
  // Coach adds breakdown to video
  // { video_id, coach_id, coach_name, key_points, timestamp }
},

'video:liked': (data) => {
  // User likes a video
  // { video_id, user_id, like_count, timestamp }
},

// Coach tools events
'drill:created': (data) => {
  // Coach creates new drill
  // { drill_id, coach_id, name, technique_focus, timestamp }
},

'session_plan:scheduled': (data) => {
  // Coach schedules session plan
  // { session_plan_id, class_id, planned_date, title, timestamp }
},

// Community channels events
'channel:created': (data) => {
  // New channel created (class-specific or rolling)
  // { channel_id, name, channel_type, class_id?, timestamp }
},

'channel:announcement': (data) => {
  // Coach posts announcement in channel
  // { channel_id, channel_name, message, type: 'schedule|update|general', timestamp }
},

// Room subscriptions for new features
socket.on('subscribe:journal', (data) => {
  const { user_id } = data;
  socket.join(`journal:${user_id}`);
  // User receives journal-related events
});

socket.on('subscribe:rolling_videos', (data) => {
  const { discipline_id } = data;
  socket.join(`videos:${discipline_id}`);
  // User receives video uploads/feedback in their discipline
});

socket.on('subscribe:coach_class', (data) => {
  const { class_id } = data;
  socket.join(`coach:${class_id}`);
  // Coach receives real-time updates on their class
});

socket.on('subscribe:study_materials', (data) => {
  const { discipline_id } = data;
  socket.join(`materials:${discipline_id}`);
  // Users get notified of new materials in their disciplines
});


### 10.2 Event-Driven Badge & XP Calculation

**Message Queue (BullMQ):**

```javascript
// When attendance is checked in
const attendanceQueue = new Queue('attendance-processing');

attendanceQueue.add('process-attendance', {
  user_id: userId,
  class_id: classId,
  intensity: 7,
  recovery: 2
}, {
  delay: 500, // Allow for XP multiplier to settle
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 }
});

// Worker processes the job
attendanceQueue.process('process-attendance', async (job) => {
  const { user_id, class_id, intensity, recovery } = job.data;

  // 1. Calculate XP
  const xpData = await calculateXP(user_id);
  await User.update({ total_xp: xpData.totalXP }, { where: { id: user_id } });

  // 2. Update streak
  const streakData = await updateStreak(user_id);

  // 3. Check badge eligibility
  const badges = await checkBadgeEligibility(user_id);

  // 4. Update leaderboards (via Redis)
  await updateLeaderboardRanks(user_id);

  // 5. Emit WebSocket events
  io.to(`user:${user_id}`).emit('stats:updated', {
    total_xp: xpData.totalXP,
    current_streak: streakData.current_streak,
    badges_earned: badges.map(b => ({ id: b.id, name: b.name, icon: b.icon_url }))
  });

  return { status: 'success', xp: xpData.totalXP, badges: badges.length };
});
```

**Batch Leaderboard Updates (Cron):**

```javascript
// Run every 5 minutes
const leaderboardJob = schedule.scheduleJob('*/5 * * * *', async () => {
  // Weekly leaderboard
  await updateLeaderboard('weekly_xp', 'week_' + getWeekId());

  // Monthly leaderboard
  await updateLeaderboard('monthly_streak', 'month_' + getMonthId());

  // Broadcast to all connected clients
  const top10 = await getTopLeaderboardScores('weekly_xp');
  io.emit('leaderboard:top_update', {
    type: 'weekly_xp',
    period: 'week_' + getWeekId(),
    top_10: top10
  });
});
```

### 10.3 Push Notification System

**Notification Service:**

```javascript
// When badge is earned
async function sendBadgeNotification(userId, badge) {
  const user = await User.findById(userId);
  const prefs = await NotificationPreferences.findOne({ user_id: userId });

  if (!prefs.badge_earned) return;

  const subscriptions = await PushSubscription.findAll({ where: { user_id: userId, enabled: true } });

  for (const sub of subscriptions) {
    await firebase.messaging().sendToDevice(sub.device_token, {
      notification: {
        title: `Badge Unlocked! 🏆`,
        body: badge.name,
        sound: 'default',
        vibrate: [200, 100, 200],
        badge: '1',
        priority: 'high'
      },
      data: {
        type: 'badge_earned',
        badge_id: badge.id,
        badge_icon: badge.icon_url,
        action: 'open_badge_detail'
      }
    });
  }
}

// When referral status changes
async function sendReferralNotification(referrerId, newStatus, refereeName) {
  const templates = {
    trial_booked: {
      title: '🎉 Trial Booked!',
      body: `${refereeName} booked their trial class. Congratulations!`
    },
    trial_completed: {
      title: '✅ Trial Completed',
      body: `${refereeName} attended their trial. Waiting for signup...`
    },
    signed_up: {
      title: '🚀 They Signed Up!',
      body: `Referral complete! ${refereeName} purchased a membership. Reward processing...`
    },
    active_30d: {
      title: '🏆 Referral Active!',
      body: `${refereeName} has been active for 30 days. Your reward is unlocked!`
    }
  };

  const template = templates[newStatus];
  // Send via Firebase to all active devices
}

// Streak reminder (daily)
schedule.scheduleJob('0 20 * * *', async () => {
  // 8 PM daily
  const users = await User.findAll({ where: { is_deleted: false } });

  for (const user of users) {
    const hasCheckedInToday = await Attendance.findOne({
      where: {
        user_id: user.id,
        checked_in_at: { [Op.gte]: today }
      }
    });

    if (!hasCheckedInToday) {
      const prefs = await NotificationPreferences.findOne({ user_id: user.id });
      if (prefs.streak_reminder) {
        await sendPushNotification(user.id, {
          title: `Don't Lose Your Streak! 🔥`,
          body: `You have ${user.current_streak} days. One more class to keep it alive!`,
          data: { type: 'streak_reminder', current_streak: user.current_streak }
        });
      }
    }
  }
});
```

---

## 11. Technology Stack Recommendation

### 11.1 Frontend

**Framework: React Native + Expo**
- **Why**: Cross-platform (iOS/Android), rapid development, shared codebase
- **State Management**: Redux Toolkit + Redux-Persist for offline support
- **Navigation**: React Navigation with deep linking
- **UI Components**: React Native Paper or Tamagui
- **HTTP Client**: Axios with interceptors for auth refresh
- **WebSocket**: Socket.io-client
- **Local Storage**: SQLite (via react-native-sqlite-storage) for offline attendance queue
- **Animations**: React Native Reanimated for smooth leaderboard updates
- **Push Notifications**: Firebase Cloud Messaging (FCM) + Expo notifications plugin
- **Maps**: React Native Maps (future: gym location features)
- **Analytics**: Segment or Mixpanel for user behavior tracking
- **Testing**: Jest + React Native Testing Library

**Build & Deployment:**
- **EAS (Expo Application Services)** for iOS TestFlight + Android PlayStore builds
- **Fastlane** for automating release workflows

### 11.2 Backend

**Runtime: Node.js 18+ LTS**

**Framework: NestJS**
- **Why**: Enterprise TypeScript framework, built-in dependency injection, excellent for microservices
- **Database ORM**: TypeORM with PostgreSQL
- **Validation**: class-validator + class-transformer
- **Authentication**: @nestjs/jwt + @nestjs/passport
- **WebSockets**: @nestjs/websockets (Socket.io wrapper)
- **Caching**: @nestjs/cache-manager with ioredis backend
- **Task Scheduling**: @nestjs/schedule for cron jobs
- **Message Queue**: Bull with Redis for async processing
- **File Upload**: aws-sdk for S3 integration
- **Logging**: Winston logger
- **API Documentation**: Swagger (@nestjs/swagger)
- **Testing**: Jest + Supertest for e2e tests
- **Rate Limiting**: @nestjs/throttler

**Code Organization:**
```
src/
├── auth/                    # Authentication module
├── attendance/              # Check-in & tracking
├── gamification/            # XP, badges, leaderboards
├── referrals/               # Referral program
├── community/               # Chat & channels
├── profiles/                # User profiles
├── media/                   # File uploads
├── common/
│   ├── decorators/          # Custom decorators
│   ├── guards/              # Auth guards
│   ├── filters/             # Exception filters
│   ├── interceptors/        # Logging, transformation
│   └── pipes/               # Validation
├── database/
│   ├── entities/            # TypeORM entities
│   ├── migrations/          # Database migrations
│   └── seeders/             # Test data
├── websockets/              # Socket.io gateway
├── queue/                   # BullMQ jobs
└── config/                  # Environment configs
```

### 11.3 Database

**Primary: PostgreSQL 14+**
- **Why**: ACID compliance, JSONB for flexible badge criteria, excellent JSON indexing
- **Connection Pooling**: pgBouncer or pg pool (npm)
- **Migrations**: TypeORM migrations or Knex
- **Backup Strategy**: AWS RDS automated backups, 30-day retention

**Caching Layer: Redis 7+**
- **Why**: O(1) leaderboard updates, session storage, rate limit counters
- **Use Cases**:
  - Leaderboards (sorted sets)
  - Streak freezes per user
  - Session tokens (JWT blacklist on logout)
  - Message queue (BullMQ)
  - Rate limiting buckets
  - Real-time presence (pub/sub)
- **Persistence**: RDB snapshots daily + AOF append-only file

### 11.4 Real-time & Messaging

**WebSocket Server: Socket.io 4.x**
- **Why**: Fallback to long-polling, rooms/namespaces for channels, easy deployment
- **Adapters**: Socket.io Redis Adapter for scaling across multiple server instances
- **Auth**: JWT verification on connection
- **Storage**: Redis for session management

**Message Queue: BullMQ**
- **Why**: Built on Redis, TypeScript-first, excellent for delayed jobs
- **Use Cases**:
  - Badge calculation (process after small delay to avoid race conditions)
  - Leaderboard ranking updates
  - Email notifications
  - Referral status transitions
  - Streak expiration checks

### 11.5 Media Storage

**Primary: AWS S3 or Cloudflare R2**
- **S3 Rationale**: Mature, reliable, S3 Select for querying, CloudFront CDN integration
- **Alternatives**: Cloudflare R2 (cheaper egress, S3-compatible API)
- **Structure**:
  ```
  training-grounds-media/
  ├── media/{user_id}/{uuid}.{ext}
  ├── avatars/{user_id}/{uuid}.jpg
  ├── thumbnails/{media_id}_thumb.jpg
  └── competitions/{competition_id}/{uuid}.{ext}
  ```
- **CDN**: CloudFront with 1-year cache for immutable assets
- **Virus Scanning**: ClamAV integration (via Lambda) for user uploads
- **Optimization**: ImageMagick for resize/compress on upload

### 11.6 Authentication & Authorization

**Primary: Firebase Auth**
- **Why**: Managed service, OAuth2 providers (Google, Apple), email/password, phone SMS
- **Alternatives**: Auth0 (more features but higher cost)
- **Token Strategy**: JWT (Firebase tokens) + refresh token rotation
- **Social Login**: Native iOS/Android SDKs for Apple Sign-In, Google Sign-In

**Role-Based Access Control (RBAC):**
```typescript
enum Role {
  ADMIN = 'admin',
  COACH = 'coach',
  AMBASSADOR = 'ambassador',
  MEMBER = 'member',
  TRIAL = 'trial'
}

// Guard implementation
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRole = Reflect.getMetadata('roles', context.getHandler());
    const user = context.switchToHttp().getRequest().user;
    return requiredRole?.includes(user.role);
  }
}

// Usage
@UseGuards(RolesGuard)
@Roles(Role.COACH, Role.ADMIN)
@Post('coaches/assign')
assignCoach(@Body() dto: AssignCoachDto) { ... }
```

### 11.7 Push Notifications

**Service: Firebase Cloud Messaging (FCM)**
- **Why**: Free, integrates with both iOS and Android, handles token management
- **Token Refresh**: Handled automatically by FCM SDK
- **Delivery**: Delivery guarantees, device state awareness

### 11.8 Monitoring & Observability

**Error Tracking: Sentry**
- **Config**: Capture exceptions, performance monitoring, release tracking
- **Sampling**: 100% for errors, 10% for performance (transaction sampling)

**Metrics & Logs: DataDog**
- **APM**: Track slow endpoints, database query performance
- **Logs**: Centralized logging with structured JSON
- **Custom Metrics**: User signups, referrals converted, badge earnings

**Uptime: UptimeRobot or similar**
- **Monitors**: Check API health every 5 minutes
- **Alerts**: Slack/PagerDuty on downtime

### 11.9 CI/CD Pipeline

**Platform: GitHub Actions**

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run test:cov
      - run: npm run test:e2e
      - uses: codecov/codecov-action@v3

  build-backend:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v3
      - run: npm run build
      - uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: arn:aws:iam::${{ secrets.AWS_ACCOUNT_ID }}:role/GitHubActionsRole
      - run: |
          aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_REGISTRY
          docker build -t $ECR_REGISTRY/training-grounds:${{ github.sha }} .
          docker push $ECR_REGISTRY/training-grounds:${{ github.sha }}

  deploy-staging:
    if: github.ref == 'refs/heads/staging'
    runs-on: ubuntu-latest
    needs: build-backend
    steps:
      - name: Deploy to ECS Fargate
        run: |
          aws ecs update-service \
            --cluster training-grounds-staging \
            --service api \
            --force-new-deployment

  deploy-production:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    needs: build-backend
    environment: production
    steps:
      - name: Deploy to ECS Fargate
        run: |
          aws ecs update-service \
            --cluster training-grounds-prod \
            --service api \
            --force-new-deployment
      - name: Notify Slack
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -d '{"text":"Deployed Training Grounds API to production"}'
```

### 11.10 Infrastructure & Hosting

**Option A: AWS (Recommended for Scale)**
- **Compute**: ECS Fargate (serverless containers)
- **Database**: RDS PostgreSQL (Multi-AZ for HA)
- **Cache**: ElastiCache Redis
- **File Storage**: S3 + CloudFront
- **Load Balancer**: Application Load Balancer (ALB)
- **DNS**: Route 53
- **Secrets**: Secrets Manager for API keys, DB credentials
- **Monitoring**: CloudWatch + Sentry + DataDog

**Estimated Costs** (monthly):
- Fargate (2 vCPU, 4GB RAM): ~$100/month
- RDS (db.t3.small): ~$50/month
- ElastiCache (cache.t3.micro): ~$20/month
- S3 (1TB stored): ~$30/month (+ egress)
- CloudFront: ~$50/month
- **Total**: ~$250/month at launch, scales with usage

**Option B: Railway or Render (Faster MVP)**
- **Why**: Simpler deployment, automatic scaling, integrated PostgreSQL/Redis
- **Cost**: $25-100/month for MVP
- **Ideal For**: First 3-6 months before scaling to AWS

---

## 12. Security Considerations

### 12.1 Authentication Flow

```
1. User signs up/logs in
   → Firebase Auth handles credentials (never sent to our backend)
   → Firebase returns ID token + refresh token

2. App exchanges ID token for our JWT
   POST /auth/login { firebase_id_token }
   → Backend validates Firebase token signature
   → Backend returns our JWT (shorter lived, 15 min)

3. API requests include JWT
   Authorization: Bearer <our_jwt>
   → Verified using HS256 (shared secret) or RS256 (public key)

4. Token refresh before expiry
   POST /auth/refresh { refresh_token }
   → Backend validates refresh token (longer lived, 7 days)
   → Returns new JWT

5. Logout
   POST /auth/logout
   → Add JWT to Redis blacklist (expires with token)
   → Clear refresh token from client
```

### 12.2 Data Privacy

**GDPR Compliance:**
- Right to deletion: Soft delete users, retain anonymized analytics
- Data portability: Export user data endpoint
- Consent management: Explicit opt-in for emails, notifications
- DPA with AWS/Firebase for data processing

**Sensitive Data Handling:**
- No passwords stored (Firebase handles)
- No credit card data (Stripe handles)
- Encryption at rest: S3-SSE for media, RDS encryption
- Encryption in transit: HTTPS/TLS 1.2+ for all connections
- PII fields: belt_rank, bio (acceptable), but not email in public profiles

### 12.3 Media Upload Validation

```javascript
// 1. MIME type whitelist
const ALLOWED_TYPES = {
  'image/jpeg': { ext: 'jpg', maxSize: 10 * 1024 * 1024 }, // 10MB
  'image/png': { ext: 'png', maxSize: 10 * 1024 * 1024 },
  'video/mp4': { ext: 'mp4', maxSize: 100 * 1024 * 1024 }, // 100MB
  'video/quicktime': { ext: 'mov', maxSize: 100 * 1024 * 1024 }
};

// 2. File signature validation (magic bytes)
const fileSignatures = {
  'image/jpeg': Buffer.from([0xFF, 0xD8, 0xFF]),
  'image/png': Buffer.from([0x89, 0x50, 0x4E, 0x47]),
  'video/mp4': [...] // atom box check
};

// 3. Virus scan
const { exec } = require('child_process');
async function scanFile(filePath) {
  return new Promise((resolve, reject) => {
    exec(`clamscan ${filePath}`, (error, stdout) => {
      if (error && error.code === 1) {
        reject(new Error('File failed virus scan'));
      }
      resolve(true);
    });
  });
}

// 4. Dimension check (prevent polyglot attacks)
const sharp = require('sharp');
const metadata = await sharp(filePath).metadata();
if (metadata.width > 4000 || metadata.height > 4000) {
  throw new Error('Image dimensions too large');
}
```

### 12.4 Rate Limiting

```typescript
// Global rate limiter: 100 requests per 15 minutes per IP
@UseGuards(ThrottleGuard)
@Throttle(100, 900) // 100 requests per 900 seconds
@Controller('api')
export class ApiController { ... }

// Stricter for auth endpoints
@Post('auth/login')
@Throttle(5, 900) // 5 login attempts per 15 minutes
async login() { ... }

// Per-user rate limits for expensive operations
async checkInAttendance(userId: string) {
  const key = `checkin:${userId}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, 3600); // 1 hour window
  }
  if (count > 10) { // Max 10 check-ins per hour
    throw new TooManyRequestsException();
  }
}
```

### 12.5 Role-Based Access Control

```typescript
enum Role {
  ADMIN = 'admin',      // Full system access
  COACH = 'coach',      // Manage classes, athletes, leaderboards
  AMBASSADOR = 'ambassador', // Moderate channels, guide new members
  MEMBER = 'member',    // Normal user
  TRIAL = 'trial'       // View-only, no messaging
}

// Permission matrix
const permissions = {
  'attendance:check-in': [Role.MEMBER, Role.AMBASSADOR, Role.COACH, Role.ADMIN],
  'channel:post': [Role.MEMBER, Role.AMBASSADOR, Role.COACH, Role.ADMIN],
  'channel:post': [Role.TRIAL], // TRIAL can only read
  'message:delete-any': [Role.COACH, Role.ADMIN],
  'channel:create': [Role.COACH, Role.ADMIN],
  'leaderboard:view': [Role.MEMBER, Role.AMBASSADOR, Role.COACH, Role.ADMIN],
  'coach:dashboard': [Role.COACH, Role.ADMIN]
};

// Enforce at route level
@UseGuards(RolesGuard)
@Roles(Role.COACH, Role.ADMIN)
@Post('coaches/bulk-import')
bulkImport() { ... }
```

---

## 13. MVP Phasing Plan

### Phase 1: Foundation (Months 1-2)
**Goal:** Get members using the app daily for attendance

**Deliverables:**
- User authentication (Firebase Auth + JWT)
- QR code check-in system
- Basic XP system (attendance + streak multiplier)
- Streak tracking with freeze mechanics
- Profile page with stats
- Push notifications for streaks
- Basic attendance calendar heatmap
- Simple leaderboards (weekly XP)
- **NEW: Session logging with basic prompts** (start of reflection)
- **NEW: Belt/stripe promotion tracking and display**

**Success Metrics:**
- 80% of active gym members have app
- 60% check in via app (vs. manual tracking)
- Average streak > 10 days
- Daily active users (DAU) > 50% of registered
- 40% of members complete session logs

**Team Size:** 1 backend dev + 1 frontend dev + 1 designer

**Team Size:** 1 backend dev + 1 frontend dev + 1 designer

### Phase 2: Engagement (Months 3-4)
**Goal:** Full gamification with social comparison and learning

**Deliverables:**
- Badge system (attendance, discipline mastery, achievements)
- League system with dynamic promotion/demotion
- All leaderboard types (weekly, monthly, all-time, referral)
- Belt progression tracker with technique checklist
- Referral program MVP (tracking pipeline, rewards system)
- Email notifications for referral status changes
- User profiles with featured badges
- Friend list and friend-only leaderboards
- **NEW: Class materials & study plans (coach-created resources)**
- **NEW: Technique progress tracking (learnable skills)**
- **NEW: Personal goals system (set and track goals)**
- **NEW: Coach session planning tools (drill templates, class templates)**
- **NEW: Deep journal with prompts (full reflection system)**

**Success Metrics:**
- Badge earned by 70% of members (adoption)
- League promotion/demotion each month (engagement)
- 10% of members complete referral flow
- Average session time > 5 minutes
- 30% of students accessing class materials
- 50% of members setting personal goals
- Coaches actively using planning tools

**Team Size:** 2 backend devs + 1 frontend dev + 1 designer

**Team Size:** 2 backend devs + 1 frontend dev + 1 designer

### Phase 3: Community (Months 5-6)
**Goal:** Build internal social network to drive retention

**Deliverables:**
- Discord-like channels (General, Discipline-specific, Competitions, Off-topic)
- **NEW: Class-specific channels (Lunch class, Open mat, Competition team)**
- **NEW: Rolling feedback channel**
- Real-time chat with WebSocket
- Photo/video uploads to channels (compression + CDN)
- Message reactions and threading
- Competition media gallery
- @mentions and notifications
- Channel moderation tools (pins, deletions, mutes)
- Live typing indicators and presence
- **NEW: Rolling/video library (demonstrations, live rounds, highlights)**
- **NEW: Coach breakdowns on footage**
- **NEW: Video feedback system (peer and coach comments)**

**Success Metrics:**
- 40% of members post in channels monthly
- 1,000+ messages per month in community
- Competition galleries with 100+ photos
- Community as top engagement driver (>30% DAU coming from channel notifications)
- 20% of members uploading rolling footage
- 500+ videos in library with active feedback

**Team Size:** 2 backend devs + 2 frontend devs + 1 designer + 1 DevOps

**Team Size:** 2 backend devs + 2 frontend devs + 1 designer + 1 DevOps

### Phase 4: Analytics & Expansion (Months 7+)
**Goal:** Advanced insights, retention optimization, and coach tools maturity

**Deliverables:**
- Whoop-style training load scoring (intensity + recovery)
- Monthly training reports with trend analysis
- Rest day recommendations
- Injury/soreness tracking (optional)
- Coach dashboard (member compliance, training patterns)
- API for gym management system integration (Mindbody, Zen Planner)
- **NEW: Enhanced coach corner features**
  - Student progress monitoring dashboard
  - Session attendance and engagement analytics
  - Bulk technique assignment across classes
  - Curriculum planning (week-by-week progression)
- **NEW: Journal analytics and insights**
  - AI-powered theme detection in journals
  - Common challenges identified across members
  - Coach guidance based on journal sentiment
- **NEW: Video library analytics**
  - Most-watched techniques
  - Technique performance correlation
  - Trending movements
- **NEW: Goal achievement tracking**
  - Member goal completion rates
  - Time-to-goal analysis
  - Recommendations for next goals
- Wearable integration (Whoop, Apple Watch, Garmin) — future
- Advanced notifications (class scheduling, coach feedback)

**Success Metrics:**
- Training analytics viewed by 50% of members
- Coach engagement in platform (60%+ active weekly)
- Member churn reduction (target: 15% decrease vs. control)
- NPS score > 50
- Coaches using analytics for curriculum decisions
- Video library engaged by 70% of members
- Goal achievement rate > 40%

**Team Size:** 3 backend devs + 2 frontend devs + 1 data analyst + 1 DevOps

**Team Size:** 3 backend devs + 2 frontend devs + 1 data analyst + 1 DevOps

---

## 14. Integration Points

### 14.1 Gym Management Software

**Mindbody or Zen Planner Integration:**
```
Option A: Webhook-based sync
  1. Gym updates class schedule in Mindbody
  2. Mindbody sends webhook to our API
  3. We sync classes, instructors, capacity
  4. Real-time availability check when user checks in

Option B: Batch import
  1. Daily cron job pulls class list from Mindbody API
  2. Syncs with our database
  3. Handles class rescheduling/cancellations

Data to sync:
  - Classes (name, schedule, instructor, capacity, location)
  - Memberships (user status, membership tier, expiry)
  - Staff (coaches, instructors)
  - Attendance (if stored in Mindbody, sync back)

Conflict resolution:
  - If member paid in Mindbody, mark as active in Training Grounds
  - If member canceled, set to paused (give option to reactivate)
```

### 14.2 Payment & Billing

**Stripe Integration:**
- **Checkout**: Membership purchase, referral reward redemption
- **Subscriptions**: Recurring membership billing
- **Webhooks**: Listen for payment failures, refunds, subscription changes
- **PCI Compliance**: Stripe handles card data (we never see it)

```javascript
// Example: Referral reward redemption
async function redeemMembershipCredit(userId, days) {
  const customer = await stripe.customers.retrieve(user.stripe_customer_id);

  // Create a discount code
  const coupon = await stripe.coupons.create({
    duration: 'repeating',
    duration_in_months: 1,
    percent_off: 100, // Free month
    max_redemptions: 1
  });

  // Apply to their subscription
  await stripe.subscriptions.update(user.stripe_subscription_id, {
    coupon: coupon.id
  });
}
```

### 14.3 Social Media Sharing

**Share Referral Links:**
```javascript
// Native Share API for SMS, iMessage, Email
Share.open({
  url: 'https://training-grounds.app/join/ABC123XYZ',
  message: 'Join me at Training Grounds! Use code ABC123XYZ for a free trial.',
  subject: 'Train With Me at Training Grounds',
  social: ['instagram', 'facebook', 'twitter', 'email']
});

// Deep linking
// training-grounds://invite/ABC123XYZ
// tg://invite/ABC123XYZ
// https://training-grounds.app/join/ABC123XYZ

// App links automatically open in native app if installed
// Falls back to web if not
```

### 14.4 Calendar Sync

**Future: Add to calendar**
```javascript
async function addClassToCalendar(classId) {
  const trainingClass = await Class.findById(classId);

  // Generate .ics file
  const event = {
    title: trainingClass.name,
    startTime: trainingClass.nextSchedule(),
    endTime: trainingClass.nextSchedule() + (60 * 60 * 1000), // 1 hour
    location: gymAddress,
    description: `${trainingClass.discipline} class with ${trainingClass.instructor.name}`
  };

  // Share .ics or open native calendar app
  Share.open({ url: generateICS(event) });
}
```

### 14.5 Wearable Device Integration (Future)

**Whoop, Apple Watch, Garmin:**
```javascript
// Phase 4+: Connect wearables for training load insights
// - Pull daily strain/recovery data from Whoop API
// - Correlate with gym training load (our calculation)
// - Surface recommendations: "Your Whoop strain is high, consider a rest day"
// - Auto-adjust leaderboard rankings based on recovery score
```

---

## 15. Deployment & Operations

### 15.1 Environments

```
Development (local)
  → Localhost, Firebase emulator, local PostgreSQL

Staging (qa.training-grounds.app)
  → Separate AWS account, feature testing, UAT
  → Deploy on every commit to staging branch

Production (api.training-grounds.app)
  → Primary AWS account, multi-AZ RDS, Redis cluster
  → Deploy manually after QA approval
  → Blue-green deployment for zero-downtime updates
```

### 15.2 Database Migrations

```bash
# Using TypeORM CLI
npm run typeorm migration:generate -- -n AddBadgeSystem
npm run typeorm migration:run -- --synchronize=false

# Version control migrations in src/database/migrations/
# Deploy migrations before app start
```

### 15.3 Scaling Strategy

**Phase 1-2 (500-2000 users):**
- Single Fargate instance (2 vCPU)
- RDS db.t3.small
- Redis single node

**Phase 3-4 (2000-10000 users):**
- Load balanced Fargate (3 instances minimum)
- RDS Multi-AZ failover
- Redis cluster (3 nodes)
- CloudFront CDN for media

**Phase 5+ (10000+ users):**
- Fargate auto-scaling (4-10 instances)
- RDS with read replicas
- ElastiCache Redis cluster with auto-failover
- S3 Intelligent-Tiering for old media
- Consider DynamoDB for leaderboard reads (if needed)

### 15.4 Backup & Disaster Recovery

**Backup Strategy:**
- RDS automated backups (35-day retention)
- Weekly full backup export to S3
- Redis snapshot every 6 hours (upload to S3)
- Test restore monthly

**RTO/RPO Targets:**
- Recovery Time Objective: 2 hours (restore from backup)
- Recovery Point Objective: 1 hour (max data loss)

**Disaster Recovery Runbook:**
1. Detect outage (monitoring alert)
2. Failover RDS to read replica or restore from backup
3. Restore Redis from S3 snapshot
4. Restart Fargate tasks
5. Verify data consistency
6. Post-incident review

---

## Conclusion

Training Grounds is designed as a scalable, real-time engagement platform that turns gym retention into a habit. By combining Duolingo's streak psychology, Whoop's training analytics, and Discord's community features, the app creates multiple hooks for daily engagement.

The architecture prioritizes:
- **Speed**: React Native for fast shipping, NestJS for productivity
- **Scalability**: Stateless services, Redis leaderboards, async processing
- **Reliability**: PostgreSQL ACID, automated backups, multi-AZ deployment
- **User Experience**: Real-time chat, instant leaderboard updates, push notifications

The phased rollout ensures we validate core gamification (Phase 1-2) before investing in community features (Phase 3), reducing risk and enabling course correction based on user data.

**Next Steps:**
1. Finalize design mockups with Figma
2. Set up AWS infrastructure and CI/CD
3. Begin Phase 1 backend + frontend in parallel
4. Plan beta launch with 50 members at single gym location
5. Iterate on gamification mechanics based on early user behavior
