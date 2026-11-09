import {
  Equals,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
export class PaymentOrderDto {
  @IsString() @MaxLength(80) enrollmentId!: string;
}
export class PaymentSettingsDto {
  @IsOptional() @IsIn(['MANUAL_UPI', 'FAMAPP_SANDBOX']) provider?: string;
  @IsIn(['FREE', 'PAID', 'DISABLED']) mode!: 'FREE' | 'PAID' | 'DISABLED';
  @IsInt() @Min(0) @Max(100000000) amountMinor!: number;
  @IsInt() @Min(0) @Max(100000000) taxAmountMinor!: number;
  @Equals('INR') currency!: string;
  @IsIn(['PARTICIPANT', 'TEAM']) feeScope!: string;
  @IsInt() @Min(0) expectedVersion!: number;
  @IsInt() @Min(0) expectedOldAmountMinor!: number;
  @IsBoolean() @Equals(true) confirmPublish!: boolean;
  @IsBoolean() feeApproved!: boolean;
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  paymentPolicyUrl?: string;
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  refundPolicyUrl?: string;
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  cancellationPolicyUrl?: string;
  @IsOptional() @IsString() @MaxLength(200) receiptIssuer?: string;
}
