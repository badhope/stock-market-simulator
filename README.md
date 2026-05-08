# 中国高考公平性数据分析平台

基于真实可追溯数据的多维度数据挖掘与可视化分析平台。

## 核心功能

- **15个省份高考数据** - 北京、上海、河南、广东等主要省份完整录取数据分析
- **9维度数据挖掘** - 经济投入、社会流动性、政策因素、城乡差距等深度分析
- **教育公平性指数** - 量化评估各省录取公平程度
- **教育漏斗模型** - 从小学到顶尖名校的逐级筛选机制可视化
- **社会再生产分析** - 揭示阶层固化的数学规律
- **交互式图表** - ECharts 支持的数据可视化，支持动态筛选

## 技术栈

- React 18 + TypeScript
- Vite
- Ant Design
- ECharts
- Zustand

## 数据来源

- 国家统计局《教育事业发展统计公报》
- 教育部高校招生计划
- 各省教育考试院公开数据

## 核心发现

1. **城乡差距** - 城市学生985录取率(65%)是农村(12%)的5.4倍
2. **区域差距** - 北京211高校(26所)是河南(1所)的26倍
3. **本科录取率差距** - 北京(85.71%) vs 河南(26.2%)
4. **复读生竞争** - 河南复读生比例高达28%
5. **核心规律** - 教育系统是社会分层的机器，而非社会流动的阶梯

## 开始使用

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 项目结构

```
src/
├── components/       # React 组件
│   ├── Navbar.tsx           # 导航栏
│   ├── DataMiningAnalysis.tsx # 数据挖掘分析页
│   ├── AnalysisReport.tsx    # 分析报告页
│   ├── ExportImport.tsx      # 数据导入导出
│   └── ThemeToggle.tsx       # 主题切换
├── data/
│   └── gaokaoData.ts        # 高考数据与算法
├── store/
│   └── useStore.ts          # Zustand 状态管理
├── types/
│   └── index.ts             # TypeScript 类型定义
├── App.tsx                  # 应用入口
├── main.tsx                 # React 入口
└── index.css                # 全局样式
```

## License

MIT
