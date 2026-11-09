import { Transform, Type } from 'class-transformer';
import { IsDefined, ValidateNested } from 'class-validator';
import { StudentRegistrationDto } from './student-registration.dto';
import {
  IsEmail,
  IsBoolean,
  Equals,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class RegisterDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => StudentRegistrationDto)
  student!: StudentRegistrationDto;
  @IsBoolean()
  @Equals(true)
  accountPolicyAccepted!: boolean;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  college?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  department?: string;

  /** Serialized onboarding profile enrichment (JSON string). */
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  bio?: string;
}
