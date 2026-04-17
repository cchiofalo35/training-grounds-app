import 'reflect-metadata';
import dataSource from '../config/data-source';
import { GymEntity, GymMembershipEntity } from '../entities/gym.entity';
import { UserEntity } from '../entities/user.entity';

const TENANT_TABLES = [
  'attendance_records',
  'channels',
  'channel_messages',
  'message_reactions',
  'class_schedules',
  'courses',
  'course_modules',
  'journal_entries',
  'journal_comments',
  'quests',
  'user_quests',
  'badges',
  'user_badges',
];

async function seedGym() {
  await dataSource.initialize();
  console.log('Database connected. Seeding default gym...');

  const gymRepo = dataSource.getRepository(GymEntity);
  const membershipRepo = dataSource.getRepository(GymMembershipEntity);
  const userRepo = dataSource.getRepository(UserEntity);

  // 1. Create or find default gym
  let gym = await gymRepo.findOne({ where: { slug: 'training-grounds' } });
  if (!gym) {
    // Find an admin/coach user to be the owner, fall back to first user
    const owner = await userRepo.findOne({
      where: [{ role: 'admin' }, { role: 'coach' }],
      order: { joinedAt: 'ASC' },
    });

    if (!owner) {
      const firstUser = await userRepo.findOne({ order: { joinedAt: 'ASC' } });
      if (!firstUser) {
        console.log('  No users found. Skipping gym seed (run demo-accounts seed first).');
        await dataSource.destroy();
        return;
      }
      gym = gymRepo.create({
        name: 'Training Grounds',
        slug: 'training-grounds',
        ownerId: firstUser.id,
        plan: 'pro',
        primaryColor: '#C9A87C',
        secondaryColor: '#1E1E1E',
        surfaceColor: '#2A2A2A',
        textPrimary: '#FAFAF8',
        textMuted: '#B0B5B8',
        headingFont: 'Bebas Neue',
        bodyFont: 'Inter',
        timezone: 'America/New_York',
        currency: 'USD',
        streakFreezeEnabled: true,
        maxStreakFreezesPerMonth: 2,
        referralProgramEnabled: true,
        communityEnabled: true,
        isActive: true,
      });
    } else {
      gym = gymRepo.create({
        name: 'Training Grounds',
        slug: 'training-grounds',
        ownerId: owner.id,
        plan: 'pro',
        primaryColor: '#C9A87C',
        secondaryColor: '#1E1E1E',
        surfaceColor: '#2A2A2A',
        textPrimary: '#FAFAF8',
        textMuted: '#B0B5B8',
        headingFont: 'Bebas Neue',
        bodyFont: 'Inter',
        timezone: 'America/New_York',
        currency: 'USD',
        streakFreezeEnabled: true,
        maxStreakFreezesPerMonth: 2,
        referralProgramEnabled: true,
        communityEnabled: true,
        isActive: true,
      });
    }
    gym = await gymRepo.save(gym);
    console.log(`  Created gym: ${gym.name} (${gym.slug})`);
  } else {
    console.log(`  Gym already exists: ${gym.name} (${gym.slug})`);
  }

  // 2. Create memberships for all existing users
  const users = await userRepo.find();
  let membershipsCreated = 0;
  for (const user of users) {
    const existing = await membershipRepo.findOne({
      where: { gymId: gym.id, userId: user.id },
    });
    if (!existing) {
      const role = user.id === gym.ownerId ? 'owner' : (user.role === 'admin' ? 'admin' : user.role);
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
  console.log(`  Created ${membershipsCreated} gym memberships (${users.length} total users)`);

  // 3. Backfill gymId on all tenant-scoped tables
  console.log('  Backfilling gymId on tenant-scoped tables...');
  for (const table of TENANT_TABLES) {
    try {
      const result = await dataSource.query(
        `UPDATE "${table}" SET "gymId" = $1 WHERE "gymId" IS NULL`,
        [gym.id],
      );
      const rowCount = Array.isArray(result) ? result[1] : (result?.rowCount ?? 0);
      if (rowCount > 0) {
        console.log(`    ${table}: ${rowCount} rows updated`);
      }
    } catch (err: unknown) {
      // Table may not exist yet if synchronize hasn't run
      const message = err instanceof Error ? err.message : String(err);
      console.log(`    ${table}: skipped (${message.substring(0, 60)})`);
    }
  }

  console.log('Gym seed complete.');
  await dataSource.destroy();
}

seedGym().catch((err) => {
  console.error('Gym seed failed:', err);
  process.exit(1);
});

export { seedGym };
