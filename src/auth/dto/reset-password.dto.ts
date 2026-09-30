import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'd9b2d63d-a233-4f9e-bf73-b6d3a95444a1',
    description: 'Token de recuperação de senha enviado por e-mail',
  })
  @IsString()
  @IsNotEmpty({ message: 'O token é obrigatório' })
  token: string;

  @ApiProperty({
    example: 'novasenha123',
    description: 'Nova senha do usuário (mínimo de 6 caracteres)',
  })
  @IsString()
  @MinLength(6, { message: 'A nova senha deve ter no mínimo 6 caracteres' })
  @IsNotEmpty({ message: 'A nova senha é obrigatória' })
  newPassword: string;
}
