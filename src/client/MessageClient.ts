import { HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

export class MessageClient {
  private static instance: MessageClient;
  private loginUrl: string;
  private token: string;

  private constructor() {
    this.loginUrl = 'http://localhost:3005/';
  }

  public static getInstance() {
    if (!MessageClient.instance) {
      MessageClient.instance = new MessageClient();
    }

    return MessageClient.instance;
  }

  public async verifyToken(token, userId) {

    try {
      const response = await axios.get(
        `${this.loginUrl}?user=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error) {

      throw new HttpException('Failed to verify token', HttpStatus.INTERNAL_SERVER_ERROR);
    }

  }

}