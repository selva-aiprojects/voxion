import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { WhisperService } from './whisper.service';
import { AiCallService } from './ai-call.service';
import { OpenAiTtsService } from './openai-tts.service';
import { PersistenceService } from './persistence.service';
import { S3Service } from './s3.service';

@Injectable()
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'call'
})
export class CallGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('CallGateway');
  private transcripts = new Map<string, any[]>();
  private audioBuffers = new Map<string, Buffer[]>();
  private voicePrefs = new Map<string, string>();

  constructor(
    private whisper: WhisperService,
    private ai: AiCallService,
    private tts: OpenAiTtsService,
    private db: PersistenceService,
    private s3: S3Service
  ) {}

  afterInit(server: Server) {
    this.logger.log('Call WebSocket Gateway Initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.transcripts.set(client.id, []);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.transcripts.delete(client.id);
  }

  @SubscribeMessage('start-call')
  handleStartCall(@ConnectedSocket() client: Socket, @MessageBody() metadata: any) {
    this.logger.log(`Call started for client ${client.id}. Voice: ${metadata.voice}`);
    this.transcripts.set(client.id, []);
    this.voicePrefs.set(client.id, metadata.voice || 'alloy');
    client.emit('call-ready', { sessionId: `session_${Date.now()}` });
  }

  @SubscribeMessage('audio-data')
  async handleAudioData(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    this.logger.debug(`Received audio-data from ${client.id}`);
    
    let transcription: string | null = null;
    const history = this.transcripts.get(client.id) || [];

    const isBinary = Buffer.isBuffer(data) || data instanceof Uint8Array || data instanceof ArrayBuffer;

    if (isBinary) {
      // Ensure we have a real Buffer for Whisper
      const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data as any);
      
      // Collect for recording
      const chunks = this.audioBuffers.get(client.id) || [];
      chunks.push(buffer);
      this.audioBuffers.set(client.id, chunks);

      transcription = await this.whisper.transcribe(buffer);
    } else if (typeof data === 'string') {
      transcription = data;
    }

    if (transcription) {
      history.push({ role: 'user', content: transcription });
      this.logger.log(`Transcription: ${transcription}`);
      
      client.emit('transcription-result', {
        text: transcription,
        isFinal: true,
        latency: '0.6s'
      });

      const aiResponse = await this.ai.processCall(transcription);
      history.push({ role: 'assistant', content: aiResponse.response });
      
      // 3. Send AI response back
      client.emit('transcription-result', {
        role: 'assistant',
        text: aiResponse.response,
        isFinal: true,
        latency: aiResponse.latency
      });

      // 4. Generate & Stream Audio (TTS)
      const selectedVoice = this.voicePrefs.get(client.id) || 'alloy';
      const audioBuffer = await this.tts.generateSpeech(aiResponse.response, selectedVoice);
      if (audioBuffer) {
        client.emit('audio-response', audioBuffer);
      }
    }
  }

  @SubscribeMessage('end-call')
  async handleEndCall(@ConnectedSocket() client: Socket) {
    const history = this.transcripts.get(client.id) || [];
    this.logger.log(`Call ending for: ${client.id}. Summarizing...`);
    
    if (history.length > 0) {
      const insight = await this.ai.summarizeCall(history);
      
      // Handle recording
      const chunks = this.audioBuffers.get(client.id) || [];
      if (chunks.length > 0) {
        const fullBuffer = Buffer.concat(chunks);
        const recordingUrl = await this.s3.uploadRecording(fullBuffer, `call_${Date.now()}`);
        insight.recordingUrl = recordingUrl;
      }

      // Persist to register
      await this.db.saveCallRecord(insight);
      
      client.emit('call-summary', insight);
    }

    this.transcripts.delete(client.id);
    this.audioBuffers.delete(client.id);
    this.logger.log(`Call ended for: ${client.id}`);
  }

  /**
   * Helper to broadcast transcription results back to the client
   */
  sendTranscription(clientId: string, text: string, isFinal: boolean) {
    this.server.to(clientId).emit('transcription-result', { text, isFinal });
  }

  /**
   * Helper to pipe audio output from TTS to the client
   */
  sendAudioOutput(clientId: string, audioChunk: Buffer) {
    this.server.to(clientId).emit('audio-output', audioChunk);
  }
}
