import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import * as fs from 'fs';

jest.mock('fs');

describe('ExpensesService', () => {
  let service: ExpensesService;
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

  const mockData = JSON.stringify({ users: [], expenses: mockExpenses });

  beforeEach(async () => {
    jest.clearAllMocks();

    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(mockData);
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [ExpensesService],
    }).compile();

    service = module.get<ExpensesService>(ExpensesService);
    service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new expense', async () => {
      const dto = {
        commerce: 'Restaurante',
        amount: 3000,
        date: '2026-02-01',
        category: 'comida',
        description: 'Cena',
      };

      const expense = await service.create('user1', dto);

      expect(expense).toBeDefined();
      expect(expense.id).toBeDefined();
      expect(expense.userId).toBe('user1');
      expect(expense.commerce).toBe('Restaurante');
      expect(expense.amount).toBe(3000);
      expect(expense.category).toBe('comida');
      expect(expense.description).toBe('Cena');
    });

    it('should create expense without optional description', async () => {
      const dto = {
        commerce: 'Tienda',
        amount: 1000,
        date: '2026-02-01',
        category: 'otro',
      };

      const expense = await service.create('user1', dto);

      expect(expense).toBeDefined();
      expect(expense.commerce).toBe('Tienda');
      expect(expense.description).toBeUndefined();
    });

    it('should persist the new expense to file', async () => {
      const dto = {
        commerce: 'Librería',
        amount: 2500,
        date: '2026-03-01',
        category: 'educacion',
      };

      await service.create('user3', dto);

      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });

  describe('findAllByUser', () => {
    it('should return all expenses for a specific user', async () => {
      const expenses = await service.findAllByUser('user1');

      expect(expenses).toHaveLength(2);
      expect(expenses.every(e => e.userId === 'user1')).toBe(true);
    });

    it('should return empty array if user has no expenses', async () => {
      const expenses = await service.findAllByUser('nonexistent');

      expect(expenses).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should find an expense by id and userId', async () => {
      const expense = await service.findOne('exp1', 'user1');

      expect(expense).toBeDefined();
      expect(expense.id).toBe('exp1');
      expect(expense.commerce).toBe('Supermercado');
    });

    it('should throw NotFoundException if expense not found', async () => {
      await expect(service.findOne('nonexistent', 'user1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if expense belongs to another user', async () => {
      await expect(service.findOne('exp1', 'user2')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove an expense by id and userId', async () => {
      await service.remove('exp1', 'user1');

      const remaining = await service.findAllByUser('user1');
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe('exp2');
    });

    it('should throw NotFoundException if expense not found for user', async () => {
      await expect(
        service.remove('nonexistent', 'user1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if expense belongs to another user', async () => {
      await expect(service.remove('exp1', 'user2')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should persist changes after removal', async () => {
      await service.remove('exp1', 'user1');

      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });

  describe('findAllForAsesor', () => {
    it('should return all expenses for asesor role', async () => {
      const expenses = await service.findAllForAsesor();

      expect(expenses).toHaveLength(3);
    });

    it('should return expenses from all users', async () => {
      const expenses = await service.findAllForAsesor();

      const userIds = [...new Set(expenses.map(e => e.userId))];
      expect(userIds).toHaveLength(2);
      expect(userIds).toContain('user1');
      expect(userIds).toContain('user2');
    });
  });
});
