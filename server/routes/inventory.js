const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

// 获取库存列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword = '', low_stock } = req.query;
    const offset = (page - 1) * pageSize;

    let sql = `
      SELECT i.*, sp.code, sp.name, sp.model, sp.unit, sp.category_id, c.name as category_name,
             CASE WHEN i.quantity <= i.safe_quantity THEN 1 ELSE 0 END as is_low_stock
      FROM inventory i
      INNER JOIN spare_part sp ON i.part_id = sp.id
      LEFT JOIN category c ON sp.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (keyword) {
      sql += ' AND (sp.code LIKE ? OR sp.name LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (low_stock === 'true') {
      sql += ' AND i.quantity <= i.safe_quantity';
    }

    sql += ' ORDER BY is_low_stock DESC, sp.name LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    const [inventory] = await pool.execute(sql, params);
    
    // 构建COUNT查询
    let countSql = `
      SELECT COUNT(DISTINCT i.id) as total
      FROM inventory i
      INNER JOIN spare_part sp ON i.part_id = sp.id
      LEFT JOIN category c ON sp.category_id = c.id
      WHERE 1=1
    `;
    const countParams = [];
    if (keyword) {
      countSql += ' AND (sp.code LIKE ? OR sp.name LIKE ?)';
      countParams.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (low_stock === 'true') {
      countSql += ' AND i.quantity <= i.safe_quantity';
    }
    const [countResult] = await pool.execute(countSql, countParams);

    res.json({
      code: 200,
      data: {
        list: inventory,
        total: countResult[0].total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('获取库存列表错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

// 更新库存（设置安全库存、位置等）
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { safe_quantity, location } = req.body;

    const updates = [];
    const params = [];

    if (safe_quantity !== undefined) {
      updates.push('safe_quantity = ?');
      params.push(safe_quantity);
    }
    if (location !== undefined) {
      updates.push('location = ?');
      params.push(location);
    }

    if (updates.length === 0) {
      return res.status(400).json({ code: 400, message: '没有要更新的字段' });
    }

    updates.push('last_check_time = NOW()');
    params.push(id);
    await pool.execute(`UPDATE inventory SET ${updates.join(', ')} WHERE id = ?`, params);

    res.json({ code: 200, message: '更新成功' });
  } catch (error) {
    console.error('更新库存错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

// 库存盘点
router.post('/check', authMiddleware, async (req, res) => {
  try {
    const { part_id, actual_quantity, location } = req.body;

    if (!part_id || actual_quantity === undefined) {
      return res.status(400).json({ code: 400, message: '备件ID和实际数量不能为空' });
    }

    // 获取当前库存
    const [inventory] = await pool.execute('SELECT * FROM inventory WHERE part_id = ?', [part_id]);
    if (inventory.length === 0) {
      return res.status(404).json({ code: 404, message: '库存记录不存在' });
    }

    const currentQuantity = inventory[0].quantity;
    const difference = actual_quantity - currentQuantity;

    // 更新库存
    await pool.execute(
      'UPDATE inventory SET quantity = ?, location = ?, last_check_time = NOW() WHERE part_id = ?',
      [actual_quantity, location || inventory[0].location, part_id]
    );

    // 如果有差异，记录调整单
    if (difference !== 0) {
      await pool.execute(
        `INSERT INTO inventory_transaction (part_id, type, quantity, transaction_type, operator_id, remark)
         VALUES (?, ?, ?, 'adjustment', ?, ?)`,
        [
          part_id,
          difference > 0 ? 'in' : 'out',
          Math.abs(difference),
          req.user.id,
          `库存盘点调整，原数量：${currentQuantity}，盘点数量：${actual_quantity}`
        ]
      );
    }

    res.json({ code: 200, message: '盘点成功', data: { difference } });
  } catch (error) {
    console.error('库存盘点错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

// 获取低库存预警列表
router.get('/low-stock', authMiddleware, async (req, res) => {
  try {
    const [inventory] = await pool.execute(
      `SELECT i.*, sp.code, sp.name, sp.model, sp.unit, 
              (i.safe_quantity - i.quantity) as shortage
       FROM inventory i
       INNER JOIN spare_part sp ON i.part_id = sp.id
       WHERE i.quantity <= i.safe_quantity AND i.safe_quantity > 0
       ORDER BY shortage DESC`
    );

    res.json({ code: 200, data: inventory });
  } catch (error) {
    console.error('获取低库存预警错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

module.exports = router;

