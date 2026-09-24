import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Usuários & Perfis Públicos')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':username')
  @ApiOperation({ summary: 'Obter perfil público de um usuário pelo @username' })
  @ApiResponse({ status: 200, description: 'Dados públicos do perfil e total de favoritos.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  async getPublicProfile(@Param('username') username: string) {
    return this.usersService.getPublicProfile(username);
  }

  @Get(':username/favorites')
  @ApiOperation({ summary: 'Listar os favoritos de outro usuário (se o perfil for público)' })
  @ApiResponse({ status: 200, description: 'Lista de filmes e séries favoritados por esse usuário.' })
  @ApiResponse({ status: 403, description: 'Lista privada.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  async getPublicFavorites(
    @Param('username') username: string,
    @Req() req: any,
  ) {
    const currentUserId = req.user?.id;
    return this.usersService.getPublicFavorites(username, currentUserId);
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
}
