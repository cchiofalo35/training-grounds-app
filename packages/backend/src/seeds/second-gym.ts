import 'reflect-metadata';
import dataSource from '../config/data-source';
import { GymEntity, GymMembershipEntity } from '../entities/gym.entity';
import { UserEntity } from '../entities/user.entity';
import { ChannelEntity } from '../entities/channel.entity';
import { BadgeEntity } from '../entities/badge.entity';
import { QuestEntity } from '../entities/quest.entity';

/**
 * Seeds a second gym ("Iron Lion MMA") with different branding.
 * Used to verify cross-tenant isolation in dev and integration tests.
 *
 * Run: npx ts-node src/seeds/second-gym.ts
 */
async function seedSecondGym() {
  await dataSource.initialize();
  console.log('Database connected. Seeding second gym (Iron Lion MMA)...');

  const gymRepo = dataSource.getRepository(GymEntity);
  const membershipRepo = dataSource.getRepository(GymMembershipEntity);
  const userRepo = dataSource.getRepository(UserEntity);
  const channelRepo = dataSource.getRepository(ChannelEntity);
  const badgeRepo = dataSource.getRepository(BadgeEntity);
  const questRepo = dataSource.getRepository(QuestEntity);

  // 1. Create second gym with different branding
  let gym = await gymRepo.findOne({ where: { slug: 'iron-lion-mma' } });
  if (!gym) {
    // Use the first available user as owner (or create one)
    const owner = await userRepo.findOne({ order: { joinedAt: 'ASC' } });
    if (!owner) {
      console.log('  No users found. Skipping second gym seed (run demo-accounts seed first).');
      await dataSource.destroy();
      return;
    }

    gym = gymRepo.create({
      name: 'Iron Lion MMA',
      slug: 'iron-lion-mma',
      ownerId: owner.id,
      plan: 'starter',
      // Different branding from Training Grounds
      primaryColor: '#E74C3C',    // Red accent instead of gold
      secondaryColor: '#0D1117',  // Darker background
      surfaceColor: '#161B22',    // Different dark surface
      textPrimary: '#F0F6FC',     // Different light text
      textMuted: '#8B949E',       // Different muted text
      headingFont: 'Oswald',
      bodyFont: 'Roboto',
      timezone: 'America/Los_Angeles',
      currency: 'USD',
      streakFreezeEnabled: false,   // Different feature flags
      maxStreakFreezesPerMonth: 0,
      referralProgramEnabled: false,
      communityEnabled: true,
      isActive: true,
    });
    gym = await gymRepo.save(gym);
    console.log(`  Created gym: ${gym.name} (${gym.slug})`);
  } else {
    console.log(`  Gym already exists: ${gym.name} (${gym.slug})`);
  }

  // 2. Create membership for owner only (not all users)
  const existingMembership = await membershipRepo.findOne({
    where: { gymId: gym.id, userId: gym.ownerId },
  });
  if (!existingMembership) {
    await membershipRepo.save(
      membershipRepo.create({
        gymId: gym.id,
        userId: gym.ownerId,
        role: 'owner',
        isActive: true,
      }),
    );
    console.log('  Created owner membership');
  }

  // 3. Create different channels for this gym
  const channelDefs: Array<Partial<ChannelEntity>> = [
    { name: 'announcements', category: 'announcements', isPinned: true, isReadOnly: true, sortOrder: 0 },
    { name: 'general', category: 'general', sortOrder: 1 },
    { name: 'striking', category: 'discipline', discipline: 'muay-thai', sortOrder: 2 },
    { name: 'grappling', category: 'discipline', discipline: 'bjj-gi', sortOrder: 3 },
    { name: 'cage-fights', category: 'media', sortOrder: 4 },
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
  console.log(`  Created ${channelsCreated} channels (${channelDefs.length} total)`);

  // 4. Create different badges for this gym
  const badgeDefs: Partial<BadgeEntity>[] = [
    {
      name: 'Iron Debut',
      description: 'First class at Iron Lion',
      iconUrl: '/badges/iron-debut.png',
      category: 'attendance',
      criteriaJson: { type: 'attendance_count', threshold: 1 },
      isHidden: false,
    },
    {
      name: 'Lion Heart',
      description: '30 classes at Iron Lion',
      iconUrl: '/badges/lion-heart.png',
      category: 'attendance',
      criteriaJson: { type: 'attendance_count', threshold: 30 },
      isHidden: false,
    },
    {
      name: 'Cage Ready',
      description: 'Complete 10 MMA classes',
      iconUrl: '/badges/cage-ready.png',
      category: 'discipline',
      criteriaJson: { type: 'discipline_count', discipline: 'mma', threshold: 10 },
      isHidden: false,
    },
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
  console.log(`  Created ${badgesCreated} badges (${badgeDefs.length} total)`);

  // 5. Create different quests for this gym
  const questDefs: Partial<QuestEntity>[] = [
    {
      name: 'Lion\'s Den',
      description: 'Attend 5 classes this week',
      type: 'weekly',
      xpReward: 150,
      criteriaJson: { type: 'attendance_count', period: 'week', threshold: 5 },
      isActive: true,
    },
    {
      name: 'Iron Month',
      description: 'Attend 20 classes this month',
      type: 'monthly',
      xpReward: 500,
      criteriaJson: { type: 'attendance_count', period: 'month', threshold: 20 },
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
  console.log(`  Created ${questsCreated} quests (${questDefs.length} total)`);

  console.log('\nSecond gym seed complete.');
  console.log(`  Gym:      ${gym.name} (slug: ${gym.slug})`);
  console.log(`  Branding: primary=${gym.primaryColor}, secondary=${gym.secondaryColor}`);
  console.log(`  Fonts:    heading=${gym.headingFont}, body=${gym.bodyFont}`);
  console.log(`  Features: streakFreeze=${gym.streakFreezeEnabled}, referrals=${gym.referralProgramEnabled}`);

  await dataSource.destroy();
}

seedSecondGym().catch((err) => {
  console.error('Second gym seed failed:', err);
  process.exit(1);
});

export { seedSecondGym };
