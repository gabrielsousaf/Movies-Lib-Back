import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

@Injectable()
export class TmdbService {
  private readonly logger = new Logger(TmdbService.name);
  private readonly client: AxiosInstance;
  private readonly defaultLanguage = 'pt-BR';
  private readonly cache = new Map<string, CacheEntry<any>>();
  private readonly maxCacheEntries = 1000;
  private cacheHits = 0;
  private cacheMisses = 0;

  constructor(private readonly configService: ConfigService) {
    const baseURL = this.configService.get<string>('TMDB_BASE_URL') || 'https://api.themoviedb.org/3';
    const apiKey = this.configService.get<string>('TMDB_API_KEY');

    this.client = axios.create({
      baseURL,
      params: {
        api_key: apiKey,
        language: this.defaultLanguage,
      },
    });

    // Limpeza periódica de entradas expiradas a cada 5 minutos
    setInterval(() => this.cleanupExpiredCache(), 5 * 60 * 1000);
  }

  private handleError(error: any): never {
    if (error.response) {
      throw new HttpException(
        error.response.data?.status_message || 'Erro na requisição ao TMDB',
        error.response.status,
      );
    }
    throw new HttpException('Falha na comunicação com o serviço TMDB', HttpStatus.BAD_GATEWAY);
  }

