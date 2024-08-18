import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { Client } from 'minio';

@Injectable()
export class MinioService implements OnModuleInit {
  private minioClient: Client;

  onModuleInit() {
    this.minioClient = new Client({
      endPoint: process.env.MINIO_END_POINT,
      port: parseInt(process.env.MINIO_PORT),
      useSSL: true,
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_PRIVATE_KEY,
    });
  }

  async uploadPdf(
    bucketName: string,
    fileName: string,
    pdfBuffer: Buffer,
  ): Promise<void> {
    await this.minioClient.putObject(bucketName, fileName, pdfBuffer);
    console.log(`PDF uploaded to MinIO: ${bucketName}/${fileName}`);
  }

  async uploadFile(key: string, file: Buffer) {
    try {
      await this.minioClient.putObject('ice-grad-pdf', key, file);
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }
}
