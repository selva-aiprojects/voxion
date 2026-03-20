import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PersistenceService {
  private logger = new Logger('PersistenceService');
  private calls: any[] = [];
  private actions: any[] = [];

  async saveCallRecord(record: { 
    caller_name?: string; 
    summary: string; 
    sentiment: string; 
    follow_up?: any;
    duration?: number;
    recordingUrl?: string;
  }) {
    const callId = `call_${Date.now()}`;
    const newRecord = { id: callId, ...record, createdAt: new Date() };
    
    this.calls.push(newRecord);
    this.logger.log(`[DB] Saved call record: ${callId} for ${record.caller_name || 'Unknown'}`);

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
