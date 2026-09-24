import { Module } from '@nestjs/common';
import { TmdbController } from './tmdb.controller.js';
import { TmdbService } from './tmdb.service.js';

@Module({
  controllers: [TmdbController],
  providers: [TmdbService],
  exports: [TmdbService],
})
export class TmdbModule {}
