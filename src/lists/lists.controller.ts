import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ListsService } from './lists.service.js';
import { CreateCustomListDto } from './dto/create-custom-list.dto.js';
import { UpdateCustomListDto } from './dto/update-custom-list.dto.js';
import { AddListItemDto } from './dto/add-list-item.dto.js';
import { MediaTypeDto } from '../favorites/dto/create-favorite.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Listas Personalizadas')
@Controller('lists')
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar uma nova lista personalizada' })
  @ApiResponse({ status: 201, description: 'Lista criada com sucesso.' })
  async createList(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCustomListDto,
  ) {
    return this.listsService.createList(userId, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todas as minhas listas personalizadas com paginação' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async getMyLists(
    @CurrentUser('id') userId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.listsService.getMyLists(userId, page, limit);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter detalhes de uma lista e seus filmes/séries' })
  @ApiResponse({ status: 200, description: 'Detalhes da lista e itens.' })
  @ApiResponse({ status: 403, description: 'Lista privada.' })
  @ApiResponse({ status: 404, description: 'Lista não encontrada.' })
  async getListById(
    @Param('id') id: string,
    @CurrentUser('id') currentUserId?: string,
  ) {
    return this.listsService.getListById(id, currentUserId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Editar título, descrição ou visibilidade de uma lista' })
  async updateList(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCustomListDto,
  ) {
    return this.listsService.updateList(userId, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Excluir uma lista personalizada' })
  async deleteList(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.listsService.deleteList(userId, id);
  }

  @Post(':id/items')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Adicionar filme ou série à lista personalizada' })
  async addItemToList(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: AddListItemDto,
  ) {
    return this.listsService.addItemToList(userId, id, dto);
  }

  @Delete(':id/items/:tmdbId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover filme ou série da lista personalizada' })
  @ApiQuery({ name: 'type', enum: MediaTypeDto, description: 'Tipo da mídia (MOVIE ou TV)' })
  async removeItemFromList(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Param('tmdbId', ParseIntPipe) tmdbId: number,
    @Query('type', new ParseEnumPipe(MediaTypeDto)) type: MediaTypeDto,
  ) {
    return this.listsService.removeItemFromList(userId, id, tmdbId, type);
  }

  @Get('user/:username')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar listas públicas de outro usuário' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async getPublicUserLists(
    @Param('username') username: string,
    @CurrentUser('id') currentUserId?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.listsService.getPublicUserLists(username, currentUserId, page, limit);
  }
}
