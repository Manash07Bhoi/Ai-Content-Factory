import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
const { authenticator } = require('otplib');
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UsersRepository } from '../users/users.repository';
import { UserResponseDto } from '../users/dto/user-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    // The service handles uniqueness checks inside usersService.create()
    const user = await this.usersService.create({
      email: registerDto.email,
      password: registerDto.password,
    });
    return this.generateTokens(user.id, user.email, user.role);
  }

  async login(loginDto: LoginDto) {
    const userEntity = await this.usersRepository.findByEmail(loginDto.email);
    if (!userEntity || !userEntity.password_hash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      userEntity.password_hash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (userEntity.two_factor_enabled) {
      const tempToken = this.jwtService.sign(
        {
          sub: userEntity.id,
          type: 'pre_2fa',
        },
        { expiresIn: '5m' },
      );
      return { requires2fa: true, tempToken };
    }

    return this.generateTokens(
      userEntity.id,
      userEntity.email,
      userEntity.role,
    );
  }

  async verify2fa(token: string, code: string) {
    try {
      const payload = this.jwtService.verify(token) as unknown as {
        type?: string;
        sub: string;
      };
      if (payload.type !== 'pre_2fa') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.usersRepository.findById(payload.sub);
      if (!user || !user.two_factor_secret) {
        throw new UnauthorizedException('2FA not configured');
      }

      const isValid = (
        authenticator as {
          verify: (opts: { token: string; secret: string }) => boolean;
        }
      ).verify({
        token: code,
        secret: user.two_factor_secret,
      });

      if (!isValid) {
        throw new UnauthorizedException('Invalid 2FA code');
      }

      return this.generateTokens(user.id, user.email, user.role);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async refresh(refreshTokenDto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify(refreshTokenDto.refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      }) as unknown as { type?: string; sub: string };

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.usersRepository.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.generateTokens(user.id, user.email, user.role);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  logout(_userId: string) {
    // For stateless JWT, logout is usually handled client-side by deleting tokens.
    // If using Redis for token blocklisting, we'd add the token to the blocklist here.
    return { success: true };
  }

  private generateTokens(userId: string, email: string, role: string) {
    const accessPayload = { sub: userId, email, role };
    const refreshPayload = { sub: userId, type: 'refresh' };

    const accessToken = this.jwtService.sign(accessPayload);
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret');
    if (!refreshSecret) throw new Error('JWT_REFRESH_SECRET is not defined');

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: refreshSecret,
      expiresIn: (this.configService.get<string>('jwt.refreshExpiresIn') || '7d') as any,
    });

    return {
      accessToken,
      refreshToken,
      user: new UserResponseDto({ id: userId, email, role: role as any }),
    };
  }
}
