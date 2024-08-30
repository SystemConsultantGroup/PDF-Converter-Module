import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  InternalServerErrorException,
} from '@nestjs/common';
import { Kafka, EachMessagePayload, Consumer } from 'kafkajs';
import { PuppeteerService } from '../puppeteer/puppeteer.service';
import { MinioClientService } from '../minio/minio-client.service';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private consumer: Consumer;
  private topic = process.env.TOPIC;

  constructor(
    private readonly puppeteerService: PuppeteerService,
    private readonly minioService: MinioClientService,
  ) {
    this.kafka = new Kafka({
      clientId: `${process.env.CONSUMER_GROUP}+${process.pid}`,
      brokers: ['kafka.kafka.svc.cluster.local:9092'],
      sasl: {
        mechanism: 'scram-sha-256',
        username: process.env.SASL_USER,
        password: process.env.SASL_PASSWORD,
      },
    });

    this.consumer = this.kafka.consumer({
      groupId: process.env.CONSUMER_GROUP,
    });
  }

  async onModuleInit() {
    await this.consumer.connect();
    console.log('connected');
    await this.consumer.subscribe({ topic: this.topic, fromBeginning: true });
    console.log('subsribed');
    await this.consumer
      .run({
        autoCommit: false,
        eachMessage: async (payload: EachMessagePayload) => {
          const { topic, partition, message } = payload;
          console.info(
            `partition: ${partition}, messageOffset: ${message.offset}`,
          );
          const htmlContent = message.value.toString();
          const pdf = await this.puppeteerService.generatePDF(htmlContent);
          await this.minioService.uploadPdf(
            message.headers.uuid,
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
        },
      })
      .catch((e) => console.error(`[example/consumer] ${e.message}`, e));
    console.log('consumer has started');
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
  }
}
