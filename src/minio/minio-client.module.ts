import { Global, Module } from '@nestjs/common';
import { MinioService } from './minio.service';
import { MinioModule } from 'nestjs-minio-client';
import { ConfigModule, ConfigService } from '@nestjs/config';
@Global()
@Module({
  imports: [
    MinioModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        endPoint: configService.get('MINIO_END_POINT'),
        port: parseInt(configService.get('MINIO_PORT')),
        useSSL: true,
        accessKey: configService.get('MINIO_ACCESS_KEY'),
        secretKey: configService.get('MINIO_SECRET_KEY'),
      }),
    }),
  ],
  providers: [MinioService],
  exports: [MinioService],
})
export class MinioClientModule {}
