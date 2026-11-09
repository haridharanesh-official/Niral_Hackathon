import {
  Equals,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
export class UpiOrderDto {
  @IsString() @MaxLength(80) enrollmentId!: string;
}
export class UpiClaimDto {
  @IsString() @Matches(/^\d{12}$/) utr!: string;
}
export class UpiDecisionDto {
  @IsIn(['VERIFY', 'REJECT']) decision!: 'VERIFY' | 'REJECT';
  @IsString() @MinLength(10) @MaxLength(500) reason!: string;
}
export class UpiCreditVerificationDto extends UpiDecisionDto {
  @Equals('RECEIVING_ACCOUNT_STATEMENT') evidenceType!: string;
  @IsString() @MinLength(6) @MaxLength(150) evidenceReference!: string;
  @IsString() @Matches(/^\d{12}$/) utr!: string;
  @IsString() @MaxLength(200) beneficiary!: string;
  @IsInt() @Min(1) amountMinor!: number;
  @IsDateString() creditedAt!: string;
  @IsBoolean() @Equals(true) independentlyChecked!: boolean;
}
export class UpiRefundRequestDto {
  @IsString() @MinLength(10) @MaxLength(500) reason!: string;
  @IsBoolean() @Equals(true) confirm!: boolean;
}
export class UpiRefundCompleteDto extends UpiRefundRequestDto {
  @IsString() @MinLength(6) @MaxLength(150) evidenceReference!: string;
  @IsInt() @Min(1) amountMinor!: number;
  @IsString() @Matches(/^\d{12}$/) utr!: string;
  @IsDateString() completedAt!: string;
  @Equals('DEBIT') direction!: string;
  @IsBoolean() @Equals(true) independentlyChecked!: boolean;
}
export class GmailCompleteDto {
  @IsString() @MaxLength(2000) code!: string;
  @IsString() @Matches(/^[a-f0-9]{64}$/) state!: string;
}
export class UtrSearchDto {
  @IsString() @Matches(/^\d{12}$/) utr!: string;
}
export class UpiExportDto {
  @IsIn(['AUDIT', 'PAYMENTS']) kind!: 'AUDIT' | 'PAYMENTS';
  @IsOptional() @IsString() @MaxLength(80) cursor?: string;
  @IsOptional() @IsDateString() cutoff?: string;
}
