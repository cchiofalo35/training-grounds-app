import 'reflect-metadata';
import dataSource from '../config/data-source';
import { ChannelEntity } from '../entities/channel.entity';

/**
 * Seed default community channels.
 *
 * Usage:
 *   DATABASE_URL=<url> npx ts-node -r tsconfig-paths/register src/seeds/channels.ts
 */

const CHANNELS = [
  // Announcements
  {
    name: 'Announcements',
    description: 'Important updates from coaches and staff',
    category: 'announcements',
    iconEmoji: '\u{1F4E2}',
    isPinned: true,
    isReadOnly: true,
    sortOrder: 0,
  },
  {
    name: 'Events & Comps',
    description: 'Upcoming competitions, seminars, and events',
    category: 'announcements',
    iconEmoji: '\u{1F3C6}',
    isPinned: true,
    isReadOnly: true,
    sortOrder: 1,
  },

  // General
  {
    name: 'General',
    description: 'Chat about anything training related',
    category: 'general',
    iconEmoji: '\u{1F4AC}',
    isPinned: false,
    sortOrder: 0,
  },
  {
    name: 'Introductions',
    description: 'New? Say hi and introduce yourself!',
    category: 'general',
    iconEmoji: '\u{1F44B}',
    sortOrder: 1,
  },
  {
    name: 'Off Topic',
    description: 'Non-training chat, memes, and banter',
    category: 'general',
    iconEmoji: '\u{1F389}',
    sortOrder: 2,
  },

  // Discipline-specific
  {
    name: 'BJJ Discussion',
    description: 'Brazilian Jiu-Jitsu technique talk and questions',
    category: 'discipline',
    discipline: 'bjj-gi',
    iconEmoji: '\u{1F94B}',
    sortOrder: 0,
  },
  {
    name: 'No-Gi & Grappling',
    description: 'No-Gi, submission grappling, and leg locks',
    category: 'discipline',
    discipline: 'bjj-nogi',
    iconEmoji: '\u{1F93C}',
    sortOrder: 1,
  },
  {
    name: 'Muay Thai',
    description: 'Striking, clinch, and pad work discussion',
    category: 'discipline',
    discipline: 'muay-thai',
    iconEmoji: '\u{1F94A}',
    sortOrder: 2,
  },
  {
    name: 'Boxing',
    description: 'Sweet science - technique, sparring, and drills',
    category: 'discipline',
    discipline: 'boxing',
    iconEmoji: '\u{1F94A}',
    sortOrder: 3,
  },
  {
    name: 'Wrestling & MMA',
    description: 'Takedowns, MMA, and mixed martial arts',
    category: 'discipline',
    discipline: 'wrestling',
    iconEmoji: '\u{1F3CB}',
    sortOrder: 4,
  },

  // Training
  {
    name: 'Training Partners',
    description: 'Find drilling partners and open mat buddies',
    category: 'training',
    iconEmoji: '\u{1F91D}',
    sortOrder: 0,
  },
  {
    name: 'Nutrition & Recovery',
    description: 'Diet, supplements, injury prevention, and recovery tips',
    category: 'training',
    iconEmoji: '\u{1F34F}',
    sortOrder: 1,
  },
  {
    name: 'Gear & Equipment',
    description: 'Gi reviews, gloves, mouthguards, and gear recommendations',
    category: 'training',
    iconEmoji: '\u{1F45F}',
    sortOrder: 2,
  },

  // Media
  {
    name: 'Technique Videos',
    description: 'Share and discuss technique breakdowns',
    category: 'media',
    iconEmoji: '\u{1F3AC}',
    sortOrder: 0,
  },
  {
    name: 'Rolling & Sparring Clips',
    description: 'Post your rolling and sparring footage for review',
    category: 'media',
    iconEmoji: '\u{1F4F9}',
    sortOrder: 1,
  },
];

async function seed() {
  await dataSource.initialize();
  console.log('Connected to database.\n');

  const repo = dataSource.getRepository(ChannelEntity);

  const existingCount = await repo.count();
  if (existingCount > 0) {
    console.log(`\u26A0\uFE0F  ${existingCount} channels already exist. Skipping seed.`);
    console.log('   To re-seed, delete existing channels first.\n');
    await dataSource.destroy();
    return;
  }

  for (const c of CHANNELS) {
    await repo.save(repo.create(c as any));
  }

  console.log(`\u2705 Seeded ${CHANNELS.length} community channels:\n`);
  const categories = [...new Set(CHANNELS.map((c) => c.category))];
  for (const cat of categories) {
    const catChannels = CHANNELS.filter((c) => c.category === cat);
    console.log(`  ${cat.toUpperCase()}: ${catChannels.map((c) => c.name).join(', ')}`);
  }

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
