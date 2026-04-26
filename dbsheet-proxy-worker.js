/**
 * WPS 多维表格代理 Worker
 * 专门处理巡店/通报/会议/培训记录的提交和查询
 */

// 多维表格配置
const DBSHEET_CONFIG = {
  patrol: 'jWXKDrfq9xMYpuPH1Q6frxrt855mYBKDp',   // 巡店记录
  report: 'eGWgZNhZD1MNPnMAA5uvrxbwtiJ5yUc1V',   // 通报记录
  meeting: 'vEaaaGDACrM5HkXGSQFL1xZobTvm8fdaJ',  // 会议记录
  training: 'huHbAthGc1MjoGYuD7xQxxgZ8Pyyfmoap', // 培训记录
};

// WPS API 配置
const WPS_API_BASE = 'https://api.wps.cn';

// CORS 头
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    try {
      // 路由处理
      if (path === '/api' || path === '/api/') {
        return jsonResponse({ success: true, message: 'WPS DbSheet Proxy API', version: '1.0.0' });
      }

      // 获取记录列表
      if (path.match(/^\/api\/(patrol|report|meeting|training)$/) && request.method === 'GET') {
        const type = path.split('/')[2];
        return await getRecords(env, type);
      }

      // 提交新记录
      if (path.match(/^\/api\/(patrol|report|meeting|training)$/) && request.method === 'POST') {
        const type = path.split('/')[2];
        const data = await request.json();
        return await createRecord(env, type, data);
      }

      // 获取记录详情
      if (path.match(/^\/api\/(patrol|report|meeting|training)\/[\w-]+$/) && request.method === 'GET') {
        const parts = path.split('/');
        const type = parts[2];
        const recordId = parts[3];
        return await getRecord(env, type, recordId);
      }

      return jsonResponse({ success: false, error: 'Not Found' }, 404);
    } catch (error) {
      console.error('Error:', error);
      return jsonResponse({ success: false, error: error.message }, 500);
    }
  }
};

// 获取 WPS Session
async function getWpsSession(env) {
  const wpsSid = env.WPS_SID;
  if (!wpsSid) {
    throw new Error('WPS_SID not configured');
  }
  return wpsSid;
}

// 调用 WPS API
async function callWpsApi(env, method, path, body = null) {
  const sid = await getWpsSession(env);

  const headers = {
    'Content-Type': 'application/json',
    'Origin': 'https://365.kdocs.cn',
    'Referer': 'https://365.kdocs.cn/woa/im/messages',
    'Cookie': `wps_sid=${sid}; csrf=${sid}`,
  };

  const options = {
    method,
    headers,
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${WPS_API_BASE}${path}`, options);
  return await response.json();
}

// 获取记录列表
async function getRecords(env, type) {
  const fileId = DBSHEET_CONFIG[type];
  if (!fileId) {
    return jsonResponse({ success: false, error: 'Invalid record type' }, 400);
  }

  try {
    // 获取多维表格 schema
    const schemaResp = await callWpsApi(env, 'GET', `/v7/worksheets/${fileId}/sheets`);

    if (schemaResp.code !== 0) {
      return jsonResponse({ success: false, error: schemaResp.msg || 'Failed to get schema' }, 500);
    }

    // 获取第一个 sheet 的 ID
    const sheets = schemaResp.data?.items || [];
    if (sheets.length === 0) {
      return jsonResponse({ success: false, error: 'No sheets found' }, 500);
    }

    const sheetId = sheets[0].id;

    // 获取记录列表
    const recordsResp = await callWpsApi(
      env, 
      'GET', 
      `/v7/worksheets/${fileId}/sheets/${sheetId}/records?page_size=100`
    );

    if (recordsResp.code !== 0) {
      return jsonResponse({ success: false, error: recordsResp.msg || 'Failed to get records' }, 500);
    }

    // 解析记录
    const records = (recordsResp.data?.records || []).map(record => {
      let fields = record.fields;
      if (typeof fields === 'string') {
        try {
          fields = JSON.parse(fields);
        } catch (e) {
          fields = {};
        }
      }
      return {
        id: record.id,
        ...fields,
        createdAt: record.created_time,
        updatedAt: record.modified_time,
      };
    });

    return jsonResponse({ success: true, data: records });
  } catch (error) {
    console.error('getRecords error:', error);
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}

// 创建新记录
async function createRecord(env, type, data) {
  const fileId = DBSHEET_CONFIG[type];
  if (!fileId) {
    return jsonResponse({ success: false, error: 'Invalid record type' }, 400);
  }

  try {
    // 获取多维表格 schema
    const schemaResp = await callWpsApi(env, 'GET', `/v7/worksheets/${fileId}/sheets`);

    if (schemaResp.code !== 0) {
      return jsonResponse({ success: false, error: schemaResp.msg || 'Failed to get schema' }, 500);
    }

    // 获取第一个 sheet 的 ID
    const sheets = schemaResp.data?.items || [];
    if (sheets.length === 0) {
      return jsonResponse({ success: false, error: 'No sheets found' }, 500);
    }

    const sheetId = sheets[0].id;

    // 构建记录数据
    const recordData = {
      fields: JSON.stringify(data),
    };

    // 创建记录
    const createResp = await callWpsApi(
      env,
      'POST',
      `/v7/worksheets/${fileId}/sheets/${sheetId}/records`,
      { records: [recordData] }
    );

    if (createResp.code !== 0) {
      return jsonResponse({ success: false, error: createResp.msg || 'Failed to create record' }, 500);
    }

    const createdRecord = createResp.data?.records?.[0];
    return jsonResponse({ 
      success: true, 
      data: { id: createdRecord?.id },
      message: 'Record created successfully'
    });
  } catch (error) {
    console.error('createRecord error:', error);
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}

// 获取单条记录
async function getRecord(env, type, recordId) {
  const fileId = DBSHEET_CONFIG[type];
  if (!fileId) {
    return jsonResponse({ success: false, error: 'Invalid record type' }, 400);
  }

  try {
    // 获取多维表格 schema
    const schemaResp = await callWpsApi(env, 'GET', `/v7/worksheets/${fileId}/sheets`);

    if (schemaResp.code !== 0) {
      return jsonResponse({ success: false, error: schemaResp.msg || 'Failed to get schema' }, 500);
    }

    const sheets = schemaResp.data?.items || [];
    if (sheets.length === 0) {
      return jsonResponse({ success: false, error: 'No sheets found' }, 500);
    }

    const sheetId = sheets[0].id;

    // 获取记录详情
    const recordResp = await callWpsApi(
      env,
      'GET',
      `/v7/worksheets/${fileId}/sheets/${sheetId}/records/${recordId}`
    );

    if (recordResp.code !== 0) {
      return jsonResponse({ success: false, error: recordResp.msg || 'Failed to get record' }, 500);
    }

    const record = recordResp.data?.record;
    let fields = record?.fields;
    if (typeof fields === 'string') {
      try {
        fields = JSON.parse(fields);
      } catch (e) {
        fields = {};
      }
    }

    return jsonResponse({
      success: true,
      data: {
        id: record.id,
        ...fields,
        createdAt: record.created_time,
        updatedAt: record.modified_time,
      }
    });
  } catch (error) {
    console.error('getRecord error:', error);
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}

// 返回 JSON 响应
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}
