import { Module } from '@nestjs/common';
import { EpisodesController } from './episodes.controller.js';
import { EpisodesService } from './episodes.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [EpisodesController],
  providers: [EpisodesService],
})
export class EpisodesModule {}
