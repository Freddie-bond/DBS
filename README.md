HEAD
# 船舶SMIS备件管理系统

基于Vue3 + Node.js + MySQL的船舶备件管理系统

## 技术栈

- 前端：Vue3 + Element Plus + Pinia + Vue Router
- 后端：Node.js + Express + MySQL
- 数据库：MySQL

## 项目结构

```
BostSMIS-1/
├── client/              # 前端项目
│   ├── src/
│   │   ├── api/        # API接口
│   │   ├── views/       # 页面组件
│   │   ├── components/  # 公共组件
│   │   ├── layouts/     # 布局组件
│   │   ├── router/      # 路由配置
│   │   ├── stores/      # Pinia状态管理
│   │   └── utils/       # 工具函数
├── server/              # 后端项目
│   ├── routes/          # 路由文件
│   ├── config/          # 配置文件
│   └── middleware/      # 中间件
├── database/            # 数据库脚本
└── package.json         # 项目配置
```

## 安装与运行

### 1. 安装依赖

```bash
# 安装后端依赖
npm install

# 安装前端依赖
cd client
npm install
```

### 2. 配置数据库

1. 创建MySQL数据库
2. 执行 `database/init.sql` 初始化数据库
3. 复制 `.env.example` 为 `.env` 并配置数据库连接信息

### 3. 配置环境变量

在项目根目录创建 `.env` 文件（可选，不创建则使用默认配置）：

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=123456
DB_NAME=bost_smis
PORT=3000
JWT_SECRET=your-secret-key-here
```

### 4. 运行项目

在项目根目录直接运行：

```bash
npm run dev
```

这将同时启动前端和后端服务：
- 前端服务：http://localhost:5173
- 后端API：http://localhost:3000/api

如果需要分别启动：

```bash
npm run server  # 后端服务（端口3000）
npm run client  # 前端服务（端口5173）
```

## 默认账号

- 用户名：admin
- 密码：admin123

## 功能模块

### 1. 备件信息管理
- 备件分类管理（树形结构）
- 备件编码生成与管理
- 备件基本信息维护
- 备件唯一标识（二维码/条形码）

### 2. 库存管理
- 实时库存查询
- 安全库存设置与预警
- 库存盘点功能
- 库存变动历史记录

### 3. 采购管理
- 采购计划制定与审批流程
- 供应商管理
- 询价比价管理
- 采购订单跟踪

### 4. 出入库管理
- 入库管理（采购入库、调拨入库）
- 出库管理（领用出库、调拨出库）
- 批次管理与追溯
- 责任人记录

### 5. 供应商管理
- 供应商信息维护
- 供应商评价与绩效管理
- 合作记录查询

### 6. 报表与统计
- 库存报表
- 采购报表
- 出入库流水报表
- 备件使用频率分析
- 支持导出Excel

### 7. 用户与权限管理
- 用户管理
- 角色管理
- 菜单权限与操作权限控制
- 登录日志与操作审计

## 系统角色

| 角色 | 权限说明 |
|------|---------|
| 系统管理员 | 用户管理、权限分配、系统配置、数据备份与恢复 |
| 机务主管 | 审核采购计划、查看全船备件库存、审批出入库申请、查看各类报表 |
| 采购员 | 管理供应商、发起采购申请、询价比价、跟踪订单状态 |
| 仓库管理员 | 管理出入库记录、执行库存盘点、维护库存状态、触发补货预警 |
| 普通船员 | 查询备件信息、申请领用备件、查看个人领用记录 |

## 开发说明

### 前端开发

前端使用Vue3 Composition API，所有组件使用JavaScript（非TypeScript）。

### 后端开发

后端使用Express框架，所有路由文件位于 `server/routes/` 目录。

### API接口

所有API接口统一返回格式：
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {}
}
```

### 数据库

数据库表结构定义在 `database/init.sql` 中，包含：
- 用户表（user）
- 角色表（role）
- 备件表（spare_part）
- 分类表（category）
- 库存表（inventory）
- 供应商表（supplier）
- 采购订单表（purchase_order）
- 出入库记录表（inventory_transaction）
- 登录日志表（login_log）
- 操作日志表（operation_log）

## 注意事项

1. 确保MySQL服务已启动
2. 确保端口3000和5173未被占用
3. 首次运行需要执行数据库初始化脚本
4. 生产环境请修改JWT密钥和数据库密码

## 许可证

ISC

=======
# DBS
