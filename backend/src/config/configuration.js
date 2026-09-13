"use strict";
exports.__esModule = true;
exports["default"] = (function () { return ({
    port: parseInt(process.env.PORT, 10) || 3000,
    database: {
        url: process.env.DATABASE_URL
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        expirationTime: parseInt(process.env.JWT_EXPIRATION_TIME, 10) || 86400
    },
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379
    },
    aws: {
        region: process.env.AWS_REGION,
        accessKey: process.env.AWS_ACCESS_KEY_ID,
        secretKey: process.env.AWS_SECRET_ACCESS_KEY,
        bucket: process.env.AWS_S3_BUCKET
    },
    email: {
        sendgridApiKey: process.env.SENDGRID_API_KEY,
        from: process.env.EMAIL_FROM
    },
    oauth: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackUrl: process.env.GOOGLE_CALLBACK_URL
        },
        microsoft: {
            clientId: process.env.MICROSOFT_CLIENT_ID,
            clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
            callbackUrl: process.env.MICROSOFT_CALLBACK_URL
        }
    },
    tenant: {
        "default": process.env.DEFAULT_TENANT || 'default'
    },
    throttle: {
        ttl: parseInt(process.env.THROTTLE_TTL, 10) || 60,
        limit: parseInt(process.env.THROTTLE_LIMIT, 10) || 10
    }
}); });
