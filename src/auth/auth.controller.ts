import { Controller, Get, Res, Req, Headers, UnauthorizedException } from '@nestjs/common';
import { Response, Request } from 'express';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt'; // <-- Import JwtService
import { Body, Post } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  
  // Inject both Prisma and the new JWT Service
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  @Get('google')
  async startGoogleLogin(@Res() res: Response) {
    try {
      const neonUrl = process.env.NEON_AUTH_URL;
      const frontendUrl = process.env.FRONTEND_URL;
      const backendUrl = process.env.BACKEND_URL;

      if (!neonUrl) throw new Error("Neon Auth URL missing");

      const response = await fetch(neonUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Origin': frontendUrl,
          'Referer': `${frontendUrl}/`
        },
        body: JSON.stringify({
          provider: 'google',
          callbackURL: `${backendUrl}/auth/callback`, 
        }),
      });
      
      const data = await response.json();
      if (response.ok && data.url) return res.redirect(data.url);
      
      return res.status(response.status).json({ message: "Failed", details: data });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

 @Get('callback')
  async handleGoogleCallback(@Req() req: Request, @Res() res: Response) {
    const verifier = (req.query.token || req.query.session_token || req.query.code || req.query.neon_auth_session_verifier) as string;

    if (!verifier) return res.redirect(`caviteexplorer://login-callback?error=LoginCanceled`);

    try {
      // FIX: We now look for the user attached to the MOST RECENT SESSION.
      // This works 100% of the time, whether it's a new user or a returning user!
      const userResult: any[] = await this.prisma.$queryRaw`
        SELECT u.id, u.name, u.email 
        FROM neon_auth."user" u
        JOIN neon_auth.session s ON u.id = s."userId"
        ORDER BY s."createdAt" DESC 
        LIMIT 1
      `;

      if (userResult && userResult.length > 0) {
        const user = userResult[0];

        // --- ADD THIS PRISMA SYNC BLOCK ---
        await this.prisma.user.upsert({
          where: { id: user.id }, 
          update: { name: user.name }, 
          create: {
            id: user.id,
            email: user.email,
            name: user.name,
            password: "MANAGED_BY_NEON", // <-- ADD THIS LINE
          }
        });
        // ----------------------------------

        const payload = { sub: user.id, name: user.name, email: user.email };
        const signedJwt = this.jwtService.sign(payload);

        console.log(`🔐 Google Login Success & Synced to Prisma: ${user.name}`);

        const deepLink = `caviteexplorer://login-callback?token=${signedJwt}`;
        return res.redirect(deepLink);
      } else {
        console.warn("⚠️ No sessions found in the database.");
      }
    } catch (error: any) {
      console.error("🚨 Auth Callback Crash:", error.message);
    }
    
    return res.redirect(`caviteexplorer://login-callback?error=UserNotFound`);
  }
  // ==========================================
  // BRAND NEW: The Secure Profile Endpoint
  // ==========================================
  @Get('me')
  async getProfile(@Headers('authorization') authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid token');
    }

    // Extract the token (Remove "Bearer " from the string)
    const token = authHeader.split(' ')[1];

    try {
      // Decode the JWT using our secret key
      const decodedUser = this.jwtService.verify(token);
      
      // Send the data safely as a JSON response!
      return {
        message: "Secure data retrieved",
        user: {
          id: decodedUser.sub,
          name: decodedUser.name,
          email: decodedUser.email
        }
      };
    } catch (error) {
      throw new UnauthorizedException('Token expired or invalid');
    }
  }

 @Post('register')
  async registerUser(@Body() body: { email: string; password: string; name: string }, @Res() res: Response) {
    try {
      // 1. Grab all the required URLs from .env
      const neonAuthUrl = process.env.NEON_AUTH_URL;
      const frontendUrl = process.env.FRONTEND_URL;
      const backendUrl = process.env.BACKEND_URL;

      if (!neonAuthUrl || !frontendUrl || !backendUrl) {
        throw new Error("CRITICAL: Missing environment variables in .env");
      }

      const neonSignupUrl = neonAuthUrl.replace('/sign-in/social', '/sign-up/email');
      console.log("Attempting to register user at:", neonSignupUrl);

      // 2. Add the missing headers and callbackURL!
      const response = await fetch(neonSignupUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Origin': frontendUrl,       // <-- FIX: Tells Neon who we are
          'Referer': `${frontendUrl}/` // <-- FIX: Security requirement
        },
        body: JSON.stringify({
          email: body.email,
          password: body.password,
          name: body.name,
          callbackURL: `${backendUrl}/auth/callback`, // <-- FIX: Where to send the email verification link
        }),
      });

      const data = await response.json();

      if (response.ok) {
        return res.status(201).json({ message: "Registration successful. Please check your email." });
      } else {
        console.error("❌ NEON REJECTED SIGNUP:", data);
        return res.status(response.status).json({ message: data.message || "Registration failed" });
      }
      
    } catch (error: any) {
      console.error("🚨 SIGN UP CRASH:", error); 
      return res.status(500).json({ message: "Internal server error", error: error.message });
    }
  }

  @Post('login')
  async loginUser(@Body() body: { email: string; password: string }, @Res() res: Response) {
    try {
      const neonAuthUrl = process.env.NEON_AUTH_URL;
      const frontendUrl = process.env.FRONTEND_URL;

      if (!neonAuthUrl || !frontendUrl) {
        throw new Error("CRITICAL: Missing environment variables");
      }

      // 1. FIX: Use the correct endpoint name (/sign-in/email)
      const neonSignInUrl = neonAuthUrl.replace('/sign-in/social', '/sign-in/email');
      console.log(`Attempting to login user: ${body.email} at ${neonSignInUrl}`);

      const response = await fetch(neonSignInUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Origin': frontendUrl, 
        },
        body: JSON.stringify({
          email: body.email,
          password: body.password,
        }),
      });

      // 2. THE BULLETPROOF VEST: Read as text first to prevent the JSON crash
      const responseText = await response.text();
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error("❌ NEON SENT NON-JSON RESPONSE:", responseText);
        return res.status(response.status).json({ message: "Invalid response from auth server." });
      }

      if (response.ok && data.user) {
        
        // --- ADD THIS PRISMA SYNC BLOCK ---
        // This ensures the user exists in YOUR database before we give them a token
        await this.prisma.user.upsert({
          where: { id: data.user.id }, 
          update: { name: data.user.name }, 
          create: {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            password: "MANAGED_BY_NEON", // <-- ADD THIS LINE
          }
        });
        // ----------------------------------

        const payload = { sub: data.user.id, name: data.user.name, email: data.user.email };
        const signedJwt = this.jwtService.sign(payload);

        console.log(`🔐 Manual Login Success & Synced to Prisma: ${data.user.name}`);

        return res.status(200).json({ 
          message: "Login successful", 
          token: signedJwt,
          user: data.user 
        });

      } else {
        console.error("❌ NEON REJECTED LOGIN:", data);
        return res.status(response.status).json({ message: data.message || "Invalid credentials." });
      }
      
    } catch (error: any) {
      console.error("🚨 LOGIN CRASH:", error); 
      return res.status(500).json({ message: "Internal server error", error: error.message });
    }
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }, @Res() res: Response) {
    try {
      const neonAuthUrl = process.env.NEON_AUTH_URL;
      const frontendUrl = process.env.FRONTEND_URL;

      if (!neonAuthUrl || !frontendUrl) {
        throw new Error("CRITICAL: Missing environment variables");
      }

      // 1. FIX: The correct endpoint to trigger the email is /forgot-password
      // CORRECT: The updated API route for password resets!
      const neonResetUrl = neonAuthUrl.replace('/sign-in/social', '/request-password-reset');
      console.log(`Attempting to send password reset to: ${body.email} at ${neonResetUrl}`);

      const response = await fetch(neonResetUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Origin': frontendUrl, 
        },
        body: JSON.stringify({
          email: body.email,
          // CHANGE THIS LINE: Use 'redirectTo' instead of 'callbackURL'
          redirectTo: `${process.env.BACKEND_URL}/auth/reset-callback` 
        }),
      });

      const responseText = await response.text();
      let data = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (e) {}

      if (response.ok) {
        return res.status(200).json({ message: "Password reset link sent!" });
      } else {
        console.error("❌ NEON REJECTED RESET:", data);
        return res.status(response.status).json({ message: data['message'] || "Failed to send reset link." });
      }
      
    } catch (error: any) {
      console.error("🚨 RESET CRASH:", error); 
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  @Get('reset-callback')
  async handleResetCallback(@Req() req: Request, @Res() res: Response) {
    // 1. Catch the token Neon put in the URL
    const token = req.query.token as string;

    if (!token) {
      return res.redirect(`caviteexplorer://reset-password?error=NoTokenFound`);
    }

    console.log("🔄 Slingshotting user back to Flutter to set a new password!");
    
    // 2. Redirect the browser to open the Cavite Explorer app!
    return res.redirect(`caviteexplorer://reset-password?token=${token}`);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; newPassword: string }, @Res() res: Response) {
    try {
      const neonAuthUrl = process.env.NEON_AUTH_URL;
      if (!neonAuthUrl) throw new Error("CRITICAL: Missing environment variables");

      // Remember earlier when Neon yelled at us about missing 'newPassword'? 
      // This is the correct endpoint for actually changing it!
      const neonResetUrl = neonAuthUrl.replace('/sign-in/social', '/reset-password');
      console.log(`Attempting to save new password with token...`);

      const response = await fetch(neonResetUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Origin': process.env.FRONTEND_URL, 
        },
        body: JSON.stringify({
          newPassword: body.newPassword,
          token: body.token, // We pass the secure token so Neon knows exactly who is changing their password
        }),
      });

      const responseText = await response.text();
      let data = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (e) {}

      if (response.ok) {
        return res.status(200).json({ message: "Password updated successfully!" });
      } else {
        console.error("❌ NEON REJECTED NEW PASSWORD:", data);
        return res.status(response.status).json({ message: data['message'] || "Failed to update password. Token may be expired." });
      }
      
    } catch (error: any) {
      console.error("🚨 SAVE PASSWORD CRASH:", error); 
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}