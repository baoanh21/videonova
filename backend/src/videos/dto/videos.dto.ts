import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { VideoStatus } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CreateVideoDto {
  @IsString()
  @Length(1, 500)
  prompt!: string;

  @IsString()
  @Length(1, 80)
  @IsOptional()
  model = 'local-ffmpeg';

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(60)
  duration!: number;

  @IsIn(['16:9', '9:16', '1:1', '4:3', '3:4'])
  aspect_ratio!: string;

  @IsString()
  @Length(1, 50)
  @IsOptional()
  style = 'cinematic';

  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  @IsOptional()
  enhance_quality = false;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(12)
  @Max(60)
  @IsOptional()
  fps = 30;
}

export class VideoQueryDto extends PaginationDto {
  @IsEnum(VideoStatus)
  @IsOptional()
  status?: VideoStatus;

  @IsIn(['created_at', 'progress', 'duration'])
  @IsOptional()
  sort = 'created_at';
}
