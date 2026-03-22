import { Controller, Post, Get, Body, HttpCode, Query, Res, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { AiCallService } from './ai-call.service';
import { PersistenceService } from './persistence.service';

@Controller('call')
export class CallController {
  private readonly logger = new Logger('CallController');
  private static readonly history: any[] = []; 

  constructor(
    private readonly ai: AiCallService,
    private readonly db: PersistenceService
  ) {}

  @Get('inspector')
  async inspector() {
    return {
      message: "Exotel/Twilio Request Inspector",
      count: CallController.history.length,
      history: CallController.history.slice().reverse()
    };
  }

  private recordHistory(req: any, res: any) {
    CallController.history.push({
      timestamp: new Date().toISOString(),
      url: req.url,
      method: req.method,
      data: req.body || req.query,
      response: res
    });
    if (CallController.history.length > 20) CallController.history.shift();
  }

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
    const isBoss = this.normalizeNumber(callerNumber) === this.normalizeNumber(bossNumber);
    const callerText = body.SpeechResult || "Hello?";
    const context = isBoss ? "The Boss is calling." : `Incoming Call from ${callerNumber}.`;
    const aiResponse = await this.ai.processCall(`[Secretary Context] ${context} Caller says: ${callerText}`, isBoss);
    const twilioRes = this.generateTwilioResponse(aiResponse.response);
    this.recordHistory({ url: '/call/twilio', method: 'POST', body }, twilioRes);
    return twilioRes;
  }

  // LEGACY EXOTEL HANDLER (FLOW BUILDER)
  @Post('exotel')
  @HttpCode(200)
  async handleExotel(@Body() body: any, @Res() res: Response) {
    this.logger.log(`📢 EXOTEL POST HIT! Body: ${JSON.stringify(body)}`);
    const callerNumber = body.From || body.CallFrom || '';
    const digits = body.Digits || '';
    const bossNumber = process.env.BOSS_PHONE_NUMBER || '+918825492600';
    const isBoss = this.normalizeNumber(callerNumber) === this.normalizeNumber(bossNumber);
    const input = body.SpeechResult || (digits ? `[Keypad Press: ${digits}]` : "START_CALL");
    const callId = body.CallSid || `exotel_${Date.now()}`;
    
    this.db.recordTurn(callId, { speaker: 'USER', content: input });
    const contextInput = input === "START_CALL" 
      ? "User just connected. Say 'Thanks for calling, I will connect you to AI Assistant'"
      : `[Secretary Context] Incoming Call (Exotel). Caller says: ${input}`;

    const aiResponse = await this.ai.processCall(contextInput, isBoss);
    this.db.recordTurn(callId, { speaker: 'ASSISTANT', content: aiResponse.response });

    res.setHeader('Content-Type', 'text/plain');
    const responseBody = aiResponse.response;
    this.recordHistory({ url: '/call/exotel', method: 'POST', body }, responseBody);
    return res.status(200).send(responseBody);
  }

  @Post('exotel/')
  async handleExotelSlash(@Body() body: any, @Res() res: Response) {
    return this.handleExotel(body, res);
  }

  @Get('exotel')
  async handleExotelGet(@Query() query: any, @Res() res: Response) {
    this.logger.log(`📢 EXOTEL GET HIT! Query: ${JSON.stringify(query)}`);
    return this.handleExotel(query, res);
  }

  @Get('exotel/')
  async handleExotelGetSlash(@Query() query: any, @Res() res: Response) {
    return this.handleExotel(query, res);
  }

  // NEW CLEAN DYNAMIC ARCHITECTURE
  @Post('exotel/dynamic')
  @HttpCode(200)
  async handleExotelDynamic(@Body() body: any) {
    this.logger.log(`📢 EXOTEL DYNAMIC POST HIT! Body: ${JSON.stringify(body)}`);
    const callerNumber = body.From || body.CallFrom || '';
    const digits = body.Digits || '';
    const bossNumber = process.env.BOSS_PHONE_NUMBER || '+918825492600';
    const isBoss = this.normalizeNumber(callerNumber) === this.normalizeNumber(bossNumber);
    const input = body.SpeechResult || (digits ? `[Keypad Press: ${digits}]` : "START_CALL");
    const callId = body.CallSid || `exotel_${Date.now()}`;

    this.db.recordTurn(callId, { speaker: 'USER', content: input });
    const contextInput = input === "START_CALL" 
      ? "User just connected. Say 'Thanks for calling, I will connect you to AI Assistant'"
      : `[Secretary Context] Incoming Call (Exotel Dynamic). Caller says: ${input}`;

    const aiResponse = await this.ai.processCall(contextInput, isBoss);
    this.db.recordTurn(callId, { speaker: 'ASSISTANT', content: aiResponse.response });

    const payload = {
      "Status": 200,
      "gather_prompt": { "text": aiResponse.response },
      "Prompt": aiResponse.response,
      "max_input_digits": 10,
      "MaxDigits": 10,
      "timeout": 5,
      "Timeout": 5,
      "finish_key": "#",
      "FinishKey": "#",
      "action": "gather"
    };

    const finalResponse = {
      ...payload,
      "Parameters": payload,
      "Custom": payload
    };

    this.recordHistory({ url: '/call/exotel/dynamic', method: 'POST', body }, finalResponse);
    return finalResponse;
  }

  // DEFINITIVE EXOTEL XML HANDLER (ROCK-SOLID)
  @Post('exotel-xml')
  @HttpCode(200)
  async handleExotelXml(@Body() body: any, @Res() res: Response) {
    this.logger.log(`📢 EXOTEL XML HIT! Body: ${JSON.stringify(body)}`);
    const callerNumber = body.From || body.CallFrom || '';
    const digits = body.Digits || '';
    const bossNumber = process.env.BOSS_PHONE_NUMBER || '+918825492600';
    const isBoss = this.normalizeNumber(callerNumber) === this.normalizeNumber(bossNumber);
    
    // Explicit Speech Result or initial start
    const input = body.SpeechResult || (digits ? `[Keypad: ${digits}]` : "START_CALL");
    const callId = body.CallSid || `exotel_xml_${Date.now()}`;

    const contextInput = input === "START_CALL"
      ? "User just connected. Say 'Thanks for calling, I will connect you to AI Assistant'"
      : `[Secretary Context] Exotel XML Flow. Caller says: ${input}`;

    const aiResponse = await this.ai.processCall(contextInput, isBoss);
    
    // Build definitive ExML (XML) response
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Gather input="speech" action="/call/exotel-xml" method="POST" timeout="3" language="en-IN">
          <Say>${aiResponse.response}</Say>
        </Gather>
        <Redirect>/call/exotel-xml</Redirect>
      </Response>`;

    res.setHeader('Content-Type', 'text/xml');
    this.recordHistory({ url: '/call/exotel-xml', method: 'POST', body }, xml);
    return res.status(200).send(xml);
  }

  @Get('exotel-xml')
  @HttpCode(200)
  async handleExotelXmlGet(@Body() body: any, @Res() res: Response) {
    // Handle the initial hit if it comes as GET
    return this.handleExotelXml(body, res);
  }

  @Post('exotel/dynamic/')
  async handleExotelDynamicSlash(@Body() body: any) {
    return this.handleExotelDynamic(body);
  }

  @Get('exotel/dynamic')
  async handleExotelDynamicGet(@Query() query: any) {
    this.logger.log(`📢 EXOTEL DYNAMIC GET HIT!`);
    const intro = "Thanks for calling, I will connect you to AI Assistant";
    const payload = {
      "Status": 200,
      "gather_prompt": { "text": intro },
      "Prompt": intro,
      "max_input_digits": 10,
      "MaxDigits": 10,
      "timeout": 5,
      "Timeout": 5,
      "finish_key": "#",
      "FinishKey": "#",
      "action": "gather"
    };

    const finalResponse = {
      ...payload,
      "Parameters": payload,
      "Custom": payload
    };

    this.recordHistory({ url: '/call/exotel/dynamic', method: 'GET', query }, finalResponse);
    return finalResponse;
  }

  @Get('exotel/dynamic/')
  async handleExotelDynamicGetSlash(@Query() query: any) {
    return this.handleExotelDynamicGet(query);
  }

  @Get('debug')
  @HttpCode(200)
  async debug() {
    return "Backend is alive and ready for Exotel!";
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
