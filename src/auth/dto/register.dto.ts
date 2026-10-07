import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, Matches } from 'class-validator';

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

  @ApiProperty({ example: 'Senha@123', description: 'Senha forte (mínimo 8 caracteres, maiúscula, minúscula, número e símbolo)' })
  @IsString()
  @MinLength(8, { message: 'A senha deve ter pelo menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: 'A senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais',
  })
  password: string;

  @ApiProperty({ example: 'Gabriel Sousa', description: 'Nome de exibição público', required: false })
  @IsString()
  @IsOptional()
  displayName?: string;
}
