import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Role } from '../../common/enums/role.enum';
import { User } from './entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let mockRepo: jest.Mocked<UsersRepository>;

  const mockUser: User = {
    id: 'test-uuid',
    email: 'test@example.com',
    password_hash: 'hashed_pw',
    role: Role.CUSTOMER,
    two_factor_enabled: false,
    two_factor_secret: '',
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null as unknown as Date,
  };

  beforeEach(async () => {
    mockRepo = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<UsersRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('create', () => {
    it('should throw ConflictException if email exists', async () => {
      mockRepo.findByEmail.mockResolvedValue(mockUser);
      await expect(
        service.create({ email: 'test@example.com', password: 'pw' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create and return a user', async () => {
      mockRepo.findByEmail.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue(mockUser);

      const result = await service.create({
        email: 'test@example.com',
        password: 'pw',
      });

      expect(mockRepo.create.mock.calls.length).toBe(1);
      const createCallArg = mockRepo.create.mock.calls[0][0];
      expect(createCallArg.email).toBe('test@example.com');
      expect(createCallArg.password_hash).toBeDefined();
      expect(createCallArg.password_hash).not.toBe('pw');
      expect((createCallArg as { password?: string }).password).toBeUndefined();
      expect(result.email).toBe(mockUser.email);
      expect(
        (result as unknown as { password_hash?: string }).password_hash,
      ).toBeUndefined(); // ensure password stripped in response
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if user not found', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.findOne('missing-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return a user', async () => {
      mockRepo.findById.mockResolvedValue(mockUser);
      const result = await service.findOne('test-uuid');
      expect(result.id).toBe(mockUser.id);
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      mockRepo.findAll.mockResolvedValue([[mockUser], 1]);
      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if user not found', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(
        service.update('missing', {}, { sub: 'missing', role: 'admin' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if new email is taken', async () => {
      mockRepo.findById.mockResolvedValue(mockUser);
      mockRepo.findByEmail.mockResolvedValue({ id: 'other-uuid', ...mockUser });

      await expect(
        service.update(
          'test-uuid',
          { email: 'other@example.com' },
          { sub: 'test-uuid', role: 'customer' },
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw UnauthorizedException if user updates another profile', async () => {
      await expect(
        service.update(
          'other-uuid',
          {},
          { sub: 'test-uuid', role: 'customer' },
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if non-admin updates role', async () => {
      mockRepo.findById.mockResolvedValue(mockUser);
      await expect(
        service.update(
          'test-uuid',
          { role: Role.ADMIN },
          { sub: 'test-uuid', role: 'customer' },
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should update and return user', async () => {
      mockRepo.findById.mockResolvedValue(mockUser);
      mockRepo.update.mockResolvedValue({
        ...mockUser,
        role: Role.ADMIN,
      });

      const result = await service.update(
        'test-uuid',
        { role: Role.ADMIN, password: 'new_pw' },
        { sub: 'test-uuid', role: 'admin' },
      );

      expect(mockRepo.update.mock.calls.length).toBe(1);
      const updateCallArgs = mockRepo.update.mock.calls[0];
      expect(updateCallArgs[0]).toBe('test-uuid');
      expect(updateCallArgs[1].password_hash).toBeDefined();
      expect(updateCallArgs[1].password_hash).not.toBe('new_pw');
      expect(
        (updateCallArgs[1] as { password?: string }).password,
      ).toBeUndefined();
      expect(result.role).toBe(Role.ADMIN);
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException if user not found', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should soft delete user', async () => {
      mockRepo.findById.mockResolvedValue(mockUser);
      await service.remove('test-uuid');
      expect(mockRepo.softDelete.mock.calls.length).toBe(1);
      expect(mockRepo.softDelete.mock.calls[0][0]).toBe('test-uuid');
    });
  });
});
