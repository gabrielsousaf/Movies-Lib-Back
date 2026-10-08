import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class FeedService {
  constructor(private readonly prisma: PrismaService) {}

  async getFeed(userId: string, page = 1, limit = 20) {
    // Buscar quem o usuário segue
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    
    const followingIds = following.map((f) => f.followingId);

    if (followingIds.length === 0) {
      return { data: [] };
    }

    const take = limit > 0 ? Math.min(limit, 50) : 20;

    // Buscar avaliações
    const reviews = await this.prisma.review.findMany({
      where: { userId: { in: followingIds } },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        _count: { select: { likes: true, comments: true } }
      },
      orderBy: { createdAt: 'desc' },
      take,
    });

    // Buscar listas criadas (apenas públicas)
    const lists = await this.prisma.customList.findMany({
      where: { userId: { in: followingIds }, isPublic: true },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        _count: { select: { items: true } }
      },
      orderBy: { createdAt: 'desc' },
      take,
    });

    // Unir e ordenar
    const feed = [
      ...reviews.map((r) => ({ type: 'REVIEW', item: r, createdAt: r.createdAt })),
      ...lists.map((l) => ({ type: 'LIST', item: l, createdAt: l.createdAt })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, take);

    return { data: feed };
  }
}
