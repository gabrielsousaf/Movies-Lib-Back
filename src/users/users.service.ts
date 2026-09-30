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

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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
}
