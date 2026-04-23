import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt'; // <-- 1. Import JWT Module
import { AuthController } from './auth.controller';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [
    // 2. Register the module with a secret key (In production, put this in your .env!)
    JwtModule.register({
      secret: 'cavite_super_secret_key_2026', 
      signOptions: { expiresIn: '30d' }, // Token expires in 30 days
    }),
  ],
  controllers: [AuthController],
  providers: [PrismaService],
})
export class AuthModule {}