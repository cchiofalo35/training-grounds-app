import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsIn,
  IsOptional,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateGymDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsEmail()
  ownerEmail!: string;

  @IsIn(['starter', 'pro', 'enterprise'])
  plan!: string;

  @IsOptional()
  @IsString()
  @MaxLength(7)
  primaryColor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(7)
  secondaryColor?: string;

  @IsOptional()
  @IsString()
  headingFont?: string;

  @IsOptional()
  @IsString()
  bodyFont?: string;

  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;
}
