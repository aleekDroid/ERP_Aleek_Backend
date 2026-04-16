// src/auth/auth.controller.ts
import { Controller, Post, Body, HttpStatus, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Response } from 'express'; 

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: any, @Res() res: Response) {
    try {
      const result = await this.authService.login(body); 
      
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        intOpCode: 'SxUS200',
        data: result 
      });

    } catch (error) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        statusCode: HttpStatus.UNAUTHORIZED,
        intOpCode: 'ExUS401', 
        data: { error: 'Credenciales inválidas' }
      });
    }
  }

  @Post('register')
  async register(@Body() body: any, @Res() res: Response) {
    try {
      const newUser = await this.authService.register(body); 
      
      return res.status(HttpStatus.CREATED).json({
        statusCode: HttpStatus.CREATED,
        intOpCode: 'SxUS201',
        data: newUser
      });

    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        intOpCode: 'ExUS400',
        data: { error: 'Error al registrar usuario' }
      });
    }
  }
}