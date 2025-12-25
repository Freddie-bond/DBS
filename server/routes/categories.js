const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

// 获取分类树
router.get('/tree', authMiddleware, async (req, res) => {
  try {
    const [categories] = await pool.execute(
      'SELECT * FROM category ORDER BY parent_id, sort_order'
    );

    const buildTree = (parentId = 0) => {
      return categories
        .filter(cat => cat.parent_id === parentId)
        .map(cat => ({
          ...cat,
          children: buildTree(cat.id)
        }));
    };

    res.json({ code: 200, data: buildTree() });
  } catch (error) {
    console.error('获取分类树错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

// 获取分类列表（扁平）
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [categories] = await pool.execute(
      'SELECT * FROM category ORDER BY parent_id, sort_order'
    );
    res.json({ code: 200, data: categories });
  } catch (error) {
    console.error('获取分类列表错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

// 创建分类
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, parent_id = 0, code, sort_order = 0 } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO category (name, parent_id, code, sort_order) VALUES (?, ?, ?, ?)',
      [name, parent_id, code, sort_order]
    );

    res.json({ code: 200, message: '创建成功', data: { id: result.insertId } });
  } catch (error) {
    console.error('创建分类错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

// 更新分类
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, parent_id, code, sort_order } = req.body;

    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (parent_id !== undefined) {
      updates.push('parent_id = ?');
      params.push(parent_id === null ? null : Number(parent_id));
    }
    if (code !== undefined) {
      updates.push('code = ?');
      params.push(code);
    }
    if (sort_order !== undefined) {
      updates.push('sort_order = ?');
      params.push(sort_order);
    }

    if (updates.length === 0) {
      return res.status(400).json({ code: 400, message: '没有要更新的字段' });
    }

    params.push(id);
    await pool.execute(`UPDATE category SET ${updates.join(', ')} WHERE id = ?`, params);

    res.json({ code: 200, message: '更新成功' });
  } catch (error) {
    console.error('更新分类错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

// 删除分类
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查是否有子分类
    const [children] = await pool.execute('SELECT COUNT(*) as count FROM category WHERE parent_id = ?', [id]);
    if (children[0].count > 0) {
      return res.status(400).json({ code: 400, message: '该分类下存在子分类，无法删除' });
    }

    // 检查是否有备件使用该分类
    const [parts] = await pool.execute('SELECT COUNT(*) as count FROM spare_part WHERE category_id = ?', [id]);
    if (parts[0].count > 0) {
      return res.status(400).json({ code: 400, message: '该分类下存在备件，无法删除' });
    }

    await pool.execute('DELETE FROM category WHERE id = ?', [id]);
    res.json({ code: 200, message: '删除成功' });
  } catch (error) {
    console.error('删除分类错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

module.exports = router;

