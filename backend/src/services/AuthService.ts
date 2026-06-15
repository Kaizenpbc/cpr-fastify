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

export class AuthService {
  constructor(private userRepo: UserRepository) {}

  async login(username: string, password: string): Promise<LoginResult> {
    const user = await this.userRepo.findByUsername(username);
    if (!user || user.status === 'inactive') {
      throw new AuthError('Invalid username or password');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new AuthError('Invalid username or password');
    }

    const tokens = this.generateTokens(user);
    const { password_hash, ...safeUser } = user;

    return { user: safeUser, tokens };
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
