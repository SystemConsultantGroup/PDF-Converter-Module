import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka } from 'kafkajs';
import { PuppeteerService } from '../puppeteer/puppeteer.service';
import { MinioService } from '../minio/minio.service';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private consumer;
  private topic = 'pdf-topic';

  constructor(
    private readonly puppeteerService: PuppeteerService,
    private readonly minioService: MinioService,
  ) {
    this.kafka = new Kafka({
      clientId: 'pdf-service',
      brokers: ['localhost:9092'],
    }); 
  }

  async onModuleInit() {
    this.consumer = this.kafka.consumer({ groupId: 'pdf-group' });
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: this.topic });

    await this.consumer.run({
      eachMessage: async ({ message }) => {
        const uuid = message.key.toString();
        const htmlContent = message.value.toString();
        const pdf = await this.puppeteerService.generatePDF(htmlContent);
        
      },
    });
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
  }
}