// src/auth/auth.controller.ts
import { Controller, Post, Body, HttpStatus, Res, HttpException } from '@nestjs/common';
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

    } catch (error: any) {
      const status = error instanceof HttpException ? error.getStatus() : HttpStatus.UNAUTHORIZED;
      const message = error instanceof HttpException ? error.message : 'Credenciales inválidas';
      return res.status(status).json({
        statusCode: status,
        intOpCode: 'ExUS401', 
        data: { error: message }
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

    } catch (error: any) {
      const status = error instanceof HttpException ? error.getStatus() : HttpStatus.BAD_REQUEST;
      const message = error instanceof HttpException ? error.message : 'Error al registrar usuario';
      return res.status(status).json({
        statusCode: status,
        intOpCode: 'ExUS400',
        data: { error: message }
      });
    }
  }
}