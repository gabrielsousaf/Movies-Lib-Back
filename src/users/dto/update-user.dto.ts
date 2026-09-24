import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ example: 'Gabriel Sousa', description: 'Nome de exibição', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(60)
  displayName?: string;

  @ApiProperty({ example: 'Apaixonado por filmes de Ficção Científica e Séries', description: 'Biografia do perfil', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(300)
  bio?: string;

  @ApiProperty({ example: 'https://github.com/gabrielsousaf.png', description: 'URL do avatar', required: false })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiProperty({ example: true, description: 'Se o perfil e favoritos são públicos para outros usuários', required: false })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
