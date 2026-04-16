const repository = require('../repositories/groups.repository');

class GroupsController {
  async getAll(request, reply) {
    try {
      const groups = await repository.getAllGroups();
      reply.code(200).send({ statusCode: 200, intOpCode: 'SxGR200', data: groups });
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({ statusCode: 500, intOpCode: 'ExGR500', data: { error: 'Error obteniendo los grupos' } });
    }
  }

  async getMembers(request, reply) {
    try {
      const { id } = request.params;
      const members = await repository.getGroupMembers(id);
      reply.code(200).send({ statusCode: 200, intOpCode: 'SxGR200', data: members });
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({ statusCode: 500, intOpCode: 'ExGR500', data: { error: 'Error obteniendo miembros del grupo' } });
    }
  }

  async create(request, reply) {
    try {
      const newId = await repository.createGroup(request.body, request.user.userId);
      reply.code(201).send({ statusCode: 201, intOpCode: 'SxGR201', data: { message: 'Grupo creado exitosamente', id: newId } });
    } catch (error) {
      request.log.error(error);
      if (error.code === '23505') {
        return reply.code(400).send({ statusCode: 400, intOpCode: 'ExGR400', data: { error: 'Ya existe un grupo con ese nombre' } });
      }
      reply.code(500).send({ statusCode: 500, intOpCode: 'ExGR500', data: { error: 'Error al crear el grupo' } });
    }
  }

  async update(request, reply) {
    try {
      const { id } = request.params;
      await repository.updateGroup(id, request.body);
      reply.code(200).send({ statusCode: 200, intOpCode: 'SxGR200', data: { message: 'Grupo actualizado correctamente' } });
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({ statusCode: 500, intOpCode: 'ExGR500', data: { error: 'Error al actualizar el grupo' } });
    }
  }

  async delete(request, reply) {
    try {
      const { id } = request.params;
      await repository.deleteGroup(id);
      reply.code(200).send({ statusCode: 200, intOpCode: 'SxGR200', data: { message: 'Grupo eliminado correctamente' } });
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({ statusCode: 500, intOpCode: 'ExGR500', data: { error: 'Error al eliminar el grupo' } });
    }
  }

  async addMember(request, reply) {
    try {
      const { id } = request.params; 
      const { userId } = request.body;
      await repository.addMember(id, userId);
      reply.code(200).send({ statusCode: 200, intOpCode: 'SxGR200', data: { message: 'Usuario agregado al grupo' } });
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({ statusCode: 500, intOpCode: 'ExGR500', data: { error: 'Error al agregar al usuario' } });
    }
  }

  async removeMember(request, reply) {
    try {
      const { id, userId } = request.params;
      await repository.removeMember(id, userId);
      reply.code(200).send({ statusCode: 200, intOpCode: 'SxGR200', data: { message: 'Usuario removido del grupo' } });
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({ statusCode: 500, intOpCode: 'ExGR500', data: { error: 'Error al remover al usuario' } });
    }
  }
}

module.exports = new GroupsController();