  /**
   * Limpa chaves expiradas do cache em memória para liberar recursos
   */
  private cleanupExpiredCache() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Executa requisição HTTP ao TMDB com cache em memória baseado em TTL
   */
  private async getCached<T>(
    endpoint: string,
    params: Record<string, any> = {},
    ttlSeconds = 600,
  ): Promise<T> {
    const sortedParams = Object.keys(params)
      .filter((k) => params[k] !== undefined && params[k] !== null)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join('&');
    const cacheKey = `${endpoint}?${sortedParams}`;

    const now = Date.now();
    const cached = this.cache.get(cacheKey);

    if (cached && now < cached.expiresAt) {
      this.cacheHits++;
      return cached.data as T;
    }

    this.cacheMisses++;

    try {
      const response = await this.client.get(endpoint, { params });

      // Se atingir o limite máximo, remove a chave mais antiga (FIFO/LRU)
      if (this.cache.size >= this.maxCacheEntries) {
        const firstKey = this.cache.keys().next().value;
        if (firstKey) this.cache.delete(firstKey);
      }

      this.cache.set(cacheKey, {
        data: response.data,
        expiresAt: now + ttlSeconds * 1000,
      });

      return response.data as T;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Retorna métricas de performance do cache do TMDB
   */
  getCacheStats() {
    const total = this.cacheHits + this.cacheMisses;
    return {
      entries: this.cache.size,
      maxEntries: this.maxCacheEntries,
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRatio: total > 0 ? `${((this.cacheHits / total) * 100).toFixed(1)}%` : '0%',
    };
  }

  /**
   * Limpa manualmente todo o cache do TMDB
   */
  clearCache() {
    this.cache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    return { message: 'Cache do TMDB limpo com sucesso' };
  }

  // ================= FILMES =================

  async getPopularMovies(page = 1) {
    return this.getCached('/movie/popular', { page }, 600);
  }

  async getTopRatedMovies(page = 1) {
    return this.getCached('/movie/top_rated', { page }, 600);
  }

  async getNowPlayingMovies(page = 1) {
    return this.getCached('/movie/now_playing', { page }, 600);
  }

  async getTrendingMovies(timeWindow: 'day' | 'week' = 'day', page = 1) {
    return this.getCached(`/trending/movie/${timeWindow}`, { page }, 600);
  }

  async getMovieDetails(id: number) {
    return this.getCached(
      `/movie/${id}`,
      { append_to_response: 'credits,recommendations,videos,watch/providers,images' },
      1800,
    );
  }

  async getCollection(id: number) {
    return this.getCached(`/collection/${id}`, {}, 86400);
  }

  async getSimilarMovies(id: number, page = 1) {
    return this.getCached(`/movie/${id}/similar`, { page }, 1800);
  }

  async getRecommendedMovies(id: number, page = 1) {
    return this.getCached(`/movie/${id}/recommendations`, { page }, 1800);
  }

  async getMovieTrailer(id: number) {
    try {
      const response: any = await this.getCached(`/movie/${id}/videos`, {}, 1800);
      const videos = response?.results || [];

      // Procura primeiro por Trailer dublado/legendado em pt-BR no YouTube
      let trailer =
        videos.find((v: any) => v.site === 'YouTube' && v.type === 'Trailer') ||
        videos.find((v: any) => v.site === 'YouTube' && v.type === 'Teaser');

      // Fallback: se não encontrou em pt-BR, busca trailers em en-US
      if (!trailer) {
        const fallbackResponse: any = await this.getCached(
          `/movie/${id}/videos`,
          { language: 'en-US' },
          1800,
        );
        const fallbackVideos = fallbackResponse?.results || [];

        trailer =
          fallbackVideos.find((v: any) => v.site === 'YouTube' && v.type === 'Trailer') ||
          fallbackVideos.find((v: any) => v.site === 'YouTube' && v.type === 'Teaser') ||
          fallbackVideos.find((v: any) => v.site === 'YouTube') ||
          videos[0];
      }

      if (!trailer) {
        return { hasTrailer: false, message: 'Nenhum trailer encontrado para este filme.' };
      }

      return {
        hasTrailer: true,
        key: trailer.key,
        name: trailer.name,
        site: trailer.site,
        type: trailer.type,
        url: `https://www.youtube.com/watch?v=${trailer.key}`,
        embedUrl: `https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1`,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async getMovieWatchProviders(id: number) {
    try {
      const response: any = await this.getCached(`/movie/${id}/watch/providers`, {}, 1800);
      const results = response?.results || {};
      const br = results['BR'] || null;

      return {
        id,
        country: 'BR',
        hasProviders: !!br,
        providers: br,
        allCountries: results,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  // ================= SÉRIES =================

  async getPopularSeries(page = 1) {
    return this.getCached('/tv/popular', { page }, 600);
  }

  async getTopRatedSeries(page = 1) {
    return this.getCached('/tv/top_rated', { page }, 600);
  }

  async getTrendingSeries(timeWindow: 'day' | 'week' = 'day', page = 1) {
    return this.getCached(`/trending/tv/${timeWindow}`, { page }, 600);
  }

  async getSeriesDetails(id: number) {
    return this.getCached(
      `/tv/${id}`,
      { append_to_response: 'credits,recommendations,videos,watch/providers,images' },
      1800,
    );
  }

  async getSimilarSeries(id: number, page = 1) {
    return this.getCached(`/tv/${id}/similar`, { page }, 1800);
  }

  async getRecommendedSeries(id: number, page = 1) {
    return this.getCached(`/tv/${id}/recommendations`, { page }, 1800);
  }

  async getSeriesSeason(id: number, seasonNumber: number) {
    return this.getCached(`/tv/${id}/season/${seasonNumber}`, {}, 1800);
  }

  async getSeriesTrailer(id: number) {
    try {
      const response: any = await this.getCached(`/tv/${id}/videos`, {}, 1800);
      const videos = response?.results || [];

      // Procura primeiro por Trailer dublado/legendado em pt-BR no YouTube
      let trailer =
        videos.find((v: any) => v.site === 'YouTube' && v.type === 'Trailer') ||
        videos.find((v: any) => v.site === 'YouTube' && v.type === 'Teaser');

      // Fallback: se não encontrou em pt-BR, busca trailers em en-US
      if (!trailer) {
        const fallbackResponse: any = await this.getCached(
          `/tv/${id}/videos`,
          { language: 'en-US' },
          1800,
        );
        const fallbackVideos = fallbackResponse?.results || [];

        trailer =
          fallbackVideos.find((v: any) => v.site === 'YouTube' && v.type === 'Trailer') ||
          fallbackVideos.find((v: any) => v.site === 'YouTube' && v.type === 'Teaser') ||
          fallbackVideos.find((v: any) => v.site === 'YouTube') ||
          videos[0];
      }

      if (!trailer) {
        return { hasTrailer: false, message: 'Nenhum trailer encontrado para esta série.' };
      }

      return {
        hasTrailer: true,
        key: trailer.key,
        name: trailer.name,
        site: trailer.site,
        type: trailer.type,
        url: `https://www.youtube.com/watch?v=${trailer.key}`,
        embedUrl: `https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1`,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async getSeriesWatchProviders(id: number) {
    try {
      const response: any = await this.getCached(`/tv/${id}/watch/providers`, {}, 1800);
      const results = response?.results || {};
      const br = results['BR'] || null;

      return {
        id,
        country: 'BR',
        hasProviders: !!br,
        providers: br,
        allCountries: results,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  // ================= BUSCA & GÊNEROS =================

  async multiSearch(query: string, page = 1) {
    return this.getCached('/search/multi', { query, page }, 300);
  }

  async searchMovies(query: string, page = 1) {
    return this.getCached('/search/movie', { query, page }, 300);
  }

  async searchSeries(query: string, page = 1) {
    return this.getCached('/search/tv', { query, page }, 300);
  }

  async getMovieGenres() {
    return this.getCached('/genre/movie/list', {}, 86400);
  }

  async getSeriesGenres() {
    return this.getCached('/genre/tv/list', {}, 86400);
  }

  // ================= FILMES EM BREVE (UPCOMING) =================

  async getUpcomingMovies(page = 1) {
    return this.getCached('/movie/upcoming', { page }, 600);
  }

  // ================= DESCOBERTA & FILTROS (DISCOVER) =================

  async discoverMovies(params: {
    with_genres?: string;
    sort_by?: string;
    page?: number;
    year?: number;
    min_vote?: number;
  }) {
    return this.getCached(
      '/discover/movie',
      {
        with_genres: params.with_genres,
        sort_by: params.sort_by || 'popularity.desc',
        page: params.page || 1,
        primary_release_year: params.year,
        'vote_average.gte': params.min_vote,
        'vote_count.gte': params.min_vote ? 100 : undefined,
      },
      600,
    );
  }

  async discoverSeries(params: {
    with_genres?: string;
    sort_by?: string;
    page?: number;
    first_air_date_year?: number;
    min_vote?: number;
  }) {
    return this.getCached(
      '/discover/tv',
      {
        with_genres: params.with_genres,
        sort_by: params.sort_by || 'popularity.desc',
        page: params.page || 1,
        first_air_date_year: params.first_air_date_year,
        'vote_average.gte': params.min_vote,
        'vote_count.gte': params.min_vote ? 50 : undefined,
      },
      600,
    );
  }

  // ================= ELENCO & ATORES (PERSON / CREDITS) =================

  async getPersonDetails(id: number) {
    return this.getCached(
      `/person/${id}`,
      { append_to_response: 'combined_credits,images' },
      3600,
    );
  }

  async getMovieCredits(id: number) {
    return this.getCached(`/movie/${id}/credits`, {}, 3600);
  }

  async getSeriesCredits(id: number) {
    return this.getCached(`/tv/${id}/credits`, {}, 3600);
  }
}
