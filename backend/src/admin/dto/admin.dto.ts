import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsString, Max, Min } from 'class-validator';

export class LockUserDto {
  @IsBoolean()
  locked!: boolean;
}

export class GrantCreditsDto {
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100000)
  credits!: number;

  @IsString()
  reason!: string;
}
