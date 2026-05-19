import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async findAll(@Request() req) {
    if (req.user.role !== 'asesor') {
      return [];
    }
    const users = await this.usersService.findAll();
    return users
      .filter(u => u.role === 'cliente')
      .map(({ password, ...rest }) => rest);
  }
}
