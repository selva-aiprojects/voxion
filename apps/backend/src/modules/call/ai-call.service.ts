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

  async processCall(input: string): Promise<any> {
    this.logger.log(`AI Processing input: "${input}"`);

    if (!this.openai) {
      return this.mockResponse(input);
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'You are a professional, helpful, and warm Indian AI assistant from vapi-engine.io. Use a friendly Indian-English style. Be super concise. Focus on scheduling and support.' 
          },
          { role: 'user', content: input }
        ],
        max_tokens: 150
      });

      const text = response.choices[0].message.content;

      return {
        id: `call_${Date.now()}`,
        response: text,
        sentiment: 'neutral', // Could be expanded with another AI call
        latency: '1.1s'
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
