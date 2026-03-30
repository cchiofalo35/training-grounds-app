import 'reflect-metadata';
import type { Discipline } from '@training-grounds/shared';
import * as admin from 'firebase-admin';
import dataSource from '../config/data-source';
import { UserEntity } from '../entities/user.entity';
import { AttendanceRecordEntity } from '../entities/attendance.entity';
import { JournalEntryEntity } from '../entities/journal.entity';
import { BadgeEntity, UserBadgeEntity } from '../entities/badge.entity';

/**
 * Demo accounts seed script.
 *
 * Creates 3 demo users in Firebase Auth + database with realistic
 * attendance history, journal entries, XP, streaks, and badges.
 *
 * Usage:
 *   DATABASE_URL=<your-db-url> FIREBASE_PROJECT_ID=training-grounds-app \
 *     npx ts-node -r tsconfig-paths/register src/seeds/demo-accounts.ts
 *
 * Or run via the /auth/seed-demo endpoint (admin only, or remove guard for first-time setup).
 */

const DEMO_USERS = [
  {
    email: 'demo@traininggrounds.app',
    password: 'Demo1234!',
    name: 'Alex Demo',
    beltRank: 'blue' as const,
    stripes: 2,
    totalXp: 8750,
    currentStreak: 12,
    longestStreak: 34,
    role: 'member' as const,
    streakFreezes: 2,
    streakFreezesUsed: 1,
    classCount: 47,
  },
  {
    email: 'coach@traininggrounds.app',
    password: 'Coach1234!',
    name: 'Coach Martinez',
    beltRank: 'black' as const,
    stripes: 3,
    totalXp: 52000,
    currentStreak: 45,
    longestStreak: 120,
    role: 'coach' as const,
    streakFreezes: 5,
    streakFreezesUsed: 2,
    classCount: 312,
  },
  {
    email: 'newbie@traininggrounds.app',
    password: 'Newbie1234!',
    name: 'Jordan New',
    beltRank: 'white' as const,
    stripes: 0,
    totalXp: 450,
    currentStreak: 3,
    longestStreak: 5,
    role: 'member' as const,
    streakFreezes: 2,
    streakFreezesUsed: 0,
    classCount: 5,
  },
];

const DISCIPLINES = ['bjj-gi', 'bjj-nogi', 'muay-thai', 'wrestling', 'mma', 'boxing', 'open-mat'] as const;
const CLASS_NAMES: Record<string, string[]> = {
  'bjj-gi': ['Fundamentals BJJ', 'Advanced Gi', 'Competition BJJ'],
  'bjj-nogi': ['No-Gi Fundamentals', 'Advanced No-Gi', 'Submission Grappling'],
  'muay-thai': ['Muay Thai Basics', 'Advanced Striking', 'Pad Work', 'Sparring MT'],
  wrestling: ['Wrestling Fundamentals', 'Takedown Drilling', 'Live Wrestling'],
  mma: ['MMA Fundamentals', 'Advanced MMA', 'Fight Camp'],
  boxing: ['Boxing Basics', 'Heavy Bag Work', 'Boxing Sparring'],
  'open-mat': ['Open Mat', 'Free Rolling', 'Open Sparring'],
};
const INTENSITIES = ['light', 'moderate', 'high', 'all-out'] as const;

