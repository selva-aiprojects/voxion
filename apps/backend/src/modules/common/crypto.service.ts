import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly logger = new Logger('CryptoService');
  private readonly masterKey: Buffer;

  constructor(private config: ConfigService) {
    const key = this.config.get<string>('MASTER_ENCRYPTION_KEY') || 'vapi_default_32_byte_secret_key_123';
    this.masterKey = crypto.scryptSync(key, 'salt', 32);
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.masterKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  decrypt(text: string): string {
    try {
      if (!text.includes(':')) return text; // Fallback for plain text if not encrypted yet
      
      const [ivHex, encryptedText] = text.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv(this.algorithm, this.masterKey, iv);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (err) {
      this.logger.error('Decryption failed, using text as-is');
      return text;
    }
  }
}
