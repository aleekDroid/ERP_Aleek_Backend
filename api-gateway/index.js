const Fastify = require('fastify');
const fastifyHttpProxy = require('@fastify/http-proxy');
const jwt = require('jsonwebtoken');
const Redis = require('ioredis');
const mongoose = require('mongoose');
require('dotenv').config();

const fastify = Fastify({ logger: true });

// --- CONEXIONES A BASES DE DATOS (Para validar sesiones) ---
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('✅ Gateway conectado a Mongo (Fallback de sesiones)'))
  .catch(err => console.error('❌ Error conectando Mongo en Gateway:', err));

// Molde rápido de Mongo para leer la sesión
const sessionSchema = new mongoose.Schema({ userId: String, token: String });
const SessionModel = mongoose.model('Session', sessionSchema);

// --- MIDDLEWARE DE SESIÓN RESILIENTE ---
fastify.decorate('verifySession', async (request, reply) => {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];
    
    // 1. Validar firma del JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // 2. Buscar en Redis (Ruta rápida)
    const redisToken = await redis.get(`session:${userId}`);
    if (redisToken === token) {
      request.user = decoded; 
      return; 
    }

    // 3. Fallback: Buscar en Mongo (Ruta de emergencia si Redis falló)
    const mongoSession = await SessionModel.findOne({ userId, token });
    if (mongoSession) {
      // Restaurar en Redis para futuras peticiones
      await redis.set(`session:${userId}`, token, 'EX', 8 * 60 * 60);
      fastify.log.info(`🔄 Sesión restaurada desde Mongo a Redis para el usuario ${userId}`);
      request.user = decoded;
      return;
    }

    // Si no está ni en Redis ni en Mongo, la sesión ya no existe o se cerró
    return reply.code(401).send({ error: 'Sesión inválida o expirada' });

  } catch (err) {
    fastify.log.error(err);
    return reply.code(401).send({ error: 'Token inválido' });
  }
});

// --- RUTA DE SALUD ---
fastify.get('/api/health', async (request, reply) => {
  return { status: 'Gateway funcionando', service: 'API Gateway' };
});

// --- PROXIES (RUTEO HACIA MICROSERVICIOS) ---

// 1. Rutas Públicas (Auth) - Pasan directo sin middleware
fastify.register(fastifyHttpProxy, {
  upstream: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  prefix: '/auth', 
  rewritePrefix: '/auth'
});

// 2. Rutas Protegidas (Requieren Token)
fastify.register(async function (protectedRoutes) {
  // Le decimos a Fastify que ejecute el guardia ANTES de dejar pasar la petición
  protectedRoutes.addHook('preHandler', fastify.verifySession);

  // Si el guardia da luz verde, mandamos la petición al microservicio de usuarios
  protectedRoutes.register(fastifyHttpProxy, {
    upstream: process.env.USER_SERVICE_URL || 'http://localhost:3002',
    prefix: '/users', 
    rewritePrefix: '/users'
  });
});

// --- ARRANCAR SERVIDOR ---
const start = async () => {
  try {
    await fastify.listen({ port: process.env.PORT || 4000, host: '0.0.0.0' });
    console.log(`🚀 API Gateway escuchando en el puerto ${process.env.PORT || 4000}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();