import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PlacesModule } from './places/places.module';

@Module({
  imports: [
    // This magically loads your .env file and makes it available everywhere
    ConfigModule.forRoot({ 
      isGlobal: true,
    }),
    
    // Import your newly created AuthModule
    AuthModule,
    
    PlacesModule, 
  ],
  providers: [],
})
export class AppModule {}