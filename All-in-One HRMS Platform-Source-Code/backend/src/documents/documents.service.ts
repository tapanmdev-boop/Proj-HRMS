import { Injectable } from '@nestjs/common';
import { S3Service } from './s3.service';

@Injectable()
export class DocumentsService {
  constructor(private readonly s3Service: S3Service) {}

  async uploadDocument(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    fileSize: number,
    employeeId: string,
    type: string,
    tenantId: string,
    key: string,
  ) {
    // Upload to S3/MinIO
    const result = await this.s3Service.uploadFile({
      buffer,
      originalname: fileName,
      mimetype: mimeType,
      size: fileSize,
    }, key);
    return {
      fileUrl: result.Location,
      key,
      employeeId,
      type,
      tenantId,
    };
  }
}
