import { Module } from '@nestjs/common';
import { CallGateway } from './call.gateway';
import { CallController } from './call.controller';
import { AiCallService } from './ai-call.service';
import { WhisperService } from './whisper.service';
import { OpenAiTtsService } from './openai-tts.service';
import { PersistenceService } from './persistence.service';
import { S3Service } from './s3.service';

@Module({
  providers: [
    CallGateway, 
    AiCallService, 
    WhisperService, 
    OpenAiTtsService, 
    PersistenceService,
    S3Service
  ],
  controllers: [CallController],
  exports: [AiCallService, WhisperService, OpenAiTtsService, PersistenceService, S3Service]
})
export class CallModule {}
