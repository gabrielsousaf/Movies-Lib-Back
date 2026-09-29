import { Module } from '@nestjs/common';
import { WatchlistController } from './watchlist.controller.js';
import { WatchlistService } from './watchlist.service.js';

@Module({
  controllers: [WatchlistController],
  providers: [WatchlistService],
  exports: [WatchlistService],
})
export class WatchlistModule {}
