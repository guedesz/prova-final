import { HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

export class MessageClient {
  private static instance: MessageClient;
  private loginUrl: string;
  private recordUrl: string
  private token: string;

  private constructor() {
    this.loginUrl = 'http://authapi.lndo.site/api/';
    this.recordUrl = 'http://recordapi.lndo.site/api/message';
  }

  public static getInstance() {
    if (!MessageClient.instance) {
      MessageClient.instance = new MessageClient();
    }

    return MessageClient.instance;
  }

  public async verifyToken(token, userId: string) {
    try {
      const response = await axios.get(
        `${this.loginUrl}token?user=${userId}`,
        {
          headers: {
            Authorization: `${token}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      throw new HttpException('Failed to verify token', HttpStatus.INTERNAL_SERVER_ERROR);
    }

  }

  public async recordMessage(userIdSend, userIdReceive, message) {
    try {
      const response = await axios.post(this.recordUrl, {
        userIdSend: userIdSend,
        userIdReceive: userIdReceive,
        message: message
      });
      
      console.log('Message recorded successfully:', response.data);
    } catch (error) {
      console.error('Error recording message:', error);
    }
  }

  public async getAllUsers(token: string) {

    try {

      const response = await axios.get(
        `${this.loginUrl}users`,
        {
          headers: {
            Authorization: `${token}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error('Error recording message:', error);
    }
  }

}