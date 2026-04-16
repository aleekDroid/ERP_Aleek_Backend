const pool = require('../config/db');

class TicketsRepository {
  async getTickets(filters) {
    let query = `
      SELECT t.id, t.titulo, t.descripcion, t.creado_en, t.fecha_final,
             e.nombre as estado, p.nombre as prioridad,
             u.nombre_completo as autor_nombre, u.id as autor_id,
             a.nombre_completo as asignado_nombre, a.id as asignado_id,
             g.nombre as grupo_nombre, g.id as grupo_id
      FROM tickets t
      LEFT JOIN estados e ON t.estado_id = e.id
      LEFT JOIN prioridades p ON t.prioridad_id = p.id
      LEFT JOIN usuarios u ON t.autor_id = u.id
      LEFT JOIN usuarios a ON t.asignado_id = a.id
      LEFT JOIN grupos g ON t.grupo_id = g.id
      WHERE 1=1
    `;
    const values = [];
    let counter = 1;

    if (filters.groupId) { query += ` AND t.grupo_id = $${counter++}`; values.push(filters.groupId); }
    if (filters.assignedUserId) { query += ` AND t.asignado_id =$${counter++}`; values.push(filters.assignedUserId); }
    if (filters.unassigned) { query += ` AND t.asignado_id IS NULL`; }
    if (filters.status) { query += ` AND e.nombre = $${counter++}`; values.push(filters.status); }

    query += ` ORDER BY t.creado_en DESC LIMIT $${counter++} OFFSET $${counter++}`;
    values.push(filters.pageSize || 50, filters.offset || 0);

    const result = await pool.query(query, values);
    return result.rows;
  }

  async updateTicket(id, data) {
    const query = `
      UPDATE tickets
      SET 
        titulo = $1,
        descripcion = $2,
        estado_id = (SELECT id FROM estados WHERE nombre = $3 LIMIT 1),
        prioridad_id = (SELECT id FROM prioridades WHERE nombre = $4 LIMIT 1),
        fecha_final = $5,
        asignado_id = (SELECT id FROM usuarios WHERE nombre_completo = $6 LIMIT 1)
      WHERE id = $7
    `;
    
    await pool.query(query, [
      data.titulo, 
      data.descripcion, 
      data.estado, 
      data.prioridad, 
      data.fechaLimite, 
      data.asignadoA || null, 
      id
    ]);
  }

  async createTicketWithHistory(data, autorId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN'); // Iniciamos transacción
      
      const insertTicket = `
        INSERT INTO tickets (id, titulo, descripcion, grupo_id, autor_id, asignado_id, estado_id, prioridad_id, fecha_final)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
      `;
      const ticketRes = await client.query(insertTicket, [
        data.titulo, data.descripcion, data.grupoId, autorId, data.asignadoId, data.estadoId, data.prioridadId, data.fechaLimite
      ]);
      const newTicketId = ticketRes.rows[0].id;

      const insertHistory = `
        INSERT INTO historial_tickets (id, ticket_id, usuario_id, accion, detalles)
        VALUES (gen_random_uuid(), $1, $2, 'creado', '{"mensaje": "Ticket inicializado"}')
      `;
      await client.query(insertHistory, [newTicketId, autorId]);

      await client.query('COMMIT'); // Guardamos todo
      return newTicketId;
    } catch (e) {
      await client.query('ROLLBACK'); // Si algo falla, deshacemos todo
      throw e;
    } finally {
      client.release();
    }
  }

  async getDashboardSummary() {
    // Ejemplo de métricas
    const query = `
      SELECT 
        COUNT(*) as total_tickets,
        COUNT(*) FILTER (WHERE e.nombre != 'finalizado') as tickets_activos
      FROM tickets t
      JOIN estados e ON t.estado_id = e.id;
    `;
    const result = await pool.query(query);
    return result.rows[0];
  }
}

module.exports = new TicketsRepository();