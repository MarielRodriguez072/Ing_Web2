import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  const mockUsers = [
    {
      id: '1',
      username: 'cliente1',
      email: 'cliente1@test.com',
      password: 'secret',
      role: 'cliente' as const,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: '2',
      username: 'cliente2',
      email: 'cliente2@test.com',
      password: 'secret2',
      role: 'cliente' as const,
      createdAt: '2026-01-02T00:00:00.000Z',
    },
    {
      id: '3',
      username: 'asesor1',
      email: 'asesor1@test.com',
      password: 'secret3',
      role: 'asesor' as const,
      createdAt: '2026-01-03T00:00:00.000Z',
    },
  ];

  beforeEach(async () => {
    jest.clearAllMocks();

    const usersServiceMock = {
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersServiceMock }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService) as jest.Mocked<UsersService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return only clients (no password) for asesor role', async () => {
      usersService.findAll.mockResolvedValue(mockUsers);

      const req = { user: { userId: 'asesor1', role: 'asesor' } };
      const result = await controller.findAll(req);

      expect(result).toHaveLength(2);
      expect(result[0].username).toBe('cliente1');
      expect(result[1].username).toBe('cliente2');
      expect(result[0]).not.toHaveProperty('password');
      expect(result[1]).not.toHaveProperty('password');
    });

    it('should return empty array for cliente role', async () => {
      usersService.findAll.mockResolvedValue(mockUsers);

      const req = { user: { userId: 'cliente1', role: 'cliente' } };
      const result = await controller.findAll(req);

      expect(result).toEqual([]);
    });

    it('should not call findAll if user is not asesor', async () => {
      const req = { user: { userId: 'cliente1', role: 'cliente' } };
      await controller.findAll(req);

      expect(usersService.findAll).not.toHaveBeenCalled();
    });
  });
});
