import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  @Get()
  async findAll(@Request() req, @Query('userId') userId?: string) {
    if (req.user.role === 'asesor') {
      if (userId) {
        return this.expensesService.findAllByUser(userId);
      }
      return this.expensesService.findAllForAsesor();
    }
    return this.expensesService.findAllByUser(req.user.userId);
  }

  @Post()
  async create(@Request() req, @Body() dto: CreateExpenseDto) {
    return this.expensesService.create(req.user.userId, dto);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    await this.expensesService.remove(id, req.user.userId);
    return { success: true };
  }
}
