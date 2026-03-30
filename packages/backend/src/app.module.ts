import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { JournalModule } from './modules/journal/journal.module';
import { NotificationModule } from './modules/notification/notification.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>('DATABASE_URL');
        if (databaseUrl) {
          return {
            type: 'postgres' as const,
            url: databaseUrl,
            entities: [__dirname + '/entities/**/*.entity{.ts,.js}'],
            synchronize: true,
            ssl: config.get<string>('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
            logging: config.get<string>('NODE_ENV', 'development') === 'development',
          };
        }
        return {
          type: 'postgres' as const,
          host: config.get<string>('DATABASE_HOST', 'localhost'),
          port: config.get<number>('DATABASE_PORT', 5432),
          username: config.get<string>('DATABASE_USERNAME', 'postgres'),
          password: config.get<string>('DATABASE_PASSWORD', 'postgres'),
          database: config.get<string>('DATABASE_NAME', 'training_grounds'),
          entities: [__dirname + '/entities/**/*.entity{.ts,.js}'],
          synchronize: config.get<string>('NODE_ENV', 'development') === 'development',
          logging: config.get<string>('NODE_ENV', 'development') === 'development',
        };
      },
    }),

    AuthModule,
    UserModule,
    AttendanceModule,
    GamificationModule,
    JournalModule,
    NotificationModule,
    AdminModule,
  ],
})
export class AppModule {}
