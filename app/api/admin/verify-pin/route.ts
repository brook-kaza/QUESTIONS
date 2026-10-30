import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// In-memory rate limiting map for brute force prevention
interface RateLimitEntry {
  attempts: number;
  lockoutUntil: number;
}
const rateLimitMap = new Map<string, RateLimitEntry>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now > entry.lockoutUntil && entry.attempts <= 0) {
      rateLimitMap.delete(ip);
    }
  }
}, 60000);

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown-client';
    const body = await req.json();
    const pin = typeof body.pin === 'string' ? body.pin.trim() : '';

    const now = Date.now();
    const entry = rateLimitMap.get(ip) || { attempts: 0, lockoutUntil: 0 };

    // Check if client is locked out
    if (now < entry.lockoutUntil) {
      const waitSeconds = Math.ceil((entry.lockoutUntil - now) / 1000);
      return NextResponse.json(
        {
          success: false,
          error: `በርካታ የተሳሳቱ ሙከራዎች ተደርገዋል። እባክዎ ${waitSeconds} ሰከንድ ይጠብቁ።`,
          locked: true,
          retryAfter: waitSeconds,
        },
        { status: 429 }
      );
    }

    const expectedPin =
      process.env.ADMIN_PIN?.trim() ||
      process.env.NEXT_PUBLIC_ADMIN_PIN?.trim() ||
      '1234';

    // Constant-time comparison to prevent timing attacks
    const pinBuffer = Buffer.from(pin);
    const expectedBuffer = Buffer.from(expectedPin);
    const isMatch =
      pinBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(pinBuffer, expectedBuffer);

    if (!isMatch) {
      entry.attempts += 1;
      if (entry.attempts >= 5) {
        entry.lockoutUntil = now + 5 * 60 * 1000; // 5 minute lockout
        rateLimitMap.set(ip, entry);
        return NextResponse.json(
          {
            success: false,
            error: 'ተደጋጋሚ የተሳሳተ ሙከራ! ስርዓቱ ለ 5 ደቂቃዎች ተቆልፏል።',
            locked: true,
            retryAfter: 300,
          },
          { status: 429 }
        );
      }
      rateLimitMap.set(ip, entry);
      const remaining = 5 - entry.attempts;
      return NextResponse.json(
        {
          success: false,
          error: `የተሳሳተ ፒን ኮድ። (${remaining} ሙከራዎች ቀርተዋል)`,
          remainingAttempts: remaining,
        },
        { status: 401 }
      );
    }

    // Success: Reset rate limit
    rateLimitMap.delete(ip);

    // Create a time-limited session token
    const secret = process.env.ADMIN_SECRET || expectedPin + '-session-secret-salt';
    const timestamp = Date.now();
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${ip}:${timestamp}`)
      .digest('hex');
    const token = `${timestamp}.${signature}`;

    const response = NextResponse.json({
      success: true,
      token,
      message: 'እንኳን በደህና መጡ',
    });

    // Also set httpOnly cookie for extra resilience
    response.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'የማረጋገጫ ስህተት አጋጥሟል' },
      { status: 500 }
    );
  }
}

