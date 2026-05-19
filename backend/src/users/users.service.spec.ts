import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import * as fs from 'fs';

jest.mock('fs');

describe('UsersService', () => {
  let service: UsersService;
  const mockUsers = [
    {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpw',
      role: 'cliente' as const,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: '2',
      username: 'asesoruser',
      email: 'asesor@example.com',
      password: 'hashedpw2',
      role: 'asesor' as const,
      createdAt: '2026-01-02T00:00:00.000Z',
    },
  ];

  const mockData = JSON.stringify({ users: mockUsers });

  beforeEach(async () => {
    jest.clearAllMocks();

    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(mockData);
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService],
    }).compile();

    service = module.get<UsersService>(UsersService);
    service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should load users from file on init', async () => {
    const users = await service.findAll();
    expect(users).toHaveLength(2);
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const newUser = await service.create({
        username: 'newuser',
        email: 'new@example.com',
        password: 'newhashedpw',
        role: 'cliente',
      });

      expect(newUser).toBeDefined();
      expect(newUser.id).toBeDefined();
      expect(newUser.username).toBe('newuser');
      expect(newUser.email).toBe('new@example.com');
      expect(newUser.role).toBe('cliente');
      expect(newUser.createdAt).toBeDefined();
      expect(newUser.password).toBe('newhashedpw');
    });

    it('should persist created user to file', async () => {
      // Simulate readFileSync returning initial data then updated data
      (fs.readFileSync as jest.Mock).mockReturnValueOnce(mockData);
      (fs.readFileSync as jest.Mock).mockReturnValueOnce(mockData);

      const newUser = await service.create({
        username: 'another',
        email: 'another@example.com',
        password: 'pw',
        role: 'asesor',
      });

      expect(fs.writeFileSync).toHaveBeenCalled();
      const allUsers = await service.findAll();
      expect(allUsers).toHaveLength(3);
    });
  });

  describe('findByEmail', () => {
    it('should find a user by email', async () => {
      const user = await service.findByEmail('test@example.com');
      expect(user).toBeDefined();
      expect(user!.email).toBe('test@example.com');
      expect(user!.username).toBe('testuser');
    });

    it('should return undefined if email does not exist', async () => {
      const user = await service.findByEmail('nonexistent@example.com');
      expect(user).toBeUndefined();
    });
  });

  describe('findByUsername', () => {
    it('should find a user by username', async () => {
      const user = await service.findByUsername('testuser');
      expect(user).toBeDefined();
      expect(user!.username).toBe('testuser');
      expect(user!.email).toBe('test@example.com');
    });

    it('should return undefined if username does not exist', async () => {
      const user = await service.findByUsername('unknown');
      expect(user).toBeUndefined();
    });
  });

  describe('findById', () => {
    it('should find a user by id', async () => {
      const user = await service.findById('1');
      expect(user).toBeDefined();
      expect(user!.id).toBe('1');
      expect(user!.username).toBe('testuser');
    });

    it('should return undefined if id does not exist', async () => {
      const user = await service.findById('999');
      expect(user).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = await service.findAll();
      expect(users).toHaveLength(2);
      expect(users[0].email).toBe('test@example.com');
      expect(users[1].email).toBe('asesor@example.com');
    });
  });

  describe('existsByEmail', () => {
    it('should return true if email exists', async () => {
      const exists = await service.existsByEmail('test@example.com');
      expect(exists).toBe(true);
    });

    it('should return false if email does not exist', async () => {
      const exists = await service.existsByEmail('nope@example.com');
      expect(exists).toBe(false);
    });
  });

  describe('existsByUsername', () => {
    it('should return true if username exists', async () => {
      const exists = await service.existsByUsername('testuser');
      expect(exists).toBe(true);
    });

    it('should return false if username does not exist', async () => {
      const exists = await service.existsByUsername('nobody');
      expect(exists).toBe(false);
    });
  });

  describe('file handling', () => {
    it('should call existsSync on init', () => {
      expect(fs.existsSync).toHaveBeenCalled();
    });

    it('should call readFileSync on init', () => {
      expect(fs.readFileSync).toHaveBeenCalled();
    });

    it('should call writeFileSync when creating user', async () => {
      (fs.readFileSync as jest.Mock).mockReturnValue(mockData);
      await service.create({
        username: 'saveuser',
        email: 'save@example.com',
        password: 'pw',
        role: 'cliente',
      });
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });
});
