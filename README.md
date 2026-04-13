# 💹 Stock Market Simulator

专业股票市场模拟器 - 100% 还原真实券商交易体验

> 纯前端实现的高仿真股票交易平台，用户完全看不出是游戏

[![在线演示](https://img.shields.io/badge/🚀_在线演示-GitHub_Pages-brightgreen?style=for-the-badge)](https://badhope.github.io/stock-market-simulator/)

[![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Zustand](https://img.shields.io/badge/Zustand-4-yellow?style=flat-square)](https://zustand-demo.pmnd.rs/)
[![Ant Design](https://img.shields.io/badge/Ant_Design-5-1677ff?style=flat-square&logo=antdesign)](https://ant.design/)
[![ECharts](https://img.shields.io/badge/ECharts-5-AA344D?style=flat-square)](https://echarts.apache.org/)
[![GitHub license](https://img.shields.io/github/license/badhope/stock-market-simulator?style=flat-square)](https://github.com/badhope/stock-market-simulator/blob/main/LICENSE)

---

## ✨ 核心特性

### 🎯 券商级仿真度

- ✅ **T+1 交易规则** - 当天买入，下一交易日才可卖出，完美还原A股规则
- ✅ **五档盘口** - 买1-买5 / 卖1-卖5 实时盘口，带成交量分布
- ✅ **精确手续费** - 印花税(卖出0.1%) + 佣金(万2.5，最低5元) + 过户费
- ✅ **订单撮合引擎** - 市价单、限价单、部成、撤单完整状态机
- ✅ **资金冻结/解冻** - 委托时冻结，成交/撤单时解冻
- ✅ **持仓成本核算** - FIFO先进先出算法，精确计算盈亏

### 🎨 专业级 UI/UX

- 🌙 **暗黑玻璃态主题** - GitHub 级专业暗黑设计
- 📊 **四个功能页面**：
  - **行情中心** - 8只样板股票实时行情，支持搜索，一键交易
  - **交易页面** - 分时走势图 + 五档盘口 + 快捷仓位 + 当日委托
  - **我的持仓** - 环形饼图分布 + 实时盈亏计算 + 一键交易
  - **成交记录** - 委托记录 + 成交明细 + 历史记录
- ⚡ **60帧过渡动画** - 所有交互带平滑过渡效果
- 🔗 **全链路互通** - 持仓→交易，行情→交易一键跳转

### 🔧 技术实现

- 💾 **localStorage 持久化** - 刷新页面数据不丢失
- 🚀 **纯前端实现** - 零后端依赖，开箱即用
- 📈 **实时价格模拟** - 3秒自动刷新行情
- 🎯 **严格类型安全** - TypeScript 严格模式 0 Error

---

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

然后打开 http://localhost:3000 开始交易！

---

## 📸 功能截图

| 行情中心 | 交易页面 |
|---------|---------|
| ![行情中心](.github/images/market.png) | ![交易页面](.github/images/trade.png) |
| 我的持仓 | 成交记录 |
| ![我的持仓](.github/images/portfolio.png) | ![成交记录](.github/images/history.png) |

---

## 🏗️ 项目架构

```
src/
├── store/
│   └── useStore.ts          # Zustand 状态管理 + 交易核心逻辑
├── types/
│   └── index.ts             # TypeScript 类型定义
├── pages/
│   ├── MarketPage.tsx       # 行情中心
│   ├── TradePage.tsx        # 交易页面
│   ├── PortfolioPage.tsx    # 我的持仓
│   └── HistoryPage.tsx      # 成交记录
├── components/
│   └── Navbar.tsx           # 导航栏 + 账户信息
├── utils/
│   └── format.ts            # 金融数据格式化
├── index.css                # CSS Variables + 暗黑主题
├── App.tsx                  # 路由入口
└── main.tsx                 # 应用入口
```

---

## 🎮 玩法说明

1. **初始资金**：¥ 100,000 模拟资金
2. **交易时间**：7x24 小时全天候开市
3. **选股**：从行情中心选择股票，点击「交易」按钮
4. **买卖**：选择买入/卖出方向，输入价格和数量
5. **快捷仓位**：1/4仓、1/3仓、半仓、全仓一键下单
6. **查看持仓**：在「我的持仓」查看盈亏和持仓分布
7. **撤单**：未成交的委托可以在历史页面或交易页面撤销

---

## 📊 交易规则

| 费用项 | 费率 | 说明 |
|--------|------|------|
| 印花税 | 0.1% | 仅卖出时收取 |
| 佣金 | 0.025% | 最低5元，买卖双向收取 |
| 过户费 | 0.001% | 最低1元，买卖双向收取 |

| 订单类型 | 说明 |
|---------|------|
| 限价单 | 指定价格，达到才成交 |
| 市价单 | 以当前最优价格成交 |

| 订单状态 | 说明 |
|---------|------|
| 已报 | 已提交等待成交 |
| 部成 | 部分成交 |
| 已成 | 完全成交 |
| 已撤 | 已撤销 |
| 废单 | 拒绝成交（资金不足等） |

---

## 🛠️ 开发

```bash
# 类型检查
npx tsc --noEmit

# 代码检查
npm run lint

# 生产预览
npm run preview
```

---

## 📝 License

MIT License - feel free to use this project for learning and fun!

---

**如果觉得不错，请给个 ⭐ Star！**

---

> ⚠️ **免责声明**：本项目仅供学习娱乐，不构成任何投资建议。股市有风险，投资需谨慎。
