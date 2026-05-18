import { Injectable, OnModuleInit } from '@nestjs/common';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  role: 'cliente' | 'asesor';
  createdAt: string;
}

@Injectable()
export class UsersService implements OnModuleInit {
  private dataPath: string;
  private users: User[] = [];

  onModuleInit() {
    this.dataPath = join(process.cwd(), 'data.json');
    this.load();
  }

  private load() {
    if (existsSync(this.dataPath)) {
      const raw = readFileSync(this.dataPath, 'utf-8');
      const data = JSON.parse(raw);
      this.users = data.users || [];
    }
  }

  private save() {
    const raw = readFileSync(this.dataPath, 'utf-8');
    const data = JSON.parse(raw);
    data.users = this.users;
    writeFileSync(this.dataPath, JSON.stringify(data, null, 2));
  }

  async create(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const newUser: User = {
      ...user,
      id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
      createdAt: new Date().toISOString(),
    };
    this.users.push(newUser);
    this.save();
    return newUser;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.users.find(u => u.email === email);
  }

  async findByUsername(username: string): Promise<User | undefined> {
    return this.users.find(u => u.username === username);
  }

  async findById(id: string): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async findAll(): Promise<User[]> {
    return this.users;
  }

  async existsByEmail(email: string): Promise<boolean> {
    return this.users.some(u => u.email === email);
  }

  async existsByUsername(username: string): Promise<boolean> {
    return this.users.some(u => u.username === username);
  }
}
