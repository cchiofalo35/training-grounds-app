import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  async sendToUser(
    fcmToken: string,
    payload: NotificationPayload,
  ): Promise<void> {
    try {
      await admin.messaging().send({
        token: fcmToken,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data,
      });

      this.logger.log(`Notification sent: ${payload.title}`);
    } catch (error) {
      this.logger.error(
        `Failed to send notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async sendToTopic(
    topic: string,
    payload: NotificationPayload,
  ): Promise<void> {
    try {
      await admin.messaging().send({
        topic,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data,
      });

      this.logger.log(`Topic notification sent to ${topic}: ${payload.title}`);
    } catch (error) {
      this.logger.error(
        `Failed to send topic notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async sendStreakReminder(
    fcmToken: string,
    currentStreak: number,
  ): Promise<void> {
    await this.sendToUser(fcmToken, {
      title: 'Keep Your Streak Alive!',
      body: `You're on a ${currentStreak}-day streak. Train today to keep it going!`,
      data: {
        type: 'streak_reminder',
        currentStreak: currentStreak.toString(),
      },
    });
  }

  async sendXpNotification(
    userId: string,
    xpEarned: number,
    reason: string,
    totalXp: number,
  ): Promise<void> {
    // In production, look up FCM token from user record or a tokens table.
    // For now, log the notification for development.
    this.logger.log(
      `XP notification for user ${userId}: +${xpEarned} XP (${reason}). Total: ${totalXp}`,
    );
  }

  async sendBadgeEarnedNotification(
    userId: string,
    badgeName: string,
  ): Promise<void> {
    this.logger.log(
      `Badge notification for user ${userId}: Earned "${badgeName}"`,
    );
  }

  async sendStreakBrokenNotification(
    fcmToken: string,
    previousStreak: number,
  ): Promise<void> {
    await this.sendToUser(fcmToken, {
      title: 'Streak Broken',
      body: `Your ${previousStreak}-day streak has ended. Get back on the mats and start a new one!`,
      data: {
        type: 'streak_broken',
        previousStreak: previousStreak.toString(),
      },
    });
  }

  async sendStreakMilestoneNotification(
    fcmToken: string,
    streak: number,
    bonusXp: number,
  ): Promise<void> {
    await this.sendToUser(fcmToken, {
      title: `${streak}-Day Streak!`,
      body: `Incredible consistency! You earned ${bonusXp} bonus XP for your ${streak}-day streak.`,
      data: {
        type: 'streak_milestone',
        streak: streak.toString(),
        bonusXp: bonusXp.toString(),
      },
    });
  }
}
