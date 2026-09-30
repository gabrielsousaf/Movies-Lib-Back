import { Test, TestingModule } from '@nestjs/testing';
import { ListsService } from './lists.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MediaTypeDto } from '../favorites/dto/create-favorite.dto.js';

describe('ListsService', () => {
  let service: ListsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    customList: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    customListItem: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ListsService>(ListsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prisma).toBeDefined();
  });

  describe('createList', () => {
    it('should create a custom list successfully', async () => {
      const mockCreated = {
        id: 'list-1',
        userId: 'user-1',
        title: 'Sci-Fi Classics',
        description: 'Best sci-fi movies',
        isPublic: true,
      };

      mockPrismaService.customList.create.mockResolvedValueOnce(mockCreated);

      const result = await service.createList('user-1', {
        title: 'Sci-Fi Classics',
        description: 'Best sci-fi movies',
      });

      expect(result).toEqual(mockCreated);
    });
  });

  describe('addItemToList', () => {
    it('should add item to list if user is the owner', async () => {
      mockPrismaService.customList.findUnique.mockResolvedValueOnce({
        id: 'list-1',
        userId: 'user-1',
      });

      const mockItem = {
        id: 'item-1',
        listId: 'list-1',
        tmdbId: 157336,
        mediaType: 'MOVIE',
        title: 'Interstellar',
      };

      mockPrismaService.customListItem.upsert.mockResolvedValueOnce(mockItem);

      const result = await service.addItemToList('user-1', 'list-1', {
        tmdbId: 157336,
        mediaType: MediaTypeDto.MOVIE,
        title: 'Interstellar',
      });

      expect(result.message).toBe('Item adicionado à lista com sucesso!');
      expect(result.item).toEqual(mockItem);
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      mockPrismaService.customList.findUnique.mockResolvedValueOnce({
        id: 'list-1',
        userId: 'owner-user',
      });

      await expect(
        service.addItemToList('stranger', 'list-1', {
          tmdbId: 157336,
          mediaType: MediaTypeDto.MOVIE,
          title: 'Interstellar',
        }),
      ).rejects.toThrow('Você só pode adicionar itens às suas próprias listas.');
    });
  });
});
