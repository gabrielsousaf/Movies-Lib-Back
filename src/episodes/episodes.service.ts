import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { MarkEpisodeDto } from './dto/mark-episode.dto.js';

@Injectable()
export class EpisodesService {
  constructor(private readonly prisma: PrismaService) {}

  async markWatched(userId: string, dto: MarkEpisodeDto) {
    const existing = await this.prisma.watchedEpisode.findUnique({
      where: {
        userId_showId_seasonNumber_episodeNumber: {
          userId,
          showId: dto.showId,
          seasonNumber: dto.seasonNumber,
          episodeNumber: dto.episodeNumber,
        },
      },
    });

    if (existing) {
      return { message: 'Episódio já marcado como assistido.', isWatched: true };
    }

    await this.prisma.watchedEpisode.create({
      data: {
        userId,
        showId: dto.showId,
        seasonNumber: dto.seasonNumber,
        episodeNumber: dto.episodeNumber,
      },
    });

    return { message: 'Episódio marcado como assistido!', isWatched: true };
  }

  async unmarkWatched(userId: string, dto: MarkEpisodeDto) {
    const existing = await this.prisma.watchedEpisode.findUnique({
      where: {
        userId_showId_seasonNumber_episodeNumber: {
          userId,
          showId: dto.showId,
          seasonNumber: dto.seasonNumber,
          episodeNumber: dto.episodeNumber,
        },
      },
    });

    if (!existing) {
      return { message: 'Episódio não estava marcado.', isWatched: false };
    }

    await this.prisma.watchedEpisode.delete({
      where: { id: existing.id },
    });

    return { message: 'Episódio desmarcado.', isWatched: false };
  }

  async getWatchedEpisodes(userId: string, showId: number, seasonNumber?: number) {
    const whereClause: any = { userId, showId };
    if (seasonNumber !== undefined) {
      whereClause.seasonNumber = seasonNumber;
    }

    const watched = await this.prisma.watchedEpisode.findMany({
      where: whereClause,
      select: { seasonNumber: true, episodeNumber: true },
    });

    return watched;
  }
}
