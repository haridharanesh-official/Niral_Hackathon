import {
  IsBoolean,
  IsIn,
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

  @IsString()
  @MinLength(50)
  @MaxLength(500)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  theme?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string;

  @IsOptional()
  @IsIn(['PUBLIC', 'PRIVATE'])
  visibility?: 'PUBLIC' | 'PRIVATE';

  @IsOptional()
  @IsIn(['OPEN', 'CLOSED'])
  recruitmentStatus?: 'OPEN' | 'CLOSED';

  @IsOptional()
  @IsString()
  eventId?: string;
}

export class JoinTeamDto {
  @IsString()
  @MinLength(6)
  inviteCode!: string;
}

export class RequestJoinDto {
  @IsString()
  teamId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  message?: string;
}

export class RespondJoinDto {
  @IsString()
  requestId!: string;

  @IsBoolean()
  accept!: boolean;
}

export class InviteMemberDto {
  @IsString()
  teamId!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(254)
  email!: string;
}
