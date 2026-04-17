import { IsString, IsOptional, IsUrl, MaxLength, IsBoolean } from 'class-validator';

export class UpdateGymDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

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
  @MaxLength(7)
  surfaceColor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(7)
  textPrimary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(7)
  textMuted?: string;

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

  @IsOptional()
  @IsBoolean()
  streakFreezeEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  referralProgramEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  communityEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
