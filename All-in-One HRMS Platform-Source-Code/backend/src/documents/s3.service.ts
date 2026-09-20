import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';

@Injectable()
export class S3Service {
  private s3: AWS.S3;

  constructor(private readonly configService: ConfigService) {
    const isLocal = configService.get('NODE_ENV') !== 'production';
    
    // If using MinIO locally
    if (isLocal) {
      this.s3 = new AWS.S3({
        accessKeyId: 'minioadmin',
        secretAccessKey: 'minioadmin',
        endpoint: 'http://localhost:9000',
        s3ForcePathStyle: true,
        signatureVersion: 'v4',
      });
    } else {
      // Production AWS S3
      this.s3 = new AWS.S3({
        region: configService.get('aws.region'),
        accessKeyId: configService.get('aws.accessKey'),
        secretAccessKey: configService.get('aws.secretKey'),
      });
    }
  }

  async uploadFile(
    file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
    key: string,
  ): Promise<AWS.S3.ManagedUpload.SendData> {
    const bucketName = this.configService.get('aws.bucket');
    return this.s3
      .upload({
        Bucket: bucketName,
        Body: file.buffer,
        Key: key,
        ContentType: file.mimetype,
        ACL: 'private',
      })
      .promise();
  }

  async getSignedUrl(key: string): Promise<string> {
    const bucketName = this.configService.get('aws.bucket');
    
    return this.s3.getSignedUrlPromise('getObject', {
      Bucket: bucketName,
      Key: key,
      Expires: 3600, // URL expires in 1 hour
    });
  }

  async deleteFile(key: string): Promise<AWS.S3.DeleteObjectOutput> {
    const bucketName = this.configService.get('aws.bucket');
    
    return this.s3
      .deleteObject({
        Bucket: bucketName,
        Key: key,
      })
      .promise();
  }
}
