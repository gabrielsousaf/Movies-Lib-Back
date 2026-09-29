import {
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
          select: { favorites: true, watchlist: true, reviews: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuário '@${username}' não foi encontrado.`);
    }

    return {
      ...user,
      totalFavorites: user._count.favorites,
      totalWatchlist: user._count.watchlist,
      totalReviews: user._count.reviews,
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
}
