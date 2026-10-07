import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Usuários & Perfis Públicos')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':username')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter perfil público de um usuário pelo @username' })
  @ApiResponse({ status: 200, description: 'Dados públicos do perfil e estatísticas de engajamento.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  async getPublicProfile(
    @Param('username') username: string,
    @CurrentUser('id') currentUserId?: string,
  ) {
    return this.usersService.getPublicProfile(username, currentUserId);
  }

  @Get(':username/favorites')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar os favoritos de outro usuário (se o perfil for público ou você for o dono)' })
  @ApiResponse({ status: 200, description: 'Lista de filmes e séries favoritados por esse usuário.' })
  @ApiResponse({ status: 403, description: 'Lista privada.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  async getPublicFavorites(
    @Param('username') username: string,
    @CurrentUser('id') currentUserId?: string,
  ) {
    return this.usersService.getPublicFavorites(username, currentUserId);
  }

  @Post(':username/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Seguir um usuário' })
  @ApiResponse({ status: 200, description: 'Usuário seguido com sucesso.' })
  @ApiResponse({ status: 400, description: 'Não é possível seguir a si mesmo.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  async followUser(
    @CurrentUser('id') followerId: string,
    @Param('username') username: string,
  ) {
    return this.usersService.followUser(followerId, username);
  }

  @Delete(':username/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deixar de seguir um usuário' })
  @ApiResponse({ status: 200, description: 'Deixou de seguir o usuário com sucesso.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  async unfollowUser(
    @CurrentUser('id') followerId: string,
    @Param('username') username: string,
  ) {
    return this.usersService.unfollowUser(followerId, username);
  }

  @Get(':username/followers')
  @ApiOperation({ summary: 'Listar seguidores de um usuário' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async getFollowers(
    @Param('username') username: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.usersService.getFollowers(username, page, limit);
  }

  @Get(':username/following')
  @ApiOperation({ summary: 'Listar quem o usuário está seguindo' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async getFollowing(
    @Param('username') username: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.usersService.getFollowing(username, page, limit);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar informações do meu próprio perfil (bio, avatar, nome, privacidade)' })
  @ApiResponse({ status: 200, description: 'Perfil atualizado.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  async updateMe(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateMe(userId, dto);
  }

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fazer upload da foto de perfil' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (req, file, cb) => {
          const uniqueSuffix = randomUUID();
          const ext = extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  async uploadAvatar(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    return this.usersService.updateMe(userId, { avatarUrl });
  }

  @Patch('me/password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Alterar a senha do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Senha alterada com sucesso.' })
  @ApiResponse({ status: 401, description: 'Senha atual incorreta ou não autorizado.' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(userId, dto);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Excluir definitivamente a conta do usuário autenticado e seus dados' })
  @ApiResponse({ status: 200, description: 'Conta excluída com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  async deleteAccount(@CurrentUser('id') userId: string) {
    return this.usersService.deleteAccount(userId);
  }
}
