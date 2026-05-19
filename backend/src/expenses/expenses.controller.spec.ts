import { Test, TestingModule } from '@nestjs/testing';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';

describe('ExpensesController', () => {
  let controller: ExpensesController;
  let expensesService: jest.Mocked<ExpensesService>;

  const mockExpenses = [
    {
      id: 'exp1',
      userId: 'user1',
      commerce: 'Supermercado',
      amount: 5000,
      date: '2026-01-15',
      category: 'comida',
      description: 'Compra semanal',
      createdAt: '2026-01-15T10:00:00.000Z',
    },
    {
      id: 'exp2',
      userId: 'user1',
      commerce: 'Farmacia',
      amount: 2000,
      date: '2026-01-16',
      category: 'salud',
      createdAt: '2026-01-16T10:00:00.000Z',
    },
  ];

  const mockAllExpenses = [
    ...mockExpenses,
    {
      id: 'exp3',
      userId: 'user2',
      commerce: 'Cine',
      amount: 1500,
      date: '2026-01-17',
      category: 'entretenimiento',
      createdAt: '2026-01-17T10:00:00.000Z',
    },
  ];

  beforeEach(async () => {
    jest.clearAllMocks();

    const expensesServiceMock = {
      findAllByUser: jest.fn(),
      findAllForAsesor: jest.fn(),
      create: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExpensesController],
      providers: [
        { provide: ExpensesService, useValue: expensesServiceMock },
      ],
    }).compile();

    controller = module.get<ExpensesController>(ExpensesController);
    expensesService = module.get(
      ExpensesService,
    ) as jest.Mocked<ExpensesService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return user expenses for cliente role', async () => {
      expensesService.findAllByUser.mockResolvedValue(mockExpenses);

      const req = {
        user: { userId: 'user1', email: 'test@test.com', role: 'cliente' },
      };

      const result = await controller.findAll(req);

      expect(result).toEqual(mockExpenses);
      expect(expensesService.findAllByUser).toHaveBeenCalledWith('user1');
      expect(expensesService.findAllForAsesor).not.toHaveBeenCalled();
    });

    it('should return all expenses for asesor role', async () => {
      expensesService.findAllForAsesor.mockResolvedValue(mockAllExpenses);

      const req = {
        user: { userId: 'user2', email: 'asesor@test.com', role: 'asesor' },
      };

      const result = await controller.findAll(req);

      expect(result).toEqual(mockAllExpenses);
      expect(expensesService.findAllForAsesor).toHaveBeenCalled();
      expect(expensesService.findAllByUser).not.toHaveBeenCalled();
    });

    it('should return expenses for a specific user when asesor passes userId query', async () => {
      expensesService.findAllByUser.mockResolvedValue(mockExpenses);

      const req = {
        user: { userId: 'asesor1', email: 'asesor@test.com', role: 'asesor' },
      };

      const result = await controller.findAll(req, 'user1');

      expect(result).toEqual(mockExpenses);
      expect(expensesService.findAllByUser).toHaveBeenCalledWith('user1');
      expect(expensesService.findAllForAsesor).not.toHaveBeenCalled();
    });

    it('should return empty array for cliente with no expenses', async () => {
      expensesService.findAllByUser.mockResolvedValue([]);

      const req = {
        user: { userId: 'newuser', email: 'new@test.com', role: 'cliente' },
      };

      const result = await controller.findAll(req);

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create a new expense for the authenticated user', async () => {
      const dto = {
        commerce: 'Restaurante',
        amount: 3000,
        date: '2026-02-01',
        category: 'comida',
        description: 'Cena',
      };

      const createdExpense = {
        ...dto,
        id: 'exp4',
        userId: 'user1',
        createdAt: '2026-02-01T12:00:00.000Z',
      };

      expensesService.create.mockResolvedValue(createdExpense);

      const req = {
        user: { userId: 'user1', email: 'test@test.com', role: 'cliente' },
      };

      const result = await controller.create(req, dto);

      expect(result).toEqual(createdExpense);
      expect(expensesService.create).toHaveBeenCalledWith('user1', dto);
    });
  });

  describe('remove', () => {
    it('should delete an expense and return success', async () => {
      expensesService.remove.mockResolvedValue(undefined);

      const req = {
        user: { userId: 'user1', email: 'test@test.com', role: 'cliente' },
      };

      const result = await controller.remove(req, 'exp1');

      expect(result).toEqual({ success: true });
      expect(expensesService.remove).toHaveBeenCalledWith('exp1', 'user1');
    });

    it('should propagate NotFoundException from service', async () => {
      expensesService.remove.mockRejectedValue(
        new (require('@nestjs/common').NotFoundException)('Gasto no encontrado'),
      );

      const req = {
        user: { userId: 'user1', email: 'test@test.com', role: 'cliente' },
      };

      await expect(controller.remove(req, 'nonexistent')).rejects.toThrow();
    });
  });
});
