import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
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
import { FavoritesService } from './favorites.service.js';
import { CreateFavoriteDto, MediaTypeDto } from './dto/create-favorite.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Favoritos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  @ApiOperation({ summary: 'Adicionar filme ou série aos favoritos do usuário logado' })
  @ApiResponse({ status: 201, description: 'Favoritado com sucesso.' })
  @ApiResponse({ status: 409, description: 'Item já está favoritado.' })
  async addFavorite(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateFavoriteDto,
  ) {
    return this.favoritesService.addFavorite(userId, dto);
  }

  @Delete(':tmdbId')
  @ApiOperation({ summary: 'Remover filme ou série dos favoritos' })
  @ApiQuery({ name: 'type', enum: MediaTypeDto, description: 'Tipo da mídia (MOVIE ou TV)' })
  @ApiResponse({ status: 200, description: 'Item removido dos favoritos.' })
  @ApiResponse({ status: 404, description: 'Item não encontrado.' })
  async removeFavorite(
    @CurrentUser('id') userId: string,
    @Param('tmdbId', ParseIntPipe) tmdbId: number,
    @Query('type') type: MediaTypeDto,
  ) {
    return this.favoritesService.removeFavorite(userId, tmdbId, type);
  }

  @Get('me')
  @ApiOperation({ summary: 'Listar todos os favoritos do usuário logado' })
  @ApiQuery({ name: 'type', enum: MediaTypeDto, required: false, description: 'Filtrar por MOVIE ou TV' })
  async getMyFavorites(
    @CurrentUser('id') userId: string,
    @Query('type') type?: MediaTypeDto,
  ) {
    return this.favoritesService.getMyFavorites(userId, type);
  }

  @Get('check/:tmdbId')
  @ApiOperation({ summary: 'Verificar se o item já está favoritado pelo usuário logado' })
  @ApiQuery({ name: 'type', enum: MediaTypeDto, description: 'Tipo da mídia (MOVIE ou TV)' })
  async checkFavorite(
    @CurrentUser('id') userId: string,
    @Param('tmdbId', ParseIntPipe) tmdbId: number,
    @Query('type') type: MediaTypeDto,
  ) {
    return this.favoritesService.checkIsFavorite(userId, tmdbId, type);
  }
}
