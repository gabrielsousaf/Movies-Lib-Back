import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCustomListDto {
  @ApiProperty({
    example: 'Favoritos de Ficção Científica',
    description: 'Título da lista personalizada',
  })
  @IsString()
  @IsNotEmpty({ message: 'O título da lista é obrigatório' })
  @MaxLength(100, { message: 'O título deve ter no máximo 100 caracteres' })
  title: string;

  @ApiProperty({
    example: 'Minha seleção com os melhores filmes espaciais e ficção científica.',
    description: 'Descrição ou contexto sobre a lista',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'A descrição deve ter no máximo 500 caracteres' })
  description?: string;

  @ApiProperty({
    example: true,
    description: 'Define se a lista é visível publicamente no perfil do usuário',
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
