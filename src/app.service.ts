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

  public async processMessages(userIdSend, userIdReceive) {
    // Lógica para consultar mensagens e registrar na tabela de mensagens
    const channelId = `${userIdSend}${userIdReceive}`;

    try {
      // Recupera todas as mensagens do canal especificado
      const messages = await this.fetchMessagesFromChannel(channelId);

      // Salva as mensagens na tabela
      await this.messageModel.bulkCreate(messages);

      console.log('Mensagens processadas e salvas na tabela:', messages);
    } catch (error) {
      console.error('Falha ao processar mensagens', error);
    }
  }

  private async fetchMessagesFromChannel(channelId: string): Promise<any[]> {
    if (!this.channel) {
      throw new Error('O canal RabbitMQ não está inicializado');
    }

    try {
      await this.channel.assertQueue(channelId, { durable: true });

      const messages: any[] = [];

      const consumeMessages = async (msg) => {
        if (msg !== null) {
          const messageContent = msg.content.toString();
          messages.push({ channelId, message: messageContent });
          this.channel.ack(msg);  // Confirma a mensagem como processada
        }
      };

      await this.channel.consume(channelId, consumeMessages, { noAck: false });

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(messages);
        }, 5000); // Aguarda 5 segundos para consumir as mensagens
      });

    } catch (error) {
      console.error('Falha ao buscar mensagens do canal', error);
      throw new Error('Falha ao buscar mensagens do canal');
    }
  }

  public async consumeMessagesFromQueue(queue: string) {
    if (!this.channel) {
      throw new Error('O canal RabbitMQ não está inicializado');
    }

    try {
      await this.channel.assertQueue(queue, { durable: true });

      this.channel.consume(queue, async (msg) => {
        if (msg !== null) {
          const messageContent = msg.content.toString();
          console.log('Mensagem recebida da fila:', messageContent);

          // Processa a mensagem conforme necessário
          // Aqui você pode fazer o parse do conteúdo e salvar na tabela, etc.
          await this.processReceivedMessage(messageContent);

          // Confirma a mensagem como processada
          this.channel.ack(msg);
        }
      });

      console.log('Consumidor de mensagens da fila iniciado:', queue);
    } catch (error) {
      console.error('Falha ao consumir mensagens da fila', error);
    }
  }

  private async processReceivedMessage(messageContent: string) {
    // Implementação simulada para processar a mensagem recebida
    // Aqui você pode salvar na tabela, logar, etc.
    console.log('Processando mensagem recebida:', messageContent);
    // Exemplo de salvamento na tabela
    await this.messageModel.create({ content: messageContent });
  }

}
