import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { MediaTypeDto } from '../../favorites/dto/create-favorite.dto.js';

export enum WatchStatusDto {
  WATCHLIST = 'WATCHLIST', // Quero Assistir
  WATCHED = 'WATCHED',     // Já Assisti
}

export class CreateWatchlistDto {
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

  @ApiProperty({
    enum: WatchStatusDto,
    example: 'WATCHLIST',
    default: 'WATCHLIST',
    description: 'Status: WATCHLIST (Quero Assistir) ou WATCHED (Já Assisti)',
    required: false,
  })
  @IsEnum(WatchStatusDto, { message: 'status deve ser WATCHLIST ou WATCHED' })
  @IsOptional()
  status?: WatchStatusDto;

  @ApiProperty({ example: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', description: 'Caminho do poster no TMDB', required: false })
  @IsString()
  @IsOptional()
  posterPath?: string;

  @ApiProperty({ example: '/hZkgoQYus5vegHoetLkCJzb17zJ.jpg', description: 'Caminho do backdrop no TMDB', required: false })
  @IsString()
  @IsOptional()
  backdropPath?: string;

  @ApiProperty({ example: 8.4, description: 'Nota média no TMDB', required: false })
  @IsNumber()
  @IsOptional()
  voteAverage?: number;

  @ApiProperty({ example: '1999-10-15', description: 'Data de lançamento', required: false })
  @IsString()
  @IsOptional()
  releaseDate?: string;
}
