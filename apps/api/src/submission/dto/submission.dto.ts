import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ComplianceDeclaration, DeliverableCategory } from '@hackos/shared';

export class UpdateSubmissionDetailsDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  executiveSummary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  problemStatement?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  objectives?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  innovationSummary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  solutionSummary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  expectedImpact?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  technologies?: string[];

  @IsOptional()
  @IsUrl()
  githubUrl?: string;

  @IsOptional()
  @IsUrl()
  demoUrl?: string;

  @IsOptional()
  @IsUrl()
  slidesUrl?: string;

  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsUrl()
  teamPhotoUrl?: string;

  @IsOptional()
  @IsString()
  repositoryType?: string;
}

export class AddDeliverableDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @IsUrl()
  url!: string;

  @IsString()
  mimeType!: string;

  @IsInt()
  @Min(0)
  size!: number;

  @IsEnum(DeliverableCategory)
  category!: DeliverableCategory;

  @IsOptional()
  @IsString()
  requirementKey?: string;
}

export class UpdateDeliverableDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  size?: number;

  @IsOptional()
  @IsEnum(DeliverableCategory)
  category?: DeliverableCategory;

  @IsOptional()
  @IsString()
  requirementKey?: string;
}

export class AcceptComplianceDto {
  @IsEnum(ComplianceDeclaration)
  declaration!: ComplianceDeclaration;

  @IsBoolean()
  accepted!: boolean;
}

export class CreateVersionDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  changeSummary?: string;
}

export class SubmitProjectDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  changeSummary?: string;

  @IsBoolean()
  confirm!: boolean;
}
