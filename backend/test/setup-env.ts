// Loads backend/.env (DATABASE_URL, Redis) and pins test-only settings.
// e2e tests write to the database in DATABASE_URL: point it at a disposable database.
import 'dotenv/config';

process.env.NODE_ENV = 'test';
process.env.ALLOW_SIGNUP = 'true';
process.env.JWT_SECRET = process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32 ? process.env.JWT_SECRET : 'e2e-only-secret-that-is-at-least-32-characters-long';
process.env.THROTTLE_LIMIT = '1000';
process.env.AUTH_THROTTLE_LIMIT = "1000";
