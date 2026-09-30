import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    passwordResetToken: {
      create: vi.fn(),
      deleteMany: vi.fn(),
      findUnique: vi.fn(),
    },
  };

  const mockJwtService = {
    signAsync: vi.fn().mockResolvedValue('jwt-token-123'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prisma).toBeDefined();
  });

  describe('forgotPassword', () => {
    it('should generate reset token if email exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        email: 'teste@email.com',
      });
      mockPrismaService.passwordResetToken.deleteMany.mockResolvedValueOnce({ count: 0 });
      mockPrismaService.passwordResetToken.create.mockResolvedValueOnce({});

      const result = await service.forgotPassword({ email: 'teste@email.com' });
      expect(result.message).toBe('Token de recuperação gerado com sucesso.');
      expect(result.resetToken).toBeDefined();
    });

    it('should return safe message even if email does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);

      const result = await service.forgotPassword({ email: 'naoexiste@email.com' });
      expect(result.message).toContain('Se este e-mail estiver cadastrado');
    });
  });

  describe('resetPassword', () => {
    it('should throw BadRequestException if token is expired or not found', async () => {
      mockPrismaService.passwordResetToken.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.resetPassword({
          token: 'invalid-token',
          newPassword: 'nova_senha_123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reset password when token is valid', async () => {
      mockPrismaService.passwordResetToken.findUnique.mockResolvedValueOnce({
        id: 'token-1',
        token: 'valid-token',
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 60000),
      });
      mockPrismaService.user.update.mockResolvedValueOnce({});
      mockPrismaService.passwordResetToken.deleteMany.mockResolvedValueOnce({ count: 1 });

      const result = await service.resetPassword({
        token: 'valid-token',
        newPassword: 'novasenha123',
      });

      expect(result.message).toContain('Senha redefinida com sucesso');
    });
  });
});
