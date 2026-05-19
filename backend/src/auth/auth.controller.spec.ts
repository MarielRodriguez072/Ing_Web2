import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockUser = {
    user: {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      role: 'cliente',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    token: 'jwt-token',
  };

  const mockProfile = {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    role: 'cliente',
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const authServiceMock = {
      register: jest.fn(),
      login: jest.fn(),
      getProfile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService) as jest.Mocked<AuthService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a user and return user + token', async () => {
      authService.register.mockResolvedValue(mockUser);

      const dto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'cliente' as const,
      };

      const result = await controller.register(dto);

      expect(result).toEqual(mockUser);
      expect(authService.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('should login and return user + token', async () => {
      authService.login.mockResolvedValue(mockUser);

      const dto = {
        identifier: 'test@example.com',
        password: 'password123',
      };

      const result = await controller.login(dto);

      expect(result).toEqual(mockUser);
      expect(authService.login).toHaveBeenCalledWith(dto);
    });
  });

  describe('getProfile', () => {
    it('should return profile for authenticated user', async () => {
      authService.getProfile.mockResolvedValue(mockProfile);

      const req = { user: { sub: '1', email: 'test@example.com', role: 'cliente' } };
      const result = await controller.getProfile(req);

      expect(result).toEqual(mockProfile);
      expect(authService.getProfile).toHaveBeenCalledWith('1');
    });

    it('should call getProfile with correct user id from token', async () => {
      authService.getProfile.mockResolvedValue(mockProfile);

      const req = { user: { sub: '2', email: 'other@test.com', role: 'asesor' } };
      await controller.getProfile(req);

      expect(authService.getProfile).toHaveBeenCalledWith('2');
    });
  });
});
