// src/users/users.controller.ts
import { Controller, Get, Patch, Param, Body, HttpStatus, Res } from '@nestjs/common';
import { UsersService } from './users.service';
import type { Response } from 'express';

@Controller('users') // La ruta será http://localhost:3002/users.
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(@Res() res: Response) {
    try {
      const usuarios = await this.usersService.findAll();
      
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        intOpCode: 'SxUS200',
        data: usuarios
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        intOpCode: 'ExUS500',
        data: { error: 'Error obteniendo la lista de usuarios' }
      });
    }
  }

  @Patch(':id/permissions')
  async updatePermissions(
    @Param('id') id: string, 
    @Body('permisos') permisos: string[],
    @Res() res: Response
  ) {
    try {
      const resultado = await this.usersService.updatePermissions(id, permisos);
      
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        intOpCode: 'SxUS200',
        data: resultado
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        intOpCode: 'ExUS500',
        data: { error: 'Error al actualizar los permisos del usuario' }
      });
    }
  }
}