import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'gabriel', description: 'Nome de usuário único' })
  @IsString()
  @IsNotEmpty({ message: 'O nome de usuário é obrigatório' })
  @MinLength(3, { message: 'O nome de usuário deve ter no mínimo 3 caracteres' })
  username: string;

  @ApiProperty({ example: 'gabriel@email.com', description: 'E-mail do usuário' })
  @IsEmail({}, { message: 'Forneça um e-mail válido' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório' })
  email: string;

  @ApiProperty({ example: '123456', description: 'Senha de acesso (mínimo 6 caracteres)' })
  @IsString()
  @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres' })
  password: string;

  @ApiProperty({ example: 'Gabriel Sousa', description: 'Nome de exibição público', required: false })
  @IsString()
  @IsOptional()
  displayName?: string;
}
