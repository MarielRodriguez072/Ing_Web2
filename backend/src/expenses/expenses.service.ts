import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { CreateExpenseDto } from './dto/create-expense.dto';

export interface Expense {
  id: string;
  userId: string;
  commerce: string;
  amount: number;
  date: string;
  category: string;
  description?: string;
  createdAt: string;
}

@Injectable()
export class ExpensesService implements OnModuleInit {
  private dataPath: string;
  private expenses: Expense[] = [];

  onModuleInit() {
    this.dataPath = join(process.cwd(), 'data.json');
    this.load();
  }

  private load() {
    const raw = readFileSync(this.dataPath, 'utf-8');
    const data = JSON.parse(raw);
    this.expenses = data.expenses || [];
  }

  private save() {
    const raw = readFileSync(this.dataPath, 'utf-8');
    const data = JSON.parse(raw);
    data.expenses = this.expenses;
    writeFileSync(this.dataPath, JSON.stringify(data, null, 2));
  }

  async create(userId: string, dto: CreateExpenseDto): Promise<Expense> {
    const expense: Expense = {
      ...dto,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      userId,
      createdAt: new Date().toISOString(),
    };
    this.expenses.push(expense);
    this.save();
    return expense;
  }

  async findAllByUser(userId: string): Promise<Expense[]> {
    return this.expenses.filter(e => e.userId === userId);
  }

  async findOne(id: string, userId: string): Promise<Expense> {
    const expense = this.expenses.find(e => e.id === id && e.userId === userId);
    if (!expense) throw new NotFoundException('Gasto no encontrado');
    return expense;
  }

  async remove(id: string, userId: string): Promise<void> {
    const index = this.expenses.findIndex(e => e.id === id && e.userId === userId);
    if (index === -1) throw new NotFoundException('Gasto no encontrado');
    this.expenses.splice(index, 1);
    this.save();
  }

  async findAllForAsesor(): Promise<Expense[]> {
    return this.expenses;
  }
}
