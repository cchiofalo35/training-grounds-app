import 'reflect-metadata';
import dataSource from '../config/data-source';
import { ClassScheduleEntity } from '../entities/class-schedule.entity';

/**
 * Timetable seed — imports the real Training Grounds schedule
 * sourced from https://www.traininggrounds.com.au/timetable (Clubworx).
 *
 * Usage:
 *   DATABASE_URL=<url> npx ts-node -r tsconfig-paths/register src/seeds/timetable.ts
 */

interface ClassDef {
  name: string;
  discipline: string;
  instructorName: string;
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  startTime: string; // HH:mm
  durationMinutes: number;
  level: string;
  location: string;
}

function dur(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

const CLASSES: ClassDef[] = [
  // ===== MONDAY (1) =====
  { name: 'BOXING All Levels', discipline: 'boxing', instructorName: 'Jamie Rae', dayOfWeek: 1, startTime: '06:00', durationMinutes: 60, level: 'all-levels', location: 'Middle' },
  { name: 'MUAY THAI Advanced', discipline: 'muay-thai', instructorName: 'Scott Ireland', dayOfWeek: 1, startTime: '06:00', durationMinutes: 60, level: 'advanced', location: 'Striking' },
  { name: 'NO GI BJJ', discipline: 'bjj-nogi', instructorName: 'Tristan Hessell', dayOfWeek: 1, startTime: '12:30', durationMinutes: 60, level: 'all-levels', location: 'BJJ' },
  { name: 'BOXING All Levels', discipline: 'boxing', instructorName: 'Jason Kelly', dayOfWeek: 1, startTime: '12:30', durationMinutes: 60, level: 'all-levels', location: 'Striking' },
  { name: 'MUAY THAI KIDS', discipline: 'muay-thai', instructorName: 'Scott Ireland & Jamie Rae', dayOfWeek: 1, startTime: '17:00', durationMinutes: 45, level: 'kids', location: 'Middle' },
  { name: 'MUAY THAI Fundamentals', discipline: 'muay-thai', instructorName: 'Jamie Rae', dayOfWeek: 1, startTime: '17:50', durationMinutes: 60, level: 'beginner', location: 'Striking' },
  { name: 'NO GI BJJ Intermediate', discipline: 'bjj-nogi', instructorName: 'Scott Ireland', dayOfWeek: 1, startTime: '18:00', durationMinutes: 60, level: 'intermediate', location: 'BJJ' },
  { name: 'BOXING Fundamentals', discipline: 'boxing', instructorName: 'Jason Kelly', dayOfWeek: 1, startTime: '18:00', durationMinutes: 60, level: 'beginner', location: 'Middle' },
  { name: 'BOXING Intermediate', discipline: 'boxing', instructorName: 'Jamie Rae', dayOfWeek: 1, startTime: '19:00', durationMinutes: 60, level: 'intermediate', location: 'Striking' },
  { name: 'MUAY THAI Intermediate', discipline: 'muay-thai', instructorName: 'Dave Barlow', dayOfWeek: 1, startTime: '19:00', durationMinutes: 60, level: 'intermediate', location: 'Striking' },
  { name: 'NO GI OPEN MAT', discipline: 'open-mat', instructorName: 'TG', dayOfWeek: 1, startTime: '19:00', durationMinutes: 60, level: 'all-levels', location: 'BJJ' },

  // ===== TUESDAY (2) =====
  { name: 'MUAY THAI All Levels', discipline: 'muay-thai', instructorName: 'Scott Ireland', dayOfWeek: 2, startTime: '06:00', durationMinutes: 60, level: 'all-levels', location: 'Striking' },
  { name: 'BJJ GI', discipline: 'bjj-gi', instructorName: 'Tristan Hessell', dayOfWeek: 2, startTime: '06:30', durationMinutes: 60, level: 'all-levels', location: 'BJJ' },
  { name: 'MUAY THAI All Levels', discipline: 'muay-thai', instructorName: 'TG', dayOfWeek: 2, startTime: '12:30', durationMinutes: 60, level: 'all-levels', location: 'Striking' },
  { name: 'BJJ KIDS 4-6.5 yrs', discipline: 'bjj-gi', instructorName: 'Wayne Miller', dayOfWeek: 2, startTime: '16:00', durationMinutes: 60, level: 'kids', location: 'BJJ' },
  { name: 'BJJ KIDS 6yrs plus', discipline: 'bjj-gi', instructorName: 'Wayne Miller', dayOfWeek: 2, startTime: '17:00', durationMinutes: 60, level: 'kids', location: 'BJJ' },
  { name: 'BOXING Fundamentals', discipline: 'boxing', instructorName: 'Jamie Rae', dayOfWeek: 2, startTime: '17:50', durationMinutes: 60, level: 'beginner', location: 'Striking' },
  { name: 'MMA', discipline: 'mma', instructorName: 'Scott Ireland', dayOfWeek: 2, startTime: '18:00', durationMinutes: 60, level: 'all-levels', location: 'BJJ' },
  { name: 'BJJ GI', discipline: 'bjj-gi', instructorName: 'Tristan Hessell', dayOfWeek: 2, startTime: '18:00', durationMinutes: 60, level: 'all-levels', location: 'Middle' },
  { name: 'MUAY THAI Fundamentals', discipline: 'muay-thai', instructorName: 'Scott Ireland', dayOfWeek: 2, startTime: '19:00', durationMinutes: 60, level: 'beginner', location: 'Middle' },
  { name: 'BJJ GI', discipline: 'bjj-gi', instructorName: 'Tristan Hessell', dayOfWeek: 2, startTime: '19:00', durationMinutes: 60, level: 'all-levels', location: 'BJJ' },
  { name: 'BOXING Advanced', discipline: 'boxing', instructorName: 'Jamie Rae', dayOfWeek: 2, startTime: '19:00', durationMinutes: 60, level: 'advanced', location: 'Striking' },

  // ===== WEDNESDAY (3) =====
  { name: 'BOXING All Levels', discipline: 'boxing', instructorName: 'Jamie Rae', dayOfWeek: 3, startTime: '06:00', durationMinutes: 60, level: 'all-levels', location: 'Striking' },
  { name: 'WOMENS BJJ', discipline: 'bjj-gi', instructorName: 'Janise Huckerby', dayOfWeek: 3, startTime: '06:30', durationMinutes: 60, level: 'all-levels', location: 'BJJ' },
  { name: 'BJJ GI', discipline: 'bjj-gi', instructorName: 'Tristan Hessell', dayOfWeek: 3, startTime: '12:30', durationMinutes: 60, level: 'all-levels', location: 'BJJ' },
  { name: 'BOXING All Levels', discipline: 'boxing', instructorName: 'Nathan Mazoudier', dayOfWeek: 3, startTime: '12:30', durationMinutes: 60, level: 'all-levels', location: 'Striking' },
  { name: 'MUAY THAI KIDS', discipline: 'muay-thai', instructorName: 'Nathan Mazoudier & Scott Ireland', dayOfWeek: 3, startTime: '17:00', durationMinutes: 45, level: 'kids', location: 'Middle' },
  { name: 'MUAY THAI Fundamentals', discipline: 'muay-thai', instructorName: 'Nathan Mazoudier', dayOfWeek: 3, startTime: '18:00', durationMinutes: 60, level: 'beginner', location: 'Middle' },
  { name: 'NO GI BJJ Intermediate', discipline: 'bjj-nogi', instructorName: 'Scott Ireland', dayOfWeek: 3, startTime: '18:00', durationMinutes: 60, level: 'intermediate', location: 'BJJ' },
  { name: 'BOXING Intermediate', discipline: 'boxing', instructorName: 'Jamie Rae', dayOfWeek: 3, startTime: '18:00', durationMinutes: 60, level: 'intermediate', location: 'Striking' },
  { name: 'MUAY THAI Intermediate', discipline: 'muay-thai', instructorName: 'Nathan Mazoudier', dayOfWeek: 3, startTime: '19:00', durationMinutes: 60, level: 'intermediate', location: 'Middle' },
  { name: 'BOXING Fundamentals', discipline: 'boxing', instructorName: 'Jason Kelly', dayOfWeek: 3, startTime: '19:00', durationMinutes: 60, level: 'beginner', location: 'Striking' },

  // ===== THURSDAY (4) =====
  { name: 'BOXING All Levels', discipline: 'boxing', instructorName: 'Jason Kelly', dayOfWeek: 4, startTime: '06:00', durationMinutes: 60, level: 'all-levels', location: 'Striking' },
  { name: 'BJJ GI', discipline: 'bjj-gi', instructorName: 'Scott Ireland', dayOfWeek: 4, startTime: '06:30', durationMinutes: 60, level: 'all-levels', location: 'BJJ' },
  { name: 'MUAY THAI All Levels', discipline: 'muay-thai', instructorName: 'Nathan Mazoudier', dayOfWeek: 4, startTime: '12:30', durationMinutes: 60, level: 'all-levels', location: 'Striking' },
  { name: 'BJJ KIDS 4-6.5 yrs', discipline: 'bjj-gi', instructorName: 'Wayne Miller', dayOfWeek: 4, startTime: '16:00', durationMinutes: 60, level: 'kids', location: 'BJJ' },
  { name: 'TEEN NO GI BJJ', discipline: 'bjj-nogi', instructorName: 'Ethan Moore', dayOfWeek: 4, startTime: '17:00', durationMinutes: 45, level: 'kids', location: 'Middle' },
  { name: 'MUAY THAI KIDS', discipline: 'muay-thai', instructorName: 'Nathan Mazoudier', dayOfWeek: 4, startTime: '17:00', durationMinutes: 45, level: 'kids', location: 'Striking' },
  { name: 'KIDS BJJ 6yrs plus', discipline: 'bjj-gi', instructorName: 'Wayne Miller', dayOfWeek: 4, startTime: '17:00', durationMinutes: 60, level: 'kids', location: 'BJJ' },
  { name: 'BJJ GI INTRO', discipline: 'bjj-gi', instructorName: 'Tristan Hessell', dayOfWeek: 4, startTime: '17:30', durationMinutes: 30, level: 'beginner', location: 'Middle' },
  { name: 'MUAY THAI Advanced', discipline: 'muay-thai', instructorName: 'Scott Ireland', dayOfWeek: 4, startTime: '17:50', durationMinutes: 60, level: 'advanced', location: 'Striking' },
  { name: 'BOXING Fundamentals', discipline: 'boxing', instructorName: 'Jamie Rae', dayOfWeek: 4, startTime: '18:00', durationMinutes: 60, level: 'beginner', location: 'Middle' },
  { name: 'BJJ GI', discipline: 'bjj-gi', instructorName: 'Tristan Hessell', dayOfWeek: 4, startTime: '18:00', durationMinutes: 60, level: 'all-levels', location: 'BJJ' },
  { name: 'BJJ GI', discipline: 'bjj-gi', instructorName: 'Tristan Hessell', dayOfWeek: 4, startTime: '19:00', durationMinutes: 60, level: 'all-levels', location: 'BJJ' },
  { name: 'BOXING Advanced', discipline: 'boxing', instructorName: 'Jamie Rae', dayOfWeek: 4, startTime: '19:00', durationMinutes: 60, level: 'advanced', location: 'Striking' },

  // ===== FRIDAY (5) =====
  { name: 'BOXING + 30min Sparring', discipline: 'boxing', instructorName: 'TG', dayOfWeek: 5, startTime: '08:00', durationMinutes: 60, level: 'all-levels', location: 'Striking' },
  { name: 'BJJ OPEN MAT', discipline: 'open-mat', instructorName: 'TG', dayOfWeek: 5, startTime: '09:00', durationMinutes: 60, level: 'all-levels', location: 'BJJ' },
  { name: 'MUAY THAI + 30min Sparring', discipline: 'muay-thai', instructorName: 'TG', dayOfWeek: 5, startTime: '09:30', durationMinutes: 60, level: 'all-levels', location: 'Striking' },

  // ===== SATURDAY (6) =====
  { name: 'BOXING Intermediate', discipline: 'boxing', instructorName: 'Jamie Rae', dayOfWeek: 6, startTime: '08:00', durationMinutes: 60, level: 'intermediate', location: 'Striking' },
  { name: 'BJJ TEEN', discipline: 'bjj-gi', instructorName: 'Ethan Moore & Wayne Miller', dayOfWeek: 6, startTime: '08:00', durationMinutes: 60, level: 'kids', location: 'BJJ' },
  { name: 'BOXING Fundamentals', discipline: 'boxing', instructorName: 'Nathan Mazoudier', dayOfWeek: 6, startTime: '08:30', durationMinutes: 60, level: 'beginner', location: 'Middle' },
  { name: 'BOXING Sparring', discipline: 'boxing', instructorName: 'Jamie Rae', dayOfWeek: 6, startTime: '09:00', durationMinutes: 30, level: 'advanced', location: 'Striking' },
  { name: 'TODDLERS BJJ', discipline: 'bjj-gi', instructorName: 'Wayne Miller', dayOfWeek: 6, startTime: '09:00', durationMinutes: 30, level: 'kids', location: 'BJJ' },
  { name: 'WRESTLING', discipline: 'wrestling', instructorName: 'Scott Ireland', dayOfWeek: 6, startTime: '09:30', durationMinutes: 60, level: 'all-levels', location: 'Middle' },
  { name: 'BJJ KIDS 4-6.5 yrs', discipline: 'bjj-gi', instructorName: 'Wayne Miller', dayOfWeek: 6, startTime: '09:30', durationMinutes: 60, level: 'kids', location: 'BJJ' },
  { name: 'MUAY THAI Fundamentals', discipline: 'muay-thai', instructorName: 'TG', dayOfWeek: 6, startTime: '09:30', durationMinutes: 60, level: 'beginner', location: 'Striking' },
  { name: 'MUAY THAI CLINCHING', discipline: 'muay-thai', instructorName: 'TG', dayOfWeek: 6, startTime: '10:30', durationMinutes: 30, level: 'all-levels', location: 'Striking' },
  { name: 'BJJ GI & NO GI Open Mat', discipline: 'open-mat', instructorName: 'Scott Ireland', dayOfWeek: 6, startTime: '10:30', durationMinutes: 60, level: 'all-levels', location: 'Middle' },
  { name: 'KIDS BJJ 6yrs plus', discipline: 'bjj-gi', instructorName: 'Wayne Miller', dayOfWeek: 6, startTime: '10:30', durationMinutes: 60, level: 'kids', location: 'BJJ' },
];

async function seed() {
  await dataSource.initialize();
  console.log('Connected to database.\n');

  const repo = dataSource.getRepository(ClassScheduleEntity);

  const existingCount = await repo.count();
  if (existingCount > 0) {
    console.log(`⚠️  ${existingCount} class schedules already exist. Clearing and re-seeding...`);
    await repo.clear();
  }

  const entities = CLASSES.map((c) =>
    repo.create({
      name: c.name,
      discipline: c.discipline as any,
      instructorName: c.instructorName,
      dayOfWeek: c.dayOfWeek,
      startTime: c.startTime,
      durationMinutes: c.durationMinutes,
      level: c.level,
      isActive: true,
    }),
  );

  await repo.save(entities);
  console.log(`✅ Seeded ${entities.length} class schedules from Training Grounds timetable.\n`);

  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  for (let d = 0; d <= 6; d++) {
    const dayClasses = entities.filter((e) => e.dayOfWeek === d);
    if (dayClasses.length > 0) {
      console.log(`  ${DAYS[d]}: ${dayClasses.length} classes`);
    }
  }

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
