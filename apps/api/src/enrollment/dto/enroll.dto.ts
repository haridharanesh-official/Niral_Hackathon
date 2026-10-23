import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

export class EnrollEventDto {
  @IsOptional()
  @IsString()
  eventId?: string;

  @IsIn(['ONLINE', 'ONSITE', 'HYBRID'])
  mode!: 'ONLINE' | 'ONSITE' | 'HYBRID';

  @IsBoolean()
  rulesAccepted!: boolean;

  @IsBoolean()
  eligibilityConfirmed!: boolean;
}
