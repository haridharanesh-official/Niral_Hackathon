import {
  IsBoolean,
  IsDefined,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  IsArray,
  ArrayMaxSize,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
export class ApplicationDetailsDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  institution!: string;
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  department!: string;
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  degree!: string;
  @IsString() @MinLength(2) @MaxLength(40) yearOfStudy!: string;
  @IsString() @MinLength(8) @MaxLength(32) phone!: string;
  @IsOptional() @IsString() @MaxLength(80) studentId?: string;
  @IsArray()
  @ArrayMinSize(0)
  @ArrayMaxSize(12)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  interests!: string[];
  @IsArray()
  @ArrayMinSize(0)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  technologies!: string[];
  @IsOptional() @IsString() @MaxLength(1000) skills?: string;
}
export class EnrollEventDto {
  @IsOptional() @IsString() eventId?: string;
  @IsIn(['ONLINE', 'ONSITE', 'HYBRID']) mode!: 'ONLINE' | 'ONSITE' | 'HYBRID';
  @IsBoolean() rulesAccepted!: boolean;
  @IsBoolean() eligibilityConfirmed!: boolean;
  @IsBoolean() privacyAccepted!: boolean;
  @IsBoolean() codeOfConductAccepted!: boolean;
  @IsDefined()
  @ValidateNested()
  @Type(() => ApplicationDetailsDto)
  application!: ApplicationDetailsDto;
}

export class EnrollmentStatusDto {
  @IsIn(['PENDING', 'CONFIRMED', 'WAITLISTED', 'REJECTED', 'WITHDRAWN'])
  status!: 'PENDING' | 'CONFIRMED' | 'WAITLISTED' | 'REJECTED' | 'WITHDRAWN';
}
