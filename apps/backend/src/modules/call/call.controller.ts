import { Controller, Post, Get, Body, HttpCode } from '@nestjs/common';
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

  private normalizeNumber(num: string): string {
    return num.replace(/^[0|+]/, '').replace(/^91/, '');
  }

  @Post('twilio')
  async handleTwilio(@Body() body: any) {
    const callerNumber = body.From || '';
    const bossNumber = process.env.BOSS_PHONE_NUMBER || '+918825492600';
    
    // Smart Indian Normalization for Boss Recognition
    const isBoss = this.normalizeNumber(callerNumber) === this.normalizeNumber(bossNumber);

    const callerText = body.SpeechResult || "Hello?";
    const context = isBoss ? "The Boss is calling." : `Incoming Call from ${callerNumber}.`;
    const aiResponse = await this.ai.processCall(`[Secretary Context] ${context} Caller says: ${callerText}`, isBoss);

    return this.generateTwilioResponse(aiResponse.response);
  }

  @Post('exotel')
  @HttpCode(200)
  async handleExotel(@Body() body: any) {
    const callerNumber = body.From || body.CallFrom || '';
    const bossNumber = process.env.BOSS_PHONE_NUMBER || '+918825492600';
    const isBoss = this.normalizeNumber(callerNumber) === this.normalizeNumber(bossNumber);

    const callerText = body.Digits || body.SpeechResult || "Hello?";
    const aiResponse = await this.ai.processCall(`[Secretary Context] Incoming Call (Exotel). Caller says: ${callerText}`, isBoss);

    // Return Raw String for Exotel Passthru Variable (%passthru_response%)
    return aiResponse.response;
  }

  private generateTwilioResponse(text: string) {
    return `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="Polly.Aditi-Neural">${text}</Say>
        <Gather input="speech" action="/call/twilio" method="POST" timeout="3" language="en-IN">
          <Say>Please speak now.</Say>
        </Gather>
        <Redirect>/call/twilio</Redirect>
      </Response>`;
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
