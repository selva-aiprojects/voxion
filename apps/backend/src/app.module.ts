import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CallModule } from './modules/call/call.module';
import { AuthModule } from './modules/auth/auth.module';
import { CommonModule } from './modules/common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    CallModule, 
    AuthModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
