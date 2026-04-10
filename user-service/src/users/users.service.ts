import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
  ) {}

  async findAll() {
    // Retornamos la lista ordenada por fecha de creación.
    return await this.usuarioRepository.find({
      select: ['id', 'nombre_completo', 'username', 'email', 'creado_en'],
      order: { creado_en: 'DESC' },
    });
  }
}