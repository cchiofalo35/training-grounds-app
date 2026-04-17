import 'reflect-metadata';
import dataSource from '../config/data-source';
import { ClassScheduleEntity } from '../entities/class-schedule.entity';
import { GymEntity } from '../entities/gym.entity';

/**
 * Timetable seed for Karuna CrossFit.
 * Sourced from crossfitkaruna.com.au — 35+ classes weekly.
 * Programs: CrossFit, Weightlifting, HYROX Training Club, CrossFit Kids, Open Gym
 * Hours: Mon-Fri 05:00-19:00, Sat 08:00-09:00
 *
 * Run: DATABASE_URL=<url> npx ts-node -r tsconfig-paths/register src/seeds/karuna-timetable.ts
 */

interface ClassDef {
  name: string;
  discipline: string;
  instructorName: string;
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  startTime: string; // HH:mm
  durationMinutes: number;
  level: string;
}

const CLASSES: ClassDef[] = [
  // ===== MONDAY (1) =====
  { name: 'CrossFit', discipline: 'crossfit', instructorName: 'Coach Sam', dayOfWeek: 1, startTime: '05:00', durationMinutes: 60, level: 'all-levels' },
  { name: 'CrossFit', discipline: 'crossfit', instructorName: 'Coach Sam', dayOfWeek: 1, startTime: '06:00', durationMinutes: 60, level: 'all-levels' },
  { name: 'CrossFit', discipline: 'crossfit', instructorName: 'Coach Mia', dayOfWeek: 1, startTime: '09:00', durationMinutes: 60, level: 'all-levels' },
  { name: 'Weightlifting', discipline: 'weightlifting', instructorName: 'Coach Liam', dayOfWeek: 1, startTime: '11:30', durationMinutes: 60, level: 'all-levels' },
  { name: 'CrossFit', discipline: 'crossfit', instructorName: 'Coach Mia', dayOfWeek: 1, startTime: '12:00', durationMinutes: 60, level: 'all-levels' },
  { name: 'CrossFit Kids', discipline: 'crossfit-kids', instructorName: 'Coach Emma', dayOfWeek: 1, startTime: '15:30', durationMinutes: 45, level: 'kids' },
  { name: 'CrossFit', discipline: 'crossfit', instructorName: 'Coach Sam', dayOfWeek: 1, startTime: '16:30', durationMinutes: 60, level: 'all-levels' },
  { name: 'CrossFit', discipline: 'crossfit', instructorName: 'Coach Liam', dayOfWeek: 1, startTime: '17:30', durationMinutes: 60, level: 'all-levels' },

  // ===== TUESDAY (2) =====
  { name: 'CrossFit', discipline: 'crossfit', instructorName: 'Coach Mia', dayOfWeek: 2, startTime: '05:00', durationMinutes: 60, level: 'all-levels' },
  { name: 'CrossFit', discipline: 'crossfit', instructorName: 'Coach Mia', dayOfWeek: 2, startTime: '06:00', durationMinutes: 60, level: 'all-levels' },
  { name: 'HYROX Training Club', discipline: 'hyrox', instructorName: 'Coach Sam', dayOfWeek: 2, startTime: '09:00', durationMinutes: 60, level: 'all-levels' },
  { name: 'CrossFit', discipline: 'crossfit', instructorName: 'Coach Sam', dayOfWeek: 2, startTime: '12:00', durationMinutes: 60, level: 'all-levels' },
  { name: 'CrossFit Kids', discipline: 'crossfit-kids', instructorName: 'Coach Emma', dayOfWeek: 2, startTime: '15:30', durationMinutes: 45, level: 'kids' },
  { name: 'CrossFit', discipline: 'crossfit', instructorName: 'Coach Liam', dayOfWeek: 2, startTime: '16:30', durationMinutes: 60, level: 'all-levels' },
  { name: 'Weightlifting', discipline: 'weightlifting', instructorName: 'Coach Liam', dayOfWeek: 2, startTime: '17:30', durationMinutes: 60, level: 'all-levels' },

  // ===== WEDNESDAY (3) =====
  { name: 'CrossFit', discipline: 'crossfit', instructorName: 'Coach Sam', dayOfWeek: 3, startTime: '05:00', durationMinutes: 60, level: 'all-levels' },
  { name: 'CrossFit', discipline: 'crossfit', instructorName: 'Coach Sam', dayOfWeek: 3, startTime: '06:00', durationMinutes: 60, level: 'all-levels' },
  { name: 'CrossFit', discipline: 'crossfit', instructorName: 'Coach Mia', dayOfWeek: 3, startTime: '09:00', durationMinutes: 60, level: 'all-levels' },
  { name: 'Open Gym', discipline: 'open-gym', instructorName: 'Karuna', dayOfWeek: 3, startTime: '11:30', durationMinutes: 90, level: 'all-levels' },
  { name: 'CrossFit', discipline: 'crossfit', instructorName: 'Coach Mia', dayOfWeek: 3, startTime: '12:00', durationMinutes: 60, level: 'all-levels' },
  { name: 'CrossFit', discipline: 'crossfit', instructorName: 'Coach Sam', dayOfWeek: 3, startTime: '16:30', durationMinutes: 60, level: 'all-levels' },
  { name: 'CrossFit', discipline: 'crossfit', instructorName: 'Coach Liam', dayOfWeek: 3, startTime: '17:30', durationMinutes: 60, level: 'all-levels' },

  // ===== THURSDAY (4) =====
  { name: 'CrossFit', discipline: 'crossfit', instructorName: 'Coach Mia', dayOfWeek: 4, startTime: '05:00', durationMinutes: 60, level: 'all-levels' },
  { name: 'CrossFit', discipline: 'crossfit', instructorName: 'Coach Mia', dayOfWeek: 4, startTime: '06:00', durationMinutes: 60, level: 'all-levels' },
  { name: 'HYROX Training Club', discipline: 'hyrox', instructorName: 'Coach Sam', dayOfWeek: 4, startTime: '09:00', durationMinutes: 60, level: 'all-levels' },
  { name: 'Weightlifting', discipline: 'weightlifting', instructorName: 'Coach Liam', dayOfWeek: 4, startTime: '11:30', durationMinutes: 60, level: 'all-levels' },
  { name: 'CrossFit', discipline: 'crossfit', instructorName: 'Coach Sam', dayOfWeek: 4, startTime: '12:00', durationMinutes: 60, level: 'all-levels' },
  { name: 'CrossFit Kids', discipline: 'crossfit-kids', instructorName: 'Coach Emma', dayOfWeek: 4, startTime: '15:30', durationMinutes: 45, level: 'kids' },
  { name: 'CrossFit', discipline: 'crossfit', instructorName: 'Coach Liam', dayOfWeek: 4, startTime: '16:30', durationMinutes: 60, level: 'all-levels' },
  { name: 'CrossFit', discipline: 'crossfit', instructorName: 'Coach Sam', dayOfWeek: 4, startTime: '17:30', durationMinutes: 60, level: 'all-levels' },

  // ===== FRIDAY (5) =====
  { name: 'CrossFit', discipline: 'crossfit', instructorName: 'Coach Sam', dayOfWeek: 5, startTime: '05:00', durationMinutes: 60, level: 'all-levels' },
  { name: 'CrossFit', discipline: 'crossfit', instructorName: 'Coach Sam', dayOfWeek: 5, startTime: '06:00', durationMinutes: 60, level: 'all-levels' },
  { name: 'CrossFit', discipline: 'crossfit', instructorName: 'Coach Mia', dayOfWeek: 5, startTime: '09:00', durationMinutes: 60, level: 'all-levels' },
  { name: 'Open Gym', discipline: 'open-gym', instructorName: 'Karuna', dayOfWeek: 5, startTime: '11:30', durationMinutes: 90, level: 'all-levels' },
  { name: 'CrossFit', discipline: 'crossfit', instructorName: 'Coach Mia', dayOfWeek: 5, startTime: '12:00', durationMinutes: 60, level: 'all-levels' },
  { name: 'HYROX Training Club', discipline: 'hyrox', instructorName: 'Coach Sam', dayOfWeek: 5, startTime: '16:30', durationMinutes: 60, level: 'all-levels' },
  { name: 'CrossFit', discipline: 'crossfit', instructorName: 'Coach Liam', dayOfWeek: 5, startTime: '17:30', durationMinutes: 60, level: 'all-levels' },

  // ===== SATURDAY (6) =====
  { name: 'CrossFit', discipline: 'crossfit', instructorName: 'Coach Sam', dayOfWeek: 6, startTime: '08:00', durationMinutes: 60, level: 'all-levels' },
  { name: 'Open Gym', discipline: 'open-gym', instructorName: 'Karuna', dayOfWeek: 6, startTime: '09:00', durationMinutes: 60, level: 'all-levels' },
];