const JOURNAL_ENTRIES = [
  {
    discipline: 'bjj-gi',
    className: 'Fundamentals BJJ',
    exploration: 'Worked on closed guard retention and breaking posture. Tried the flower sweep from a new angle.',
    challenge: 'Keeping my hips active when someone passes to half guard. I keep flattening out.',
    worked: 'My collar grip control was really solid today. Coach noticed I was breaking posture faster.',
    takeaways: 'Need to think of guard as an active position, not just holding on. Move hips first, then grips.',
    nextSession: 'Focus on hip escapes from half guard bottom. Ask coach about the underhook game.',
  },
  {
    discipline: 'muay-thai',
    className: 'Advanced Striking',
    exploration: 'Practiced the jab-cross-hook-low kick combo. Also drilled teeps to the body.',
    challenge: 'My rear low kick keeps getting checked. Timing is off — I\'m telegraphing it.',
    worked: 'Teep timing was great today. Used it to create distance and reset effectively.',
    takeaways: 'Set up the low kick with punches. Don\'t throw it naked. The teep is my best friend.',
    nextSession: 'Work on feinting before the low kick. Drill the Dutch-style blitz combo.',
  },
  {
    discipline: 'wrestling',
    className: 'Takedown Drilling',
    exploration: 'Single leg entries from different angles. Tried the high crotch to single transition.',
    challenge: 'Finishing the single leg against the fence/wall. People are good at hopping away.',
    worked: 'Level change was crisp today. My setups with collar ties before shooting were effective.',
    takeaways: 'Wrestling is about chain wrestling — if the first shot fails, transition immediately.',
    nextSession: 'Work on double leg finishes and mat returns from the clinch.',
  },
  {
    discipline: 'mma',
    className: 'MMA Fundamentals',
    exploration: 'Combined striking with clinch entries. Practiced dirty boxing to takedowns.',
    challenge: 'Transitioning from striking range to clinch without eating a counter.',
    worked: 'My jab-to-collar-tie entry was smooth. Got several clean takedowns from it.',
    takeaways: 'MMA is about blending ranges. Need to be comfortable in every range, not just one.',
    nextSession: 'Ground and pound positioning. How to maintain top control while landing strikes.',
  },
  {
    discipline: 'bjj-nogi',
    className: 'Advanced No-Gi',
    exploration: 'Leg locks! Worked on the ashi garami entries from standing and guard.',
    challenge: 'Understanding when to attack heel hooks vs straight ankle locks. Position before submission.',
    worked: 'My back takes from turtle were on point. Hit 3 clean ones during rolling.',
    takeaways: 'Leg locks are about control first. If you can control the legs, the finish comes naturally.',
    nextSession: 'Inside sankaku entries and the 411/honehole position. Review Danaher concepts.',
  },
];

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'TG-';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(6 + Math.floor(Math.random() * 14), Math.floor(Math.random() * 60), 0, 0);
  return d;
}

async function createFirebaseUser(email: string, password: string, name: string): Promise<string> {
  try {
    const existing = await admin.auth().getUserByEmail(email);
    console.log(`  Firebase user exists: ${email} (${existing.uid})`);
    return existing.uid;
  } catch {
    const user = await admin.auth().createUser({
      email,
      password,
      displayName: name,
      emailVerified: true,
    });
    console.log(`  Created Firebase user: ${email} (${user.uid})`);
    return user.uid;
  }
}

