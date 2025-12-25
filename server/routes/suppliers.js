const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

// 获取供应商列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword = '' } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageSizeNum = Math.max(1, parseInt(pageSize) || 10);
    const offset = Math.max(0, (pageNum - 1) * pageSizeNum);

    let sql = 'SELECT * FROM supplier WHERE 1=1';
    const params = [];

    if (keyword) {
      sql += ' AND (name LIKE ? OR contact_person LIKE ? OR phone LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    sql += ` ORDER BY created_at DESC LIMIT ${Number(pageSizeNum)} OFFSET ${Number(offset)}`;

    const [suppliers] = await pool.execute(sql, params);
    
    // 构建COUNT查询
    let countSql = 'SELECT COUNT(*) as total FROM supplier WHERE 1=1';
    const countParams = [];
    if (keyword) {
      countSql += ' AND (name LIKE ? OR contact_person LIKE ? OR phone LIKE ?)';
      countParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    const [countResult] = await pool.execute(countSql, countParams);

    res.json({
      code: 200,
      data: {
        list: suppliers,
        total: countResult[0].total,
        page: pageNum,
        pageSize: pageSizeNum
      }
    });
  } catch (error) {
    console.error('获取供应商列表错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

// 获取供应商详情
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const [suppliers] = await pool.execute('SELECT * FROM supplier WHERE id = ?', [id]);

    if (suppliers.length === 0) {
      return res.status(404).json({ code: 404, message: '供应商不存在' });
    }

    // 获取合作记录
    const [orders] = await pool.execute(
      `SELECT COUNT(*) as order_count, SUM(total_amount) as total_amount, AVG(score) as avg_score
       FROM purchase_order
       WHERE supplier_id = ? AND status = 'received'`,
      [id]
    );

    res.json({
      code: 200,
      data: {
        ...suppliers[0],
        statistics: orders[0]
      }
    });
  } catch (error) {
    console.error('获取供应商详情错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

// 创建供应商
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, contact_person, phone, email, address, score = 5.0, status = 'active' } = req.body;

    if (!name) {
      return res.status(400).json({ code: 400, message: '供应商名称不能为空' });
    }

    const [result] = await pool.execute(
      'INSERT INTO supplier (name, contact_person, phone, email, address, score, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, contact_person, phone, email, address, score, status]
    );

    res.json({ code: 200, message: '创建成功', data: { id: result.insertId } });
  } catch (error) {
    console.error('创建供应商错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

// 更新供应商
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact_person, phone, email, address, score, status } = req.body;

    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (contact_person !== undefined) {
      updates.push('contact_person = ?');
      params.push(contact_person);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(phone);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      params.push(email);
    }
    if (address !== undefined) {
      updates.push('address = ?');
      params.push(address);
    }
    if (score !== undefined) {
      updates.push('score = ?');
      params.push(score);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ code: 400, message: '没有要更新的字段' });
    }

    params.push(id);
    await pool.execute(`UPDATE supplier SET ${updates.join(', ')} WHERE id = ?`, params);

    res.json({ code: 200, message: '更新成功' });
  } catch (error) {
    console.error('更新供应商错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

// 删除供应商
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查是否有采购订单
    const [orders] = await pool.execute('SELECT COUNT(*) as count FROM purchase_order WHERE supplier_id = ?', [id]);
    if (orders[0].count > 0) {
      return res.status(400).json({ code: 400, message: '该供应商存在采购订单，无法删除' });
    }

    // 检查是否有相关的操作日志
    const [operationLogs] = await pool.execute('SELECT COUNT(*) as count FROM operation_log WHERE JSON_CONTAINS(description, ?, "$.supplier_id")', [JSON.stringify(id)]);
    if (operationLogs[0].count > 0) {
      return res.status(400).json({ code: 400, message: '该供应商有相关操作记录，无法删除' });
    }

    await pool.execute('DELETE FROM supplier WHERE id = ?', [id]);
    res.json({ code: 200, message: '删除成功' });
  } catch (error) {
    console.error('删除供应商错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

module.exports = router;

