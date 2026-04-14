import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS so your frontend web app can securely call this API
  app.enableCors();

  // Start the server on port 3000
  await app.listen(3000);
  console.log(`🚀 Cavite Explorer Backend is running on: http://localhost:3000`);
}
bootstrap();