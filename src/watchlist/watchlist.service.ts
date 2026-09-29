import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreateWatchlistDto,
  WatchStatusDto,
} from './dto/create-watchlist.dto.js';
import { MediaTypeDto } from '../favorites/dto/create-favorite.dto.js';
import { MediaType, WatchStatus } from '@prisma/client';

@Injectable()
export class WatchlistService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertItem(userId: string, dto: CreateWatchlistDto) {
    const status = (dto.status || WatchStatusDto.WATCHLIST) as unknown as WatchStatus;
    const mediaType = dto.mediaType as unknown as MediaType;

    const item = await this.prisma.watchlistItem.upsert({
      where: {
        userId_tmdbId_mediaType: {
          userId,
          tmdbId: dto.tmdbId,
          mediaType,
        },
      },
      update: {
        status,
        title: dto.title,
        posterPath: dto.posterPath,
        backdropPath: dto.backdropPath,
        voteAverage: dto.voteAverage,
        releaseDate: dto.releaseDate,
      },
      create: {
        userId,
        tmdbId: dto.tmdbId,
        mediaType,
        title: dto.title,
        status,
        posterPath: dto.posterPath,
        backdropPath: dto.backdropPath,
        voteAverage: dto.voteAverage,
        releaseDate: dto.releaseDate,
      },
    });

    const statusLabel =
      item.status === WatchStatus.WATCHED ? 'marcado como Já assistido' : 'adicionado a Quero assistir';

    return {
      message: `Item ${statusLabel} com sucesso!`,
      item,
    };
  }

  async updateStatus(
    userId: string,
    tmdbId: number,
    mediaType: MediaTypeDto,
    status: WatchStatusDto,
  ) {
    const existing = await this.prisma.watchlistItem.findUnique({
      where: {
        userId_tmdbId_mediaType: {
          userId,
          tmdbId,
          mediaType: mediaType as unknown as MediaType,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Item não encontrado na sua lista.');
    }

    const updated = await this.prisma.watchlistItem.update({
      where: { id: existing.id },
      data: { status: status as unknown as WatchStatus },
    });

    const statusLabel =
      updated.status === WatchStatus.WATCHED ? 'Já assistido' : 'Quero assistir';

    return {
      message: `Status atualizado para '${statusLabel}' com sucesso.`,
      item: updated,
    };
  }

  async removeItem(userId: string, tmdbId: number, mediaType: MediaTypeDto) {
    const existing = await this.prisma.watchlistItem.findUnique({
      where: {
        userId_tmdbId_mediaType: {
          userId,
          tmdbId,
          mediaType: mediaType as unknown as MediaType,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Item não encontrado na sua lista.');
    }

    await this.prisma.watchlistItem.delete({
      where: { id: existing.id },
    });

    return { message: 'Item removido da lista com sucesso.' };
  }

  async getMyWatchlist(
    userId: string,
    status?: WatchStatusDto,
    type?: MediaTypeDto,
    page?: number,
    limit?: number,
  ) {
    const where = {
      userId,
      ...(status ? { status: status as unknown as WatchStatus } : {}),
      ...(type ? { mediaType: type as unknown as MediaType } : {}),
    };

    if (page || limit) {
      const take = limit && limit > 0 ? Math.min(limit, 100) : 20;
      const skip = page && page > 0 ? (page - 1) * take : 0;

      const [total, data] = await Promise.all([
        this.prisma.watchlistItem.count({ where }),
        this.prisma.watchlistItem.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          skip,
          take,
        }),
      ]);

      return {
        data,
        meta: {
          total,
          page: page || 1,
          limit: take,
          totalPages: Math.ceil(total / take),
        },
      };
    }

    return this.prisma.watchlistItem.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async checkItem(userId: string, tmdbId: number, mediaType: MediaTypeDto) {
    const item = await this.prisma.watchlistItem.findUnique({
      where: {
        userId_tmdbId_mediaType: {
          userId,
          tmdbId,
          mediaType: mediaType as unknown as MediaType,
        },
      },
      select: { id: true, status: true },
    });

    return {
      inList: !!item,
      status: item ? item.status : null,
    };
  }

  async getPublicWatchlist(
    username: string,
    currentUserId?: string,
    status?: WatchStatusDto,
    type?: MediaTypeDto,
    page?: number,
    limit?: number,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() },
      select: { id: true, isPublic: true },
    });

    if (!user) {
      throw new NotFoundException(`Usuário '@${username}' não foi encontrado.`);
    }

    if (!user.isPublic && user.id !== currentUserId) {
      throw new ForbiddenException('A lista deste usuário é privada.');
    }

    return this.getMyWatchlist(user.id, status, type, page, limit);
  }
}
