const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

// 生成订单号
const generateOrderNo = async () => {
  const prefix = 'PO';
  const date = new Date();
  const dateStr = date.getFullYear().toString() + 
                  String(date.getMonth() + 1).padStart(2, '0') + 
                  String(date.getDate()).padStart(2, '0');
  
  const [result] = await pool.execute(
    'SELECT COUNT(*) as count FROM purchase_order WHERE order_no LIKE ?',
    [`${prefix}${dateStr}%`]
  );
  
  const sequence = String(result[0].count + 1).padStart(4, '0');
  return `${prefix}${dateStr}${sequence}`;
};

// 获取采购订单列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status, keyword = '' } = req.query;
    const offset = (page - 1) * pageSize;

    let sql = `
      SELECT po.*, sp.code as part_code, sp.name as part_name, s.name as supplier_name,
             u1.real_name as creator_name, u2.real_name as approver_name
      FROM purchase_order po
      LEFT JOIN spare_part sp ON po.part_id = sp.id
      LEFT JOIN supplier s ON po.supplier_id = s.id
      LEFT JOIN user u1 ON po.created_by = u1.id
      LEFT JOIN user u2 ON po.approved_by = u2.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND po.status = ?';
      params.push(status);
    }
    if (keyword) {
      sql += ' AND (po.order_no LIKE ? OR sp.name LIKE ? OR s.name LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    sql += ' ORDER BY po.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    const [orders] = await pool.execute(sql, params);
    
    // 构建COUNT查询
    let countSql = `
      SELECT COUNT(DISTINCT po.id) as total
      FROM purchase_order po
      LEFT JOIN spare_part sp ON po.part_id = sp.id
      LEFT JOIN supplier s ON po.supplier_id = s.id
      LEFT JOIN user u1 ON po.created_by = u1.id
      LEFT JOIN user u2 ON po.approved_by = u2.id
      WHERE 1=1
    `;
    const countParams = [];
    if (status) {
      countSql += ' AND po.status = ?';
      countParams.push(status);
    }
    if (keyword) {
      countSql += ' AND (po.order_no LIKE ? OR sp.name LIKE ? OR s.name LIKE ?)';
      countParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    const [countResult] = await pool.execute(countSql, countParams);

    res.json({
      code: 200,
      data: {
        list: orders,
        total: countResult[0].total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('获取采购订单列表错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

// 获取采购订单详情
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const [orders] = await pool.execute(
      `SELECT po.*, sp.code as part_code, sp.name as part_name, sp.model, sp.unit,
              s.name as supplier_name, s.contact_person, s.phone, s.email,
              u1.real_name as creator_name, u2.real_name as approver_name
       FROM purchase_order po
       LEFT JOIN spare_part sp ON po.part_id = sp.id
       LEFT JOIN supplier s ON po.supplier_id = s.id
       LEFT JOIN user u1 ON po.created_by = u1.id
       LEFT JOIN user u2 ON po.approved_by = u2.id
       WHERE po.id = ?`,
      [id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ code: 404, message: '采购订单不存在' });
    }

    res.json({ code: 200, data: orders[0] });
  } catch (error) {
    console.error('获取采购订单详情错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

// 创建采购订单
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { part_id, supplier_id, quantity, unit_price, remark } = req.body;

    if (!part_id || !quantity) {
      return res.status(400).json({ code: 400, message: '备件ID和数量不能为空' });
    }

    const order_no = await generateOrderNo();
    const total_amount = quantity * (unit_price || 0);

    const [result] = await pool.execute(
      'INSERT INTO purchase_order (order_no, part_id, supplier_id, quantity, unit_price, total_amount, status, created_by, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [order_no, part_id, supplier_id, quantity, unit_price, total_amount, 'draft', req.user.id, remark]
    );

    res.json({ code: 200, message: '创建成功', data: { id: result.insertId, order_no } });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ code: 400, message: '订单号已存在' });
    }
    console.error('创建采购订单错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

// 更新采购订单
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { supplier_id, quantity, unit_price, status, remark } = req.body;

    // 获取当前订单
    const [orders] = await pool.execute('SELECT * FROM purchase_order WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json({ code: 404, message: '采购订单不存在' });
    }

    const order = orders[0];

    // 如果订单已审批或已完成，不允许修改
    if (['approved', 'ordered', 'shipped', 'received'].includes(order.status)) {
      return res.status(400).json({ code: 400, message: '该订单已审批，无法修改' });
    }

    const updates = [];
    const params = [];

    if (supplier_id !== undefined) {
      updates.push('supplier_id = ?');
      params.push(supplier_id);
    }
    if (quantity !== undefined) {
      updates.push('quantity = ?');
      params.push(quantity);
    }
    if (unit_price !== undefined) {
      updates.push('unit_price = ?');
      params.push(unit_price);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
      
      // 如果是审批，记录审批信息
      if (status === 'approved') {
        updates.push('approved_by = ?');
        updates.push('approved_at = NOW()');
        params.push(req.user.id);
      }
    }
    if (remark !== undefined) {
      updates.push('remark = ?');
      params.push(remark);
    }

    // 重新计算总金额
    const finalQuantity = quantity !== undefined ? quantity : order.quantity;
    const finalUnitPrice = unit_price !== undefined ? unit_price : order.unit_price;
    updates.push('total_amount = ?');
    params.push(finalQuantity * finalUnitPrice);

    if (updates.length === 0) {
      return res.status(400).json({ code: 400, message: '没有要更新的字段' });
    }

    params.push(id);
    await pool.execute(`UPDATE purchase_order SET ${updates.join(', ')} WHERE id = ?`, params);

    res.json({ code: 200, message: '更新成功' });
  } catch (error) {
    console.error('更新采购订单错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

// 删除采购订单
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 只能删除草稿状态的订单
    const [orders] = await pool.execute('SELECT status FROM purchase_order WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json({ code: 404, message: '采购订单不存在' });
    }
    if (orders[0].status !== 'draft') {
      return res.status(400).json({ code: 400, message: '只能删除草稿状态的订单' });
    }

    await pool.execute('DELETE FROM purchase_order WHERE id = ?', [id]);
    res.json({ code: 200, message: '删除成功' });
  } catch (error) {
    console.error('删除采购订单错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

module.exports = router;

