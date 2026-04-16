import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // Extract the JWT from the Authorization: Bearer <token> header
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      
      // Verify the token's signature using Neon Auth's public keys
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${process.env.NEON_AUTH_URL}/.well-known/jwks.json`, 
      }),
      algorithms: ['RS256'],
    });
  }

  // Once the token is verified, this payload is injected into the Request object
  async validate(payload: any) {
    // Let's print the payload to the terminal so we can see exactly what Neon is sending!
    console.log('Neon JWT Payload:', payload); 
    
    // Pass the email AND the role to the request object
    return { 
      userId: payload.sub, 
      email: payload.email,
      role: payload.role // Grabbing the role you set in the console!
    };
  }
}