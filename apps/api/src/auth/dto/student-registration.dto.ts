import {
  ArrayMaxSize,
  Equals,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
export class StudentRegistrationDto {
  @IsString() @MinLength(2) @MaxLength(39) firstName!: string;
  @IsString() @MinLength(2) @MaxLength(40) lastName!: string;
  @IsString() @MinLength(2) @MaxLength(80) displayName!: string;
  @IsString() @Matches(/^(?=(?:\D*\d){8,15}\D*$)\+?[\d ()-]+$/) phone!: string;
  @IsString() @MinLength(2) @MaxLength(120) institution!: string;
  @IsString() @MinLength(2) @MaxLength(120) department!: string;
  @IsIn([
    'B.E. / B.Tech',
    'B.Sc.',
    'BCA',
    'M.E. / M.Tech',
    'M.Sc.',
    'MCA',
    'Other eligible program',
  ])
  degree!: string;
  @IsIn([
    'First year',
    'Second year',
    'Third year',
    'Fourth year',
    'Fifth year / Other',
  ])
  yearOfStudy!: string;
  @IsOptional() @IsString() @MaxLength(80) studentId?: string;
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  skills!: string[];
  @IsOptional() @IsString() @MaxLength(80) experience?: string;
  @IsOptional() @IsString() @MaxLength(80) track?: string;
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Matches(/^$|^https:\/\/github\.com\/[a-zA-Z0-9-]+\/?$/)
  github?: string;
  @IsBoolean() @Equals(true) rulesAccepted!: boolean;
  @IsBoolean() @Equals(true) privacyAccepted!: boolean;
  @IsBoolean() @Equals(true) codeOfConductAccepted!: boolean;
  @IsBoolean() @Equals(true) eligibilityConfirmed!: boolean;
}
