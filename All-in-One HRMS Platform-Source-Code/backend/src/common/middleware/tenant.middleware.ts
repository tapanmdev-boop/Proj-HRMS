import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Get tenant from header or use default
    const tenantId = 
      req.headers['x-tenant-id'] as string || 
      this.configService.get('tenant.default');
    
    // Attach tenant to request for later use
    req['tenantId'] = tenantId;
    
    next();
  }
}
