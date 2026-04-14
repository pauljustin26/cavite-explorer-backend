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
    // You can attach more data here if needed (e.g., fetching user roles from the DB)
    return { userId: payload.sub, email: payload.email };
  }
}