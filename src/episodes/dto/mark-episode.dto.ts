import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MarkEpisodeDto {
  @ApiProperty({ description: 'ID da série no TMDB', example: 1399 })
  @IsInt()
  @Min(1)
  showId: number;

  @ApiProperty({ description: 'Número da temporada', example: 1 })
  @IsInt()
  @Min(1)
  seasonNumber: number;

  @ApiProperty({ description: 'Número do episódio', example: 1 })
  @IsInt()
  @Min(1)
  episodeNumber: number;
}
