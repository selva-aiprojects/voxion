import { Module, Injectable, Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';

@Injectable()
export class SmsService {
  private codes = new Map<string, string>();
  private pendingUsers = new Map<string, any>(); // Store user info temporarily until verified

  async sendVerification(phone: string, userData: any): Promise<string> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.codes.set(phone, code);
    this.pendingUsers.set(phone, userData);
    console.log(`[SMS STUB] Sending OTP ${code} to ${phone}`);
    return code;
  }

  async verify(phone: string, code: string): Promise<any | null> {
    const savedCode = this.codes.get(phone);
    if (savedCode === code) {
      this.codes.delete(phone);
      const user = this.pendingUsers.get(phone);
      this.pendingUsers.delete(phone);
      return user;
    }
    return null;
  }
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly sms: SmsService,
    private readonly users: UsersService
  ) {}

  @Post('register')
  async register(@Body() body: any) {
    // Basic info received: name, email, phone, catalog
    await this.sms.sendVerification(body.phone, body);
    return { message: 'SMS Sent', phone: body.phone };
  }

  @Post('verify')
  async verify(@Body() body: { phone: string; code: string }) {
    const pendingUser = await this.sms.verify(body.phone, body.code);
    if (!pendingUser) {
      throw new HttpException('Invalid or expired verification code', HttpStatus.UNAUTHORIZED);
    }
    
    // Save to database
    const user = await this.users.createUser({
      name: pendingUser.name,
      email: pendingUser.email,
      phone: pendingUser.phone,
      subscriptionTier: pendingUser.catalog || 'PERSONAL',
    });

    return { 
      message: 'Verified successfully', 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        tier: user.subscriptionTier
      }
    };
  }
}

@Module({
  controllers: [AuthController],
  providers: [SmsService, UsersService],
  exports: [UsersService]
})
export class AuthModule {}
