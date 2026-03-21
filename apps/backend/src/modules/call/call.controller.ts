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

  @Post('twilio')
  async handleTwilio(@Body() body: any) {
    const callerNumber = body.From || '';
    const bossNumber = process.env.BOSS_PHONE_NUMBER || '+918825492600';
    const isBoss = callerNumber.includes(bossNumber.replace('+', ''));

    const callerText = body.SpeechResult || "Hello?";
    const context = isBoss ? "The Boss is calling." : `Incoming Call from ${callerNumber}.`;
    const aiResponse = await this.ai.processCall(`[Secretary Context] ${context} Caller says: ${callerText}`, isBoss);

    // Generate TwiML (XML) for real phone responses
    return `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
        <Say voice="Polly.Aditi-Neural">${aiResponse.response}</Say>
        <Gather input="speech" action="/call/twilio" method="POST" timeout="3">
            <Say>I'm listening. Please continue.</Say>
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
