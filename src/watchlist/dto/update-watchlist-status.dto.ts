import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { WatchStatusDto } from './create-watchlist.dto.js';

export class UpdateWatchlistStatusDto {
  @ApiProperty({
    enum: WatchStatusDto,
    example: 'WATCHED',
    description: 'Novo status da mídia (WATCHLIST ou WATCHED)',
  })
  @IsEnum(WatchStatusDto, { message: 'status deve ser WATCHLIST ou WATCHED' })
  @IsNotEmpty()
  status: WatchStatusDto;
}
