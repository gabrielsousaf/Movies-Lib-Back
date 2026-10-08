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
        _count: {
          select: { likes: true },
        },
      },
    });

    return {
      message: 'Avaliação registrada com sucesso!',
      review: {
        ...review,
        totalLikes: review._count?.likes ?? 0,
      },
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
        _count: {
          select: { likes: true },
        },
      },
    });

    return {
      message: 'Avaliação atualizada com sucesso.',
      review: {
        ...updated,
        totalLikes: updated._count?.likes ?? 0,
      },
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

  async toggleLikeReview(userId: string, reviewId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true },
    });

    if (!review) {
      throw new NotFoundException('Avaliação não encontrada.');
    }

    const existingLike = await this.prisma.reviewLike.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId,
        },
      },
    });

    let liked = false;

    if (existingLike) {
      await this.prisma.reviewLike.delete({
        where: {
          reviewId_userId: {
            reviewId,
            userId,
          },
        },
      });
      liked = false;
    } else {
      await this.prisma.reviewLike.create({
        data: {
          reviewId,
          userId,
        },
      });
      liked = true;
    }

    const totalLikes = await this.prisma.reviewLike.count({
      where: { reviewId },
    });

    return {
      message: liked ? 'Avaliação curtida com sucesso!' : 'Curtida removida com sucesso.',
      liked,
      totalLikes,
    };
  }

  async getMediaReviews(
    tmdbId: number,
    mediaType: MediaTypeDto,
    page = 1,
    limit = 10,
    currentUserId?: string,
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
          _count: {
            select: { likes: true },
          },
          ...(currentUserId
            ? {
                likes: {
                  where: { userId: currentUserId },
                  select: { id: true },
                },
              }
            : {}),
        },
      }),
      this.prisma.review.aggregate({
        where,
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    const formattedReviews = reviews.map((r: any) => ({
      id: r.id,
      userId: r.userId,
      tmdbId: r.tmdbId,
      mediaType: r.mediaType,
      title: r.title,
      posterPath: r.posterPath,
      rating: r.rating,
      content: r.content,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      user: r.user,
      totalLikes: r._count?.likes ?? 0,
      isLiked: Boolean(r.likes && r.likes.length > 0),
    }));

    return {
      stats: {
        averageRating: aggregate._avg.rating ? Number(aggregate._avg.rating.toFixed(1)) : null,
        totalReviews: aggregate._count.rating,
      },
      data: formattedReviews,
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
      include: {
        _count: {
          select: { likes: true },
        },
      },
    });

    if (!review) return null;

    return {
      ...review,
      totalLikes: review._count?.likes ?? 0,
    };
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
        include: {
          _count: {
            select: { likes: true },
          },
        },
      }),
    ]);

    return {
      data: reviews.map((r) => ({
        ...r,
        totalLikes: r._count?.likes ?? 0,
      })),
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

  async addComment(userId: string, reviewId: string, content: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Avaliação não encontrada.');
    }

    const comment = await this.prisma.reviewComment.create({
      data: {
        content,
        userId,
        reviewId,
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

    return { message: 'Comentário adicionado com sucesso.', comment };
  }

  async getComments(reviewId: string, page = 1, limit = 20) {
    const take = limit > 0 ? Math.min(limit, 50) : 20;
    const skip = page > 0 ? (page - 1) * take : 0;

    const where = { reviewId };

    const [total, comments] = await Promise.all([
      this.prisma.reviewComment.count({ where }),
      this.prisma.reviewComment.findMany({
        where,
        orderBy: { createdAt: 'asc' },
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
    ]);

    return {
      data: comments,
      meta: {
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async deleteComment(userId: string, commentId: string) {
    const comment = await this.prisma.reviewComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comentário não encontrado.');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para excluir este comentário.');
    }

    await this.prisma.reviewComment.delete({
      where: { id: commentId },
    });

    return { message: 'Comentário excluído com sucesso.' };
  }
}
