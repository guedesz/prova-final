import { Controller, Get, Headers, Post, Body, Query, HttpException, HttpStatus } from '@nestjs/common';
import { MessageClient } from './client/MessageClient';
import { AppService } from './app.service';

@Controller()
export class AppController {
  private messageClient: MessageClient;

  public constructor(
    private readonly appService: AppService
  ) {
    this.messageClient = MessageClient.getInstance();
  }
  @Post('message')
  public async receive_message(
    @Headers('Authorization') token: string,
    @Body() body: { user_id_send: string, user_id_receive: string, message: string }) {

    const authApiResponse = await this.messageClient.verifyToken(token, body.user_id_send);

    if (!authApiResponse) {

      return {
        msg: 'not auth'
      }

    }

    await this.appService.enqueueMessage({
        queue: `${body.user_id_send}${body.user_id_receive}`, // Ajuste no formato da fila para melhor leitura
        message: body.message,
    });
    
    return {
      message: 'Message sent with success',
    };
  }

  @Post('/message/worker')
  public async message_worker(
    @Headers('Authorization') token: string,
    @Body() body: { user_id_send: string, user_id_receive: string}
  ) {
    
    const authApiResponse = await this.messageClient.verifyToken(token, body.user_id_send);

    if (!authApiResponse) {
      return {
        msg: 'not auth'
      }
    }

    const messages = await this.appService.processMessages(
      body.user_id_send,
      body.user_id_receive,
    );
    
    if (messages.length > 0) {

      messages.map(message => {
        const response = this.messageClient.recordMessage(body.user_id_send, body.user_id_receive, message)
      })

      return {
        message: 'Messages recorded with success',
      };
    }
  }

  @Get('message')
  public async read_message(
    @Headers('Authorization') token: string,
    @Query('user') userId,
  ) {
    const authApiResponse = await this.messageClient.verifyToken(token, userId);

    if (!authApiResponse) {
      return {
        msg: 'not auth',
      };
    }

    try {
      const messages = await this.messageClient.getUserMessages(userId);
      return messages['data'].map((msg: any) => ({
        userId: userId,
        msg: msg.message,
      }));

    } catch (error) {
      console.error('Error processing users:', error);
      return {
        msg: 'error processing users',
      };
    }
  }

}