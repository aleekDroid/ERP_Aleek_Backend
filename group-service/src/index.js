// src/index.js
const Fastify = require('fastify');
require('dotenv').config();

const fastify = Fastify({ logger: true });

fastify.register(require('@fastify/cors'), { 
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] 
});
fastify.register(require('./plugins/auth.plugin'));
fastify.register(require('./routes/groups.routes'), { prefix: '/groups' });

fastify.get('/api/health', async () => ({ status: 'Group Service UP' }));

const start = async () => {
  try {
    await fastify.listen({ port: process.env.PORT || 3004, host: '0.0.0.0' });
    console.log(`👥 Microservicio de Grupos corriendo en puerto ${process.env.PORT || 3004}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();