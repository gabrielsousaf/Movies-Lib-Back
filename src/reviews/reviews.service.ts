import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { UpdateReviewDto } from './dto/update-review.dto.js';
import { MediaTypeDto } from '../favorites/dto/create-favorite.dto.js';
import { MediaType } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertReview(userId: string, dto: CreateReviewDto) {
    const mediaType = dto.mediaType as unknown as MediaType;

    const review = await this.prisma.review.upsert({
      where: {
        userId_tmdbId_mediaType: {
          userId,
          tmdbId: dto.tmdbId,
          mediaType,
        },
      },
      update: {
        rating: dto.rating,
        content: dto.content,
        title: dto.title,
        posterPath: dto.posterPath,
      },
      create: {
        userId,
        tmdbId: dto.tmdbId,
        mediaType,
        title: dto.title,
        rating: dto.rating,
        content: dto.content,
        posterPath: dto.posterPath,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      message: 'Avaliação registrada com sucesso!',
      review,
    };
  }

  async updateReview(userId: string, reviewId: string, dto: UpdateReviewDto) {
    const existing = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!existing) {
      throw new NotFoundException('Avaliação não encontrada.');
    }

    if (existing.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para editar esta avaliação.');
    }

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        ...(dto.rating !== undefined ? { rating: dto.rating } : {}),
        ...(dto.content !== undefined ? { content: dto.content } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      message: 'Avaliação atualizada com sucesso.',
      review: updated,
    };
  }

  async deleteReview(userId: string, reviewId: string) {
    const existing = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!existing) {
      throw new NotFoundException('Avaliação não encontrada.');
    }

    if (existing.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para excluir esta avaliação.');
    }

    await this.prisma.review.delete({
      where: { id: reviewId },
    });

    return { message: 'Avaliação excluída com sucesso.' };
  }

  async getMediaReviews(
    tmdbId: number,
    mediaType: MediaTypeDto,
    page = 1,
    limit = 10,
  ) {
    const take = limit > 0 ? Math.min(limit, 50) : 10;
    const skip = page > 0 ? (page - 1) * take : 0;

    const where = {
      tmdbId,
      mediaType: mediaType as unknown as MediaType,
    };

    const [total, reviews, aggregate] = await Promise.all([
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      }),
      this.prisma.review.aggregate({
        where,
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    return {
      stats: {
        averageRating: aggregate._avg.rating ? Number(aggregate._avg.rating.toFixed(1)) : null,
        totalReviews: aggregate._count.rating,
      },
      data: reviews,
      meta: {
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async getMyReviewForMedia(userId: string, tmdbId: number, mediaType: MediaTypeDto) {
    const review = await this.prisma.review.findUnique({
      where: {
        userId_tmdbId_mediaType: {
          userId,
          tmdbId,
          mediaType: mediaType as unknown as MediaType,
        },
      },
    });

    return review;
  }

  async getMyReviews(userId: string, page = 1, limit = 20) {
    const take = limit > 0 ? Math.min(limit, 50) : 20;
    const skip = page > 0 ? (page - 1) * take : 0;

    const where = { userId };

    const [total, reviews] = await Promise.all([
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);

    return {
      data: reviews,
      meta: {
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async getUserReviews(
    username: string,
    currentUserId?: string,
    page = 1,
    limit = 20,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() },
      select: { id: true, isPublic: true },
    });

    if (!user) {
      throw new NotFoundException(`Usuário '@${username}' não foi encontrado.`);
    }

    if (!user.isPublic && user.id !== currentUserId) {
      throw new ForbiddenException('As avaliações deste usuário são privadas.');
    }

    return this.getMyReviews(user.id, page, limit);
  }
}
