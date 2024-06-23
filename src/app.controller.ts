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

  /**
   * Endpoit que recebe o nome de um cliente
   * 
   * Busca a informação de usuário na UserClient
   * Trabalha a informação para isolar o nome e a senha deste cliente
   * 
   * Passa essas informações na ProductClient para autenticar
   * returna o array da product cliente
   */

  @Post('message')
  public async receive_message(
    @Headers('Authorization') token: string,
    @Body() body: { userIdSend: string, userIdReceive: string, message: string }) {

    const authApiResponse = await this.messageClient.verifyToken(token, body.userIdSend);

    if (!authApiResponse) {

      throw new HttpException('Not authenticated', HttpStatus.UNAUTHORIZED);

      return {
        msg: 'not auth'
      }

    }

    await this.appService.enqueueMessage({
      queue: `${body.userIdSend}${body.userIdReceive}`,
      message: body.message,
    });

    await this.appService.storeMessageInHistory(
      body.userIdSend,
      body.userIdReceive,
      body.message
    );

    return {
      message: 'Message sent with success',
    };
  }

}