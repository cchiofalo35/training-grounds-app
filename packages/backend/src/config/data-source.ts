import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

export default new DataSource(
  databaseUrl
    ? {
        type: 'postgres',
        url: databaseUrl,
        entities: [__dirname + '/../entities/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/../migrations/**/*{.ts,.js}'],
        synchronize: true,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        logging: true,
      }
    : {
        type: 'postgres',
        host: process.env.DATABASE_HOST ?? 'localhost',
        port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
        username: process.env.DATABASE_USERNAME ?? 'postgres',
        password: process.env.DATABASE_PASSWORD ?? 'postgres',
        database: process.env.DATABASE_NAME ?? 'training_grounds',
        entities: [__dirname + '/../entities/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/../migrations/**/*{.ts,.js}'],
        synchronize: false,
        logging: true,
      },
);
