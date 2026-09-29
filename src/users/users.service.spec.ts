import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    favorite: {
      findMany: vi.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prisma).toBeDefined();
  });

  describe('getPublicFavorites', () => {
    it('should return favorites when user profile is public', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        username: 'gabriel',
        isPublic: true,
      });

      const mockFavorites = [{ id: 'fav-1', title: 'Batman' }];
      mockPrismaService.favorite.findMany.mockResolvedValueOnce(mockFavorites);

      const result = await service.getPublicFavorites('gabriel', 'other-user');
      expect(result).toEqual(mockFavorites);
      expect(mockPrismaService.favorite.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should allow owner to see favorites even if profile is private', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        username: 'gabriel',
        isPublic: false,
      });

      const mockFavorites = [{ id: 'fav-1', title: 'Inception' }];
      mockPrismaService.favorite.findMany.mockResolvedValueOnce(mockFavorites);

      const result = await service.getPublicFavorites('gabriel', 'user-1');
      expect(result).toEqual(mockFavorites);
    });

    it('should throw ForbiddenException if profile is private and viewer is not owner', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        username: 'gabriel',
        isPublic: false,
      });

      await expect(service.getPublicFavorites('gabriel', 'stranger')).rejects.toThrow(
        'A lista de favoritos deste usuário é privada.',
      );
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);

      await expect(service.getPublicFavorites('nonexistent')).rejects.toThrow(
        "Usuário '@nonexistent' não foi encontrado.",
      );
    });
  });
});
