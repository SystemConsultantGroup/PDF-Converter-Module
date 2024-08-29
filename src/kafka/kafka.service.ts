import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
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
      brokers: [
        'kafka-controller-0.kafka-controller-headless.kafka.svc.cluster.local:9092',
        'kafka-controller-1.kafka-controller-headless.kafka.svc.cluster.local:9092',
        'kafka-controller-2.kafka-controller-headless.kafka.svc.cluster.local:9092',
      ],
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
    await this.consumer.subscribe({ topic: this.topic, fromBeginning: false });
    console.log('subsribed');
    // await this.consumer
    //   .run({
    //     autoCommit: false,
    //     eachMessage: async (payload: EachMessagePayload) => {
    //       const { topic, partition, message } = payload;
    //       console.info(
    //         `partition: ${partition}, messageOffset: ${message.offset}`,
    //       );
    //       const uuid = message.key.toString();
    //       const htmlContent = message.value.toString();
    //       try {
    //         const pdf = await this.puppeteerService.generatePDF(htmlContent);
    //         await this.minioService.uploadPdf(
    //           uuid,
    //           Buffer.from(pdf),
    //           message.headers,
    //         );
    //         // 성공 시 커밋
    //         // throw new BadGatewayException('일부러 에러 발생');
    //         await this.consumer.commitOffsets([
    //           {
    //             topic,
    //             partition,
    //             offset: (BigInt(message.offset) + BigInt(1)).toString(),
    //           },
    //         ]);
    //       } catch (e) {
    //         throw new InternalServerErrorException(`[consumer] ${e.message}`);
    //       }
    //     },
    //   })
    //   .catch((e) => console.error(`[example/consumer] ${e.message}`, e));
    console.log('consumer has started');
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
  }
}
