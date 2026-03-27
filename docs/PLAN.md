# 文章分发器 - 项目计划书

## 一、项目概述

### 1.1 项目名称
**文章分发器 (Article Distributor)**

### 1.2 项目简介
多平台文章分发CLI工具，支持一键发布到掘金、CSDN、博客园、知乎等多个技术写作平台，帮助内容创作者提高发布效率。

### 1.3 项目目标
- 实现多平台统一发布管理
- 提供安全的账号凭证存储
- 支持Markdown文章管理
- 提供发布数据统计分析

---

## 二、需求分析

### 2.1 功能需求

#### 2.1.1 核心功能
| 功能模块 | 功能描述 | 优先级 |
|---------|---------|--------|
| 多平台发布 | 支持同时发布到多个平台 | 高 |
| 账号管理 | 多平台账号统一管理，凭证加密存储 | 高 |
| 文章管理 | Markdown文章创建、编辑、导入导出 | 高 |
| 数据统计 | 发布状态、阅读数据统计 | 中 |
| 模板管理 | 文章模板创建与复用 | 中 |
| 定时发布 | 支持定时发布功能 | 低 |

#### 2.1.2 支持平台
| 平台类型 | 平台名称 | 发布方式 | 状态 |
|---------|---------|---------|------|
| 技术平台 | 掘金 | API + Cookie | ✅ 已实现 |
| 技术平台 | CSDN | API + Cookie | ✅ 已实现 |
| 技术平台 | 博客园 | API + Cookie | ✅ 已实现 |
| 技术平台 | SegmentFault | API + Cookie | 🔄 待实现 |
| 社交平台 | 知乎 | Cookie模拟 | 🔄 待实现 |
| 社交平台 | 简书 | Cookie模拟 | 🔄 待实现 |
| 媒体平台 | 微信公众号 | 官方API | 🔄 待实现 |
| 媒体平台 | 今日头条 | 官方API | 🔄 待实现 |

### 2.2 非功能需求

#### 2.2.1 安全性
- 账号凭证使用AES-256-GCM加密存储
- 加密密钥存储在用户本地配置文件
- 不传输任何敏感信息到第三方服务器

#### 2.2.2 性能要求
- 单篇文章发布响应时间 < 5秒
- 支持并发发布到多个平台
- 本地数据存储，无网络延迟

#### 2.2.3 可用性
- CLI交互式操作，降低使用门槛
- 支持命令行参数快速操作
- 提供详细的错误提示和帮助文档

---

## 三、技术方案

### 3.1 技术栈选型

| 技术领域 | 技术选型 | 选型理由 |
|---------|---------|---------|
| 运行环境 | Node.js 18+ | 跨平台、生态丰富、异步IO优秀 |
| 开发语言 | TypeScript | 类型安全、开发体验好、维护性强 |
| CLI框架 | Commander.js | 成熟稳定、功能完善、社区活跃 |
| 交互组件 | Inquirer.js | 丰富的交互组件、用户体验好 |
| HTTP客户端 | Axios | 功能完善、拦截器支持、广泛使用 |
| 加密算法 | AES-256-GCM | 安全性高、性能好、Node.js原生支持 |
| 测试框架 | Vitest | 快速、现代化、与Vite生态兼容 |
| 包管理器 | pnpm | 快速、节省磁盘空间、依赖管理严格 |

### 3.2 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                     CLI Layer (cli.ts)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  Account    │  │  Article    │  │  Publish    │    │
│  │  Commands   │  │  Commands   │  │  Commands   │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│                    Core Layer                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  Account    │  │  Article    │  │  Template   │    │
│  │  Manager    │  │  Manager    │  │  Manager    │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│                  Platform Layer                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  Juejin     │  │   CSDN      │  │  Cnblogs    │    │
│  │  Publisher  │  │  Publisher  │  │  Publisher  │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│                   Utility Layer                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Crypto    │  │   Config    │  │   Display   │    │
│  │   Utils     │  │   Manager   │  │   Utils     │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 3.3 数据模型

#### 3.3.1 账号模型 (Account)
```typescript
interface Account {
  id: string;              // 账号唯一标识
  platformId: string;      // 平台ID
  username: string;        // 用户名
  nickname?: string;       // 昵称
  avatar?: string;         // 头像
  credentials: EncryptedData;  // 加密的凭证
  status: 'active' | 'expired' | 'error';  // 状态
  lastUsed?: Date;         // 最后使用时间
  createdAt: Date;         // 创建时间
  updatedAt: Date;         // 更新时间
}
```

#### 3.3.2 文章模型 (Article)
```typescript
interface Article {
  id: string;              // 文章唯一标识
  title: string;           // 标题
  content: string;         // Markdown内容
  summary?: string;        // 摘要
  tags: string[];          // 标签
  category?: string;       // 分类
  coverImage?: string;     // 封面图
  status: 'draft' | 'published' | 'scheduled';  // 状态
  platforms: ArticlePlatform[];  // 发布平台信息
  createdAt: Date;         // 创建时间
  updatedAt: Date;         // 更新时间
  publishedAt?: Date;      // 发布时间
}
```

#### 3.3.3 发布结果模型 (PublishResult)
```typescript
interface PublishResult {
  success: boolean;        // 是否成功
  platformId: string;      // 平台ID
  url?: string;            // 发布后的URL
  articleId?: string;      // 平台文章ID
  error?: string;          // 错误信息
}
```

### 3.4 安全设计

#### 3.4.1 凭证加密流程
```
用户输入凭证
    │
    ▼
AES-256-GCM加密
    │
    ├── 生成随机IV (16字节)
    ├── 使用用户密钥派生加密密钥 (Scrypt)
    ├── 加密数据并生成认证标签
    │
    ▼
存储加密数据
{
  iv: "随机初始向量",
  data: "加密后的数据",
  tag: "认证标签"
}
```

