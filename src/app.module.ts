import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { FavoritesModule } from './favorites/favorites.module.js';
import { WatchlistModule } from './watchlist/watchlist.module.js';
import { ReviewsModule } from './reviews/reviews.module.js';
import { TmdbModule } from './tmdb/tmdb.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    FavoritesModule,
    WatchlistModule,
    ReviewsModule,
    TmdbModule,
  ],
})
export class AppModule {}
