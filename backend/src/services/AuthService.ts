import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UserRepository, User } from '../repositories/UserRepository.js';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResult {
  user: Omit<User, 'password_hash'>;
  tokens: TokenPair;
}

// Token blacklist: userId -> timestamp when all prior tokens were invalidated
// This is in-memory; survives until server restart. For multi-instance, move to Redis/DB.
const tokenBlacklist = new Map<number, number>();

// Account lockout: 5 failed attempts within 15 minutes = 15-minute lockout
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

interface LoginAttempt {
  count: number;
  firstAttempt: number;
  lockedUntil: number | null;
}

const loginAttempts = new Map<string, LoginAttempt>();

// Clean up old entries every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, attempt] of loginAttempts) {
    if (attempt.lockedUntil && now > attempt.lockedUntil) {
      loginAttempts.delete(key);
    } else if (now - attempt.firstAttempt > LOCKOUT_WINDOW_MS) {
      loginAttempts.delete(key);
    }
  }
}, 30 * 60 * 1000);

export class AuthService {
  constructor(private userRepo: UserRepository) {}

  async login(username: string, password: string): Promise<LoginResult> {
    const key = username.toLowerCase();

    // Check lockout
    const attempt = loginAttempts.get(key);
    if (attempt?.lockedUntil && Date.now() < attempt.lockedUntil) {
      const minutesLeft = Math.ceil((attempt.lockedUntil - Date.now()) / 60000);
      throw new AuthError(`Account temporarily locked. Try again in ${minutesLeft} minute(s).`, 429);
    }

    const user = await this.userRepo.findByUsername(username);
    if (!user || user.status === 'inactive') {
      this.recordFailedAttempt(key);
      throw new AuthError('Invalid username or password');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      this.recordFailedAttempt(key);
      throw new AuthError('Invalid username or password');
    }

    // Successful login — clear attempts
    loginAttempts.delete(key);

    const tokens = this.generateTokens(user);
    const { password_hash, ...safeUser } = user;

    return { user: safeUser, tokens };
  }

  private recordFailedAttempt(key: string): void {
    const now = Date.now();
    const attempt = loginAttempts.get(key);

    if (!attempt || now - attempt.firstAttempt > LOCKOUT_WINDOW_MS) {
      loginAttempts.set(key, { count: 1, firstAttempt: now, lockedUntil: null });
      return;
    }

    attempt.count++;
    if (attempt.count >= MAX_FAILED_ATTEMPTS) {
      attempt.lockedUntil = now + LOCKOUT_DURATION_MS;
    }
  }

  async refreshToken(token: string): Promise<TokenPair> {
    try {
      const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as jwt.JwtPayload;
      const user = await this.userRepo.findById(payload.userId);

      if (!user || user.status === 'inactive') {
        throw new AuthError('Invalid refresh token');
      }

      return this.generateTokens(user);
    } catch {
      throw new AuthError('Invalid refresh token');
    }
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new AuthError('User not found');

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) throw new AuthError('Current password is incorrect');

    const hash = await bcrypt.hash(newPassword, env.BCRYPT_SALT_ROUNDS);
    await this.userRepo.updatePassword(userId, hash);

    // Invalidate all existing tokens for this user
    this.invalidateUserTokens(userId);
  }

  /** Blacklist all tokens issued before now for a user */
  invalidateUserTokens(userId: number): void {
    tokenBlacklist.set(userId, Date.now());
  }

  /** Check if a token was issued before the user's tokens were invalidated */
  isTokenBlacklisted(userId: number, tokenIssuedAt: number): boolean {
    const blacklistedAt = tokenBlacklist.get(userId);
    if (!blacklistedAt) return false;
    // Token issued at (seconds) vs blacklisted at (ms)
    return (tokenIssuedAt * 1000) <= blacklistedAt;
  }

  verifyAccessToken(token: string): jwt.JwtPayload {
    try {
      return jwt.verify(token, env.JWT_ACCESS_SECRET) as jwt.JwtPayload;
    } catch {
      throw new AuthError('Invalid or expired token');
    }
  }

  private generateTokens(user: User): TokenPair {
    const payload = { userId: user.id, role: user.role, orgId: user.organization_id };

    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.ACCESS_TOKEN_EXPIRY as jwt.SignOptions['expiresIn'],
    });

    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.REFRESH_TOKEN_EXPIRY as jwt.SignOptions['expiresIn'],
    });

    return { accessToken, refreshToken };
  }
}

export class AuthError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}
