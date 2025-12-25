const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

// 生成批次号
const generateBatchNo = () => {
  const date = new Date();
  const dateStr = date.getFullYear().toString() + 
                  String(date.getMonth() + 1).padStart(2, '0') + 
                  String(date.getDate()).padStart(2, '0');
  const timeStr = String(date.getHours()).padStart(2, '0') + 
                  String(date.getMinutes()).padStart(2, '0') + 
                  String(date.getSeconds()).padStart(2, '0');
  return `BATCH${dateStr}${timeStr}`;
};

// 获取出入库记录列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, type, transaction_type, part_id, start_date, end_date } = req.query;
    const offset = (page - 1) * pageSize;

    let sql = `
      SELECT it.*, sp.code as part_code, sp.name as part_name, sp.model, sp.unit,
             u1.real_name as operator_name, u2.real_name as receiver_name,
             po.order_no
      FROM inventory_transaction it
      INNER JOIN spare_part sp ON it.part_id = sp.id
      LEFT JOIN user u1 ON it.operator_id = u1.id
      LEFT JOIN user u2 ON it.receiver_id = u2.id
      LEFT JOIN purchase_order po ON it.related_order_id = po.id
      WHERE 1=1
    `;
    const params = [];

    if (type) {
      sql += ' AND it.type = ?';
      params.push(type);
    }
    if (transaction_type) {
      sql += ' AND it.transaction_type = ?';
      params.push(transaction_type);
    }
    if (part_id) {
      sql += ' AND it.part_id = ?';
      params.push(part_id);
    }
    if (start_date) {
      sql += ' AND DATE(it.transaction_time) >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND DATE(it.transaction_time) <= ?';
      params.push(end_date);
    }

    // 普通船员只能查看自己的记录
    if (req.user.role_name === '普通船员') {
      sql += ' AND (it.receiver_id = ? OR it.operator_id = ?)';
      params.push(req.user.id, req.user.id);
    }

    sql += ' ORDER BY it.transaction_time DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    const [transactions] = await pool.execute(sql, params);
    
    // 构建COUNT查询
    let countSql = `
      SELECT COUNT(DISTINCT it.id) as total
      FROM inventory_transaction it
      INNER JOIN spare_part sp ON it.part_id = sp.id
      LEFT JOIN user u1 ON it.operator_id = u1.id
      LEFT JOIN user u2 ON it.receiver_id = u2.id
      LEFT JOIN purchase_order po ON it.related_order_id = po.id
      WHERE 1=1
    `;
    const countParams = [];
    if (type) {
      countSql += ' AND it.type = ?';
      countParams.push(type);
    }
    if (transaction_type) {
      countSql += ' AND it.transaction_type = ?';
      countParams.push(transaction_type);
    }
    if (part_id) {
      countSql += ' AND it.part_id = ?';
      countParams.push(part_id);
    }
    if (start_date) {
      countSql += ' AND DATE(it.transaction_time) >= ?';
      countParams.push(start_date);
    }
    if (end_date) {
      countSql += ' AND DATE(it.transaction_time) <= ?';
      countParams.push(end_date);
    }
    // 普通船员只能查看自己的记录
    if (req.user.role_name === '普通船员') {
      countSql += ' AND (it.receiver_id = ? OR it.operator_id = ?)';
      countParams.push(req.user.id, req.user.id);
    }
    const [countResult] = await pool.execute(countSql, countParams);

    res.json({
      code: 200,
      data: {
        list: transactions,
        total: countResult[0].total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('获取出入库记录错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

// 获取出入库记录详情
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const [transactions] = await pool.execute(
      `SELECT it.*, sp.code as part_code, sp.name as part_name, sp.model, sp.unit,
              u1.real_name as operator_name, u2.real_name as receiver_name,
              po.order_no
       FROM inventory_transaction it
       INNER JOIN spare_part sp ON it.part_id = sp.id
       LEFT JOIN user u1 ON it.operator_id = u1.id
       LEFT JOIN user u2 ON it.receiver_id = u2.id
       LEFT JOIN purchase_order po ON it.related_order_id = po.id
       WHERE it.id = ?`,
      [id]
    );

    if (transactions.length === 0) {
      return res.status(404).json({ code: 404, message: '记录不存在' });
    }

    res.json({ code: 200, data: transactions[0] });
  } catch (error) {
    console.error('获取出入库记录详情错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

// 入库操作
router.post('/in', authMiddleware, async (req, res) => {
  try {
    const { part_id, quantity, transaction_type = 'purchase', related_order_id, location, remark, batch_no } = req.body;

    if (!part_id || !quantity) {
      return res.status(400).json({ code: 400, message: '备件ID和数量不能为空' });
    }

    const finalBatchNo = batch_no || generateBatchNo();

    // 创建出入库记录
    const [result] = await pool.execute(
      `INSERT INTO inventory_transaction 
       (part_id, type, quantity, batch_no, transaction_type, related_order_id, operator_id, location, remark)
       VALUES (?, 'in', ?, ?, ?, ?, ?, ?, ?)`,
      [part_id, quantity, finalBatchNo, transaction_type, related_order_id, req.user.id, location, remark]
    );

    // 更新库存
    await pool.execute(
      'UPDATE inventory SET quantity = quantity + ?, location = COALESCE(?, location), last_check_time = NOW() WHERE part_id = ?',
      [quantity, location, part_id]
    );

    // 如果是采购入库，更新采购订单状态
    if (related_order_id && transaction_type === 'purchase') {
      await pool.execute(
        "UPDATE purchase_order SET status = 'received' WHERE id = ?",
        [related_order_id]
      );
    }

    res.json({ code: 200, message: '入库成功', data: { id: result.insertId, batch_no: finalBatchNo } });
  } catch (error) {
    console.error('入库操作错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

// 出库操作
router.post('/out', authMiddleware, async (req, res) => {
  try {
    const { part_id, quantity, transaction_type = 'usage', receiver_id, location, remark, batch_no } = req.body;

    if (!part_id || !quantity) {
      return res.status(400).json({ code: 400, message: '备件ID和数量不能为空' });
    }

    // 检查库存是否充足
    const [inventory] = await pool.execute('SELECT quantity FROM inventory WHERE part_id = ?', [part_id]);
    if (inventory.length === 0) {
      return res.status(404).json({ code: 404, message: '库存记录不存在' });
    }
    if (inventory[0].quantity < quantity) {
      return res.status(400).json({ code: 400, message: '库存不足' });
    }

    const finalBatchNo = batch_no || generateBatchNo();

    // 创建出入库记录
    const [result] = await pool.execute(
      `INSERT INTO inventory_transaction 
       (part_id, type, quantity, batch_no, transaction_type, operator_id, receiver_id, location, remark)
       VALUES (?, 'out', ?, ?, ?, ?, ?, ?, ?)`,
      [part_id, quantity, finalBatchNo, transaction_type, req.user.id, receiver_id, location, remark]
    );

    // 更新库存
    await pool.execute(
      'UPDATE inventory SET quantity = quantity - ?, last_check_time = NOW() WHERE part_id = ?',
      [quantity, part_id]
    );

    res.json({ code: 200, message: '出库成功', data: { id: result.insertId, batch_no: finalBatchNo } });
  } catch (error) {
    console.error('出库操作错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

// 删除出入库记录（仅管理员，且需要回滚库存）
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // 只有系统管理员可以删除
    if (req.user.role_name !== '系统管理员') {
      return res.status(403).json({ code: 403, message: '无权限删除' });
    }

    // 获取记录信息
    const [transactions] = await pool.execute('SELECT * FROM inventory_transaction WHERE id = ?', [id]);
    if (transactions.length === 0) {
      return res.status(404).json({ code: 404, message: '记录不存在' });
    }

    const transaction = transactions[0];

    // 回滚库存
    if (transaction.type === 'in') {
      await pool.execute(
        'UPDATE inventory SET quantity = quantity - ? WHERE part_id = ?',
        [transaction.quantity, transaction.part_id]
      );
    } else {
      await pool.execute(
        'UPDATE inventory SET quantity = quantity + ? WHERE part_id = ?',
        [transaction.quantity, transaction.part_id]
      );
    }

    // 删除记录
    await pool.execute('DELETE FROM inventory_transaction WHERE id = ?', [id]);

    res.json({ code: 200, message: '删除成功' });
  } catch (error) {
    console.error('删除出入库记录错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

module.exports = router;

