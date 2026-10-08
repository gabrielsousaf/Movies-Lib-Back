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
import { ReviewsService } from './reviews.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { UpdateReviewDto } from './dto/update-review.dto.js';
import { MediaTypeDto } from '../favorites/dto/create-favorite.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Avaliações & Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Adicionar ou atualizar nota e resenha para um filme ou série' })
  @ApiResponse({ status: 201, description: 'Avaliação registrada com sucesso.' })
  async upsertReview(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.upsertReview(userId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar nota ou texto de uma avaliação existente' })
  async updateReview(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.updateReview(userId, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Excluir uma avaliação' })
  async deleteReview(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.reviewsService.deleteReview(userId, id);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Curtir ou descurtir uma avaliação (toggle like)' })
  @ApiResponse({ status: 200, description: 'Status de curtida alterado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Avaliação não encontrada.' })
  async toggleLike(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.reviewsService.toggleLikeReview(userId, id);
  }

  @Get('media/:tmdbId')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todas as avaliações da comunidade para um título (com nota média, likes e paginação)' })
  @ApiQuery({ name: 'type', enum: MediaTypeDto, description: 'Tipo da mídia (MOVIE ou TV)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  async getMediaReviews(
    @Param('tmdbId', ParseIntPipe) tmdbId: number,
    @Query('type', new ParseEnumPipe(MediaTypeDto)) type: MediaTypeDto,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @CurrentUser('id') currentUserId?: string,
  ) {
    return this.reviewsService.getMediaReviews(tmdbId, type, page || 1, limit || 10, currentUserId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todas as minhas avaliações com paginação' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async getMyReviews(
    @CurrentUser('id') userId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.reviewsService.getMyReviews(userId, page || 1, limit || 20);
  }

  @Get('me/media/:tmdbId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter minha avaliação específica para um determinado título' })
  @ApiQuery({ name: 'type', enum: MediaTypeDto, description: 'Tipo da mídia (MOVIE ou TV)' })
  async getMyReviewForMedia(
    @CurrentUser('id') userId: string,
    @Param('tmdbId', ParseIntPipe) tmdbId: number,
    @Query('type', new ParseEnumPipe(MediaTypeDto)) type: MediaTypeDto,
  ) {
    return this.reviewsService.getMyReviewForMedia(userId, tmdbId, type);
  }

  @Get('user/:username')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar avaliações de outro usuário (se perfil for público ou você for o dono)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async getUserReviews(
    @Param('username') username: string,
    @CurrentUser('id') currentUserId?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.reviewsService.getUserReviews(username, currentUserId, page || 1, limit || 20);
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Adicionar comentário a uma avaliação' })
  async addComment(
    @CurrentUser('id') userId: string,
    @Param('id') reviewId: string,
    @Body('content') content: string,
  ) {
    return this.reviewsService.addComment(userId, reviewId, content);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Listar comentários de uma avaliação' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async getComments(
    @Param('id') reviewId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.reviewsService.getComments(reviewId, page || 1, limit || 20);
  }

  @Delete('comments/:commentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Excluir um comentário' })
  async deleteComment(
    @CurrentUser('id') userId: string,
    @Param('commentId') commentId: string,
  ) {
    return this.reviewsService.deleteComment(userId, commentId);
  }
}
