const controller = require('../controllers/tickets.controller');

async function ticketRoutes(fastify, options) {
  
  // GET /tickets - Requiere solo estar logueado
  fastify.get('/', { 
    preHandler: [fastify.authenticate] 
  }, controller.getAll);

  // POST /tickets - Requiere estar logueado Y tener permiso de edición
  fastify.post('/', { 
    preHandler: [fastify.authenticate, fastify.requirePermission('edit_ticket')] 
  }, controller.create);

  // GET /dashboard/tickets/summary
  fastify.get('/dashboard/summary', { 
    preHandler: [fastify.authenticate] 
  }, controller.getSummary);

  // PATCH /tickets/:id -> Actualizar un ticket específico
  fastify.patch('/:id', { 
    preHandler: [fastify.authenticate] 
  }, controller.update);
}

module.exports = ticketRoutes;