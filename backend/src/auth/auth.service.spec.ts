import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedpassword',
    role: 'cliente' as const,
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const usersServiceMock = {
      existsByEmail: jest.fn(),
      existsByUsername: jest.fn(),
      create: jest.fn(),
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      findById: jest.fn(),
    };

    const jwtServiceMock = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService) as jest.Mocked<UsersService>;
    jwtService = module.get(JwtService) as jest.Mocked<JwtService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto = {
      username: 'newuser',
      email: 'new@example.com',
      password: 'password123',
      role: 'cliente' as const,
    };

    it('should register a new user successfully', async () => {
      usersService.existsByEmail.mockResolvedValue(false);
      usersService.existsByUsername.mockResolvedValue(false);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword123');
      usersService.create.mockResolvedValue({
        ...mockUser,
        id: '3',
        username: 'newuser',
        email: 'new@example.com',
        password: 'hashedpassword123',
      });
      jwtService.sign.mockReturnValue('test-token');

      const result = await service.register(registerDto);

      expect(result.user).toBeDefined();
      expect(result.token).toBe('test-token');
      expect(result.user.password).toBeUndefined();
      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'newuser',
          email: 'new@example.com',
          password: 'hashedpassword123',
          role: 'cliente',
        }),
      );
    });

    it('should throw ConflictException if email already exists', async () => {
      usersService.existsByEmail.mockResolvedValue(true);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException if username already exists', async () => {
      usersService.existsByEmail.mockResolvedValue(false);
      usersService.existsByUsername.mockResolvedValue(true);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should hash the password before saving', async () => {
      usersService.existsByEmail.mockResolvedValue(false);
      usersService.existsByUsername.mockResolvedValue(false);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword123');
      usersService.create.mockResolvedValue({
        ...mockUser,
        id: '3',
        username: 'newuser',
        email: 'new@example.com',
        password: 'hashedpassword123',
      });
      jwtService.sign.mockReturnValue('token');

      await service.register(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });

    it('should not return the password in the response', async () => {
      usersService.existsByEmail.mockResolvedValue(false);
      usersService.existsByUsername.mockResolvedValue(false);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpw');
      usersService.create.mockResolvedValue({
        id: '3',
        username: 'newuser',
        email: 'new@example.com',
        password: 'hashedpw',
        role: 'cliente',
        createdAt: '2026-01-01T00:00:00.000Z',
      });
      jwtService.sign.mockReturnValue('token');

      const result = await service.register(registerDto);
      expect(result.user).not.toHaveProperty('password');
    });

    it('should generate a JWT token on successful registration', async () => {
      usersService.existsByEmail.mockResolvedValue(false);
      usersService.existsByUsername.mockResolvedValue(false);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpw');
      usersService.create.mockResolvedValue({
        ...mockUser,
        id: '3',
        username: 'newuser',
        email: 'new@example.com',
        password: 'hashedpw',
      });
      jwtService.sign.mockReturnValue('generated-jwt-token');

      const result = await service.register(registerDto);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: '3',
          email: 'new@example.com',
          role: 'cliente',
        }),
      );
      expect(result.token).toBe('generated-jwt-token');
    });
  });

  describe('login', () => {
    it('should login successfully with email', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('login-token');

      const result = await service.login({
        identifier: 'test@example.com',
        password: 'password123',
      });

      expect(result.token).toBe('login-token');
      expect(result.user.password).toBeUndefined();
    });

    it('should login successfully with username', async () => {
      usersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('login-token');

      const result = await service.login({
        identifier: 'testuser',
        password: 'password123',
      });

      expect(result.token).toBe('login-token');
      expect(usersService.findByUsername).toHaveBeenCalledWith('testuser');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findByEmail.mockResolvedValue(undefined);
      usersService.findByUsername.mockResolvedValue(undefined);

      await expect(
        service.login({ identifier: 'unknown@test.com', password: 'pw' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is wrong', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({
          identifier: 'test@example.com',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should not return the password in the response', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('token');

      const result = await service.login({
        identifier: 'test@example.com',
        password: 'password123',
      });

      expect(result.user).not.toHaveProperty('password');
    });

    it('should differentiate email vs username by presence of @', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('token');

      await service.login({
        identifier: 'user@domain.com',
        password: 'pw',
      });
      expect(usersService.findByEmail).toHaveBeenCalled();
      expect(usersService.findByUsername).not.toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('should return user profile without password', async () => {
      usersService.findById.mockResolvedValue(mockUser);

      const result = await service.getProfile('1');

      expect(result).toBeDefined();
      expect(result.id).toBe('1');
      expect(result.email).toBe('test@example.com');
      expect(result).not.toHaveProperty('password');
    });

    it('should throw BadRequestException if user not found', async () => {
      usersService.findById.mockResolvedValue(undefined);

      await expect(service.getProfile('999')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('generateToken (private via sign)', () => {
    it('should generate a token with correct payload structure', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('token');

      await service.login({
        identifier: 'test@example.com',
        password: 'password123',
      });

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
    });
  });
});
