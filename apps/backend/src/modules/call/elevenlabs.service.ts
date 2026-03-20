import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CryptoService } from '../common/crypto.service';
import axios from 'axios';

@Injectable()
export class ElevenLabsService {
  private logger = new Logger('ElevenLabsService');
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.elevenlabs.io/v1';

  constructor(
    private config: ConfigService,
    private crypto: CryptoService
  ) {
    const rawKey = this.config.get<string>('ELEVENLABS_API_KEY');
    this.apiKey = this.crypto.decrypt(rawKey || '');
  }

  async textToSpeechStream(text: string, voiceId = '21m00Tcm4TlvDq8ikWAM'): Promise<any> {
    if (!this.apiKey) {
      this.logger.warn('ElevenLabs API Key not configured. Skipping TTS.');
      return null;
    }

    try {
      const response = await axios({
        method: 'post',
        url: `${this.baseUrl}/text-to-speech/${voiceId}/stream`,
        data: {
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        },
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'accept': 'audio/mpeg',
        },
        responseType: 'arraybuffer',
      });

      return response.data;
    } catch (err) {
      this.logger.error('ElevenLabs TTS Error:', err?.response?.data || err.message);
      return null;
    }
  }
}
