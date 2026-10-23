import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { DocumentCategory, DocumentStatus } from '@prisma/client';

export class CreateWhiteboardDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  templateId?: string;
}

export class UpdateWhiteboardDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsNumber()
  zoom?: number;

  @IsOptional()
  @IsBoolean()
  gridMode?: boolean;

  @IsOptional()
  @IsBoolean()
  snapToGrid?: boolean;

  @IsOptional()
  @IsNumber()
  pageIndex?: number;
}

export class CreateWhiteboardObjectDto {
  @IsString()
  objectType!: string;

  @IsOptional()
  @IsNumber()
  positionX?: number;

  @IsOptional()
  @IsNumber()
  positionY?: number;

  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsNumber()
  rotation?: number;

  @IsOptional()
  @IsNumber()
  layer?: number;

  @IsOptional()
  properties?: Record<string, unknown>;
}

export class UpdateWhiteboardObjectDto {
  @IsOptional()
  @IsNumber()
  positionX?: number;

  @IsOptional()
  @IsNumber()
  positionY?: number;

  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsNumber()
  rotation?: number;

  @IsOptional()
  @IsNumber()
  layer?: number;

  @IsOptional()
  properties?: Record<string, unknown>;
}

export class CreateDocumentDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsEnum(DocumentCategory)
  category?: DocumentCategory;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  templateId?: string;
}

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(DocumentCategory)
  category?: DocumentCategory;

  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;

  @IsOptional()
  @IsString()
  content?: string;
}

export class CreateDocumentLinkDto {
  @IsString()
  targetType!: string;

  @IsString()
  targetId!: string;

  @IsOptional()
  @IsString()
  label?: string;
}

export class TimelineQueryDto {
  @IsOptional()
  @IsString()
  eventType?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;
}

export class AiWhiteboardPromptDto {
  @IsString()
  @MinLength(1)
  prompt!: string;
}

export class ConvertStickyDto {
  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];
}
