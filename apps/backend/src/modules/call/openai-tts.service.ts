import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { CryptoService } from '../common/crypto.service';

@Injectable()
export class OpenAiTtsService {
  private logger = new Logger('OpenAiTtsService');
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

  async generateSpeech(text: string, voice: any = 'alloy'): Promise<Buffer | null> {
    if (!this.openai) {
      this.logger.warn('OpenAI API Key not configured. Skipping TTS.');
      return null;
    }

    try {
      const response = await this.openai.audio.speech.create({
        model: 'tts-1',
        voice: voice, // Can be 'alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'
        input: text,
      });

      const buffer = Buffer.from(await response.arrayBuffer());
      return buffer;
    } catch (err) {
      this.logger.error('OpenAI TTS Error:', err);
      return null;
    }
  }
}
