import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { Client } from 'minio';

@Injectable()
export class MinioService implements OnModuleInit {
  private minioClient: Client;
  private bucketName = process.env.MINIO_BUCKET_NAME;

  onModuleInit() {
    this.minioClient = new Client({
      endPoint: process.env.MINIO_END_POINT,
      port: parseInt(process.env.MINIO_PORT),
      useSSL: true,
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_PRIVATE_KEY,
    });
  }

  async uploadPdf(fileName: string, pdfBuffer: Buffer, headers): Promise<void> {
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