async function seedKarunaTimetable() {
  await dataSource.initialize();
  console.log('Database connected. Seeding Karuna CrossFit timetable...');

  const gymRepo = dataSource.getRepository(GymEntity);
  const scheduleRepo = dataSource.getRepository(ClassScheduleEntity);

  const gym = await gymRepo.findOne({ where: { slug: 'karuna-crossfit' } });
  if (!gym) {
    console.log('  Karuna CrossFit gym not found. Run karuna-crossfit seed first.');
    await dataSource.destroy();
    return;
  }

  // Clear existing schedules for this gym to avoid duplicates on re-run
  const existingCount = await scheduleRepo.count({ where: { gymId: gym.id } });
  if (existingCount > 0) {
    console.log(`  Clearing ${existingCount} existing schedules for ${gym.name}...`);
    await scheduleRepo.delete({ gymId: gym.id });
  }

  // Insert all classes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- worktree resolves shared Discipline type to parent repo
  const entities = CLASSES.map((cls) =>
    scheduleRepo.create({
      gymId: gym.id,
      name: cls.name,
      discipline: cls.discipline as any,
      instructorName: cls.instructorName,
      dayOfWeek: cls.dayOfWeek,
      startTime: cls.startTime,
      durationMinutes: cls.durationMinutes,
      level: cls.level,
      isActive: true,
    }),
  );

  await scheduleRepo.save(entities);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const byDay = new Map<number, number>();
  for (const cls of CLASSES) {
    byDay.set(cls.dayOfWeek, (byDay.get(cls.dayOfWeek) ?? 0) + 1);
  }

  console.log(`\n  Seeded ${CLASSES.length} classes for ${gym.name}:`);
  for (const [day, count] of [...byDay.entries()].sort((a, b) => a[0] - b[0])) {
    console.log(`    ${dayNames[day]}: ${count} classes`);
  }

  const disciplines = [...new Set(CLASSES.map((c) => c.discipline))];
  console.log(`  Disciplines: ${disciplines.join(', ')}`);

  await dataSource.destroy();
}

seedKarunaTimetable().catch((err) => {
  console.error('Karuna timetable seed failed:', err);
  process.exit(1);
});

export { seedKarunaTimetable };
