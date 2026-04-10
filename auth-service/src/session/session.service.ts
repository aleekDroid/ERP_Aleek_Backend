// src/session/session.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Session } from './schemas/session.schema';
import Redis from 'ioredis';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly redisClient: Redis;

  constructor(
    @InjectModel(Session.name) private sessionModel: Model<Session>,
    private configService: ConfigService,
  ) {
    // 1. Conectar a Redis usando la URL de tus variables de entorno
    const redisUrl = this.configService.get<string>('REDIS_URL');
    this.redisClient = new Redis(redisUrl || 'redis://localhost:6379');

    this.redisClient.on('connect', () => {
      this.logger.log('✅ Conectado a Redis exitosamente');
    });

    this.redisClient.on('error', (err) => {
      this.logger.error('❌ Error conectando a Redis:', err);
    });
  }

  // 2. Función para guardar la sesión doblemente
  async saveSession(userId: string, token: string) {
    const ttlSeconds = 8 * 60 * 60; // 8 horas en segundos

    try {
      // --- PASO A: Guardar en Redis (Primario) ---
      // Usamos 'session:id_del_usuario' como llave
      await this.redisClient.set(`session:${userId}`, token, 'EX', ttlSeconds);
      this.logger.log(`⚡ Sesión rápida guardada en Redis (Usuario: ${userId})`);

      // --- PASO B: Guardar en Mongo (Respaldo) ---
      // Borramos cualquier sesión vieja de este usuario para no hacer basura
      await this.sessionModel.deleteOne({ userId }); 
      
      const newSession = new this.sessionModel({ userId, token });
      await newSession.save();
      this.logger.log(`💾 Sesión de respaldo guardada en Mongo (Usuario: ${userId})`);

    } catch (error) {
      this.logger.error('Error al guardar la sesión', error);
      throw error;
    }
  }
}