async function seed() {
  // Initialize Firebase Admin
  if (admin.apps.length === 0) {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID ?? 'training-grounds-app',
    });
  }

  // Connect to database
  await dataSource.initialize();
  console.log('Connected to database.\n');

  const userRepo = dataSource.getRepository(UserEntity);
  const attendanceRepo = dataSource.getRepository(AttendanceRecordEntity);
  const journalRepo = dataSource.getRepository(JournalEntryEntity);
  const badgeRepo = dataSource.getRepository(BadgeEntity);
  const userBadgeRepo = dataSource.getRepository(UserBadgeEntity);

  // Get all badges for assignment
  const allBadges = await badgeRepo.find();
  if (allBadges.length === 0) {
    console.log('⚠️  No badges found. Run the badge seed first (src/seeds/run.ts)');
  }

  for (const demo of DEMO_USERS) {
    console.log(`\n--- Setting up: ${demo.name} (${demo.email}) ---`);

    // 1. Create Firebase user
    const firebaseUid = await createFirebaseUser(demo.email, demo.password, demo.name);

    // 2. Create or update DB user
    let user = await userRepo.findOne({ where: { email: demo.email } });
    if (user) {
      console.log(`  DB user exists, updating...`);
      Object.assign(user, {
        firebaseUid,
        name: demo.name,
        beltRank: demo.beltRank,
        stripes: demo.stripes,
        totalXp: demo.totalXp,
        currentStreak: demo.currentStreak,
        longestStreak: demo.longestStreak,
        role: demo.role,
        streakFreezes: demo.streakFreezes,
        streakFreezesUsed: demo.streakFreezesUsed,
      });
      await userRepo.save(user);
    } else {
      user = userRepo.create({
        firebaseUid,
        email: demo.email,
        name: demo.name,
        beltRank: demo.beltRank,
        stripes: demo.stripes,
        totalXp: demo.totalXp,
        currentStreak: demo.currentStreak,
        longestStreak: demo.longestStreak,
        role: demo.role,
        referralCode: generateReferralCode(),
        streakFreezes: demo.streakFreezes,
        streakFreezesUsed: demo.streakFreezesUsed,
        lastCheckinDate: new Date().toISOString().split('T')[0],
      });
      await userRepo.save(user);
      console.log(`  Created DB user: ${user.id}`);
    }

    // 3. Create attendance records (spread across the last 90 days)
    const existingAttendance = await attendanceRepo.count({ where: { userId: user.id } });
    if (existingAttendance > 0) {
      console.log(`  ${existingAttendance} attendance records already exist, skipping...`);
    } else {
      const records: Partial<AttendanceRecordEntity>[] = [];
      for (let i = 0; i < demo.classCount; i++) {
        const discipline = randomItem(DISCIPLINES);
        const className = randomItem(CLASS_NAMES[discipline]);
        const xp = 50 + Math.floor(Math.random() * 150); // 50-200 XP per class
        records.push({
          userId: user.id,
          classId: `class-${discipline}-${Math.floor(Math.random() * 100)}`,
          checkedInAt: daysAgo(Math.floor(Math.random() * 90)),
          intensityRating: randomItem(INTENSITIES),
          xpEarned: xp,
          className,
          discipline,
        });
      }
      await attendanceRepo.save(records.map((r) => attendanceRepo.create(r)));
      console.log(`  Created ${records.length} attendance records`);
    }

    // 4. Create journal entries
    const existingJournals = await journalRepo.count({ where: { userId: user.id } });
    if (existingJournals > 0) {
      console.log(`  ${existingJournals} journal entries already exist, skipping...`);
    } else {
      const entriesToCreate = demo.classCount >= 20 ? 5 : demo.classCount >= 5 ? 3 : 1;
      const journals: Partial<JournalEntryEntity>[] = [];
      for (let i = 0; i < entriesToCreate; i++) {
        const entry = JOURNAL_ENTRIES[i % JOURNAL_ENTRIES.length];
        journals.push({
          userId: user.id,
          className: entry.className,
          discipline: entry.discipline as Discipline,
          exploration: entry.exploration,
          challenge: entry.challenge,
          worked: entry.worked,
          takeaways: entry.takeaways,
          nextSession: entry.nextSession,
          isSharedWithCoach: Math.random() > 0.5,
          createdAt: daysAgo(i * 7 + Math.floor(Math.random() * 5)),
        });
      }
      await journalRepo.save(journals.map((j) => journalRepo.create(j)));
      console.log(`  Created ${journals.length} journal entries`);
    }

    // 5. Assign badges based on XP/attendance
    if (allBadges.length > 0) {
      const existingUserBadges = await userBadgeRepo.count({ where: { userId: user.id } });
      if (existingUserBadges > 0) {
        console.log(`  ${existingUserBadges} badges already assigned, skipping...`);
      } else {
        let assignedCount = 0;
        for (const badge of allBadges) {
          const criteria = badge.criteriaJson as any;
          let earned = false;

          if (criteria.type === 'attendance_count') {
            earned = demo.classCount >= criteria.threshold;
          } else if (criteria.type === 'streak') {
            earned = demo.longestStreak >= criteria.threshold;
          } else if (criteria.type === 'xp_total') {
            earned = demo.totalXp >= criteria.threshold;
          } else if (criteria.type === 'custom' && criteria.key === 'late_checkin') {
            // Give Night Owl to coach only
            earned = demo.role === 'coach';
          }

          if (earned) {
            await userBadgeRepo.save(
              userBadgeRepo.create({
                userId: user.id,
                badgeId: badge.id,
                earnedAt: daysAgo(Math.floor(Math.random() * 60)),
              }),
            );
            assignedCount++;
          }
        }
        console.log(`  Assigned ${assignedCount} badges`);
      }
    }
  }

  console.log('\n✅ Demo accounts seeded successfully!');
  console.log('\n📋 Login credentials:');
  for (const demo of DEMO_USERS) {
    console.log(`   ${demo.name}: ${demo.email} / ${demo.password}`);
  }

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
