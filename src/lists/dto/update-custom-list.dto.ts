import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCustomListDto {
  @ApiProperty({
    example: 'Favoritos de Ficção Científica (Atualizada)',
    description: 'Novo título da lista personalizada',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'O título deve ter no máximo 100 caracteres' })
  title?: string;

  @ApiProperty({
    example: 'Descrição atualizada da lista.',
    description: 'Nova descrição sobre a lista',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'A descrição deve ter no máximo 500 caracteres' })
  description?: string;

  @ApiProperty({
    example: false,
    description: 'Define se a lista é visível publicamente',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
