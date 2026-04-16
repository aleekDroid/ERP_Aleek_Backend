const Fastify = require('fastify');
require('dotenv').config();

const fastify = Fastify({ logger: true });

fastify.register(require('@fastify/cors'), {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] 
});

// 2. Registrar Plugins Propios (Auth)
fastify.register(require('./plugins/auth.plugin'));

// 3. Registrar Rutas
fastify.register(require('./routes/tickets.routes'), { prefix: '/tickets' });

// Ruta Health
fastify.get('/api/health', async () => ({ status: 'Ticket Service UP', framework: 'Fastify' }));

const start = async () => {
  try {
    await fastify.listen({ port: process.env.PORT || 3003, host: '0.0.0.0' });
    console.log(`🎫 Microservicio de Tickets (Fastify) en puerto ${process.env.PORT || 3003}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();