import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCustomListDto } from './dto/create-custom-list.dto.js';
import { UpdateCustomListDto } from './dto/update-custom-list.dto.js';
import { AddListItemDto } from './dto/add-list-item.dto.js';
import { MediaTypeDto } from '../favorites/dto/create-favorite.dto.js';

@Injectable()
export class ListsService {
  constructor(private readonly prisma: PrismaService) {}

  async createList(userId: string, dto: CreateCustomListDto) {
    return this.prisma.customList.create({
      data: {
        userId,
        title: dto.title.trim(),
        description: dto.description?.trim(),
        isPublic: dto.isPublic ?? true,
      },
    });
  }

  async getMyLists(userId: string, page = 1, limit = 20) {
    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (Math.max(page, 1) - 1) * take;

    const [total, lists] = await Promise.all([
      this.prisma.customList.count({
        where: { userId },
      }),
      this.prisma.customList.findMany({
        where: { userId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { items: true },
          },
        },
      }),
    ]);

    return {
      data: lists.map((list) => ({
        ...list,
        totalItems: list._count.items,
      })),
      meta: {
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async getListById(listId: string, currentUserId?: string) {
    const list = await this.prisma.customList.findUnique({
      where: { id: listId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        items: {
          orderBy: { addedAt: 'desc' },
        },
        _count: {
          select: { items: true },
        },
      },
    });

    if (!list) {
      throw new NotFoundException('Lista não encontrada.');
    }

    if (!list.isPublic && list.userId !== currentUserId) {
      throw new ForbiddenException('Esta lista é privada.');
    }

    return {
      ...list,
      totalItems: list._count.items,
    };
  }

  async updateList(userId: string, listId: string, dto: UpdateCustomListDto) {
    const list = await this.prisma.customList.findUnique({
      where: { id: listId },
      select: { userId: true },
    });

    if (!list) {
      throw new NotFoundException('Lista não encontrada.');
    }

    if (list.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para editar esta lista.');
    }

    return this.prisma.customList.update({
      where: { id: listId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() } : {}),
        ...(dto.isPublic !== undefined ? { isPublic: dto.isPublic } : {}),
      },
    });
  }

  async deleteList(userId: string, listId: string) {
    const list = await this.prisma.customList.findUnique({
      where: { id: listId },
      select: { userId: true },
    });

    if (!list) {
      throw new NotFoundException('Lista não encontrada.');
    }

    if (list.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para excluir esta lista.');
    }

    await this.prisma.customList.delete({
      where: { id: listId },
    });

    return { message: 'Lista personalizada excluída com sucesso.' };
  }

  async addItemToList(userId: string, listId: string, dto: AddListItemDto) {
    const list = await this.prisma.customList.findUnique({
      where: { id: listId },
      select: { userId: true },
    });

    if (!list) {
      throw new NotFoundException('Lista não encontrada.');
    }

    if (list.userId !== userId) {
      throw new ForbiddenException('Você só pode adicionar itens às suas próprias listas.');
    }

    const item = await this.prisma.customListItem.upsert({
      where: {
        listId_tmdbId_mediaType: {
          listId,
          tmdbId: dto.tmdbId,
          mediaType: dto.mediaType,
        },
      },
      update: {
        title: dto.title,
        posterPath: dto.posterPath,
        backdropPath: dto.backdropPath,
        voteAverage: dto.voteAverage,
        releaseDate: dto.releaseDate,
      },
      create: {
        listId,
        tmdbId: dto.tmdbId,
        mediaType: dto.mediaType,
        title: dto.title,
        posterPath: dto.posterPath,
        backdropPath: dto.backdropPath,
        voteAverage: dto.voteAverage,
        releaseDate: dto.releaseDate,
      },
    });

    return {
      message: 'Item adicionado à lista com sucesso!',
      item,
    };
  }

  async removeItemFromList(
    userId: string,
    listId: string,
    tmdbId: number,
    mediaType: MediaTypeDto,
  ) {
    const list = await this.prisma.customList.findUnique({
      where: { id: listId },
      select: { userId: true },
    });

    if (!list) {
      throw new NotFoundException('Lista não encontrada.');
    }

    if (list.userId !== userId) {
      throw new ForbiddenException('Você só pode remover itens das suas próprias listas.');
    }

    const item = await this.prisma.customListItem.findUnique({
      where: {
        listId_tmdbId_mediaType: {
          listId,
          tmdbId,
          mediaType,
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Item não encontrado nesta lista.');
    }

    await this.prisma.customListItem.delete({
      where: {
        listId_tmdbId_mediaType: {
          listId,
          tmdbId,
          mediaType,
        },
      },
    });

    return { message: 'Item removido da lista com sucesso.' };
  }

  async getPublicUserLists(
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
      throw new ForbiddenException('As listas deste usuário são privadas.');
    }

    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (Math.max(page, 1) - 1) * take;

    const whereClause = {
      userId: user.id,
      ...(user.id !== currentUserId ? { isPublic: true } : {}),
    };

    const [total, lists] = await Promise.all([
      this.prisma.customList.count({ where: whereClause }),
      this.prisma.customList.findMany({
        where: whereClause,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { items: true },
          },
        },
      }),
    ]);

    return {
      data: lists.map((list) => ({
        ...list,
        totalItems: list._count.items,
      })),
      meta: {
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }
}
