import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

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

  private async generateToken(userId: string, username: string, email: string) {
    const payload = { sub: userId, username, email };
    return this.jwtService.signAsync(payload);
  }
}
