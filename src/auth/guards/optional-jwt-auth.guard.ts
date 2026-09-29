import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(err: any, user: any): TUser {
    // Se não houver token ou o token for inválido, não lança UnauthorizedException, retorna null
    if (err || !user) {
      return null as unknown as TUser;
    }
    return user;
  }
}
