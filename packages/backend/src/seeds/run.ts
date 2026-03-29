import 'reflect-metadata';
import dataSource from '../config/data-source';
import { BadgeEntity } from '../entities/badge.entity';

const badges: Partial<BadgeEntity>[] = [
  // Attendance badges
  {
    name: 'First Class',
    description: 'Attended your first class',
    iconUrl: '/badges/first-class.png',
    category: 'attendance',
    criteriaJson: { type: 'attendance_count', threshold: 1 },
    isHidden: false,
  },
  {
    name: '10-Class Warrior',
    description: 'Attended 10 classes',
    iconUrl: '/badges/10-classes.png',
    category: 'attendance',
    criteriaJson: { type: 'attendance_count', threshold: 10 },
    isHidden: false,
  },
  {
    name: '50-Class Veteran',
    description: 'Attended 50 classes',
    iconUrl: '/badges/50-classes.png',
    category: 'attendance',
    criteriaJson: { type: 'attendance_count', threshold: 50 },
    isHidden: false,
  },
  {
    name: '100-Class Legend',
    description: 'Attended 100 classes',
    iconUrl: '/badges/100-classes.png',
    category: 'attendance',
    criteriaJson: { type: 'attendance_count', threshold: 100 },
    isHidden: false,
  },
  // Streak badges
  {
    name: '7-Day Warrior',
    description: '7-day training streak',
    iconUrl: '/badges/7-day-streak.png',
    category: 'attendance',
    criteriaJson: { type: 'streak', threshold: 7 },
    isHidden: false,
  },
  {
    name: '30-Day Machine',
    description: '30-day training streak',
    iconUrl: '/badges/30-day-streak.png',
    category: 'attendance',
    criteriaJson: { type: 'streak', threshold: 30 },
    isHidden: false,
  },
  {
    name: '100-Day Legend',
    description: '100 consecutive training days',
    iconUrl: '/badges/100-day-streak.png',
    category: 'attendance',
    criteriaJson: { type: 'streak', threshold: 100 },
    isHidden: false,
  },
  // XP badges
  {
    name: 'XP Rookie',
    description: 'Earn 1,000 XP',
    iconUrl: '/badges/xp-1000.png',
    category: 'discipline',
    criteriaJson: { type: 'xp_total', threshold: 1000 },
    isHidden: false,
  },
  {
    name: 'XP Warrior',
    description: 'Earn 5,000 XP',
    iconUrl: '/badges/xp-5000.png',
    category: 'discipline',
    criteriaJson: { type: 'xp_total', threshold: 5000 },
    isHidden: false,
  },
  {
    name: 'XP Elite',
    description: 'Earn 25,000 XP',
    iconUrl: '/badges/xp-25000.png',
    category: 'discipline',
    criteriaJson: { type: 'xp_total', threshold: 25000 },
    isHidden: false,
  },
  // Secret badge
  {
    name: 'Night Owl',
    description: 'Check in to a class after 9 PM',
    iconUrl: '/badges/night-owl.png',
    category: 'secret',
    criteriaJson: { type: 'custom', key: 'late_checkin' },
    isHidden: true,
  },
];

async function seed() {
  await dataSource.initialize();
  console.log('Database connected. Seeding badges...');

  const badgeRepo = dataSource.getRepository(BadgeEntity);

  for (const badge of badges) {
    const existing = await badgeRepo.findOne({ where: { name: badge.name! } });
    if (!existing) {
      await badgeRepo.save(badgeRepo.create(badge));
      console.log(`  Created badge: ${badge.name}`);
    } else {
      console.log(`  Badge already exists: ${badge.name}`);
    }
  }

  console.log('Seeding complete.');
  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
