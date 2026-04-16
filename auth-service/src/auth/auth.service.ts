// src/auth/auth.service.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt'; 
import { Usuario } from './entities/usuario.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto'; 
import { Logger } from '@nestjs/common';
import { SessionService } from '../session/session.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    constructor(
        @InjectRepository(Usuario)
        private usuarioRepository: Repository<Usuario>,
        private jwtService: JwtService, 
        private sessionService: SessionService,
    ) { }

    async register(registerDto: RegisterDto) {
        const { nombre_completo, username, email, password } = registerDto;

        // 1. Validar que vengan todos los campos
        if (!nombre_completo || !username || !email || !password) {
            throw new HttpException('Campos requeridos faltantes', HttpStatus.BAD_REQUEST);
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const nuevoUsuario = this.usuarioRepository.create({
                nombre_completo,
                username,
                email,
                password: hashedPassword,
            });

            const usuarioGuardado = await this.usuarioRepository.save(nuevoUsuario);
            this.logger.log(`Usuario registrado: ${usuarioGuardado.username} (${usuarioGuardado.id})`);

            return {
                id: usuarioGuardado.id,
                nombre_completo: usuarioGuardado.nombre_completo,
                username: usuarioGuardado.username,
                email: usuarioGuardado.email,
                creado_en: usuarioGuardado.creado_en,
            };

        } catch (error: any) {
            if (error.code === '23505') {
                throw new HttpException('Usuario o correo ya existe', HttpStatus.CONFLICT);
            }
            console.error(error);
            throw new HttpException('Error al registrar usuario', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async login(loginDto: LoginDto) {
        const { username, password } = loginDto;

        if (!username || !password) {
            this.logger.warn('Intento de login sin credenciales completas');
            throw new HttpException('Credenciales requeridas', HttpStatus.BAD_REQUEST);
        }

        const usuario = await this.usuarioRepository.findOne({ where: { username } });
        if (!usuario) {
            throw new HttpException('Usuario no encontrado', HttpStatus.UNAUTHORIZED); // 401
        }

        const passwordValida = await bcrypt.compare(password, usuario.password);
        if (!passwordValida) {
            this.logger.warn(`Intento de login fallido para usuario: ${username}`);
            throw new HttpException('Contraseña incorrecta', HttpStatus.UNAUTHORIZED); // 401
        }

        let permisosNombres: string[] = [];
    if (usuario.permisos_globales && usuario.permisos_globales.length > 0) {
        const result = await this.usuarioRepository.query(
            `SELECT nombre FROM permisos WHERE id = ANY($1)`,
            [usuario.permisos_globales]
        );
        permisosNombres = result.map((p: any) => p.nombre);
    }

        // Crear el Token
        const payload = { userId: usuario.id };
        const token = this.jwtService.sign(payload);
        await this.sessionService.saveSession(usuario.id, token);

        usuario.last_login = new Date();
        await this.usuarioRepository.save(usuario);

        this.logger.log(`Login exitoso para el usuario: ${username}`);

        return {
            token,
            user: {
                id: usuario.id,
                username: usuario.username,
                permisos: permisosNombres
            },
        };
    }
}