#### 3.4.2 密钥管理
- 主密钥存储在用户目录 `~/.adrc`
- 每次加密使用不同的IV
- 使用Scrypt进行密钥派生，增加破解难度

---

## 四、项目结构

```
article-distributor/
├── src/
│   ├── cli.ts                 # CLI入口
│   ├── index.ts               # 导出入口
│   ├── types/
│   │   └── index.ts           # 类型定义
│   ├── utils/
│   │   ├── crypto.ts          # 加密工具
│   │   ├── config.ts          # 配置管理
│   │   ├── display.ts         # 显示工具
│   │   └── __tests__/         # 工具测试
│   ├── core/
│   │   ├── account.ts         # 账号管理核心
│   │   └── article.ts         # 文章管理核心
│   ├── platforms/
│   │   ├── base.ts            # 发布器基类
│   │   ├── juejin.ts          # 掘金发布器
│   │   ├── csdn.ts            # CSDN发布器
│   │   ├── cnblogs.ts         # 博客园发布器
│   │   ├── index.ts           # 平台管理器
│   │   └── __tests__/         # 平台测试
│   └── commands/
│       ├── account.ts         # 账号命令
│       ├── article.ts         # 文章命令
│       └── publish.ts         # 发布命令
├── dist/                      # 编译输出
├── docs/                      # 文档目录
│   └── PLAN.md               # 项目计划书
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── .eslintrc.cjs
├── .gitignore
└── README.md
```

---

## 五、开发计划

### 5.1 开发阶段

#### 第一阶段：核心功能 (已完成 ✅)
- [x] 项目初始化和基础架构
- [x] TypeScript配置和构建流程
- [x] CLI框架搭建
- [x] 账号管理模块
- [x] 文章管理模块
- [x] 掘金、CSDN、博客园发布器
- [x] 加密工具和配置管理
- [x] 单元测试框架

#### 第二阶段：功能完善 (进行中 🔄)
- [ ] 更多平台支持（知乎、简书、SegmentFault）
- [ ] 文章编辑器集成
- [ ] 发布日志和错误追踪
- [ ] 批量发布功能
- [ ] 文章同步更新

#### 第三阶段：高级功能 (计划中 📋)
- [ ] 定时发布功能
- [ ] 数据统计仪表板
- [ ] 文章版本管理
- [ ] 团队协作功能
- [ ] Web管理界面

### 5.2 里程碑

| 里程碑 | 目标 | 状态 |
|-------|------|------|
| v1.0.0 | 核心功能完成，支持3个平台 | ✅ 已完成 |
| v1.1.0 | 支持6个平台，优化用户体验 | 🔄 进行中 |
| v1.2.0 | 数据统计、批量发布 | 📋 计划中 |
| v2.0.0 | Web界面、团队协作 | 📋 计划中 |

---

## 六、使用指南

### 6.1 安装

```bash
# 克隆项目
git clone https://github.com/your-username/article-distributor.git
cd article-distributor

# 安装依赖
pnpm install

# 构建项目
pnpm build

# 全局安装（可选）
pnpm link --global
```

### 6.2 快速开始

```bash
# 初始化项目
ad init

# 添加账号
ad account add

# 创建文章
ad article create

# 发布文章
ad publish run <article-id>
```

### 6.3 常用命令

```bash
# 账号管理
ad account list              # 列出所有账号
ad account add               # 添加账号
ad account test <id>         # 测试账号连接
ad account platforms         # 查看支持的平台

# 文章管理
ad article list              # 列出所有文章
ad article create            # 创建文章
ad article edit <id>         # 编辑文章
ad article show <id>         # 查看详情
ad article export <id> file  # 导出文章

# 发布管理
ad publish run <id>          # 发布文章
ad publish status <id>       # 查看状态
ad publish history           # 发布历史
ad publish stats <id>        # 数据统计
```

---

## 七、风险与对策

### 7.1 技术风险

| 风险 | 影响 | 概率 | 对策 |
|-----|------|------|------|
| 平台API变更 | 高 | 中 | 使用稳定的API端点，及时更新适配 |
| Cookie失效 | 中 | 高 | 提供账号测试命令，提醒用户更新 |
| 反爬虫机制 | 高 | 中 | 控制请求频率，模拟真实用户行为 |

### 7.2 安全风险

| 风险 | 影响 | 概率 | 对策 |
|-----|------|------|------|
| 凭证泄露 | 高 | 低 | AES-256加密，密钥本地存储 |
| 数据丢失 | 中 | 低 | 数据本地存储，支持导出备份 |

---

## 八、后续规划

### 8.1 短期目标（1-3个月）
- 完善现有平台支持
- 添加更多技术平台
- 优化错误处理和用户提示
- 编写详细的使用文档

### 8.2 中期目标（3-6个月）
- 开发Web管理界面
- 支持团队协作
- 添加数据分析和可视化
- 支持更多内容格式

### 8.3 长期目标（6-12个月）
- 构建内容创作者生态
- 提供API接口
- 支持插件系统
- 多语言支持

---

## 九、总结

文章分发器是一个实用的CLI工具，旨在帮助内容创作者提高多平台发布效率。通过模块化的架构设计和安全的凭证管理，为用户提供便捷、安全的发布体验。

项目采用现代化的技术栈，代码结构清晰，易于维护和扩展。后续将持续迭代，添加更多平台支持和高级功能，打造完善的内容分发解决方案。

---

**文档版本**: v1.0.0  
**最后更新**: 2026-03-27  
**维护者**: Article Distributor Team
