import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
const helmet = require('helmet');
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Get config service
  const configService = app.get(ConfigService);
  
  // Global prefix for all routes
  app.setGlobalPrefix('api');
  
  // CORS configuration
  app.enableCors();
  
  // Helmet for security headers
  app.use(helmet());
  
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  
  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('HRMS API')
    .setDescription('Human Resource Management System API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('employees', 'Employee management endpoints')
    .addTag('attendance', 'Attendance tracking endpoints')
    .addTag('leave', 'Leave management endpoints')
    .addTag('payroll', 'Payroll management endpoints')
    .addTag('documents', 'Document management endpoints')
    .addTag('notifications', 'Notification endpoints')
    .addTag('admin', 'Admin dashboard endpoints')
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  // Start the server
  const port = configService.get('PORT') || 3000;
  await app.listen(port);
  console.log(`Application is running on port ${port}`);
}
bootstrap();
