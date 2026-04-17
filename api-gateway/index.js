const Fastify = require('fastify');
const fastifyHttpProxy = require('@fastify/http-proxy');
const jwt = require('jsonwebtoken');
const Redis = require('ioredis');
const mongoose = require('mongoose');
require('dotenv').config();

const fastify = Fastify({ logger: true });

// --- 1. CORS GLOBAL ---
// Angular SOLO le hablará al Gateway (puerto 4000)
fastify.register(require('@fastify/cors'), {
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
});

// --- 2. RATE LIMITING ---
fastify.register(require('@fastify/rate-limit'), {
  max: 300,
  timeWindow: '1 minute',
  errorResponseBuilder: function (request, context) {
    // Formato JSON Universal para el error 429
    return {
      statusCode: 429,
      intOpCode: 'ERR429',
      data: { error: 'Too many requests', limit: context.max, after: context.after }
    };
  }
});

// --- CONEXIONES A BASES DE DATOS ---
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('✅ Gateway conectado a Mongo'))
  .catch(err => console.error('❌ Error conectando Mongo en Gateway:', err));

const sessionSchema = new mongoose.Schema({ userId: String, token: String });
const SessionModel = mongoose.model('Session', sessionSchema);

// --- 3. UTILIDAD: GENERADOR DE RESPUESTAS UNIVERSALES ---
// Función auxiliar para que el Gateway responda siempre con el mismo esquema
const sendUniversalResponse = (reply, statusCode, opCode, data) => {
  return reply.code(statusCode).send({
    statusCode: statusCode,
    intOpCode: opCode,
    data: data
  });
};

// --- 4. MIDDLEWARES (Hooks) ---

// Middleware A: Verificar Sesión (Auth)
fastify.decorate('verifySession', async (request, reply) => {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendUniversalResponse(reply, 401, 'AUTH401', { error: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const redisToken = await redis.get(`session:${userId}`);
    if (redisToken === token) {
      request.user = decoded; 
      return; 
    }

    const mongoSession = await SessionModel.findOne({ userId, token });
    if (mongoSession) {
      await redis.set(`session:${userId}`, token, 'EX', 8 * 60 * 60);
      request.user = decoded;
      return;
    }

    return sendUniversalResponse(reply, 401, 'AUTH401', { error: 'Sesión inválida o expirada' });
  } catch (err) {
    return sendUniversalResponse(reply, 401, 'AUTH401', { error: 'Token inválido o expirado' });
  }
});

// Middleware B: Verificar Permisos Globales (El API Gateway asume el control)
// Nota: El PDF pide validación por grupo, pero como primer paso, 
// validamos los permisos globales que vienen en el JWT.
fastify.decorate('requirePermission', function (requiredPermission) {
  return async function (request, reply) {
    // Si el usuario no tiene permisos, o no incluye el requerido, bloqueamos.
    // Asumimos que los permisos globales vienen en el token bajo request.user.permisos
    const userPermissions = request.user.permisos || [];
    
    if (!userPermissions.includes(requiredPermission)) {
      return sendUniversalResponse(reply, 403, 'AUTH403', { 
        error: `Acceso denegado. Se requiere el permiso: ${requiredPermission}` 
      });
    }
  };
});


// --- RUTA DE SALUD ---
fastify.get('/api/health', async (request, reply) => {
  return sendUniversalResponse(reply, 200, 'SYS200', { status: 'Gateway funcionando' });
});

// --- 5. PROXIES (RUTEO HACIA MICROSERVICIOS) ---

// A. Rutas Públicas (Auth) - Pasan directo
fastify.register(fastifyHttpProxy, {
  upstream: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  prefix: '/auth', 
  rewritePrefix: '/auth'
  // Nota: Lo ideal es que el auth-service ya devuelva el JSON universal.
});

// B. Rutas Protegidas de USUARIOS
fastify.register(async function (userRoutes) {
  userRoutes.addHook('preHandler', fastify.verifySession);
  
  userRoutes.register(fastifyHttpProxy, {
    upstream: process.env.USER_SERVICE_URL || 'http://localhost:3002',
    prefix: '/users', 
    rewritePrefix: '/users'
  });
});

// C. Rutas Protegidas de TICKETS
fastify.register(async function (ticketRoutes) {
  ticketRoutes.addHook('preHandler', fastify.verifySession);
  
  // Ejemplo de validación de permisos EN EL GATEWAY antes del proxy:
  // Si es un POST a /tickets, requerimos 'edit_ticket' (o 'tickets:add' según tu nomenclatura)
  ticketRoutes.addHook('preHandler', async (request, reply) => {
    if (request.method === 'POST') {
       await fastify.requirePermission('edit_ticket')(request, reply);
    }
  });

  ticketRoutes.register(fastifyHttpProxy, {
    upstream: process.env.TICKET_SERVICE_URL || 'http://localhost:3003',
    prefix: '/tickets', 
    rewritePrefix: '/tickets'
  });
});

// D. Rutas Protegidas de GRUPOS
fastify.register(async function (groupRoutes) {
  groupRoutes.addHook('preHandler', fastify.verifySession);
  
  // Ejemplo de validación en Gateway:
  // Si es POST o PATCH, requerimos 'create_group'
  groupRoutes.addHook('preHandler', async (request, reply) => {
    if (request.method === 'POST' || request.method === 'PATCH' || request.method === 'DELETE') {
       // OJO: POST a /groups/:id/members requiere 'manage_users', esto es una simplificación.
       // Para un control fino por ruta, es mejor definir proxies específicos.
       // Por ahora, dejamos pasar si está autenticado, pero lo ideal es mapearlo exacto.
    }
  });

  groupRoutes.register(fastifyHttpProxy, {
    upstream: process.env.GROUP_SERVICE_URL || 'http://localhost:3004',
    prefix: '/groups', 
    rewritePrefix: '/groups'
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