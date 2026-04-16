// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
  ) {}

  async findAll() {
      const usuarios = await this.usuarioRepository.find({
        order: { creado_en: 'DESC' },
      });

      // Convertimos los UUIDs a nombres de permisos para que Angular los entienda
      for (const user of usuarios) {
        if (user.permisos_globales && user.permisos_globales.length > 0) {
          const result = await this.usuarioRepository.query(
            `SELECT nombre FROM permisos WHERE id = ANY($1)`,
            [user.permisos_globales]
          );
          user.permisos_globales = result.map((p: any) => p.nombre);
        } else {
          user.permisos_globales = [];
        }
      }
      return usuarios;
    }
  
  async updatePermissions(userId: string, permisosNombres: string[]) {
    const usuario = await this.usuarioRepository.findOne({ where: { id: userId } });
    
    if (!usuario) {
      throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
    }

    if (permisosNombres && permisosNombres.length > 0) {
      // Buscamos los UUIDs reales en la tabla permisos usando los nombres
      const result = await this.usuarioRepository.query(
        `SELECT id FROM permisos WHERE nombre = ANY($1)`,
        [permisosNombres]
      );
      // Guardamos el arreglo de UUIDs
      usuario.permisos_globales = result.map((p: any) => p.id);
    } else {
      // Si le quitaron todas las palomitas, lo dejamos vacío
      usuario.permisos_globales = [];
    }

    await this.usuarioRepository.save(usuario);
    return { message: 'Permisos actualizados correctamente' };
  }
}