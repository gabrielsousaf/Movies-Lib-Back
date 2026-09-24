import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateFavoriteDto, MediaTypeDto } from './dto/create-favorite.dto.js';
import { MediaType } from '@prisma/client';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async addFavorite(userId: string, dto: CreateFavoriteDto) {
    const existing = await this.prisma.favorite.findUnique({
      where: {
        userId_tmdbId_mediaType: {
          userId,
          tmdbId: dto.tmdbId,
          mediaType: dto.mediaType as unknown as MediaType,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Este item já está na sua lista de favoritos.');
    }

    const favorite = await this.prisma.favorite.create({
      data: {
        userId,
        tmdbId: dto.tmdbId,
        mediaType: dto.mediaType as unknown as MediaType,
        title: dto.title,
        posterPath: dto.posterPath,
        backdropPath: dto.backdropPath,
        voteAverage: dto.voteAverage,
        releaseDate: dto.releaseDate,
      },
    });

    return {
      message: 'Adicionado aos favoritos com sucesso!',
      favorite,
    };
  }

  async removeFavorite(userId: string, tmdbId: number, mediaType: MediaTypeDto) {
    const existing = await this.prisma.favorite.findUnique({
      where: {
        userId_tmdbId_mediaType: {
          userId,
          tmdbId,
          mediaType: mediaType as unknown as MediaType,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Item não encontrado nos seus favoritos.');
    }

    await this.prisma.favorite.delete({
      where: { id: existing.id },
    });

    return { message: 'Item removido dos favoritos com sucesso.' };
  }

  async getMyFavorites(userId: string, type?: MediaTypeDto) {
    return this.prisma.favorite.findMany({
      where: {
        userId,
        ...(type ? { mediaType: type as unknown as MediaType } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async checkIsFavorite(userId: string, tmdbId: number, mediaType: MediaTypeDto) {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_tmdbId_mediaType: {
          userId,
          tmdbId,
          mediaType: mediaType as unknown as MediaType,
        },
      },
      select: { id: true },
    });

    return { isFavorite: !!favorite };
  }
}
