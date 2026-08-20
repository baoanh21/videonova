import Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(8000),
  DATABASE_URL: Joi.string().required(),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_TTL: Joi.string().default('15m'),
  JWT_REFRESH_TTL_DAYS: Joi.number().integer().min(1).max(365).default(30),
  CORS_ORIGINS: Joi.string().default('http://localhost:5173'),
  STORAGE_ROOT: Joi.string().default('./storage'),
  FFMPEG_PATH: Joi.string().default('ffmpeg'),
  MAX_IMAGE_SIZE_MB: Joi.number().positive().max(50).default(10),
  MAX_IMAGES_PER_VIDEO: Joi.number().integer().min(1).max(50).default(10),
  VIDEO_CREDIT_COST: Joi.number().integer().min(0).default(1),
  LOG_LEVEL: Joi.string().default('info'),
});
