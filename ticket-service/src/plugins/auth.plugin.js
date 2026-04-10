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
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      request.user = decoded; 
    } catch (err) {
      reply.code(401).send({ error: 'No autorizado o token expirado' });
    }
  });

  fastify.decorate('requirePermission', function (requiredPermission) {
    return async function (request, reply) {
      const { userId } = request.user;
      const query = `
        SELECT 1 FROM grupo_usuario_permisos gup
        JOIN permisos p ON gup.permiso_id = p.id
        WHERE gup.usuario_id = $1 AND p.nombre = $2
        LIMIT 1;
      `;
      const result = await pool.query(query, [userId, requiredPermission]);
      
      if (result.rowCount === 0) {
        reply.code(403).send({ error: `Falta el permiso: ${requiredPermission}` });
      }
    };
  });
});