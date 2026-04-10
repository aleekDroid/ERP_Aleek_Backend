const repository = require('../repositories/tickets.repository');

class TicketsController {
  async getAll(request, reply) {
    try {
      const filters = {
        groupId: request.query.groupId,
        assignedUserId: request.query.assignedUserId,
        unassigned: request.query.unassigned === 'true',
        status: request.query.status,
        pageSize: parseInt(request.query.pageSize) || 50,
        offset: (parseInt(request.query.page) || 0) * (parseInt(request.query.pageSize) || 50)
      };

      const ticketsDb = await repository.getTickets(filters);
      
      const ticketsDto = ticketsDb.map(row => ({
        id: row.id,
        titulo: row.titulo,
        descripcion: row.descripcion,
        estado: row.estado,
        prioridad: row.prioridad,
        asignadoA: row.asignado_nombre,
        asignadoId: row.asignado_id,
        grupoId: row.grupo_id,
        grupoNombre: row.grupo_nombre,
        fechaCreacion: row.creado_en,
        fechaLimite: row.fecha_final,
        autorId: row.autor_id,
        autorNombre: row.autor_nombre
      }));

      reply.send(ticketsDto);
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({ error: 'Error obteniendo tickets' });
    }
  }

  async create(request, reply) {
    try {
      const newId = await repository.createTicketWithHistory(request.body, request.user.userId);
      reply.code(201).send({ message: 'Ticket creado', id: newId });
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({ error: 'Error al crear el ticket' });
    }
  }

  async getSummary(request, reply) {
    try {
      const summary = await repository.getDashboardSummary();
      reply.send(summary);
    } catch (error) {
      reply.code(500).send({ error: 'Error obteniendo métricas' });
    }
  }
}

module.exports = new TicketsController();