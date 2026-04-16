import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class NeonGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    try {
      const neonAuthBaseUrl = process.env.NEON_AUTH_URL; 
      const neonUrl = `${neonAuthBaseUrl}/get-session`;
      
      const response = await fetch(neonUrl, {
        headers: { 'Authorization': authHeader }
      });

      if (!response.ok) {
        throw new UnauthorizedException('Neon Auth rejected the token. It may be expired.');
      }

      return true; 
    } catch (error) {
      throw new UnauthorizedException('Failed to communicate with Neon Auth.');
    }
  }
}