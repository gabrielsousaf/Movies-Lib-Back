import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateReviewDto {
  @ApiProperty({ example: 9.0, description: 'Nova nota de 0.5 a 10', required: false })
  @IsNumber()
  @Min(0.5, { message: 'A nota mínima permitida é 0.5' })
  @Max(10, { message: 'A nota máxima permitida é 10' })
  @IsOptional()
  rating?: number;

  @ApiProperty({
    example: 'Revendo depois de anos, continua uma obra prima!',
    description: 'Novo comentário',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000, { message: 'O comentário pode ter no máximo 2000 caracteres' })
  content?: string;
}
