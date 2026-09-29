import { Test, TestingModule } from '@nestjs/testing';
import { WatchlistService } from './watchlist.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MediaTypeDto } from '../favorites/dto/create-favorite.dto.js';
import { WatchStatusDto } from './dto/create-watchlist.dto.js';

describe('WatchlistService', () => {
  let service: WatchlistService;
  let prisma: PrismaService;

  const mockPrismaService = {
    watchlistItem: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WatchlistService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<WatchlistService>(WatchlistService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prisma).toBeDefined();
  });

  describe('upsertItem', () => {
    it('should upsert an item to watchlist', async () => {
      const mockResult = {
        id: 'w-1',
        userId: 'user-1',
        tmdbId: 100,
        mediaType: 'MOVIE',
        title: 'Interstellar',
        status: 'WATCHLIST',
      };
      mockPrismaService.watchlistItem.upsert.mockResolvedValueOnce(mockResult);

      const result = await service.upsertItem('user-1', {
        tmdbId: 100,
        mediaType: MediaTypeDto.MOVIE,
        title: 'Interstellar',
        status: WatchStatusDto.WATCHLIST,
      });

      expect(result.message).toContain('adicionado a Quero assistir');
      expect(result.item).toEqual(mockResult);
    });
  });

  describe('checkItem', () => {
    it('should return inList true and status when item exists', async () => {
      mockPrismaService.watchlistItem.findUnique.mockResolvedValueOnce({
        id: 'w-1',
        status: 'WATCHED',
      });

      const result = await service.checkItem('user-1', 100, MediaTypeDto.MOVIE);
      expect(result).toEqual({ inList: true, status: 'WATCHED' });
    });

    it('should return inList false when item does not exist', async () => {
      mockPrismaService.watchlistItem.findUnique.mockResolvedValueOnce(null);

      const result = await service.checkItem('user-1', 999, MediaTypeDto.MOVIE);
      expect(result).toEqual({ inList: false, status: null });
    });
  });
});
