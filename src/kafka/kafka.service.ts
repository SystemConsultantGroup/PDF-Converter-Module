import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, EachMessagePayload } from 'kafkajs';
import { PuppeteerService } from '../puppeteer/puppeteer.service';
import { MinioService } from '../minio/minio.service';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private consumer;
  private topic = process.env.TOPIC;

  constructor(
    private readonly puppeteerService: PuppeteerService,
    private readonly minioService: MinioService,
  ) {
    this.kafka = new Kafka({
      clientId: process.env.CONSUMER_GROUP,
      brokers: [process.env.KAFKA_CLIENT_BOOTSTRAP_SERVER],
    });
  }

  async onModuleInit() {
    this.consumer = this.kafka.consumer({ groupId: 'pdf-group' });
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: this.topic });

    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        const { topic, partition, message } = payload;
        const uuid = message.key.toString();
        const htmlContent = message.value.toString();
        try {
          const pdf = await this.puppeteerService.generatePDF(htmlContent);
          await this.minioService.uploadFile(uuid + '.pdf', Buffer.from(pdf));
          // 성공 시 커밋
          await this.consumer.commitOffsets([
            {
              topic,
              partition,
              offset: (BigInt(message.offset) + BigInt(1)).toString(),
            },
          ]);
        } catch (e) {
          console.log(e);
        }
      },
    });
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
  }
}
