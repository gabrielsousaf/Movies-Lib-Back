import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { FavoritesModule } from './favorites/favorites.module.js';
import { WatchlistModule } from './watchlist/watchlist.module.js';
import { ReviewsModule } from './reviews/reviews.module.js';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ListsModule } from './lists/lists.module.js';
import { TmdbModule } from './tmdb/tmdb.module.js';
import { EpisodesModule } from './episodes/episodes.module.js';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 segundos
        limit: 100, // limite de 100 requisições por IP a cada 60s
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    FavoritesModule,
    WatchlistModule,
    ReviewsModule,
    ListsModule,
    TmdbModule,
    EpisodesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
