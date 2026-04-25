Content-Disposition: form-data; name="worker.js"

const ALLOWED_TABLES = ['patrol_records', 'report_records', 'meeting_records', 'training_records'];

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function handleOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

async function handleCreate(env, table, record) {
  const cols = Object.keys(record);
  const placeholders = cols.map(() => '?').join(', ');
  const values = cols.map(c => record[c]);

  const result = await env.DB.prepare(
    `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`
  ).bind(...values).run();

  return jsonResponse({ success: true, id: record.id });
}

async function handleList(env, table, url) {
  const operatorId = url.searchParams.get('operatorId');
  const date = url.searchParams.get('date');

  let query = `SELECT * FROM ${table}`;
  const conditions = [];
  const values = [];

  if (operatorId) {
    conditions.push('operator_id = ?');
    values.push(operatorId);
  }
  if (date) {
    conditions.push('date = ?');
    values.push(date);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY created_at DESC LIMIT 200';

  const result = await env.DB.prepare(query).bind(...values).all();
  return jsonResponse({ success: true, data: result.results });
}

async function handleGet(env, table, id) {
  const result = await env.DB.prepare(
    `SELECT * FROM ${table} WHERE id = ?`
  ).bind(id).first();

  if (!result) {
    return jsonResponse({ success: false, error: 'Not found' }, 404);
  }
  return jsonResponse({ success: true, data: result });
}

async function handleDelete(env, table, id, operatorId) {
  const result = await env.DB.prepare(
    `DELETE FROM ${table} WHERE id = ? AND operator_id = ?`
  ).bind(id, operatorId).run();

  if (result.meta.changes === 0) {
    return jsonResponse({ success: false, error: 'Not found or not authorized' }, 404);
  }
  return jsonResponse({ success: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }

    // Health check
    if (path === '/api/health') {
      return jsonResponse({ status: 'ok', time: new Date().toISOString() });
    }

    // Route: /api/{table} or /api/{table}/{id}
    const match = path.match(/^\/api\/([a-z_]+)(?:\/([a-zA-Z0-9_-]+))?$/);
    if (!match) {
      return jsonResponse({ error: 'Not found' }, 404);
    }

    const table = match[1];
    const id = match[2] || null;

    if (!ALLOWED_TABLES.includes(table)) {
      return jsonResponse({ error: 'Invalid table' }, 400);
    }

    // POST: create record
    if (request.method === 'POST') {
      try {
        const record = await request.json();
        if (!record.id) {
          return jsonResponse({ error: 'Missing id' }, 400);
        }
        return await handleCreate(env, table, record);
      } catch {
        return jsonResponse({ error: 'Invalid JSON body' }, 400);
      }
    }

    // GET: list or get single
    if (request.method === 'GET') {
      if (id) {
        return await handleGet(env, table, id);
      }
      return await handleList(env, table, url);
    }

    // DELETE: delete record
    if (request.method === 'DELETE') {
      if (!id) {
        return jsonResponse({ error: 'Missing id' }, 400);
      }
      const operatorId = url.searchParams.get('operatorId');
      if (!operatorId) {
        return jsonResponse({ error: 'Missing operatorId' }, 400);
      }
      return await handleDelete(env, table, id, operatorId);
    }

    return jsonResponse({ error: 'Method not allowed' }, 405);
  },
};