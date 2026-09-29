import {
  Controller,
  Get,
  Param,
  ParseFloatPipe,
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
  async getPopularMovies(@Query('page', new ParseIntPipe({ optional: true })) page?: number) {
    return this.tmdbService.getPopularMovies(page || 1);
  }

  @Get('movies/top-rated')
  @ApiOperation({ summary: 'Listar filmes mais bem avaliados do TMDB' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  async getTopRatedMovies(@Query('page', new ParseIntPipe({ optional: true })) page?: number) {
    return this.tmdbService.getTopRatedMovies(page || 1);
  }

  @Get('movies/now-playing')
  @ApiOperation({ summary: 'Listar filmes atualmente em cartaz nos cinemas' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  async getNowPlayingMovies(@Query('page', new ParseIntPipe({ optional: true })) page?: number) {
    return this.tmdbService.getNowPlayingMovies(page || 1);
  }

  @Get('movies/upcoming')
  @ApiOperation({ summary: 'Listar filmes que estreiam em breve nos cinemas' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  async getUpcomingMovies(@Query('page', new ParseIntPipe({ optional: true })) page?: number) {
    return this.tmdbService.getUpcomingMovies(page || 1);
  }

  @Get('movies/trending')
  @ApiOperation({ summary: 'Listar filmes em alta (trending) no dia ou na semana' })
  @ApiQuery({ name: 'timeWindow', enum: ['day', 'week'], required: false, example: 'day' })
  async getTrendingMovies(@Query('timeWindow') timeWindow?: 'day' | 'week') {
    const validWindow = timeWindow === 'week' ? 'week' : 'day';
    return this.tmdbService.getTrendingMovies(validWindow);
  }

  @Get('movies/discover')
  @ApiOperation({ summary: 'Descobrir e filtrar filmes por gênero, ano, ordenação e nota mínima' })
  @ApiQuery({ name: 'genres', required: false, description: 'IDs de gêneros separados por vírgula (ex: 28,12)' })
  @ApiQuery({ name: 'sortBy', required: false, example: 'popularity.desc', description: 'popularity.desc, vote_average.desc, primary_release_date.desc' })
  @ApiQuery({ name: 'year', required: false, example: 2024, description: 'Ano de lançamento' })
  @ApiQuery({ name: 'minVote', required: false, example: 7.0, description: 'Nota mínima de avaliação (0 a 10)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  async discoverMovies(
    @Query('genres') genres?: string,
    @Query('sortBy') sortBy?: string,
    @Query('year', new ParseIntPipe({ optional: true })) year?: number,
    @Query('minVote', new ParseFloatPipe({ optional: true })) minVote?: number,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
  ) {
    return this.tmdbService.discoverMovies({
      with_genres: genres,
      sort_by: sortBy,
      year,
      min_vote: minVote,
      page: page || 1,
    });
  }

  @Get('movies/:id')
  @ApiOperation({ summary: 'Obter detalhes completos do filme (sinopse, elenco, recomendados, onde assistir)' })
  async getMovieDetails(@Param('id', ParseIntPipe) id: number) {
    return this.tmdbService.getMovieDetails(id);
  }

  @Get('movies/:id/trailer')
  @ApiOperation({ summary: 'Buscar o trailer oficial do filme no YouTube via TMDB' })
  async getMovieTrailer(@Param('id', ParseIntPipe) id: number) {
    return this.tmdbService.getMovieTrailer(id);
  }

  @Get('movies/:id/providers')
  @ApiOperation({ summary: 'Listar plataformas de streaming e aluguel (Onde Assistir no Brasil) para o filme' })
  async getMovieProviders(@Param('id', ParseIntPipe) id: number) {
    return this.tmdbService.getMovieWatchProviders(id);
  }

  @Get('movies/:id/credits')
  @ApiOperation({ summary: 'Listar elenco completo e equipe técnica do filme' })
  async getMovieCredits(@Param('id', ParseIntPipe) id: number) {
    return this.tmdbService.getMovieCredits(id);
  }

  // ================= SÉRIES =================

  @Get('series/popular')
  @ApiOperation({ summary: 'Listar séries populares do TMDB' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  async getPopularSeries(@Query('page', new ParseIntPipe({ optional: true })) page?: number) {
    return this.tmdbService.getPopularSeries(page || 1);
  }

  @Get('series/top-rated')
  @ApiOperation({ summary: 'Listar séries mais bem avaliadas do TMDB' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  async getTopRatedSeries(@Query('page', new ParseIntPipe({ optional: true })) page?: number) {
    return this.tmdbService.getTopRatedSeries(page || 1);
  }

  @Get('series/trending')
  @ApiOperation({ summary: 'Listar séries em alta no TMDB' })
  @ApiQuery({ name: 'timeWindow', enum: ['day', 'week'], required: false, example: 'day' })
  async getTrendingSeries(@Query('timeWindow') timeWindow?: 'day' | 'week') {
    const validWindow = timeWindow === 'week' ? 'week' : 'day';
    return this.tmdbService.getTrendingSeries(validWindow);
  }

  @Get('series/discover')
  @ApiOperation({ summary: 'Descobrir e filtrar séries por gênero, ano, ordenação e nota mínima' })
  @ApiQuery({ name: 'genres', required: false, description: 'IDs de gêneros separados por vírgula (ex: 18,10765)' })
  @ApiQuery({ name: 'sortBy', required: false, example: 'popularity.desc' })
  @ApiQuery({ name: 'year', required: false, example: 2024, description: 'Ano de estreia' })
  @ApiQuery({ name: 'minVote', required: false, example: 7.0, description: 'Nota mínima de avaliação (0 a 10)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  async discoverSeries(
    @Query('genres') genres?: string,
    @Query('sortBy') sortBy?: string,
    @Query('year', new ParseIntPipe({ optional: true })) year?: number,
    @Query('minVote', new ParseFloatPipe({ optional: true })) minVote?: number,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
  ) {
    return this.tmdbService.discoverSeries({
      with_genres: genres,
      sort_by: sortBy,
      first_air_date_year: year,
      min_vote: minVote,
      page: page || 1,
    });
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

  @Get('series/:id/providers')
  @ApiOperation({ summary: 'Listar plataformas de streaming e aluguel (Onde Assistir no Brasil) para a série' })
  async getSeriesProviders(@Param('id', ParseIntPipe) id: number) {
    return this.tmdbService.getSeriesWatchProviders(id);
  }

  @Get('series/:id/credits')
  @ApiOperation({ summary: 'Listar elenco completo e equipe técnica da série' })
  async getSeriesCredits(@Param('id', ParseIntPipe) id: number) {
    return this.tmdbService.getSeriesCredits(id);
  }

  // ================= ELENCO & ATORES =================

  @Get('person/:id')
  @ApiOperation({ summary: 'Obter biografia, filmografia e fotos de um ator ou diretor' })
  async getPersonDetails(@Param('id', ParseIntPipe) id: number) {
    return this.tmdbService.getPersonDetails(id);
  }

  // ================= BUSCA & GÊNEROS =================

  @Get('search')
  @ApiOperation({ summary: 'Busca unificada (filmes e séries) por texto' })
  @ApiQuery({ name: 'query', required: true, example: 'Batman' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  async multiSearch(
    @Query('query') query: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
  ) {
    return this.tmdbService.multiSearch(query, page || 1);
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
