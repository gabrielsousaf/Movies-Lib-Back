import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicProfile(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        isPublic: true,
        createdAt: true,
        _count: {
          select: { favorites: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuário '@${username}' não foi encontrado.`);
    }

    return {
      ...user,
      totalFavorites: user._count.favorites,
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
}
