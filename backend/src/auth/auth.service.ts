import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const emailExists = await this.usersService.existsByEmail(dto.email);
    if (emailExists) throw new ConflictException('Email ya registrado');

    const usernameExists = await this.usersService.existsByUsername(dto.username);
    if (usernameExists) throw new ConflictException('Usuario ya existe');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      username: dto.username,
      email: dto.email,
      password: hashedPassword,
      role: dto.role,
    });

    const { password, ...result } = user;
    const token = this.generateToken(user);
    return { user: result, token };
  }

  async login(dto: LoginDto) {
    const isEmail = dto.identifier.includes('@');
    const user = isEmail
      ? await this.usersService.findByEmail(dto.identifier)
      : await this.usersService.findByUsername(dto.identifier);

    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const validPassword = await bcrypt.compare(dto.password, user.password);
    if (!validPassword) throw new UnauthorizedException('Credenciales inválidas');

    const { password, ...result } = user;
    const token = this.generateToken(user);
    return { user: result, token };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new BadRequestException('Usuario no encontrado');
    const { password, ...result } = user;
    return result;
  }

  private generateToken(user: { id: string; email: string; role: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return this.jwtService.sign(payload);
  }
}
