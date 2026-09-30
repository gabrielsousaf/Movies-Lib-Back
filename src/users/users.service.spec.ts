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
      delete: vi.fn(),
    },
    favorite: {
      findMany: vi.fn(),
    },
    follow: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
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

  describe('followUser', () => {
    it('should follow user successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: 'user-2',
        username: 'lucas',
      });
      mockPrismaService.follow.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.follow.create.mockResolvedValueOnce({});

      const result = await service.followUser('user-1', 'lucas');
      expect(result.isFollowing).toBe(true);
      expect(result.message).toContain('começou a seguir @lucas');
    });

    it('should prevent user from following themselves', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        username: 'gabriel',
      });

      await expect(service.followUser('user-1', 'gabriel')).rejects.toThrow(
        'Você não pode seguir a si mesmo.',
      );
    });
  });
});
