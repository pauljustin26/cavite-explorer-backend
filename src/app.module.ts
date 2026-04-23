import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // <-- 1. Import ConfigModule
import { AuthModule } from './auth/auth.module';
import { PlacesModule } from './places/places.module';
import { PrismaService } from './prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // <-- 2. Initialize it globally
    AuthModule, 
    PlacesModule
  ],
  controllers: [],
  providers: [PrismaService],
  exports: [PrismaService], // Export so PlacesService can use it
})
export class AppModule {}