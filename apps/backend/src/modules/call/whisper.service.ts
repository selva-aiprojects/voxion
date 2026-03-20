import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { toFile } from 'openai';
import { CryptoService } from '../common/crypto.service';

@Injectable()
export class WhisperService {
  private logger = new Logger('WhisperService');
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

  async transcribe(audioBuffer: Buffer): Promise<string | null> {
    if (!this.openai) {
      this.logger.warn('OpenAI API Key not configured. Skipping Whisper transcription.');
      return null;
    }

    try {
      // Whisper API expects a file, so we convert the buffer into an OpenAI-compatible file object
      const file = await toFile(audioBuffer, 'voice.wav', { type: 'audio/wav' });
      
      const transcription = await this.openai.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
        language: 'en', // Can be dynamic
      });

      return transcription.text;
    } catch (err) {
      this.logger.error('Whisper Transcription Error:', err);
      return null;
    }
  }
}
