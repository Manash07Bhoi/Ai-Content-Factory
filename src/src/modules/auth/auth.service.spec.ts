import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UsersRepository } from '../users/users.repository';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { authenticator } from 'otplib';
import { Role } from '../../common/enums/role.enum';
import { UserResponseDto } from '../users/dto/user-response.dto';

jest.mock('bcrypt');
jest.mock('otplib', () => ({
  authenticator: {
    verify: jest.fn(),
  },
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let usersRepository: jest.Mocked<UsersRepository>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = {
    id: 'test-uuid',
    email: 'test@example.com',
    password_hash: 'hashed_pw',
    role: Role.CUSTOMER,
    two_factor_enabled: false,
    two_factor_secret: 'secret',
  };

  beforeEach(async () => {
    usersService = {
      create: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    usersRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<UsersRepository>;

    jwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    const configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'jwt.refreshSecret') return 'refreshSecret';
        if (key === 'jwt.refreshExpiresIn') return '7d';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: UsersRepository, useValue: usersRepository },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should register and return tokens', async () => {
      usersService.create.mockResolvedValue(new UserResponseDto(mockUser));
      jwtService.sign.mockImplementation((payload: unknown) =>
        (payload as { type?: string }).type ? 'refresh-token' : 'access-token',
      );

      const result = await service.register({
        email: 'test@example.com',
        password: 'pw',
      });

      expect(usersService.create.mock.calls.length).toBe(1);
      expect(usersService.create.mock.calls[0][0]).toEqual({
        email: 'test@example.com',
        password: 'pw',
      });
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.user.email).toBe(mockUser.email);
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException for non-existent user', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);
      await expect(
        service.login({ email: 'bad', password: 'pw' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for bad password', async () => {
      usersRepository.findByEmail.mockResolvedValue(
        mockUser as unknown as import('../users/entities/user.entity').User,
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return temp token if 2FA enabled', async () => {
      usersRepository.findByEmail.mockResolvedValue({
        ...mockUser,
        two_factor_enabled: true,
      } as unknown as import('../users/entities/user.entity').User);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('temp-token');

      const result = await service.login({
        email: 'test@example.com',
        password: 'pw',
      });
      expect(result).toEqual({ requires2fa: true, tempToken: 'temp-token' });
    });

    it('should return tokens if valid and 2FA disabled', async () => {
      usersRepository.findByEmail.mockResolvedValue(
        mockUser as unknown as import('../users/entities/user.entity').User,
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockImplementation((payload: unknown) =>
        (payload as { type?: string }).type ? 'refresh-token' : 'access-token',
      );

      const result = await service.login({
        email: 'test@example.com',
        password: 'pw',
      });
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
    });
  });

  describe('verify2fa', () => {
    it('should throw UnauthorizedException if token type is invalid', async () => {
      jwtService.verify.mockReturnValue({ type: 'refresh', sub: 'test-uuid' });
      await expect(service.verify2fa('token', 'code')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should verify code and return tokens', async () => {
      jwtService.verify.mockReturnValue({ type: 'pre_2fa', sub: 'test-uuid' });
      usersRepository.findById.mockResolvedValue(
        mockUser as unknown as import('../users/entities/user.entity').User,
      );
      (
        authenticator as unknown as { verify: jest.Mock }
      ).verify.mockReturnValue(true);
      jwtService.sign.mockImplementation((payload: unknown) =>
        (payload as { type?: string }).type ? 'refresh-token' : 'access-token',
      );

      const result = await service.verify2fa('token', '123456');
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
    });
  });

  describe('refresh', () => {
    it('should throw if token type is invalid', async () => {
      jwtService.verify.mockReturnValue({ type: 'access', sub: 'test-uuid' });
      await expect(service.refresh({ refreshToken: 'token' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should refresh and return tokens', async () => {
      jwtService.verify.mockReturnValue({ type: 'refresh', sub: 'test-uuid' });
      usersRepository.findById.mockResolvedValue(
        mockUser as unknown as import('../users/entities/user.entity').User,
      );
      jwtService.sign.mockImplementation((payload: unknown) =>
        (payload as { type?: string }).type ? 'refresh-token' : 'access-token',
      );

      const result = await service.refresh({ refreshToken: 'token' });
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
    });
  });
});
