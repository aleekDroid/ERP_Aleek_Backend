// src/auth/entities/usuario.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'nombre_completo', type: 'varchar', length: 255 })
  nombre_completo!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  username!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  password!: string;

  @Column('uuid', { array: true, nullable: true })
  permisos_globales!: string[];

  @Column({ name: 'creado_en', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  creado_en!: Date;

  @Column({ name: 'last_login', type: 'timestamp', nullable: true })
  last_login!: Date;
}