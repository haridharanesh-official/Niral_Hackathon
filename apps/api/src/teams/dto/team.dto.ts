import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateTeamDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  description?: string;
}

export class JoinTeamDto {
  @IsString()
  @MinLength(6)
  inviteCode!: string;
}
