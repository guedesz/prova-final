import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Message } from './models/Message';

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'mysql',
      host: '127.0.0.1',
      port: 3306,
      username: 'root',
      password: 'positivo',
      database: 'generaldbs',
      models: [Message],
      autoLoadModels: true, // Adiciona esta linha para auto carregar modelos
      synchronize: true,    // Sincroniza automaticamente com o banco de dados
    }),
    SequelizeModule.forFeature([Message]),
  ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule {}