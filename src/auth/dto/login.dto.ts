import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @ApiPropertyOptional({ example: 'gabriel', description: 'Username ou e-mail cadastrado' })
  @IsOptional()
  @IsString()
  login?: string;

  @ApiPropertyOptional({ example: 'gabriel@email.com', description: 'E-mail ou username (alias para login)' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ example: '123456', description: 'Senha de acesso' })
  @IsString()
  @IsNotEmpty({ message: 'Informe sua senha' })
  password: string;
}
