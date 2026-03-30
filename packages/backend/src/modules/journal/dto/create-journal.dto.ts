import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreateJournalDto {
  @IsOptional()
  @IsUUID()
  attendanceId?: string;

  @IsOptional()
  @IsString()
  className?: string;

  @IsOptional()
  @IsString()
  discipline?: string;

  @IsString()
  exploration!: string;

  @IsString()
  challenge!: string;

  @IsString()
  worked!: string;

  @IsString()
  takeaways!: string;

  @IsString()
  nextSession!: string;

  @IsOptional()
  @IsBoolean()
  isSharedWithCoach?: boolean;
}
