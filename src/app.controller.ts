import { Controller, Get, Headers, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
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

      throw new HttpException('Not authenticated', HttpStatus.UNAUTHORIZED);

      return {
        msg: 'not auth'
      }

    }

    await this.appService.enqueueMessage({
        queue: `${body.user_id_send}-${body.user_id_receive}`, // Ajuste no formato da fila para melhor leitura
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

      throw new HttpException('Not authenticated', HttpStatus.UNAUTHORIZED);

      return {
        msg: 'not auth'
      }

    }

    return await this.appService.processMessages(
      body.user_id_send,
      body.user_id_receive,
    );
    
  }

}