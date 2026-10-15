import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createNotification(data: {
    userId: string;
    actorId: string;
    type: NotificationType;
    entityId?: string;
    title?: string;
    content?: string;
  }) {
    // Não envia notificação se a ação foi realizada pelo próprio usuário
    if (data.userId === data.actorId) {
      return null;
    }

    return this.prisma.notification.create({
      data: {
        userId: data.userId,
        actorId: data.actorId,
        type: data.type,
        entityId: data.entityId,
        title: data.title,
        content: data.content,
      },
    });
  }

  async getUserNotifications(userId: string, limit = 20) {
    const take = limit > 0 ? Math.min(limit, 50) : 20;

    const [notifications, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take,
        include: {
          actor: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      }),
      this.prisma.notification.count({
        where: { userId, read: false },
      }),
    ]);

    return {
      data: notifications,
      unreadCount,
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    });
    return { success: true };
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return { success: true };
  }
}
