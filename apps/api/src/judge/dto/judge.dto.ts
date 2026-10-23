import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { JudgeAssignmentStatus, JudgeBookmarkLabel } from '@hackos/shared';

export class SaveEvaluationDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  innovation?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  technical?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  presentation?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  scalability?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  impact?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  ui?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  business?: number;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  comments?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sectionsCompleted?: string[];
}

export class SubmitEvaluationDto {
  @IsBoolean()
  confirm!: boolean;
}

export class UpdateNoteDto {
  @IsString()
  @MaxLength(50000)
  content!: string;
}

export class ToggleBookmarkDto {
  @IsEnum(JudgeBookmarkLabel)
  label!: JudgeBookmarkLabel;
}

export class CreateAssignmentDto {
  @IsString()
  judgeId!: string;

  @IsString()
  submissionId!: string;

  @IsOptional()
  @IsString()
  eventId?: string;

  @IsOptional()
  @IsString()
  round?: string;

  @IsOptional()
  @IsString()
  timeSlot?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;
}

export class ListAssignmentsQueryDto {
  @IsOptional()
  @IsEnum(JudgeAssignmentStatus)
  status?: JudgeAssignmentStatus;

  @IsOptional()
  @IsString()
  sort?: 'time' | 'theme' | 'priority' | 'status' | 'team';
}
