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
        id: row.id, titulo: row.titulo, descripcion: row.descripcion,
        estado: row.estado, prioridad: row.prioridad,
        asignadoA: row.asignado_nombre, asignadoId: row.asignado_id,
        grupoId: row.grupo_id, grupoNombre: row.grupo_nombre,
        fechaCreacion: row.creado_en, fechaLimite: row.fecha_final,
        autorId: row.autor_id, autorNombre: row.autor_nombre
      }));

      // ✅ Formato Universal
      reply.code(200).send({ statusCode: 200, intOpCode: 'SxTK200', data: ticketsDto });
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({ statusCode: 500, intOpCode: 'ExTK500', data: { error: 'Error obteniendo tickets' } });
    }
  }

  async create(request, reply) {
    try {
      const newId = await repository.createTicketWithHistory(request.body, request.user.userId);
      reply.code(201).send({ statusCode: 201, intOpCode: 'SxTK201', data: { message: 'Ticket creado', id: newId } });
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({ statusCode: 500, intOpCode: 'ExTK500', data: { error: 'Error al crear el ticket' } });
    }
  }

  async getSummary(request, reply) {
    try {
      const summary = await repository.getDashboardSummary();
      reply.code(200).send({ statusCode: 200, intOpCode: 'SxTK200', data: summary });
    } catch (error) {
      reply.code(500).send({ statusCode: 500, intOpCode: 'ExTK500', data: { error: 'Error obteniendo métricas' } });
    }
  }

  async update(request, reply) {
    try {
      const { id } = request.params;
      await repository.updateTicket(id, request.body);
      reply.code(200).send({ statusCode: 200, intOpCode: 'SxTK200', data: { message: 'Ticket actualizado correctamente' } });
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({ statusCode: 500, intOpCode: 'ExTK500', data: { error: 'Error al actualizar el ticket' } });
    }
  }
}

module.exports = new TicketsController();