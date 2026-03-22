import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PersistenceService {
  private logger = new Logger('PersistenceService');
  private calls: any[] = [];
  private actions: any[] = [];
  private transcripts: Map<string, any[]> = new Map();

  async recordTurn(callId: string, turn: { speaker: 'USER' | 'ASSISTANT'; content: string }) {
    if (!this.transcripts.has(callId)) {
      this.transcripts.set(callId, []);
    }
    this.transcripts.get(callId)!.push({ ...turn, timestamp: new Date() });
    const logContent = (turn.content || '').substring(0, 30);
    this.logger.log(`[DB] Recorded turn for ${callId}: ${turn.speaker} - ${logContent}...`);
  }

  getTranscript(callId: string): any[] {
    return this.transcripts.get(callId) || [];
  }

  async saveCallRecord(record: any) {
    const callId = record.callId || `call_${Date.now()}`;
    const newRecord = { ...record, createdAt: new Date() };
    
    this.calls.push(newRecord);
    this.logger.log(`[DB] Saved call record: ${callId}`);

    if (record.follow_up?.required) {
      const actionId = `act_${Date.now()}`;
      const action = {
        id: actionId,
        callId,
        description: record.follow_up.action,
        priority: record.follow_up.priority,
        status: 'PENDING',
        createdAt: new Date()
      };
      this.actions.push(action);
      this.logger.log(`[DB] Created follow-up action: ${actionId} - ${action.description}`);
    }

    return newRecord;
  }

  async getAllCalls() {
    return this.calls.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAllActions() {
    return this.actions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}
