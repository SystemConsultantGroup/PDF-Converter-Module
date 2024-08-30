import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MinioService } from 'nestjs-minio-client';

@Injectable()
export class MinioClientService {
  private readonly minioClient;
  private readonly bucketName;

  constructor(
    private readonly configService: ConfigService,
    private readonly minioService: MinioService,
  ) {
    this.minioClient = this.minioService.client;
    this.bucketName = this.configService.get('MINIO_BUCKET_NAME');
  }

  async uploadPdf(fileName, pdfBuffer: Buffer, headers): Promise<void> {
    const metaData = {
      'Content-Type': 'application/pdf',
      createdAt: new Date().toUTCString(),
      originalName: encodeURI(headers.originalName),
    };
    try {
      await this.minioClient.putObject(
        this.bucketName,
        fileName,
        pdfBuffer,
        Buffer.byteLength(pdfBuffer),
        metaData,
      );
      console.log(`PDF uploaded to MinIO: ${this.bucketName}/${fileName}`);
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }
}
