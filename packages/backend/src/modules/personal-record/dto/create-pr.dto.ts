import {
  IsString,
  IsNumber,
  IsIn,
  IsOptional,
  IsBoolean,
  IsUrl,
  MaxLength,
  Min,
  IsDateString,
} from 'class-validator';
import type { PrCategory, PrValueUnit } from '../../../entities/personal-record.entity';

export class CreatePrDto {
  @IsIn(['lift', 'benchmark_wod', 'gymnastics'])
  category!: PrCategory;

  @IsString()
  @MaxLength(100)
  movementName!: string;

  @IsNumber()
  @Min(0)
  valueNumeric!: number;

  @IsIn(['kg', 'lbs', 'seconds', 'reps'])
  valueUnit!: PrValueUnit;

  @IsOptional()
  @IsBoolean()
  isBodyweight?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bodyweightAtLog?: number;

  @IsOptional()
  @IsDateString()
  loggedAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsUrl()
  videoUrl?: string;
}

export class UpdatePrDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsUrl()
  videoUrl?: string;

  @IsOptional()
  @IsBoolean()
  verified?: boolean;
}
