import { Controller, Get, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { FeedService } from './feed.service.js';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('Feed Social')
@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Listar feed de atividades (Seguindo ou Explorar Global)' })
  @ApiQuery({ name: 'scope', enum: ['following', 'global'], required: false, example: 'following' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async getFeed(
    @CurrentUser('id') userId?: string,
    @Query('scope') scope?: 'following' | 'global',
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    const finalScope = scope === 'global' ? 'global' : 'following';
    return this.feedService.getFeed(userId, finalScope, page || 1, limit || 20);
  }
}
