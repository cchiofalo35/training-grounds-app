import 'reflect-metadata';
import dataSource from '../config/data-source';
import { GymEntity, GymMembershipEntity } from '../entities/gym.entity';
import { UserEntity } from '../entities/user.entity';
import { ChannelEntity } from '../entities/channel.entity';
import { BadgeEntity } from '../entities/badge.entity';
import { QuestEntity } from '../entities/quest.entity';
import { SkillEntity } from '../entities/skill.entity';

/**
 * Seeds CrossFit Karuna gym tenant (rebranded from the earlier "Karuna CrossFit").
 *
 *  - Brand   : Karuna lime green (#8BC53F) on near-black
 *  - Location: 304 Manns Rd, West Gosford NSW 2250, Australia
 *  - Tagline : "Fitter. Stronger. Happier."
 *
 * CrossFit-specific content is seeded:
 *  - 10 channels (incl. #pr-bell for PR auto-posts)
 *  - 30+ badges (attendance, skill, lift-PR, benchmark WODs, competitions, secrets)
 *  - 5 default quests
 *  - Gymnastics + weightlifting skill catalog
 *
 * This seed is IDEMPOTENT — rerunning updates the existing gym record to the
 * new branding/feature flags and inserts any missing child rows.
 *
 * Run: npx ts-node src/seeds/karuna-crossfit.ts
 */
