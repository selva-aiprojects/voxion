import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class UsersService {
  private users: any[] = [];
  private logger = new Logger('UsersService');

  async createUser(userData: { name: string; email: string; phone: string; subscriptionTier: string }) {
    this.logger.log(`Saving new user: ${userData.email}`);
    
    // In production, we'd use Drizzle:
    // await db.insert(users).values(userData);
    
    // Simulating database storage
    const newUser = {
      id: `usr_${Math.random().toString(36).substr(2, 9)}`,
      ...userData,
      isVerified: true,
      createdAt: new Date(),
    };
    
    this.users.push(newUser);
    return newUser;
  }

  async findByPhone(phone: string) {
    return this.users.find(u => u.phone === phone);
  }
}
