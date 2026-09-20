import * as Joi from 'joi';

/** Fails application start-up when required configuration is missing or unsafe. */
export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().default(3001),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required().messages({
    'string.min': 'JWT_SECRET must be at least 32 characters (generate one with: openssl rand -base64 48)',
    'any.required': 'JWT_SECRET is required',
  }),
  JWT_EXPIRATION_TIME: Joi.number().integer().min(60).default(900),
  REFRESH_TOKEN_TTL_DAYS: Joi.number().integer().min(1).max(90).default(7),
  ALLOW_SIGNUP: Joi.boolean().optional(),
  CORS_ORIGINS: Joi.string().allow('').default(''),
  DEFAULT_TENANT: Joi.string().allow('').optional(),
  THROTTLE_TTL: Joi.number().integer().min(1).default(60000),
  THROTTLE_LIMIT: Joi.number().integer().min(1).default(100),
}).unknown(true);
