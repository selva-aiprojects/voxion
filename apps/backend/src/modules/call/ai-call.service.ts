import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { CryptoService } from '../common/crypto.service';

@Injectable()
export class AiCallService {
  private logger = new Logger('AiCallService');
  private openai: OpenAI;

  constructor(
    private config: ConfigService,
    private crypto: CryptoService
  ) {
    const rawApiKey = this.config.get<string>('OPENAI_API_KEY');
    const apiKey = this.crypto.decrypt(rawApiKey || '');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async processCall(input: string, isBoss: boolean = false): Promise<any> {
    this.logger.log(`AI Processing input: "${input}" (Boss: ${isBoss})`);

    if (!this.openai) {
      return this.mockResponse(input);
    }

    try {
      const persona = isBoss 
        ? "You are a highly efficient personal AI assistant for 'Rahul'. Respond as a real person. 'Rahul' is you—the Boss. Give him a high-speed briefing of his missed calls/actions and ask if he needs anything. Do not act as a secretary for him; be his comrade."
        : (input.toLowerCase().includes('secretary') || input.toLowerCase().includes('assistant'))
          ? "You are a highly professional, warm human secretary for 'Rahul'. Respond as a real person. 'Rahul' is in a high-stakes meeting. Your goal is to: 1. Identify the caller. 2. Ask for the reason. 3. Assess urgency. 4. Promise a callback. Be super human, concise, and helpful."
          : "You are a professional, helpful, and warm Indian AI assistant from Voxion.io. Use a friendly Indian-English style. Be super concise. Focus on scheduling and support.";

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: persona },
          { role: 'user', content: input }
        ],
        max_tokens: 150
      });

      const text = response.choices[0].message.content;

      return {
        id: `call_${Date.now()}`,
        response: text,
        sentiment: 'neutral',
        latency: '0.9s'
      };
    } catch (err) {
      this.logger.error('OpenAI Error:', err);
      return this.mockResponse(input);
    }
  }

  async summarizeCall(transcript: any[]): Promise<any> {
    this.logger.log(`AI Summarizing call with ${transcript.length} turns.`);

    if (!this.openai) {
      return { summary: 'Mock summary: OpenAI not configured.', sentiment: 'neutral' };
    }

    try {
      const prompt = `Analyze the following conversation and return a JSON summary.
      Conversation: ${JSON.stringify(transcript)}
      Result format: { 
        "summary": string, 
        "sentiment": "positive" | "neutral" | "negative", 
        "caller_name": string | null,
        "follow_up": {
          "required": boolean,
          "action": string,
          "priority": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
        }
      }`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (err) {
      this.logger.error('OpenAI Summary Error:', err);
      return { summary: 'Error generating summary', sentiment: 'neutral' };
    }
  }

  private mockResponse(input: string) {
    return {
      id: `mock_${Date.now()}`,
      response: `[Mock] I heard: "${input}". (API Key not working or missing)`,
      latency: '0.4s'
    };
  }
}
