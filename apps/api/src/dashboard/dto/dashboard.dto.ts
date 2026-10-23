import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class NotificationsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;

  @IsOptional()
  @IsIn(['all', 'read', 'unread'])
  status?: 'all' | 'read' | 'unread' = 'all';
}

export class TaskUpdateDto {
  @IsString()
  id!: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsIn(['high', 'medium', 'low'])
  priority?: 'high' | 'medium' | 'low';

  @IsOptional()
  @IsString()
  due?: string;

  @IsOptional()
  @IsString()
  effort?: string;

  @IsOptional()
  @IsString()
  href?: string;

  @IsOptional()
  done?: boolean;
}

export class WidgetConfigDto {
  @IsOptional()
  hidden?: string[];

  @IsOptional()
  order?: string[];

  @IsOptional()
  @IsIn(['comfortable', 'compact'])
  density?: 'comfortable' | 'compact';
}
