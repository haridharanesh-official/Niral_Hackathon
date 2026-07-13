import { IsString, Length } from 'class-validator';

export class Enable2FaDto {
  @IsString()
  @Length(6, 6)
  code!: string;
}

export class Disable2FaDto {
  @IsString()
  @Length(6, 6)
  code!: string;
}
