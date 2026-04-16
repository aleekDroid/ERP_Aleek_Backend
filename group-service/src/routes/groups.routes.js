// src/routes/groups.routes.js
const controller = require('../controllers/groups.controller');

async function groupRoutes(fastify, options) {
  
  // GET /groups -> Ver todos los grupos 
  fastify.get('/', { 
    preHandler: [fastify.authenticate] 
  }, controller.getAll);

  // GET /groups/:id/members -> Ver quién está en un grupo específico
  fastify.get('/:id/members', { 
    preHandler: [fastify.authenticate] 
  }, controller.getMembers);

  // POST /groups -> Crear un grupo nuevo
  fastify.post('/', { 
    preHandler: [fastify.authenticate, fastify.requirePermission('create_group')] 
  }, controller.create);

  // POST /groups/:id/members -> Agregar un usuario al grupo
  fastify.post('/:id/members', { 
    preHandler: [fastify.authenticate, fastify.requirePermission('manage_users')] 
  }, controller.addMember);

  // DELETE /groups/:id/members/:userId -> Quitar un usuario del grupo
  fastify.delete('/:id/members/:userId', { 
    preHandler: [fastify.authenticate, fastify.requirePermission('manage_users')] 
  }, controller.removeMember);

  // PATCH /groups/:id -> Actualizar un grupo
  fastify.patch('/:id', { 
    preHandler: [fastify.authenticate, fastify.requirePermission('create_group')] 
  }, controller.update);

  // DELETE /groups/:id -> Eliminar un grupo
  fastify.delete('/:id', { 
    preHandler: [fastify.authenticate, fastify.requirePermission('create_group')] 
  }, controller.delete);

}

module.exports = groupRoutes;