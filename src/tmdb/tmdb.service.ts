import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class TmdbService {
  private readonly client: AxiosInstance;
  private readonly defaultLanguage = 'pt-BR';

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
  }

  private handleError(error: any) {
    if (error.response) {
      throw new HttpException(
        error.response.data?.status_message || 'Erro na requisição ao TMDB',
        error.response.status,
      );
    }
    throw new HttpException('Falha na comunicação com o serviço TMDB', HttpStatus.BAD_GATEWAY);
  }

  // ================= FILMES =================

  async getPopularMovies(page = 1) {
    try {
      const response = await this.client.get('/movie/popular', { params: { page } });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getTopRatedMovies(page = 1) {
    try {
      const response = await this.client.get('/movie/top_rated', { params: { page } });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getNowPlayingMovies(page = 1) {
    try {
      const response = await this.client.get('/movie/now_playing', { params: { page } });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getTrendingMovies(timeWindow: 'day' | 'week' = 'day') {
    try {
      const response = await this.client.get(`/trending/movie/${timeWindow}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getMovieDetails(id: number) {
    try {
      const response = await this.client.get(`/movie/${id}`, {
        params: {
          append_to_response: 'credits,recommendations,videos',
        },
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getMovieTrailer(id: number) {
    try {
      const response = await this.client.get(`/movie/${id}/videos`);
      const videos = response.data?.results || [];

      // Procura primeiro por Trailer dublado/legendado no YouTube
      const trailer =
        videos.find(
          (v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'),
        ) || videos[0];

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

  // ================= SÉRIES =================

  async getPopularSeries(page = 1) {
    try {
      const response = await this.client.get('/tv/popular', { params: { page } });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getTopRatedSeries(page = 1) {
    try {
      const response = await this.client.get('/tv/top_rated', { params: { page } });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getTrendingSeries(timeWindow: 'day' | 'week' = 'day') {
    try {
      const response = await this.client.get(`/trending/tv/${timeWindow}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getSeriesDetails(id: number) {
    try {
      const response = await this.client.get(`/tv/${id}`, {
        params: {
          append_to_response: 'credits,recommendations,videos',
        },
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getSeriesSeason(id: number, seasonNumber: number) {
    try {
      const response = await this.client.get(`/tv/${id}/season/${seasonNumber}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getSeriesTrailer(id: number) {
    try {
      const response = await this.client.get(`/tv/${id}/videos`);
      const videos = response.data?.results || [];

      const trailer =
        videos.find(
          (v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'),
        ) || videos[0];

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

  // ================= BUSCA & GÊNEROS =================

  async multiSearch(query: string, page = 1) {
    try {
      const response = await this.client.get('/search/multi', {
        params: { query, page },
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getMovieGenres() {
    try {
      const response = await this.client.get('/genre/movie/list');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getSeriesGenres() {
    try {
      const response = await this.client.get('/genre/tv/list');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }
}
