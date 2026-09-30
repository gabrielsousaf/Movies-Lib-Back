import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsService } from './reviews.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MediaTypeDto } from '../favorites/dto/create-favorite.dto.js';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    review: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    reviewLike: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prisma).toBeDefined();
  });

  describe('upsertReview', () => {
    it('should create or update review', async () => {
      const mockReview = {
        id: 'rev-1',
        userId: 'user-1',
        tmdbId: 550,
        mediaType: 'MOVIE',
        title: 'Fight Club',
        rating: 9.5,
        content: 'Excelente filme!',
      };

      mockPrismaService.review.upsert.mockResolvedValueOnce(mockReview);

      const result = await service.upsertReview('user-1', {
        tmdbId: 550,
        mediaType: MediaTypeDto.MOVIE,
        title: 'Fight Club',
        rating: 9.5,
        content: 'Excelente filme!',
      });

      expect(result.message).toBe('Avaliação registrada com sucesso!');
      expect(result.review).toEqual({
        ...mockReview,
        totalLikes: 0,
      });
    });
  });

  describe('toggleLikeReview', () => {
    it('should add like if not liked yet', async () => {
      mockPrismaService.review.findUnique.mockResolvedValueOnce({ id: 'rev-1' });
      mockPrismaService.reviewLike.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.reviewLike.create.mockResolvedValueOnce({});
      mockPrismaService.reviewLike.count.mockResolvedValueOnce(1);

      const result = await service.toggleLikeReview('user-1', 'rev-1');
      expect(result.liked).toBe(true);
      expect(result.totalLikes).toBe(1);
    });

    it('should remove like if already liked', async () => {
      mockPrismaService.review.findUnique.mockResolvedValueOnce({ id: 'rev-1' });
      mockPrismaService.reviewLike.findUnique.mockResolvedValueOnce({ id: 'like-1' });
      mockPrismaService.reviewLike.delete.mockResolvedValueOnce({});
      mockPrismaService.reviewLike.count.mockResolvedValueOnce(0);

      const result = await service.toggleLikeReview('user-1', 'rev-1');
      expect(result.liked).toBe(false);
      expect(result.totalLikes).toBe(0);
    });
  });

  describe('getMediaReviews', () => {
    it('should return aggregated stats and reviews list', async () => {
      mockPrismaService.review.count.mockResolvedValueOnce(2);
      mockPrismaService.review.findMany.mockResolvedValueOnce([
        { id: 'rev-1', rating: 10 },
        { id: 'rev-2', rating: 8 },
      ]);
      mockPrismaService.review.aggregate.mockResolvedValueOnce({
        _avg: { rating: 9 },
        _count: { rating: 2 },
      });

      const result = await service.getMediaReviews(550, MediaTypeDto.MOVIE, 1, 10);
      expect(result.stats.averageRating).toBe(9);
      expect(result.stats.totalReviews).toBe(2);
      expect(result.data).toHaveLength(2);
      expect(result.meta.totalPages).toBe(1);
    });
  });
});
