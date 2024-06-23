import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Message } from './models/Message';
import * as amqp from 'amqplib';

@Injectable()
export class AppService {
  
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  constructor(
    @InjectModel(Message)
    private readonly messageModel: typeof Message,
  ) {
    this.initialize();
  }

  async initialize() {
    try {
      var amqp = require('amqplib/callback_api');

      amqp.connect('amqp://localhost', function(error0, connection) {
        if (error0) {
          throw error0;
        }
        connection.createChannel(function(error1, channel) {
          if (error1) {
              throw error1;
            }
            var queue = 'hello';
            var msg = 'Hello world';
        
            channel.assertQueue(queue, {
              durable: false
            });
        
            channel.sendToQueue(queue, Buffer.from(msg));
            console.log(" [x] Sent %s", msg);
        });
      });
      
    } catch (error) {
      console.error('Failed to connect to RabbitMQ', error);
    }
  }

  async enqueueMessage(message: { queue: string, message: string }): Promise<void> {
    try {
      await this.channel.assertQueue(message.queue, { durable: true });
      this.channel.sendToQueue(message.queue, Buffer.from(message.message), {
        persistent: true,
      });
      console.log('Message sent to queue:', message.queue);
    } catch (error) {
      console.error('Failed to send message to queue', error);
    }
  }

  async storeMessageInHistory(userIdSend: string, userIdReceive: string, message: string): Promise<Message> {
    
    const newMessage = await this.messageModel.create({
      userIdSend,
      userIdReceive,
      message,
    });
    return newMessage;
  }

}
