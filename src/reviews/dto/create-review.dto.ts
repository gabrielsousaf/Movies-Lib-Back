import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MediaTypeDto } from '../../favorites/dto/create-favorite.dto.js';

export class CreateReviewDto {
  @ApiProperty({ example: 550, description: 'ID do filme ou série no TMDB' })
  @IsInt()
  @IsNotEmpty()
  tmdbId: number;

  @ApiProperty({ enum: MediaTypeDto, example: 'MOVIE', description: 'Tipo da mídia (MOVIE ou TV)' })
  @IsEnum(MediaTypeDto, { message: 'mediaType deve ser MOVIE ou TV' })
  @IsNotEmpty()
  mediaType: MediaTypeDto;

  @ApiProperty({ example: 'Clube da Luta', description: 'Título do filme ou série' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 9.5, description: 'Sua nota para o filme ou série (de 0.5 a 10)' })
  @IsNumber()
  @Min(0.5, { message: 'A nota mínima permitida é 0.5' })
  @Max(10, { message: 'A nota máxima permitida é 10' })
  @IsNotEmpty({ message: 'A nota é obrigatória' })
  rating: number;

  @ApiProperty({
    example: 'Um clássico do cinema! Atuações impecáveis e um roteiro surpreendente.',
    description: 'Comentário ou resenha pessoal',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000, { message: 'O comentário pode ter no máximo 2000 caracteres' })
  content?: string;

  @ApiProperty({ example: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', description: 'Caminho do poster no TMDB', required: false })
  @IsString()
  @IsOptional()
  posterPath?: string;
}
