import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private supabase: SupabaseClient | null = null;
  private readonly bucketName: string;
  private readonly localUploadDir = path.join(process.cwd(), 'uploads', 'avatars');

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.get<string>('SUPABASE_AVATARS_BUCKET') || 'avatars';

    const supabaseUrl =
      this.configService.get<string>('SUPABASE_URL') ||
      'https://yccjmhfkzfatldbzekvr.supabase.co';
    const supabaseKey =
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ||
      this.configService.get<string>('SUPABASE_KEY');

    if (supabaseUrl && supabaseKey) {
      try {
        this.supabase = createClient(supabaseUrl, supabaseKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        });
        this.logger.log(`Supabase Storage ativado com sucesso para bucket "${this.bucketName}" (${supabaseUrl})`);
        this.ensureBucketExists();
      } catch (err: any) {
        this.logger.error(`Falha ao inicializar Supabase Storage: ${err?.message}`);
        this.supabase = null;
      }
    } else {
      this.logger.warn(
        'SUPABASE_KEY / SUPABASE_SERVICE_ROLE_KEY não configurado no .env. Usando armazenamento em disco local (./uploads/avatars).',
      );
    }

    // Garante que o diretório local exista para fallback
    if (!fs.existsSync(this.localUploadDir)) {
      fs.mkdirSync(this.localUploadDir, { recursive: true });
    }
  }

  private async ensureBucketExists() {
    if (!this.supabase) return;
    try {
      const { data: buckets, error } = await this.supabase.storage.listBuckets();
      if (error) {
        this.logger.warn(`Não foi possível listar buckets do Supabase: ${error.message}`);
        return;
      }
      const exists = buckets?.some((b) => b.name === this.bucketName);
      if (!exists) {
        const { error: createError } = await this.supabase.storage.createBucket(this.bucketName, {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        });
        if (createError) {
          this.logger.warn(`Aviso ao criar bucket "${this.bucketName}": ${createError.message}`);
        } else {
          this.logger.log(`Bucket público "${this.bucketName}" criado no Supabase com sucesso.`);
        }
      }
    } catch (err: any) {
      this.logger.warn(`Erro ao verificar bucket Supabase: ${err?.message}`);
    }
  }

  /**
   * Faz upload da imagem de avatar para o Supabase Storage ou disco local
   */
  async uploadAvatar(file: Express.Multer.File, userId: string): Promise<string> {
    if (!file || !file.buffer) {
      throw new BadRequestException('Nenhum buffer de arquivo recebido para upload.');
    }

    const rawExt = extname(file.originalname).toLowerCase();
    const ext = rawExt || (file.mimetype === 'image/png' ? '.png' : file.mimetype === 'image/webp' ? '.webp' : '.jpg');
    const fileName = `${userId}-${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;

    // 1. Tentar upload no Supabase Storage se configurado
    if (this.supabase) {
      try {
        const filePath = `${userId}/${fileName}`;
        const { data, error } = await this.supabase.storage
          .from(this.bucketName)
          .upload(filePath, file.buffer, {
            contentType: file.mimetype || 'image/jpeg',
            upsert: true,
          });

        if (error) {
          this.logger.error(`Erro ao subir imagem no Supabase: ${error.message}. Fazendo fallback para disco local.`);
          return this.saveToLocalDisk(file.buffer, fileName);
        }

        const { data: publicUrlData } = this.supabase.storage
          .from(this.bucketName)
          .getPublicUrl(filePath);

        this.logger.log(`Avatar enviado ao Supabase Storage: ${publicUrlData.publicUrl}`);
        return publicUrlData.publicUrl;
      } catch (err: any) {
        this.logger.error(`Exceção no upload para Supabase: ${err?.message}. Salvando localmente.`);
        return this.saveToLocalDisk(file.buffer, fileName);
      }
    }

    // 2. Fallback para disco local
    return this.saveToLocalDisk(file.buffer, fileName);
  }

  private async saveToLocalDisk(buffer: Buffer, fileName: string): Promise<string> {
    try {
      const fullPath = path.join(this.localUploadDir, fileName);
      await fs.promises.writeFile(fullPath, buffer);
      return `/uploads/avatars/${fileName}`;
    } catch (err: any) {
      this.logger.error(`Erro ao salvar avatar em disco local: ${err?.message}`);
      throw new BadRequestException('Erro ao salvar imagem no servidor.');
    }
  }
}
