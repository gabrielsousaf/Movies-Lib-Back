import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { NotificationType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async searchUsers(query: string, limit = 10) {
    if (!query || query.trim() === '') {
      return { data: [] };
    }

    const take = limit > 0 ? Math.min(limit, 50) : 10;
    const searchTerm = `%${query.trim()}%`;

    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query.trim(), mode: 'insensitive' } },
          { displayName: { contains: query.trim(), mode: 'insensitive' } },
        ],
        isPublic: true,
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
      },
      take,
      orderBy: { username: 'asc' },
    });

    return { data: users };
  }

  async getPublicProfile(username: string, currentUserId?: string) {
    const normalizedUsername = username.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { username: normalizedUsername },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        isPublic: true,
        createdAt: true,
        _count: {
          select: {
            favorites: true,
            watchlist: true,
            reviews: true,
            customLists: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuário '@${username}' não foi encontrado.`);
    }

    let isFollowing = false;
    if (currentUserId && currentUserId !== user.id) {
      const follow = await this.prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: user.id,
          },
        },
      });
      isFollowing = Boolean(follow);
    }

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      isPublic: user.isPublic,
      createdAt: user.createdAt,
      totalFavorites: user._count.favorites,
      totalWatchlist: user._count.watchlist,
      totalReviews: user._count.reviews,
      totalLists: user._count.customLists,
      totalFollowers: user._count.followers,
      totalFollowing: user._count.following,
      isFollowing,
    };
  }

  async getPublicFavorites(username: string, currentUserId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() },
      select: {
        id: true,
        username: true,
        isPublic: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuário '@${username}' não foi encontrado.`);
    }

    // Se o perfil for privado e quem está visualizando não for o dono, bloqueia
    if (!user.isPublic && user.id !== currentUserId) {
      throw new ForbiddenException('A lista de favoritos deste usuário é privada.');
    }

    return this.prisma.favorite.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateMe(userId: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        isPublic: true,
        updatedAt: true,
      },
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const isMatch = await bcrypt.compare(dto.oldPassword, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('A senha atual fornecida está incorreta.');
    }

    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(dto.newPassword, saltRounds);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    return { message: 'Senha alterada com sucesso!' };
  }

  async deleteAccount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'Conta de usuário e dados associados excluídos com sucesso.' };
  }

  async followUser(followerId: string, usernameToFollow: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: { username: usernameToFollow.toLowerCase().trim() },
      select: { id: true, username: true },
    });

    if (!targetUser) {
      throw new NotFoundException(`Usuário '@${usernameToFollow}' não foi encontrado.`);
    }

    if (targetUser.id === followerId) {
      throw new BadRequestException('Você não pode seguir a si mesmo.');
    }

    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: targetUser.id,
        },
      },
    });

    if (existingFollow) {
      return {
        message: `Você já está seguindo @${targetUser.username}.`,
        isFollowing: true,
      };
    }

    await this.prisma.follow.create({
      data: {
        followerId,
        followingId: targetUser.id,
      },
    });

    // Notificar o usuário seguido
    await this.notificationsService.createNotification({
      userId: targetUser.id,
      actorId: followerId,
      type: NotificationType.NEW_FOLLOWER,
    });

    return {
      message: `Você começou a seguir @${targetUser.username}.`,
      isFollowing: true,
    };
  }

  async unfollowUser(followerId: string, usernameToUnfollow: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: { username: usernameToUnfollow.toLowerCase().trim() },
      select: { id: true, username: true },
    });

    if (!targetUser) {
      throw new NotFoundException(`Usuário '@${usernameToUnfollow}' não foi encontrado.`);
    }

    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: targetUser.id,
        },
      },
    });

    if (!existingFollow) {
      return {
        message: `Você não segue @${targetUser.username}.`,
        isFollowing: false,
      };
    }

    await this.prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId: targetUser.id,
        },
      },
    });

    return {
      message: `Você deixou de seguir @${targetUser.username}.`,
      isFollowing: false,
    };
  }

  async getFollowers(username: string, page = 1, limit = 20) {
    const targetUser = await this.prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() },
      select: { id: true },
    });

    if (!targetUser) {
      throw new NotFoundException(`Usuário '@${username}' não foi encontrado.`);
    }

    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (Math.max(page, 1) - 1) * take;

    const [total, follows] = await Promise.all([
      this.prisma.follow.count({
        where: { followingId: targetUser.id },
      }),
      this.prisma.follow.findMany({
        where: { followingId: targetUser.id },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              bio: true,
            },
          },
        },
      }),
    ]);

    return {
      data: follows.map((f) => ({
        ...f.follower,
        followedAt: f.createdAt,
      })),
      meta: {
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async getFollowing(username: string, page = 1, limit = 20) {
    const targetUser = await this.prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() },
      select: { id: true },
    });

    if (!targetUser) {
      throw new NotFoundException(`Usuário '@${username}' não foi encontrado.`);
    }

    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (Math.max(page, 1) - 1) * take;

    const [total, follows] = await Promise.all([
      this.prisma.follow.count({
        where: { followerId: targetUser.id },
      }),
      this.prisma.follow.findMany({
        where: { followerId: targetUser.id },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          following: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              bio: true,
            },
          },
        },
      }),
    ]);

    return {
      data: follows.map((f) => ({
        ...f.following,
        followedAt: f.createdAt,
      })),
      meta: {
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async getUserStats(username: string, currentUserId?: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() },
      select: {
        id: true,
        username: true,
        displayName: true,
        isPublic: true,
      },
    });

    if (!targetUser) {
      throw new NotFoundException(`Usuário '@${username}' não foi encontrado.`);
    }

    if (!targetUser.isPublic && targetUser.id !== currentUserId) {
      throw new ForbiddenException('Este perfil é privado.');
    }

    const [
      watchedMovies,
      watchedSeries,
      watchlistItems,
      watchedEpisodes,
      distinctShows,
      reviews,
      totalFavorites,
      totalLists,
      likesReceived,
      commentsReceived,
    ] = await Promise.all([
      this.prisma.watchlistItem.count({
        where: { userId: targetUser.id, status: 'WATCHED', mediaType: 'MOVIE' },
      }),
      this.prisma.watchlistItem.count({
        where: { userId: targetUser.id, status: 'WATCHED', mediaType: 'TV' },
      }),
      this.prisma.watchlistItem.count({
        where: { userId: targetUser.id, status: 'WATCHLIST' },
      }),
      this.prisma.watchedEpisode.count({
        where: { userId: targetUser.id },
      }),
      this.prisma.watchedEpisode.findMany({
        where: { userId: targetUser.id },
        select: { showId: true },
        distinct: ['showId'],
      }),
      this.prisma.review.findMany({
        where: { userId: targetUser.id },
        select: { rating: true, mediaType: true },
      }),
      this.prisma.favorite.count({
        where: { userId: targetUser.id },
      }),
      this.prisma.customList.count({
        where: { userId: targetUser.id },
      }),
      this.prisma.reviewLike.count({
        where: { review: { userId: targetUser.id } },
      }),
      this.prisma.reviewComment.count({
        where: { review: { userId: targetUser.id } },
      }),
    ]);

    // Calcular tempo total
    const totalMinutes = watchedMovies * 115 + watchedEpisodes * 45;
    const totalHours = Math.round(totalMinutes / 60);
    const totalDays = Number((totalHours / 24).toFixed(1));

    // Distribuição de notas (1 a 5 estrelas)
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let ratingSum = 0;

    for (const r of reviews) {
      ratingSum += r.rating;
      const rounded = Math.min(5, Math.max(1, Math.round(r.rating > 5 ? r.rating / 2 : r.rating)));
      ratingDistribution[rounded] = (ratingDistribution[rounded] || 0) + 1;
    }

    const averageRating =
      reviews.length > 0 ? Number((ratingSum / reviews.length).toFixed(1)) : 0;

    return {
      username: targetUser.username,
      time: {
        totalMinutes,
        totalHours,
        totalDays,
      },
      counts: {
        watchedMovies,
        watchedSeries,
        watchedEpisodes,
        showsFollowed: distinctShows.length,
        watchlist: watchlistItems,
        reviews: reviews.length,
        favorites: totalFavorites,
        customLists: totalLists,
      },
      ratings: {
        average: averageRating,
        total: reviews.length,
        distribution: ratingDistribution,
      },
      engagement: {
        likesReceived,
        commentsReceived,
      },
    };
  }
}
