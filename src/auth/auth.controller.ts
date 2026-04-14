import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './auth.guard'; // Importing your new guard!

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // This route is now protected! It requires a valid Neon Auth JWT in the headers.
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    // The 'req.user' object is magically populated by the validate() method 
    // inside your jwt.strategy.ts file after the token is verified.
    return this.authService.getUserProfile(req.user.userId);
  }
}