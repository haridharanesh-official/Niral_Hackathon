import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import {
  DeliverableReviewStatus,
  IssueSeverity,
  IssueStatus,
  MilestoneStatus,
  RiskLevel,
  RiskStatus,
  SprintStatus,
} from '@prisma/client';

export class CreateSprintDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  goal?: string;

  @IsString()
  startDate!: string;

  @IsString()
  endDate!: string;

  @IsOptional()
  @IsString()
  sprintLeadId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacityHours?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  memberIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  plannedDeliverables?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  taskIds?: string[];
}

export class UpdateSprintDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  goal?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  sprintLeadId?: string | null;

  @IsOptional()
  @IsInt()
  capacityHours?: number;

  @IsOptional()
  @IsEnum(SprintStatus)
  status?: SprintStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  memberIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  plannedDeliverables?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  taskIds?: string[];
}

export class CreateMilestoneDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ownerIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  taskIds?: string[];
}

export class UpdateMilestoneDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  dueDate?: string | null;

  @IsOptional()
  @IsEnum(MilestoneStatus)
  status?: MilestoneStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  progress?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ownerIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  taskIds?: string[];
}

export class CreateDeliverableDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  format?: string;

  @IsOptional()
  @IsString()
  deadline?: string;

  @IsOptional()
  @IsString()
  milestoneId?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;
}

export class UpdateDeliverableDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  format?: string;

  @IsOptional()
  @IsString()
  deadline?: string | null;

  @IsOptional()
  @IsEnum(DeliverableReviewStatus)
  reviewStatus?: DeliverableReviewStatus;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsString()
  milestoneId?: string | null;
}

export class CreateDependencyDto {
  @IsString()
  taskId!: string;

  @IsString()
  dependsOnTaskId!: string;
}

export class CreateRiskDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(RiskLevel)
  probability?: RiskLevel;

  @IsOptional()
  @IsEnum(RiskLevel)
  impact?: RiskLevel;

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsString()
  mitigation?: string;
}

export class UpdateRiskDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(RiskLevel)
  probability?: RiskLevel;

  @IsOptional()
  @IsEnum(RiskLevel)
  impact?: RiskLevel;

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsString()
  mitigation?: string;

  @IsOptional()
  @IsEnum(RiskStatus)
  status?: RiskStatus;
}

export class CreateIssueDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(IssueSeverity)
  severity?: IssueSeverity;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsString()
  reproductionSteps?: string;

  @IsOptional()
  @IsString()
  linkedTaskId?: string;

  @IsOptional()
  @IsString()
  linkedMilestoneId?: string;
}

export class UpdateIssueDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(IssueSeverity)
  severity?: IssueSeverity;

  @IsOptional()
  @IsEnum(IssueStatus)
  status?: IssueStatus;

  @IsOptional()
  @IsString()
  assigneeId?: string | null;

  @IsOptional()
  @IsString()
  reproductionSteps?: string;

  @IsOptional()
  @IsString()
  resolutionNotes?: string;

  @IsOptional()
  @IsString()
  linkedTaskId?: string | null;

  @IsOptional()
  @IsString()
  linkedMilestoneId?: string | null;
}

export class SprintReviewDto {
  @IsOptional()
  @IsString()
  plannedWork?: string;

  @IsOptional()
  @IsString()
  completedWork?: string;

  @IsOptional()
  @IsString()
  incompleteWork?: string;

  @IsOptional()
  @IsString()
  blockers?: string;

  @IsOptional()
  @IsString()
  lessonsLearned?: string;

  @IsOptional()
  @IsString()
  actionItems?: string;
}

export class SprintRetrospectiveDto {
  @IsOptional()
  @IsString()
  wentWell?: string;

  @IsOptional()
  @IsString()
  couldImprove?: string;

  @IsOptional()
  @IsString()
  actionItems?: string;
}

export class AssignSprintTasksDto {
  @IsArray()
  @IsString({ each: true })
  taskIds!: string[];
}
