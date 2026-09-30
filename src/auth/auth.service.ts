import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: dto.username.toLowerCase().trim() },
          { email: dto.email.toLowerCase().trim() },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.username === dto.username.toLowerCase().trim()) {
        throw new ConflictException('Este nome de usuário já está em uso.');
      }
      throw new ConflictException('Este e-mail já está cadastrado.');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    const user = await this.prisma.user.create({
      data: {
        username: dto.username.toLowerCase().trim(),
        email: dto.email.toLowerCase().trim(),
        passwordHash,
        displayName: dto.displayName?.trim() || dto.username.trim(),
      },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        isPublic: true,
        createdAt: true,
      },
    });

    const token = await this.generateToken(user.id, user.username, user.email);

    return {
      message: 'Usuário cadastrado com sucesso!',
      user,
      accessToken: token,
    };
  }

  async login(dto: LoginDto) {
    const loginQuery = dto.login.toLowerCase().trim();

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: loginQuery }, { email: loginQuery }],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas (usuário ou senha incorretos).');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas (usuário ou senha incorretos).');
    }

    const token = await this.generateToken(user.id, user.username, user.email);

    return {
      message: 'Login realizado com sucesso!',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        isPublic: user.isPublic,
      },
      accessToken: token,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (!user) {
      // Retorno genérico para segurança (evitar enumeração de e-mails)
      return {
        message: 'Se este e-mail estiver cadastrado, as instruções para redefinição foram enviadas.',
      };
    }

    // Remove tokens anteriores deste usuário
    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hora de validade

    await this.prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      message: 'Token de recuperação gerado com sucesso.',
      resetToken: token,
      expiresAt,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const resetRecord = await this.prisma.passwordResetToken.findUnique({
      where: { token: dto.token },
    });

    if (!resetRecord || resetRecord.expiresAt < new Date()) {
      throw new BadRequestException('Token de recuperação inválido ou expirado.');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.newPassword, saltRounds);

    await this.prisma.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash },
    });

    // Remove o token utilizado
    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: resetRecord.userId },
    });

    return {
      message: 'Senha redefinida com sucesso! Você já pode fazer login com a sua nova senha.',
    };
  }

  private async generateToken(userId: string, username: string, email: string) {
    const payload = { sub: userId, username, email };
    return this.jwtService.signAsync(payload);
  }
}
