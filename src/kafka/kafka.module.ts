import { Module } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { PuppeteerModule } from '../puppeteer/puppeteer.module';
import { MinioClientModule } from '../minio/minio-client.module';

@Module({
  imports: [PuppeteerModule, MinioClientModule],
  providers: [KafkaService],
  exports: [KafkaService],
})
export class KafkaModule {}
