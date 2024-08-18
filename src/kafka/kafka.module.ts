import { Module } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { PuppeteerModule } from '../puppeteer/puppeteer.module';
import { MinioModule } from '../minio/minio.module';

@Module({
  imports: [PuppeteerModule, MinioModule],
  providers: [KafkaService],
  exports: [KafkaService],
})
export class KafkaModule {}
