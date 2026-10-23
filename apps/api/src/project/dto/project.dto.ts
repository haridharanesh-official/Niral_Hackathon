import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { KanbanStatus, TaskPriority, TaskType } from '@prisma/client';

export class CreateTaskDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(KanbanStatus)
  status?: KanbanStatus;

  @IsOptional()
  @IsEnum(TaskType)
  type?: TaskType;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsString()
  reviewerId?: string;

  @IsOptional()
  @IsString()
  sprint?: string;

  @IsOptional()
  @IsString()
  milestone?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  acceptanceCriteria?: string;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  estimatedEffort?: string;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(KanbanStatus)
  status?: KanbanStatus;

  @IsOptional()
  @IsEnum(TaskType)
  type?: TaskType;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsString()
  assigneeId?: string | null;

  @IsOptional()
  @IsString()
  reviewerId?: string | null;

  @IsOptional()
  @IsString()
  sprint?: string;

  @IsOptional()
  @IsString()
  milestone?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  acceptanceCriteria?: string;

  @IsOptional()
  @IsString()
  dueDate?: string | null;

  @IsOptional()
  @IsString()
  estimatedEffort?: string;

  @IsOptional()
  @IsString()
  actualEffort?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progress?: number;
}

export class MoveTaskDto {
  @IsEnum(KanbanStatus)
  status!: KanbanStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @IsOptional()
  @IsBoolean()
  forceComplete?: boolean;
}

export class TaskQueryDto {
  @IsOptional()
  @IsEnum(KanbanStatus)
  status?: KanbanStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsEnum(TaskType)
  type?: TaskType;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsString()
  sprint?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export class CreateCommentDto {
  @IsString()
  @MinLength(1)
  body!: string;
}

export class CreateChecklistItemDto {
  @IsString()
  @MinLength(1)
  title!: string;
}

export class UpdateChecklistItemDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}

export class CreateAttachmentDto {
  @IsString()
  @MinLength(1)
  fileName!: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsInt()
  sizeBytes?: number;
}
