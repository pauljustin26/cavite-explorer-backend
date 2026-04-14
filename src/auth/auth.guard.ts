import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// This is the missing export! 
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}