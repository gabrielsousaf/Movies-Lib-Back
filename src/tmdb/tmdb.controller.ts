import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TmdbService } from './tmdb.service.js';

@ApiTags('TMDB (Catálogo de Filmes & Séries)')
@Controller('tmdb')
export class TmdbController {
  constructor(private readonly tmdbService: TmdbService) {}

  // ================= FILMES =================

  @Get('movies/popular')
  @ApiOperation({ summary: 'Listar filmes populares do TMDB' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  async getPopularMovies(@Query('page') page?: string) {
    const pageNum = page ? parseInt(page, 10) : 1;
    return this.tmdbService.getPopularMovies(pageNum);
  }

  @Get('movies/top-rated')
  @ApiOperation({ summary: 'Listar filmes mais bem avaliados do TMDB' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  async getTopRatedMovies(@Query('page') page?: string) {
    const pageNum = page ? parseInt(page, 10) : 1;
    return this.tmdbService.getTopRatedMovies(pageNum);
  }

  @Get('movies/now-playing')
  @ApiOperation({ summary: 'Listar filmes atualmente em cartaz nos cinemas' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  async getNowPlayingMovies(@Query('page') page?: string) {
    const pageNum = page ? parseInt(page, 10) : 1;
    return this.tmdbService.getNowPlayingMovies(pageNum);
  }

  @Get('movies/trending')
  @ApiOperation({ summary: 'Listar filmes em alta (trending) no dia ou na semana' })
  @ApiQuery({ name: 'timeWindow', enum: ['day', 'week'], required: false, example: 'day' })
  async getTrendingMovies(@Query('timeWindow') timeWindow?: 'day' | 'week') {
    return this.tmdbService.getTrendingMovies(timeWindow || 'day');
  }

  @Get('movies/:id')
  @ApiOperation({ summary: 'Obter detalhes completos do filme (sinopse, elenco, recomendados)' })
  async getMovieDetails(@Param('id', ParseIntPipe) id: number) {
    return this.tmdbService.getMovieDetails(id);
  }

  @Get('movies/:id/trailer')
  @ApiOperation({ summary: 'Buscar o trailer oficial do filme no YouTube via TMDB' })
  async getMovieTrailer(@Param('id', ParseIntPipe) id: number) {
    return this.tmdbService.getMovieTrailer(id);
  }

  // ================= SÉRIES =================

  @Get('series/popular')
  @ApiOperation({ summary: 'Listar séries populares do TMDB' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  async getPopularSeries(@Query('page') page?: string) {
    const pageNum = page ? parseInt(page, 10) : 1;
    return this.tmdbService.getPopularSeries(pageNum);
  }

  @Get('series/top-rated')
  @ApiOperation({ summary: 'Listar séries mais bem avaliadas do TMDB' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  async getTopRatedSeries(@Query('page') page?: string) {
    const pageNum = page ? parseInt(page, 10) : 1;
    return this.tmdbService.getTopRatedSeries(pageNum);
  }

  @Get('series/trending')
  @ApiOperation({ summary: 'Listar séries em alta no TMDB' })
  @ApiQuery({ name: 'timeWindow', enum: ['day', 'week'], required: false, example: 'day' })
  async getTrendingSeries(@Query('timeWindow') timeWindow?: 'day' | 'week') {
    return this.tmdbService.getTrendingSeries(timeWindow || 'day');
  }

  @Get('series/:id')
  @ApiOperation({ summary: 'Obter detalhes completos da série e lista de temporadas' })
  async getSeriesDetails(@Param('id', ParseIntPipe) id: number) {
    return this.tmdbService.getSeriesDetails(id);
  }

  @Get('series/:id/season/:seasonNumber')
  @ApiOperation({ summary: 'Listar todos os episódios de uma temporada específica da série' })
  async getSeriesSeason(
    @Param('id', ParseIntPipe) id: number,
    @Param('seasonNumber', ParseIntPipe) seasonNumber: number,
  ) {
    return this.tmdbService.getSeriesSeason(id, seasonNumber);
  }

  @Get('series/:id/trailer')
  @ApiOperation({ summary: 'Buscar o trailer oficial da série no YouTube via TMDB' })
  async getSeriesTrailer(@Param('id', ParseIntPipe) id: number) {
    return this.tmdbService.getSeriesTrailer(id);
  }

  // ================= BUSCA & GÊNEROS =================

  @Get('search')
  @ApiOperation({ summary: 'Busca unificada (filmes e séries) por texto' })
  @ApiQuery({ name: 'query', required: true, example: 'Batman' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  async multiSearch(
    @Query('query') query: string,
    @Query('page') page?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    return this.tmdbService.multiSearch(query, pageNum);
  }

  @Get('genres/movies')
  @ApiOperation({ summary: 'Listar gêneros de filmes em Português' })
  async getMovieGenres() {
    return this.tmdbService.getMovieGenres();
  }

  @Get('genres/series')
  @ApiOperation({ summary: 'Listar gêneros de séries em Português' })
  async getSeriesGenres() {
    return this.tmdbService.getSeriesGenres();
  }
}
