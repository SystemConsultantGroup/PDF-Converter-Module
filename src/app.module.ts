import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MinioClientModule } from './minio/minio-client.module';
import { KafkaModule } from './kafka/kafka.module';
import { PuppeteerModule } from './puppeteer/puppeteer.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      ...(process.env.APP_ENV !== 'production' && { envFilePath: '.env' }),
    }),
    MinioClientModule,
    KafkaModule,
    PuppeteerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
