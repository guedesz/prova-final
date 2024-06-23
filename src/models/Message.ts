import {
  Column,
  Model,
  Table,
  AutoIncrement,
  PrimaryKey,
} from 'sequelize-typescript';

@Table
export class Message extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  messageId: number;

  @Column
  user_id_send: string;

  @Column
  user_id_receive: string;
}