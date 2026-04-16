const fp = require('fastify-plugin');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

module.exports = fp(async function (fastify, opts) {
  
  fastify.decorate('authenticate', async function (request, reply) {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Missing token');
      }
      const token = authHeader.split(' ')[1];
      
      const secret = (process.env.JWT_SECRET || 'secreto').trim(); 
      
      const decoded = jwt.verify(token, secret);
      request.user = decoded; 
    } catch (err) {
      console.error('❌ Error descifrando JWT:', err.message);
      console.log('🔑 Secreto usado en Fastify:', process.env.JWT_SECRET);
      
      reply.code(401).send({ error: 'No autorizado', detalle: err.message });
    }
  });

fastify.decorate('requirePermission', function (requiredPermission) {
    return async function (request, reply) {
      const { userId } = request.user;
      
      const query = `
        SELECT 1 FROM usuarios u
        JOIN permisos p ON p.id = ANY(u.permisos_globales)
        WHERE u.id = $1 AND p.nombre = $2
        LIMIT 1;
      `;
      
      try {
        const result = await pool.query(query, [userId, requiredPermission]);
        
        if (result.rowCount === 0) {
          reply.code(403).send({ error: `Falta el permiso: ${requiredPermission}` });
        }
      } catch (err) {
        console.error('Error verificando permiso:', err);
        reply.code(500).send({ error: 'Error interno verificando permisos' });
      }
    };
  });
});