import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'gabriel', description: 'Username ou e-mail cadastrado' })
  @IsString()
  @IsNotEmpty({ message: 'Informe seu username ou e-mail' })
  login: string;

  @ApiProperty({ example: '123456', description: 'Senha de acesso' })
  @IsString()
  @IsNotEmpty({ message: 'Informe sua senha' })
  password: string;
}
