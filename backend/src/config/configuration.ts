const toInt = (value: string | undefined, fallback: number) => {
  const parsed = parseInt(value ?? '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export default () => ({
  env: process.env.NODE_ENV || 'development',
  port: toInt(process.env.PORT, 3001),
  // Self-service organization sign-up: on by default outside production, opt-in in production.
  signupEnabled: process.env.ALLOW_SIGNUP ? process.env.ALLOW_SIGNUP === "true" : process.env.NODE_ENV !== "production",
  corsOrigins: (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expirationTime: toInt(process.env.JWT_EXPIRATION_TIME, 3600),
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: toInt(process.env.REDIS_PORT, 6379),
  },
  aws: {
    region: process.env.AWS_REGION,
    accessKey: process.env.AWS_ACCESS_KEY_ID,
    secretKey: process.env.AWS_SECRET_ACCESS_KEY,
    bucket: process.env.AWS_S3_BUCKET,
    endpoint: process.env.S3_ENDPOINT,
  },
  email: {
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    from: process.env.EMAIL_FROM,
  },
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: process.env.GOOGLE_CALLBACK_URL,
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      callbackUrl: process.env.MICROSOFT_CALLBACK_URL,
    },
  },
  tenant: {
    // Slug (Tenant.name) used when a login request does not name an organization.
    default: process.env.DEFAULT_TENANT || undefined,
  },
  throttle: {
    ttl: toInt(process.env.THROTTLE_TTL, 60000), // milliseconds (throttler v5)
    limit: toInt(process.env.THROTTLE_LIMIT, 100),
  },
});
