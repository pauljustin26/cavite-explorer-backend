import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { NeonGuard } from './neon.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(NeonGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return { message: "Authenticated successfully" }; 
  }
}