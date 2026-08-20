import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @Length(2, 100)
  @IsOptional()
  full_name?: string;

  @IsString()
  @Length(1, 100)
  @IsOptional()
  display_name?: string;

  @IsString()
  @Length(0, 30)
  @IsOptional()
  phone?: string;

  @IsString()
  @Length(2, 10)
  @IsOptional()
  language?: string;
}

export class NotificationSettingsDto {
  @IsBoolean()
  video_completed!: boolean;
  @IsBoolean()
  video_failed!: boolean;
  @IsBoolean()
  low_credit!: boolean;
  @IsBoolean()
  product_updates!: boolean;
}

export class UpdateSettingsDto {
  @IsObject()
  @ValidateNested()
  @Type(() => NotificationSettingsDto)
  notifications!: NotificationSettingsDto;

  @IsInt()
  @Min(0)
  @Max(10000)
  low_credit_threshold!: number;
}

export class DeleteAccountDto {
  @IsString()
  password!: string;
}
