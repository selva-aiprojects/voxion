import { Controller, Post, Get, Body, HttpCode, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
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
  async handleExotel(@Body() body: any, @Res() res: Response) {
    const callerNumber = body.From || body.CallFrom || '';
    const digits = body.Digits || '';
    const bossNumber = process.env.BOSS_PHONE_NUMBER || '+918825492600';
    const isBoss = this.normalizeNumber(callerNumber) === this.normalizeNumber(bossNumber);

    let input = body.SpeechResult || (digits ? `[Keypad Press: ${digits}]` : "Hello?");
    const aiResponse = await this.ai.processCall(`[Secretary Context] Incoming Call (Exotel). Caller says: ${input}`, isBoss);

    let nextStep = 'gather';
    if (aiResponse.response.toLowerCase().includes('goodbye') || 
        aiResponse.response.toLowerCase().includes('thank you') ||
        digits === '0') {
      nextStep = 'hangup';
    } else if (digits === '1') {
      nextStep = 'transfer';
    }

    // If the request is from a basic Passthru block (indicated by specific headers or if we want to support it),
    // we can use status codes to branch.
    const statusCode = nextStep === 'gather' ? 200 : 201;
    
    // Return Plain Text for Exotel %passthru_response% variable
    return res.status(statusCode).send(aiResponse.response);
  }

  @Get('exotel')
  async handleExotelGet(@Query() query: any, @Res() res: Response) {
    const callerNumber = query.From || query.CallFrom || '';
    const digits = query.Digits || query.digits || '';
    const bossNumber = process.env.BOSS_PHONE_NUMBER || '+918825492600';
    const isBoss = this.normalizeNumber(callerNumber) === this.normalizeNumber(bossNumber);

    let input = query.SpeechResult || (digits ? `[Keypad Press: ${digits}]` : "Hello?");
    const aiResponse = await this.ai.processCall(`[Secretary Context] Incoming Call (Exotel). Caller says: ${input}`, isBoss);

    let nextStep = 'gather';
    if (aiResponse.response.toLowerCase().includes('goodbye') || 
        aiResponse.response.toLowerCase().includes('thank you') ||
        digits === '0') {
      nextStep = 'hangup';
    }

    // 200 OK triggers the "Success" path in Exotel Passthru
    // 201 Created triggers the "Anything Else" path (Hangup/Transfer)
    const statusCode = nextStep === 'gather' ? 200 : 201;
    
    return res.status(statusCode).send(aiResponse.response);
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
