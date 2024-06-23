import {
  Column,
  Model,
  Table,
  AutoIncrement,
  PrimaryKey,
} from 'sequelize-typescript';

@Table({ tableName: 'messages' }) // Especifica o nome da tabela
export class Message extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  messageId: number;

  @Column
  user_id_send: string;

  @Column
  user_id_receive: string;

  @Column
  message: string;
}