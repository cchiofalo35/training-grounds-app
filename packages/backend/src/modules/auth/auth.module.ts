import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as admin from 'firebase-admin';
import { UserEntity } from '../../entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'change-me-in-production'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRATION', '7d'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, FirebaseAuthGuard, RolesGuard],
  exports: [AuthService, JwtStrategy, FirebaseAuthGuard, RolesGuard],
})
export class AuthModule implements OnModuleInit {
  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    if (admin.apps.length === 0) {
      const emulatorHost = this.config.get<string>('FIREBASE_AUTH_EMULATOR_HOST');
      if (emulatorHost) {
        process.env.FIREBASE_AUTH_EMULATOR_HOST = emulatorHost;
        console.log(`Firebase Auth Emulator enabled at ${emulatorHost}`);
      }

      admin.initializeApp({
        projectId: this.config.get<string>(
          'FIREBASE_PROJECT_ID',
          'training-grounds-app',
        ),
        storageBucket: this.config.get<string>(
          'FIREBASE_STORAGE_BUCKET',
          'training-grounds-app.firebasestorage.app',
        ),
      });
    }
  }
}
