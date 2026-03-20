import { Controller, Post, Get, Body } from '@nestjs/common';
import { AiCallService } from './ai-call.service';
import { PersistenceService } from './persistence.service';

@Controller('call')
export class CallController {
  constructor(
    private readonly ai: AiCallService,
    private readonly db: PersistenceService
  ) {}

  @Post('simulate')
  async simulate(@Body() body: { text: string }) {
    return await this.ai.processCall(body.text);
  }

  @Get('logs')
  async getLogs() {
    return await this.db.getAllCalls();
  }

  @Get('actions')
  async getActions() {
    return await this.db.getAllActions();
  }
}
