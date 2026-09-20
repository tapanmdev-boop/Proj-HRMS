import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const isProduction = config.get<string>('env') === 'production';

  app.setGlobalPrefix('api');
  app.enableShutdownHooks();

  // Only the configured browser origins may call the API. Empty list = no cross-origin access.
  app.enableCors({
    origin: config.get<string[]>('corsOrigins'),
    credentials: true,
  });

  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // API docs are a development aid; never expose them in production.
  if (!isProduction) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('HRMS API')
        .setDescription('Human Resource Management System API')
        .setVersion('1.0')
        .addBearerAuth()
        .build(),
    );
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = config.get<number>('port');
  await app.listen(port);
  new Logger('Bootstrap').log(`Application is running on port ${port}`);
}
bootstrap();
