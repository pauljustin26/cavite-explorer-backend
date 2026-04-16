import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PlacesModule } from './places/places.module';
import { PrismaService } from './prisma.service';

@Module({
  imports: [AuthModule, PlacesModule],
  controllers: [],
  providers: [PrismaService],
  exports: [PrismaService], // Export so PlacesService can use it
})
export class AppModule {}