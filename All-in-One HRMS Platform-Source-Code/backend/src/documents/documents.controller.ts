import { Controller, Get } from '@nestjs/common';

@Controller('documents')
export class DocumentsController {
  @Get()
  getAll() {
    // Return all documents here
    return [];
  }
}
