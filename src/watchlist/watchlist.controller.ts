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
import { WatchlistService } from './watchlist.service.js';
import {
  CreateWatchlistDto,
  WatchStatusDto,
} from './dto/create-watchlist.dto.js';
import { UpdateWatchlistStatusDto } from './dto/update-watchlist-status.dto.js';
import { MediaTypeDto } from '../favorites/dto/create-favorite.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Watchlist (Quero Assistir & Já Assisti)')
@Controller('watchlist')
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Adicionar ou atualizar item na lista (Quero Assistir ou Já Assisti)' })
  @ApiResponse({ status: 201, description: 'Item salvo com sucesso.' })
  async upsertItem(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateWatchlistDto,
  ) {
    return this.watchlistService.upsertItem(userId, dto);
  }

  @Patch(':tmdbId/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Alterar status de um item (ex: de WATCHLIST para WATCHED)' })
  @ApiQuery({ name: 'type', enum: MediaTypeDto, description: 'Tipo da mídia (MOVIE ou TV)' })
  async updateStatus(
    @CurrentUser('id') userId: string,
    @Param('tmdbId', ParseIntPipe) tmdbId: number,
    @Query('type', new ParseEnumPipe(MediaTypeDto)) type: MediaTypeDto,
    @Body() dto: UpdateWatchlistStatusDto,
  ) {
    return this.watchlistService.updateStatus(userId, tmdbId, type, dto.status);
  }

  @Delete(':tmdbId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover filme ou série da watchlist/já assistidos' })
  @ApiQuery({ name: 'type', enum: MediaTypeDto, description: 'Tipo da mídia (MOVIE ou TV)' })
  async removeItem(
    @CurrentUser('id') userId: string,
    @Param('tmdbId', ParseIntPipe) tmdbId: number,
    @Query('type', new ParseEnumPipe(MediaTypeDto)) type: MediaTypeDto,
  ) {
    return this.watchlistService.removeItem(userId, tmdbId, type);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar meus itens com filtro por status, tipo e paginação' })
  @ApiQuery({ name: 'status', enum: WatchStatusDto, required: false, description: 'WATCHLIST ou WATCHED' })
  @ApiQuery({ name: 'type', enum: MediaTypeDto, required: false, description: 'MOVIE ou TV' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async getMyWatchlist(
    @CurrentUser('id') userId: string,
    @Query('status', new ParseEnumPipe(WatchStatusDto, { optional: true })) status?: WatchStatusDto,
    @Query('type', new ParseEnumPipe(MediaTypeDto, { optional: true })) type?: MediaTypeDto,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.watchlistService.getMyWatchlist(userId, status, type, page, limit);
  }

  @Get('check/:tmdbId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verificar se o filme/série está na lista e qual o status atual' })
  @ApiQuery({ name: 'type', enum: MediaTypeDto, description: 'Tipo da mídia (MOVIE ou TV)' })
  async checkItem(
    @CurrentUser('id') userId: string,
    @Param('tmdbId', ParseIntPipe) tmdbId: number,
    @Query('type', new ParseEnumPipe(MediaTypeDto)) type: MediaTypeDto,
  ) {
    return this.watchlistService.checkItem(userId, tmdbId, type);
  }

  @Get('user/:username')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar watchlist/já assistidos de outro usuário (se perfil público ou você for o dono)' })
  @ApiQuery({ name: 'status', enum: WatchStatusDto, required: false })
  @ApiQuery({ name: 'type', enum: MediaTypeDto, required: false })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async getPublicWatchlist(
    @Param('username') username: string,
    @CurrentUser('id') currentUserId?: string,
    @Query('status', new ParseEnumPipe(WatchStatusDto, { optional: true })) status?: WatchStatusDto,
    @Query('type', new ParseEnumPipe(MediaTypeDto, { optional: true })) type?: MediaTypeDto,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.watchlistService.getPublicWatchlist(username, currentUserId, status, type, page, limit);
  }
}
