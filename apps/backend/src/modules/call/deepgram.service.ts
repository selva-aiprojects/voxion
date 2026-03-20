import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DeepgramService {
  private logger = new Logger('DeepgramService');

  constructor(private config: ConfigService) {
    this.logger.log('Deepgram Service Initialized (Stub for MVP1)');
  }

  async createLiveStream(onTranscript: (text: string) => void) {
    this.logger.warn('Deepgram is not active for MVP1. Using WhisperAI instead.');
    return null;
  }
}
