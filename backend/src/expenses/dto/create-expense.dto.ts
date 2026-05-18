import { IsString, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateExpenseDto {
  @IsString()
  commerce: string;

  @IsNumber()
  @Type(() => Number)
  amount: number;

  @IsString()
  date: string;

  @IsString()
  category: string;

  @IsString()
  @IsOptional()
  description?: string;
}
