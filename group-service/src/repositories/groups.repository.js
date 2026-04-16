// src/repositories/groups.repository.js
const pool = require('../config/db');

class GroupsRepository {
  async getAllGroups() {
    const query = `
      SELECT g.id, g.nombre, g.descripcion, g.creado_en,
             u.nombre_completo as creador_nombre, u.id as creador_id
      FROM grupos g
      LEFT JOIN usuarios u ON g.creador_id = u.id
      ORDER BY g.creado_en DESC;
    `;
    const result = await pool.query(query);
    return result.rows;
  }

async getGroupMembers(groupId) {
    const query = `
      SELECT u.id, u.nombre_completo, u.username, u.email, gm.fecha_unido
      FROM grupo_miembros gm
      JOIN usuarios u ON gm.usuario_id = u.id
      WHERE gm.grupo_id = $1
      ORDER BY gm.fecha_unido DESC;
    `;
    const result = await pool.query(query, [groupId]);
    return result.rows;
  }

  async createGroup(data, creadorId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Crear el grupo
      const insertGroup = `
        INSERT INTO grupos (id, nombre, descripcion, creador_id)
        VALUES (gen_random_uuid(), $1, $2, $3) RETURNING id;
      `;
      const groupRes = await client.query(insertGroup, [data.nombre, data.descripcion, creadorId]);
      const newGroupId = groupRes.rows[0].id;

      // 2. Agregar al creador como el primer miembro del grupo
      const insertMember = `
        INSERT INTO grupo_miembros (grupo_id, usuario_id)
        VALUES ($1, $2);
      `;
      await client.query(insertMember, [newGroupId, creadorId]);

      await client.query('COMMIT');
      return newGroupId;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async updateGroup(id, data) {
    const query = `
      UPDATE grupos 
      SET nombre = $1, descripcion = $2
      WHERE id = $3
    `;
    await pool.query(query, [data.nombre, data.categoria || '', id]);
  }

  async deleteGroup(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM grupo_miembros WHERE grupo_id = $1', [id]);
      await client.query('DELETE FROM grupos WHERE id = $1', [id]);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async addMember(grupoId, usuarioId) {
    const query = `
      INSERT INTO grupo_miembros (grupo_id, usuario_id) 
      VALUES ($1, $2)
    `;
    await pool.query(query, [grupoId, usuarioId]);
  }

  async removeMember(grupoId, usuarioId) {
    const query = `
      DELETE FROM grupo_miembros 
      WHERE grupo_id = $1 AND usuario_id = $2
    `;
    await pool.query(query, [grupoId, usuarioId]);
  }
}

module.exports = new GroupsRepository();