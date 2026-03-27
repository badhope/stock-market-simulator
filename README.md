<div align="center">

# 📝 文章分发器

**多平台文章发布CLI工具 - 一键发布到掘金、CSDN、博客园等平台**

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.3-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[功能特性](#-功能特性) • [快速开始](#-快速开始) • [使用指南](#-使用指南) • [开发文档](#-开发文档)

</div>

---

## 📖 项目简介

**文章分发器** 是一个强大的命令行工具，帮助内容创作者将文章同时发布到多个技术写作平台。无需逐个平台手动发布，一键即可完成多平台同步，大幅提升发布效率。

### 为什么选择文章分发器？

- 🚀 **高效发布** - 一键发布到多个平台，节省重复劳动
- 🔐 **安全可靠** - AES-256加密存储账号凭证，保护隐私安全
- 📝 **Markdown支持** - 原生支持Markdown格式，兼容主流编辑器
- 🎯 **简单易用** - 交互式CLI，无需复杂配置即可上手
- 📊 **数据统计** - 查看各平台阅读、点赞、评论数据
- 🔧 **灵活扩展** - 模块化架构，易于添加新平台

---

## ✨ 功能特性

### 🌐 多平台支持

| 平台 | 类型 | 状态 | 发布方式 |
|------|------|------|----------|
| 掘金 | 技术社区 | ✅ 已支持 | API + Cookie |
| CSDN | 技术博客 | ✅ 已支持 | API + Cookie |
| 博客园 | 技术博客 | ✅ 已支持 | API + Cookie |
| SegmentFault | 技术社区 | 🔄 开发中 | API + Cookie |
| 知乎 | 社交平台 | 📋 计划中 | Cookie模拟 |
| 简书 | 写作平台 | 📋 计划中 | Cookie模拟 |
| 微信公众号 | 媒体平台 | 📋 计划中 | 官方API |
| 今日头条 | 媒体平台 | 📋 计划中 | 官方API |

### 🔑 核心功能

- **账号管理** - 统一管理多个平台的登录凭证
- **文章管理** - 创建、编辑、导入、导出Markdown文章
- **一键发布** - 选择平台后自动发布，实时反馈结果
- **模板系统** - 创建文章模板，快速生成标准化内容
- **数据统计** - 查看各平台的阅读、互动数据
- **发布历史** - 追踪所有发布记录和状态

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0 (推荐) 或 npm >= 9.0.0

### 安装

```bash
# 克隆仓库
git clone https://github.com/your-username/article-distributor.git
cd article-distributor

# 安装依赖
pnpm install

# 构建项目
pnpm build

# 全局安装（可选）
pnpm link --global
```

### 初始化

```bash
# 初始化项目，创建必要目录
ad init

# 查看帮助
ad --help
```

---

## 📚 使用指南

### 账号管理

```bash
# 查看支持的平台
ad account platforms

# 添加账号（交互式）
ad account add

# 列出所有账号
ad account list

# 测试账号连接
ad account test <account-id>

# 删除账号
ad account remove <account-id>
```

<details>
<summary>💡 如何获取Cookie？</summary>

1. 登录目标平台（如掘金）
2. 打开浏览器开发者工具 (F12)
3. 切换到 Network 标签
4. 刷新页面，找到任意请求
5. 在请求头中找到 Cookie 字段并复制

</details>

### 文章管理

```bash
# 创建新文章
ad article create

# 从Markdown文件导入
ad article create -f ./my-article.md

# 列出所有文章
ad article list

# 查看文章详情
ad article show <article-id>

# 编辑文章
ad article edit <article-id>

# 导出文章
ad article export <article-id> ./output.md

# 删除文章
ad article remove <article-id>
```

### 模板管理

```bash
# 列出所有模板
ad article template list

# 创建模板
ad article template create
```

### 发布文章

```bash
# 发布文章（交互式选择平台）
ad publish run <article-id>

# 发布到指定平台
ad publish run <article-id> -p juejin,csdn,cnblogs

# 模拟发布（不实际发布）
ad publish run <article-id> --dry-run

# 查看发布状态
ad publish status <article-id>

# 查看发布历史
ad publish history

# 查看统计数据
ad publish stats <article-id>
```

---

## 🛠️ 开发文档

### 项目结构

```
article-distributor/
├── src/
│   ├── cli.ts                 # CLI入口
│   ├── types/                 # TypeScript类型定义
│   ├── utils/                 # 工具函数
│   │   ├── crypto.ts          # 加密工具
│   │   ├── config.ts          # 配置管理
│   │   └── display.ts         # 显示工具
│   ├── core/                  # 核心模块
│   │   ├── account.ts         # 账号管理
│   │   └── article.ts         # 文章管理
│   ├── platforms/             # 平台发布器
│   │   ├── base.ts            # 基类
│   │   ├── juejin.ts          # 掘金
│   │   ├── csdn.ts            # CSDN
│   │   └── cnblogs.ts         # 博客园
│   └── commands/              # CLI命令
│       ├── account.ts         # 账号命令
│       ├── article.ts         # 文章命令
│       └── publish.ts         # 发布命令
├── docs/                      # 文档
│   └── PLAN.md               # 项目计划书
├── dist/                      # 编译输出
└── package.json
```

### 开发命令

```bash
# 开发模式（热重载）
pnpm dev

# 构建
pnpm build

# 运行测试
pnpm test

# 测试覆盖率
pnpm test:coverage

# 代码检查
pnpm lint
```

### 添加新平台

1. 在 `src/platforms/` 创建新的发布器文件
2. 继承 `BasePublisher` 基类
3. 实现必要的方法：
   - `publish()` - 发布文章
   - `update()` - 更新文章
   - `delete()` - 删除文章
   - `getStats()` - 获取统计数据
   - `validateCredentials()` - 验证凭证

```typescript
// src/platforms/newplatform.ts
import { BasePublisher } from './base.js';
import { Article, PublishResult, Account } from '../types/index.js';

export class NewPlatformPublisher extends BasePublisher {
  readonly platformId = 'newplatform';
  readonly name = '新平台';

  async publish(article: Article, account: Account): Promise<PublishResult> {
    // 实现发布逻辑
  }

  // ... 其他方法
}
```

4. 在 `src/platforms/index.ts` 注册发布器

---

## 🔐 安全说明

### 凭证加密

- 使用 **AES-256-GCM** 加密算法
- 每次加密使用随机IV（初始化向量）
- 使用Scrypt进行密钥派生
- 加密密钥存储在本地 `~/.adrc` 文件

### 数据存储

- 所有数据存储在本地 `.data/` 目录
- 不上传任何数据到云端
- 支持数据导出备份

---

## 📋 常见问题

<details>
<summary><b>Q: Cookie会过期吗？</b></summary>

是的，Cookie有时效性。当发布失败时，可以使用 `ad account test <id>` 测试账号状态，如果失效请重新添加账号。

</details>

<details>
<summary><b>Q: 支持哪些Markdown语法？</b></summary>

支持标准Markdown语法，各平台会自动转换适配。建议使用通用语法以确保兼容性。

</details>

<details>
<summary><b>Q: 如何备份数据？</b></summary>

数据存储在项目目录的 `.data/` 文件夹中，直接复制该文件夹即可备份。也可以使用 `ad article export` 导出单篇文章。

</details>

<details>
<summary><b>Q: 发布失败怎么办？</b></summary>

1. 检查账号状态：`ad account test <id>`
2. 查看错误信息：`ad publish status <article-id>`
3. 更新Cookie后重试
4. 如仍有问题，请提交Issue

</details>

---

## 🤝 参与贡献

欢迎提交Issue和Pull Request！

### 贡献步骤

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

### 开发规范

- 使用 TypeScript 编写代码
- 遵循 ESLint 规则
- 为新功能编写测试
- 更新相关文档

---

## 📄 许可证

本项目基于 [MIT](./LICENSE) 许可证开源。

---

## 🙏 致谢

感谢以下开源项目：

- [Commander.js](https://github.com/tj/commander.js) - CLI框架
- [Inquirer.js](https://github.com/SBoudrias/Inquirer.js) - 交互式命令行
- [Chalk](https://github.com/chalk/chalk) - 终端字符串样式
- [Axios](https://github.com/axios/axios) - HTTP客户端

---

## 📮 联系方式

- 提交Issue: [GitHub Issues](https://github.com/your-username/article-distributor/issues)
- 功能建议: [GitHub Discussions](https://github.com/your-username/article-distributor/discussions)

---

<div align="center">

**如果这个项目对你有帮助，请给一个 ⭐️ Star 支持一下！**

Made with ❤️ by Article Distributor Team

</div>
