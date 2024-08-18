import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  BadGatewayException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Kafka, EachMessagePayload, Consumer } from 'kafkajs';
import { PuppeteerService } from '../puppeteer/puppeteer.service';
import { MinioService } from '../minio/minio.service';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private consumer: Consumer;
  private topic = process.env.TOPIC;

  constructor(
    private readonly puppeteerService: PuppeteerService,
    private readonly minioService: MinioService,
  ) {
    this.kafka = new Kafka({
      clientId: `${process.env.CONSUMER_GROUP}+${process.pid}`,
      brokers: [process.env.KAFKA_CLIENT_BOOTSTRAP_SERVER],
    });
  }

  async onModuleInit() {
    this.consumer = this.kafka.consumer({
      groupId: process.env.CONSUMER_GROUP,
    });
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: this.topic, fromBeginning: false });

    await this.consumer
      .run({
        autoCommit: false,
        eachMessage: async (payload: EachMessagePayload) => {
          const { topic, partition, message } = payload;
          console.info(
            `partition: ${partition}, messageOffset: ${message.offset}`,
          );
          const uuid = message.key.toString();
          const htmlContent = message.value.toString();
          try {
            const pdf = await this.puppeteerService.generatePDF(htmlContent);
            await this.minioService.uploadPdf(
              uuid,
              Buffer.from(pdf),
              message.headers,
            );
            // 성공 시 커밋
            // throw new BadGatewayException('일부러 에러 발생');
            await this.consumer.commitOffsets([
              {
                topic,
                partition,
                offset: (BigInt(message.offset) + BigInt(1)).toString(),
              },
            ]);
          } catch (e) {
            throw new InternalServerErrorException(`[consumer] ${e.message}`);
          }
        },
      })
      .catch((e) => console.error(`[example/consumer] ${e.message}`, e));
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
  }
}
