import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: '123456', description: 'Senha atual do usuário' })
  @IsString()
  @IsNotEmpty({ message: 'A senha atual é obrigatória' })
  oldPassword: string;

  @ApiProperty({ example: 'nova_senha_123', description: 'Nova senha (mínimo de 6 caracteres)' })
  @IsString()
  @MinLength(6, { message: 'A nova senha deve ter no mínimo 6 caracteres' })
  @IsNotEmpty({ message: 'A nova senha é obrigatória' })
  newPassword: string;
}
