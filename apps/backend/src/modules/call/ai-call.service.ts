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
          ? `You are 'Voxion'—Rahul's highly professional human executive assistant. 
             Rahul is currently in a high-stakes meeting and cannot be disturbed.
             YOUR GOALS:
             1. Identify the caller (Name and Company).
             2. Ask for the detailed purpose of the call.
             3. Ask for the urgency (Is this time-sensitive?).
             4. Availability Info: Rahul is free tomorrow after 2 PM IST.
             5. Closure: Promise a detailed summary for Rahul the moment he finishes his meeting.
             DYNAMIC LANGUAGE MIRRORING: If the caller speaks in Hindi, respond in Hindi. If they speak in Tamil, respond in Tamil. If they use a mix (Hinglish), mirror that mix. ALWAYS follow the caller's language choice naturally while maintaining a professional, human, and polite Indian secretary tone.
             CONFLICT RESOLUTION: If the caller is angry, frustrated, or aggressive, stay extremely calm. Use phrases like 'I understand your frustration' and 'I will make sure Rahul sees this immediately as a priority.' Do not get defensive. Maintain professional boundaries at all times.
             RESPONSE STYLE: Be warm, human, extremely polite, yet firm. Never give out Rahul's private mobile number.`
          : "You are a professional, helpful, and warm Indian AI assistant from Voxion.io. DYNAMIC LANGUAGE MIRRORING: Respond in the same language as the caller (Hindi, Tamil, etc.). Use a friendly Indian-English style where appropriate. Be super concise. Focus on scheduling and support.";

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
