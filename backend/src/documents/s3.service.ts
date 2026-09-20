import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';

@Injectable()
export class S3Service {
  private s3: AWS.S3;

  constructor(private readonly configService: ConfigService) {
    // Credentials always come from configuration. Set S3_ENDPOINT to use an S3-compatible
    // store such as MinIO; leave it empty for AWS S3.
    const endpoint = configService.get<string>('aws.endpoint');
    this.s3 = new AWS.S3({
      region: configService.get<string>('aws.region') || 'us-east-1',
      accessKeyId: configService.get<string>('aws.accessKey'),
      secretAccessKey: configService.get<string>('aws.secretKey'),
      ...(endpoint ? { endpoint, s3ForcePathStyle: true, signatureVersion: 'v4' } : {}),
    });
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