async function seedCrossFitKaruna() {
  await dataSource.initialize();
  console.log('Database connected. Seeding CrossFit Karuna...');

  const gymRepo = dataSource.getRepository(GymEntity);
  const membershipRepo = dataSource.getRepository(GymMembershipEntity);
  const userRepo = dataSource.getRepository(UserEntity);
  const channelRepo = dataSource.getRepository(ChannelEntity);
  const badgeRepo = dataSource.getRepository(BadgeEntity);
  const questRepo = dataSource.getRepository(QuestEntity);
  const skillRepo = dataSource.getRepository(SkillEntity);

  // 1. Find or create the gym — handle rebrand from prior slug
  let gym =
    (await gymRepo.findOne({ where: { slug: 'crossfit-karuna' } })) ??
    (await gymRepo.findOne({ where: { slug: 'karuna-crossfit' } }));

  const owner = await userRepo.findOne({ where: {}, order: { joinedAt: 'ASC' } });
  if (!owner) {
    console.log('  No users found. Run demo-accounts seed first.');
    await dataSource.destroy();
    return;
  }

  const desired: Partial<GymEntity> = {
    name: 'CrossFit Karuna',
    slug: 'crossfit-karuna',
    ownerId: owner.id,
    plan: 'pro',
    // Branding — Karuna lime green on near-black
    primaryColor: '#8BC53F',
    secondaryColor: '#1A1A1A',
    surfaceColor: '#111111',
    textPrimary: '#FFFFFF',
    textMuted: '#8B949E',
    headingFont: 'Bebas Neue',
    bodyFont: 'Inter',
    timezone: 'Australia/Sydney',
    currency: 'AUD',
    address: '304 Manns Rd, West Gosford NSW 2250',
    city: 'West Gosford',
    streakFreezeEnabled: true,
    maxStreakFreezesPerMonth: 2,
    referralProgramEnabled: true,
    communityEnabled: true,
    videoLibraryEnabled: true,
    journalEnabled: true,
    coachesCornerEnabled: true,
    leaderboardsEnabled: true,
    prTrackingEnabled: true,
    benchmarkWodEnabled: true,
    isActive: true,
  };

  if (!gym) {
    gym = await gymRepo.save(gymRepo.create(desired));
    console.log(`  Created gym: ${gym.name} (${gym.slug})`);
  } else {
    Object.assign(gym, desired);
    gym = await gymRepo.save(gym);
    console.log(`  Updated gym: ${gym.name} (${gym.slug})`);
  }

  // 2. Memberships for all users
  const users = await userRepo.find();
  let membershipsCreated = 0;
  for (const user of users) {
    const existing = await membershipRepo.findOne({
      where: { gymId: gym.id, userId: user.id },
    });
    if (!existing) {
      const role =
        user.id === gym.ownerId
          ? 'owner'
          : user.role === 'admin'
            ? 'admin'
            : user.role;
      await membershipRepo.save(
        membershipRepo.create({
          gymId: gym.id,
          userId: user.id,
          role,
          isActive: true,
        }),
      );
      membershipsCreated++;
    }
  }
  console.log(`  Memberships: ${membershipsCreated} new / ${users.length} total users`);

  // 3. CrossFit channels
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- worktree resolves shared types to parent repo
  const channelDefs: Array<Record<string, any>> = [
    { name: 'announcements', description: 'WOD posts, schedule changes, gym news', category: 'announcements', isPinned: true, isReadOnly: true, sortOrder: 0 },
    { name: 'general', description: 'General chat', category: 'general', sortOrder: 1 },
    { name: 'introductions', description: 'Welcome new members to the box', category: 'general', sortOrder: 2 },
    { name: 'wod-results', description: 'Post your scores and times', category: 'training', sortOrder: 3 },
    { name: 'pr-bell', description: 'Auto-posted when someone hits a PR 🔔', category: 'training', isReadOnly: false, sortOrder: 4 },
    { name: 'competition-prep', description: 'Open season, throwdown prep', category: 'training', sortOrder: 5 },
    { name: 'mobility-recovery', description: 'Stretching, recovery tips', category: 'training', sortOrder: 6 },
    { name: 'nutrition', description: 'Meal prep, macros, recipes', category: 'general', sortOrder: 7 },
    { name: 'highlights', description: 'Member spotlights and achievements', category: 'media', sortOrder: 8 },
    { name: 'rolling-footage', description: 'Lift videos for form checks', category: 'media', sortOrder: 9 },
  ];

  let channelsCreated = 0;
  for (const def of channelDefs) {
    const existing = await channelRepo.findOne({
      where: { gymId: gym.id, name: def.name },
    });
    if (!existing) {
      await channelRepo.save(channelRepo.create({ ...def, gymId: gym.id }));
      channelsCreated++;
    }
  }
  console.log(`  Channels: ${channelsCreated} new / ${channelDefs.length} total`);

  // 4. CrossFit badges — attendance, skill, lift, benchmark, competition, secret
  const badgeDefs: Partial<BadgeEntity>[] = [
    // Attendance
    { name: 'Welcome to the Box', description: 'Complete your first WOD', iconUrl: '/badges/first-wod.png', category: 'attendance', criteriaJson: { type: 'attendance_count', threshold: 1 }, isHidden: false },
    { name: 'Week Warrior', description: '7-day training streak', iconUrl: '/badges/week-warrior.png', category: 'attendance', criteriaJson: { type: 'streak_days', threshold: 7 }, isHidden: false },
    { name: 'Monthly Machine', description: '30-day training streak', iconUrl: '/badges/monthly-machine.png', category: 'attendance', criteriaJson: { type: 'streak_days', threshold: 30 }, isHidden: false },
    { name: 'Century Club', description: 'Complete 100 WODs', iconUrl: '/badges/century-club.png', category: 'attendance', criteriaJson: { type: 'attendance_count', threshold: 100 }, isHidden: false },
    { name: 'Box Lifer', description: '365 WODs under the belt', iconUrl: '/badges/box-lifer.png', category: 'attendance', criteriaJson: { type: 'attendance_count', threshold: 365 }, isHidden: false },

    // Skill (gymnastics milestones)
    { name: 'Off the Ground', description: 'Your first pull-up', iconUrl: '/badges/pullup.png', category: 'discipline', criteriaJson: { type: 'skill_milestone', skill: 'pull-up' }, isHidden: false },
    { name: 'Ring King/Queen', description: 'Your first muscle-up', iconUrl: '/badges/muscle-up.png', category: 'discipline', criteriaJson: { type: 'skill_milestone', skill: 'ring-muscle-up' }, isHidden: false },
    { name: 'Upside Down', description: 'First handstand walk', iconUrl: '/badges/handstand-walk.png', category: 'discipline', criteriaJson: { type: 'skill_milestone', skill: 'handstand-walk' }, isHidden: false },
    { name: 'Top of the Rope', description: 'First rope climb', iconUrl: '/badges/rope-climb.png', category: 'discipline', criteriaJson: { type: 'skill_milestone', skill: 'rope-climb' }, isHidden: false },
    { name: 'Whip It', description: '50 consecutive double-unders', iconUrl: '/badges/double-unders.png', category: 'discipline', criteriaJson: { type: 'skill_milestone', skill: 'double-unders', threshold: 50 }, isHidden: false },
    { name: 'One-Legged Wonder', description: 'First pistol squat', iconUrl: '/badges/pistol.png', category: 'discipline', criteriaJson: { type: 'skill_milestone', skill: 'pistol-squat' }, isHidden: false },
    { name: 'Over the Bar', description: 'First bar muscle-up', iconUrl: '/badges/bar-muscle-up.png', category: 'discipline', criteriaJson: { type: 'skill_milestone', skill: 'bar-muscle-up' }, isHidden: false },
    { name: 'Butterfly Effect', description: 'Perform butterfly pull-ups', iconUrl: '/badges/butterfly.png', category: 'discipline', criteriaJson: { type: 'skill_milestone', skill: 'butterfly-pull-up' }, isHidden: false },
    { name: 'Core Crusher', description: '20 unbroken toes-to-bar', iconUrl: '/badges/ttb.png', category: 'discipline', criteriaJson: { type: 'skill_milestone', skill: 'toes-to-bar', threshold: 20 }, isHidden: false },

    // Lift PRs
    { name: 'PR Bell', description: 'Log your first personal record', iconUrl: '/badges/pr-bell.png', category: 'discipline', criteriaJson: { type: 'pr_count', threshold: 1 }, isHidden: false },
    { name: 'Squat Standard', description: 'Back squat exceeds bodyweight', iconUrl: '/badges/squat.png', category: 'discipline', criteriaJson: { type: 'pr_ratio', movement: 'Back Squat', ratio: 1.0 }, isHidden: false },
    { name: 'Dead Serious', description: 'Deadlift exceeds 1.5x bodyweight', iconUrl: '/badges/deadlift.png', category: 'discipline', criteriaJson: { type: 'pr_ratio', movement: 'Deadlift', ratio: 1.5 }, isHidden: false },
    { name: 'Olympic Standard', description: 'Clean & Jerk exceeds bodyweight', iconUrl: '/badges/cj.png', category: 'discipline', criteriaJson: { type: 'pr_ratio', movement: 'Clean & Jerk', ratio: 1.0 }, isHidden: false },
    { name: 'Snatch Game', description: 'Snatch exceeds 0.75x bodyweight', iconUrl: '/badges/snatch.png', category: 'discipline', criteriaJson: { type: 'pr_ratio', movement: 'Snatch', ratio: 0.75 }, isHidden: false },
    { name: 'PR Machine', description: 'Log 10 PRs in a single month', iconUrl: '/badges/pr-machine.png', category: 'discipline', criteriaJson: { type: 'pr_count_month', threshold: 10 }, isHidden: false },

    // Benchmark WODs
    { name: 'Fran-tastic', description: 'Complete Fran', iconUrl: '/badges/fran.png', category: 'discipline', criteriaJson: { type: 'benchmark_completed', wod: 'Fran' }, isHidden: false },
    { name: 'Murph Survivor', description: 'Complete Murph', iconUrl: '/badges/murph.png', category: 'discipline', criteriaJson: { type: 'benchmark_completed', wod: 'Murph' }, isHidden: false },
    { name: 'Amazing Grace', description: 'Complete Grace', iconUrl: '/badges/grace.png', category: 'discipline', criteriaJson: { type: 'benchmark_completed', wod: 'Grace' }, isHidden: false },
    { name: 'Hero WOD: DT', description: 'Complete DT', iconUrl: '/badges/dt.png', category: 'discipline', criteriaJson: { type: 'benchmark_completed', wod: 'DT' }, isHidden: false },
    { name: 'Met All the Girls', description: 'Complete every Girls WOD', iconUrl: '/badges/girls-wods.png', category: 'discipline', criteriaJson: { type: 'benchmark_set', set: 'girls' }, isHidden: false },
    { name: 'Fran Under Five', description: 'Fran under 5 minutes', iconUrl: '/badges/sub-5-fran.png', category: 'discipline', criteriaJson: { type: 'benchmark_time', wod: 'Fran', maxSeconds: 300 }, isHidden: false },

    // Competition
    { name: 'Throwdown Rookie', description: 'First local competition entered', iconUrl: '/badges/throwdown.png', category: 'competition', criteriaJson: { type: 'competition_count', threshold: 1 }, isHidden: false },
    { name: 'Open Season', description: 'Registered for the CrossFit Open', iconUrl: '/badges/open.png', category: 'competition', criteriaJson: { type: 'event', event: 'crossfit_open' }, isHidden: false },
    { name: 'On the Box', description: 'Top-3 finish in any competition', iconUrl: '/badges/podium.png', category: 'competition', criteriaJson: { type: 'podium_count', threshold: 1 }, isHidden: false },
    { name: 'Better Together', description: 'Entered a team competition', iconUrl: '/badges/team.png', category: 'competition', criteriaJson: { type: 'event', event: 'team_comp' }, isHidden: false },

    // Secret
    { name: '5AM Warrior', description: 'Check in before 6 AM', iconUrl: '/badges/5am.png', category: 'secret', criteriaJson: { type: 'checkin_before_hour', hour: 6 }, isHidden: true },
    { name: 'Midnight Murph', description: 'Complete Murph outside normal hours', iconUrl: '/badges/midnight-murph.png', category: 'secret', criteriaJson: { type: 'benchmark_time_of_day', wod: 'Murph', afterHour: 22 }, isHidden: true },
    { name: 'Comeback Kid', description: 'Rebuild a 30-day streak from zero', iconUrl: '/badges/comeback.png', category: 'secret', criteriaJson: { type: 'streak_recovery', threshold: 30 }, isHidden: true },
    { name: 'The Turtle', description: '365-day streak (Karuna spirit animal 🐢)', iconUrl: '/badges/turtle.png', category: 'secret', criteriaJson: { type: 'streak_days', threshold: 365 }, isHidden: true },
  ];

  let badgesCreated = 0;
  for (const badge of badgeDefs) {
    const existing = await badgeRepo.findOne({
      where: { gymId: gym.id, name: badge.name! },
    });
    if (!existing) {
      await badgeRepo.save(badgeRepo.create({ ...badge, gymId: gym.id }));
      badgesCreated++;
    }
  }
  console.log(`  Badges: ${badgesCreated} new / ${badgeDefs.length} total`);

  // 5. Default quests
  const questDefs: Partial<QuestEntity>[] = [
    {
      name: '3x This Week',
      description: 'Attend 3 WODs this week',
      type: 'weekly',
      xpReward: 100,
      criteriaJson: { type: 'attendance_count', period: 'week', threshold: 3 },
      isActive: true,
    },
    {
      name: '12 in a Month',
      description: 'Attend 12 WODs this month',
      type: 'monthly',
      xpReward: 300,
      criteriaJson: { type: 'attendance_count', period: 'month', threshold: 12 },
      isActive: true,
    },
    {
      name: 'Log a PR',
      description: 'Hit a new personal record this week',
      type: 'weekly',
      xpReward: 150,
      criteriaJson: { type: 'pr_count', period: 'week', threshold: 1 },
      isActive: true,
    },
    {
      name: 'Try Something New',
      description: 'Attend a class type you have not done this month',
      type: 'monthly',
      xpReward: 75,
      criteriaJson: { type: 'distinct_class_types', period: 'month', threshold: 1 },
      isActive: true,
    },
    {
      name: 'RX a Benchmark',
      description: 'Complete a benchmark WOD at RX weight',
      type: 'monthly',
      xpReward: 200,
      criteriaJson: { type: 'benchmark_rx', period: 'month', threshold: 1 },
      isActive: true,
    },
  ];

  let questsCreated = 0;
  for (const quest of questDefs) {
    const existing = await questRepo.findOne({
      where: { gymId: gym.id, name: quest.name! },
    });
    if (!existing) {
      await questRepo.save(questRepo.create({ ...quest, gymId: gym.id }));
      questsCreated++;
    }
  }
  console.log(`  Quests: ${questsCreated} new / ${questDefs.length} total`);

  // 6. Skill catalog (CrossFit movements)
  const skillDefs: Partial<SkillEntity>[] = [
    // Gymnastics
    { name: 'Kipping Pull-Up', category: 'gymnastics', sortOrder: 10 },
    { name: 'Strict Pull-Up', category: 'gymnastics', sortOrder: 11 },
    { name: 'Butterfly Pull-Up', category: 'gymnastics', sortOrder: 12 },
    { name: 'Ring Muscle-Up', category: 'gymnastics', sortOrder: 13 },
    { name: 'Bar Muscle-Up', category: 'gymnastics', sortOrder: 14 },
    { name: 'Strict Handstand Push-Up', category: 'gymnastics', sortOrder: 15 },
    { name: 'Kipping Handstand Push-Up', category: 'gymnastics', sortOrder: 16 },
    { name: 'Handstand Walk', category: 'gymnastics', sortOrder: 17 },
    { name: 'Pistol Squat', category: 'gymnastics', sortOrder: 18 },
    { name: 'Rope Climb', category: 'gymnastics', sortOrder: 19 },
    { name: 'Legless Rope Climb', category: 'gymnastics', sortOrder: 20 },
    { name: 'Toes-to-Bar', category: 'gymnastics', sortOrder: 21 },
    { name: 'Double-Unders', category: 'gymnastics', sortOrder: 22 },
    { name: 'Triple-Unders', category: 'gymnastics', sortOrder: 23 },
    { name: 'Ring Dips', category: 'gymnastics', sortOrder: 24 },
    { name: 'L-Sit', category: 'gymnastics', sortOrder: 25 },

    // Weightlifting
    { name: 'Clean & Jerk', category: 'weightlifting', sortOrder: 30 },
    { name: 'Power Clean', category: 'weightlifting', sortOrder: 31 },
    { name: 'Hang Clean', category: 'weightlifting', sortOrder: 32 },
    { name: 'Squat Clean', category: 'weightlifting', sortOrder: 33 },
    { name: 'Snatch', category: 'weightlifting', sortOrder: 34 },
    { name: 'Power Snatch', category: 'weightlifting', sortOrder: 35 },
    { name: 'Hang Snatch', category: 'weightlifting', sortOrder: 36 },
    { name: 'Squat Snatch', category: 'weightlifting', sortOrder: 37 },
    { name: 'Overhead Squat', category: 'weightlifting', sortOrder: 38 },
    { name: 'Thruster', category: 'weightlifting', sortOrder: 39 },
    { name: 'Cluster', category: 'weightlifting', sortOrder: 40 },
  ];

  let skillsCreated = 0;
  for (const skill of skillDefs) {
    const existing = await skillRepo.findOne({
      where: { gymId: gym.id, name: skill.name! },
    });
    if (!existing) {
      await skillRepo.save(skillRepo.create({ ...skill, gymId: gym.id }));
      skillsCreated++;
    }
  }
  console.log(`  Skills: ${skillsCreated} new / ${skillDefs.length} total`);

  console.log('\nCrossFit Karuna seed complete.');
  console.log(`  Gym      : ${gym.name} (slug: ${gym.slug})`);
  console.log(`  Branding : primary=${gym.primaryColor}, bg=${gym.secondaryColor}`);
  console.log(`  Location : ${gym.address}, ${gym.city}`);
  console.log(`  Feats    : prTracking=${gym.prTrackingEnabled}, benchmark=${gym.benchmarkWodEnabled}, referrals=${gym.referralProgramEnabled}`);

  await dataSource.destroy();
}

seedCrossFitKaruna().catch((err) => {
  console.error('CrossFit Karuna seed failed:', err);
  process.exit(1);
});

export { seedCrossFitKaruna };
