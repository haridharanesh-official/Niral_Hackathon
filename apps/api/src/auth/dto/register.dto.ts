import { IsEmail, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

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
