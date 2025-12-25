const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

// 生成备件编码
const generateCode = async () => {
  const prefix = 'SP';
  const date = new Date();
  const dateStr = date.getFullYear().toString().slice(-2) + 
                  String(date.getMonth() + 1).padStart(2, '0') + 
                  String(date.getDate()).padStart(2, '0');
  
  const [result] = await pool.execute(
    'SELECT COUNT(*) as count FROM spare_part WHERE code LIKE ?',
    [`${prefix}${dateStr}%`]
  );
  
  const sequence = String(result[0].count + 1).padStart(4, '0');
  return `${prefix}${dateStr}${sequence}`;
};

// 获取备件列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword = '', category_id } = req.query;
    const offset = (page - 1) * pageSize;

    let sql = `
      SELECT sp.*, c.name as category_name, i.quantity, i.safe_quantity, i.location
      FROM spare_part sp
      LEFT JOIN category c ON sp.category_id = c.id
      LEFT JOIN inventory i ON sp.id = i.part_id
      WHERE 1=1
    `;
    const params = [];

    if (keyword) {
      sql += ' AND (sp.code LIKE ? OR sp.name LIKE ? OR sp.model LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    if (category_id) {
      sql += ' AND sp.category_id = ?';
      params.push(category_id);
    }

    sql += ' ORDER BY sp.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    const [parts] = await pool.execute(sql, params);
    
    // 构建COUNT查询
    let countSql = `
      SELECT COUNT(DISTINCT sp.id) as total
      FROM spare_part sp
      LEFT JOIN category c ON sp.category_id = c.id
      LEFT JOIN inventory i ON sp.id = i.part_id
      WHERE 1=1
    `;
    const countParams = [];
    if (keyword) {
      countSql += ' AND (sp.code LIKE ? OR sp.name LIKE ? OR sp.model LIKE ?)';
      countParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    if (category_id) {
      countSql += ' AND sp.category_id = ?';
      countParams.push(category_id);
    }
    const [countResult] = await pool.execute(countSql, countParams);

    res.json({
      code: 200,
      data: {
        list: parts,
        total: countResult[0].total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('获取备件列表错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

// 获取备件详情
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const [parts] = await pool.execute(
      `SELECT sp.*, c.name as category_name, i.quantity, i.safe_quantity, i.location
       FROM spare_part sp
       LEFT JOIN category c ON sp.category_id = c.id
       LEFT JOIN inventory i ON sp.id = i.part_id
       WHERE sp.id = ?`,
      [id]
    );

    if (parts.length === 0) {
      return res.status(404).json({ code: 404, message: '备件不存在' });
    }

    res.json({ code: 200, data: parts[0] });
  } catch (error) {
    console.error('获取备件详情错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

// 创建备件
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { code, name, category_id, model, specification, unit, equipment_name, image_url, auto_code = false } = req.body;

    let finalCode = code;
    if (auto_code || !code) {
      finalCode = await generateCode();
    }

    const [result] = await pool.execute(
      'INSERT INTO spare_part (code, name, category_id, model, specification, unit, equipment_name, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [finalCode, name, category_id, model, specification, unit, equipment_name, image_url]
    );

    // 初始化库存
    await pool.execute(
      'INSERT INTO inventory (part_id, quantity, safe_quantity) VALUES (?, 0, 0)',
      [result.insertId]
    );

    res.json({ code: 200, message: '创建成功', data: { id: result.insertId, code: finalCode } });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ code: 400, message: '备件编码已存在' });
    }
    console.error('创建备件错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

// 更新备件
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category_id, model, specification, unit, equipment_name, image_url } = req.body;

    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (category_id !== undefined) {
      updates.push('category_id = ?');
      params.push(category_id);
    }
    if (model !== undefined) {
      updates.push('model = ?');
      params.push(model);
    }
    if (specification !== undefined) {
      updates.push('specification = ?');
      params.push(specification);
    }
    if (unit !== undefined) {
      updates.push('unit = ?');
      params.push(unit);
    }
    if (equipment_name !== undefined) {
      updates.push('equipment_name = ?');
      params.push(equipment_name);
    }
    if (image_url !== undefined) {
      updates.push('image_url = ?');
      params.push(image_url);
    }

    if (updates.length === 0) {
      return res.status(400).json({ code: 400, message: '没有要更新的字段' });
    }

    params.push(id);
    await pool.execute(`UPDATE spare_part SET ${updates.join(', ')} WHERE id = ?`, params);

    res.json({ code: 200, message: '更新成功' });
  } catch (error) {
    console.error('更新备件错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

// 删除备件
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM spare_part WHERE id = ?', [id]);
    res.json({ code: 200, message: '删除成功' });
  } catch (error) {
    console.error('删除备件错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

module.exports = router;

