import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import { monitoringSystem } from '../utils/monitoring.js';
import { logger } from '../utils/logger.js';
import { LogLevel } from '../utils/logger-types.js';

export function registerMonitorCommands(program: Command): void {
  const monitor = program.command('monitor')
    .description('系统监控和日志管理');

  monitor.command('status')
    .description('显示系统状态')
    .action(() => {
      monitoringSystem.displaySystemStatus();
    });

  monitor.command('rate-limit')
    .description('频率控制管理')
    .option('-p, --platform <platform>', '指定平台')
    .option('-r, --reset', '重置频率限制')
    .action((options) => {
      if (options.reset) {
        console.log(chalk.yellow('重置频率限制...'));
        monitoringSystem.getRateLimiter(options.platform || 'all').reset();
        console.log(chalk.green('✓ 频率限制已重置'));
      } else {
        const stats = monitoringSystem.getRateLimiter(options.platform || 'juejin').getStats();
        
        const table = new Table({
          head: ['指标', '当前值', '限制'],
          style: { head: ['cyan'], border: ['gray'] }
        });

        table.push(
          ['日用量', stats.dailyUsed.toString(), stats.dailyLimit.toString()],
          ['突发请求', stats.burstUsed.toString(), stats.burstLimit.toString()],
          ['并发数', stats.currentConcurrent.toString(), stats.maxConcurrent.toString()],
          ['成功率', `${stats.successRate.toFixed(1)}%`, '-'],
          ['平均响应时间', `${stats.avgResponseTime.toFixed(0)}ms`, '-'],
          ['退避状态', stats.isBackoff ? '是' : '否', '-']
        );

        console.log('\n⏱️ 频率控制状态');
        console.log(table.toString());
      }
    });

  monitor.command('expiration')
    .description('时效性管理')
    .option('-l, --list', '列出所有项目')
    .option('-e, --expiring', '显示即将过期项目')
    .option('-a, --add <type:name:platform:days>', '添加时效性项目')
    .action((options) => {
      if (options.add) {
        const [type, name, platform, days] = options.add.split(':');
        const id = monitoringSystem.registerExpirationItem({
          type: type as any,
          name,
          platformId: platform || undefined,
          expiresAt: Date.now() + parseInt(days) * 24 * 60 * 60 * 1000
        });
        console.log(chalk.green(`✓ 已添加时效性项目: ${id}`));
      } else if (options.expiring) {
        const items = monitoringSystem.getSystemStatus().expiringItems;
        
        if (items.length === 0) {
          console.log(chalk.green('✓ 无即将过期项目'));
        } else {
          const table = new Table({
            head: ['名称', '类型', '平台', '剩余时间'],
            style: { head: ['cyan'], border: ['gray'] }
          });

          items.forEach(item => {
            const timeLeft = item.expiresAt - Date.now();
            const hours = Math.floor(timeLeft / (60 * 60 * 1000));
            const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
            
            table.push([
              item.name,
              item.type,
              item.platformId || '-',
              `${hours}小时${minutes}分钟`
            ]);
          });

          console.log('\n⏰ 即将过期项目');
          console.log(table.toString());
        }
      } else {
        const items = monitoringSystem.expirationNotifier.getAllItems();
        
        const table = new Table({
          head: ['名称', '类型', '平台', '过期时间', '状态'],
          style: { head: ['cyan'], border: ['gray'] }
        });

        items.forEach(item => {
          const expired = item.expiresAt < Date.now();
          const status = expired 
            ? chalk.red('已过期')
            : chalk.green('正常');
          
          table.push([
            item.name,
            item.type,
            item.platformId || '-',
            new Date(item.expiresAt).toLocaleString(),
            status
          ]);
        });

        console.log('\n📋 时效性项目列表');
        console.log(table.toString());
      }
    });

  monitor.command('errors')
    .description('错误统计和可视化')
    .option('-s, --stats', '显示错误统计')
    .option('-t, --timeline', '显示错误时间线')
    .option('-h, --heatmap', '显示错误热力图')
    .option('-r, --resolve <id>', '标记错误为已解决')
    .action((options) => {
      if (options.resolve) {
        const success = monitoringSystem.errorHandler.resolveError(options.resolve);
        if (success) {
          console.log(chalk.green(`✓ 错误 ${options.resolve} 已标记为解决`));
        } else {
          console.log(chalk.red(`✗ 未找到错误 ${options.resolve}`));
        }
      } else if (options.timeline) {
        const stats = monitoringSystem.errorHandler.getStatistics();
        monitoringSystem.errorVisualizer.displayErrorTimeline(stats.topErrors);
      } else if (options.heatmap) {
        const stats = monitoringSystem.errorHandler.getStatistics();
        monitoringSystem.errorVisualizer.displayErrorHeatmap(stats.hourlyDistribution);
      } else {
        monitoringSystem.displayErrorStatistics();
      }
    });

  monitor.command('logs')
    .description('日志管理')
    .option('-l, --level <level>', '日志级别 (debug/info/warn/error)')
    .option('-n, --number <count>', '显示条数', '50')
    .option('-s, --search <query>', '搜索日志')
    .option('-c, --clear', '清空日志')
    .option('--set-level <level>', '设置日志级别')
    .action((options) => {
      if (options.setLevel) {
        const level = options.setLevel.toUpperCase() as LogLevel;
        logger.setLevel(level);
        console.log(chalk.green(`✓ 日志级别已设置为: ${level}`));
      } else if (options.clear) {
        console.log(chalk.yellow('日志清空功能暂未实现'));
      } else if (options.search) {
        const results = logger.searchLogs(options.search, {
          level: options.level?.toUpperCase() as LogLevel
        });
        
        console.log(chalk.cyan(`\n找到 ${results.length} 条匹配日志:\n`));
        results.slice(0, parseInt(options.number)).forEach(entry => {
          const time = new Date(entry.timestamp).toLocaleString();
          console.log(`${chalk.gray(time)} [${entry.level}] ${entry.message}`);
        });
      } else {
        const logs = logger.getRecentLogs(
          parseInt(options.number),
          options.level?.toUpperCase() as LogLevel
        );
        
        console.log(chalk.cyan(`\n最近 ${logs.length} 条日志:\n`));
        logs.forEach(entry => {
          const time = new Date(entry.timestamp).toLocaleString();
          const levelColors: Record<string, (s: string) => string> = {
            DEBUG: chalk.gray,
            INFO: chalk.blue,
            WARN: chalk.yellow,
            ERROR: chalk.red,
            FATAL: chalk.red.bold
          };
          const color = levelColors[entry.level] || chalk.white;
          console.log(`${chalk.gray(time)} ${color(`[${entry.level}]`)} ${entry.message}`);
        });
      }
    });
}
