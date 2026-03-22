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

    const input = body.SpeechResult || (digits ? `[Keypad Press: ${digits}]` : "Hello?");
    const callId = body.CallSid || `exotel_${Date.now()}`;
    
    await this.db.recordTurn(callId, { speaker: 'USER', content: input });

    const aiResponse = await this.ai.processCall(`[Secretary Context] Incoming Call (Exotel). Caller says: ${input}`, isBoss);
    await this.db.recordTurn(callId, { speaker: 'ASSISTANT', content: aiResponse.response });

    let nextStep = 'gather';
    const responseLower = aiResponse.response.toLowerCase();
    
    if (responseLower.includes('goodbye') || digits === '0') {
      nextStep = 'hangup';
      const summary = await this.ai.summarizeCall(this.db.getTranscript(callId));
      await this.db.saveCallRecord({
        callId,
        caller_number: callerNumber,
        summary: summary.summary,
        sentiment: summary.sentiment,
        follow_up: summary.follow_up
      });
    }

    // 200 OK -> Continue/Gather, 201 Created -> Goodbye/Hangup
    const statusCode = nextStep === 'gather' ? 200 : 201;
    return res.status(statusCode).json({
      CustomField1: aiResponse.response,
      status: nextStep
    });
  }

  @Get('exotel')
  async handleExotelGet(@Query() query: any, @Res() res: Response) {
    const callerNumber = query.From || query.CallFrom || '';
    const digits = query.Digits || query.digits || '';
    const bossNumber = process.env.BOSS_PHONE_NUMBER || '+918825492600';
    const isBoss = this.normalizeNumber(callerNumber) === this.normalizeNumber(bossNumber);

    const input = query.SpeechResult || (digits ? `[Keypad Press: ${digits}]` : "Hello?");
    const callId = query.CallSid || `exotel_${Date.now()}`;

    await this.db.recordTurn(callId, { speaker: 'USER', content: input });
    const aiResponse = await this.ai.processCall(`[Secretary Context] Incoming Call (Exotel). Caller says: ${input}`, isBoss);
    await this.db.recordTurn(callId, { speaker: 'ASSISTANT', content: aiResponse.response });

    let nextStep = 'gather';
    const responseLower = aiResponse.response.toLowerCase();

    if (responseLower.includes('goodbye') || digits === '0') {
      nextStep = 'hangup';
    }

    const statusCode = nextStep === 'gather' ? 200 : 201;
    return res.status(statusCode).json({
      CustomField1: aiResponse.response,
      status: nextStep
    });
  }

  @Post('exotel/dynamic')
  @HttpCode(200)
  async handleExotelDynamic(@Body() body: any) {
    const callerNumber = body.From || body.CallFrom || '';
    const digits = body.Digits || '';
    const bossNumber = process.env.BOSS_PHONE_NUMBER || '+918825492600';
    const isBoss = this.normalizeNumber(callerNumber) === this.normalizeNumber(bossNumber);

    const input = body.SpeechResult || (digits ? `[Keypad Press: ${digits}]` : "Hello?");
    const callId = body.CallSid || `exotel_${Date.now()}`;

    await this.db.recordTurn(callId, { speaker: 'USER', content: input });
    const aiResponse = await this.ai.processCall(`[Secretary Context] Incoming Call (Exotel Dynamic). Caller says: ${input}`, isBoss);
    await this.db.recordTurn(callId, { speaker: 'ASSISTANT', content: aiResponse.response });

    // Exotel Dynamic Parameter Format
    return {
      gather_prompt: {
        text: aiResponse.response
      },
      max_input_digits: 10,
      finish_key: "#",
      timeout: 4
    };
  }

  @Get('exotel/dynamic')
  async handleExotelDynamicGet(@Query() query: any) {
    // Treat GET as the initial "Wake up" call for the dynamic applet
    return {
      gather_prompt: {
        text: "Connected to Voxion AI. How can I help you?"
      },
      max_input_digits: 10,
      finish_key: "#",
      timeout: 4
    };
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
