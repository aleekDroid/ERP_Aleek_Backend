import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users') // La ruta será http://localhost:3002/users.
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }
}