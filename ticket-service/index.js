const Fastify = require('fastify');
require('dotenv').config();

// Inicializamos Fastify
const fastify = Fastify({ logger: true });

// Conectamos a tu base de datos Postgres local
fastify.register(require('@fastify/postgres'), {
  connectionString: process.env.DATABASE_URL
});

// --- RUTAS DE TICKETS ---
fastify.get('/tickets', async (request, reply) => {
  // Más adelante aquí haremos la consulta a Postgres (SELECT * FROM tickets)
  // Por ahora mandamos datos de prueba para ver que el microservicio responda
  return [
    { id: 1, titulo: 'Problema con la impresora', estado: 'Abierto' },
    { id: 2, titulo: 'No hay internet', estado: 'Cerrado' }
  ];
});

// --- ARRANCAR EL SERVIDOR ---
const start = async () => {
  try {
    await fastify.listen({ port: process.env.PORT || 3003, host: '0.0.0.0' });
    console.log(`🎫 Microservicio de Tickets corriendo en http://localhost:${process.env.PORT || 3003}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();