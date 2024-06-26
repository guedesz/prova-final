import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Message } from './models/Message';
import * as amqp from 'amqplib';

@Injectable()
export class AppService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  constructor(
    @InjectModel(Message)
    private readonly messageModel: typeof Message,
  ) { }

  async onModuleInit() {
    await this.initializeRabbitMQ();
  }

  async onModuleDestroy() {
    await this.closeRabbitMQ();
  }

  private async initializeRabbitMQ() {
    try {
      this.connection = await amqp.connect('amqp://localhost');
      this.channel = await this.connection.createChannel();

      console.log('Conexão com RabbitMQ estabelecida com sucesso');
    } catch (error) {
      console.error('Falha ao conectar ao RabbitMQ', error);
    }
  }

  private async closeRabbitMQ() {
    try {
      if (this.channel) {
        await this.channel.close(); // Fecha o canal
        console.log('Canal RabbitMQ fechado');
      }
      if (this.connection) {
        await this.connection.close(); // Fecha a conexão
        console.log('Conexão RabbitMQ fechada');
      }
    } catch (error) {
      console.error('Falha ao fechar a conexão com RabbitMQ', error);
    }
  }

  public async enqueueMessage(message: { queue: string, message: string }): Promise<void> {
    if (!this.channel) {
      throw new Error('O canal RabbitMQ não está inicializado');
    }
    try {
      await this.channel.assertQueue(message.queue, { durable: true });
      this.channel.sendToQueue(message.queue, Buffer.from(message.message), {
        persistent: true,
      });
      console.log('Mensagem enviada para a fila:', message.queue);
    } catch (error) {
      console.error('Falha ao enviar mensagem para a fila', error);
      throw new Error('Falha ao enviar mensagem para a fila');
    }
  }

  public async processMessages(userIdSend: string, userIdReceive: string) {
    const channelId = `${userIdSend}${userIdReceive}`;

    try {
      if (!this.channel) {
        throw new Error('O canal RabbitMQ não está inicializado');
      }

      await this.channel.assertQueue(channelId, { durable: true });

      const messages: any[] = [];
      let msg = await this.channel.get(channelId);
      while (msg !== false) {
        const messageContent = msg.content.toString();
        messages.push({ channelId, message: messageContent });

        await this.channel.ack(msg);

        msg = await this.channel.get(channelId);
      }

      if (messages.length > 0) {
        // await this.messageModel.bulkCreate(messages);
        console.log('Mensagens:', messages);
      } else {
        console.log('Nenhuma mensagem encontrada na fila:', channelId);
      }
    } catch (error) {
      console.error('Falha ao processar mensagens', error);
    }
  }
}
