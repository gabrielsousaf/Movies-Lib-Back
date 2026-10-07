import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import { EpisodesService } from './episodes.service.js';
import { MarkEpisodeDto } from './dto/mark-episode.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';

@ApiTags('Episódios (Controle)')
@Controller('episodes')
export class EpisodesController {
  constructor(private readonly episodesService: EpisodesService) {}

  @Post('mark')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marcar episódio como assistido' })
  async markWatched(
    @CurrentUser('id') userId: string,
    @Body() dto: MarkEpisodeDto,
  ) {
    return this.episodesService.markWatched(userId, dto);
  }

  @Delete('unmark')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desmarcar episódio assistido' })
  async unmarkWatched(
    @CurrentUser('id') userId: string,
    @Body() dto: MarkEpisodeDto,
  ) {
    return this.episodesService.unmarkWatched(userId, dto);
  }

  @Get('watched/:showId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar episódios assistidos de uma série (opcional por temporada)' })
  @ApiQuery({ name: 'season', required: false, type: Number })
  async getWatchedEpisodes(
    @CurrentUser('id') userId: string,
    @Param('showId', ParseIntPipe) showId: number,
    @Query('season') season?: string,
  ) {
    const seasonNumber = season ? parseInt(season, 10) : undefined;
    return this.episodesService.getWatchedEpisodes(userId, showId, seasonNumber);
  }
}
