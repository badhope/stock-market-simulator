import chalk from 'chalk';
import Table from 'cli-table3';
import {
  ErrorCategory,
  ErrorSeverity,
  ErrorStatistics,
  ErrorRecord
} from './error-types.js';

export class ErrorVisualizer {
  displayStatistics(stats: ErrorStatistics): void {
    console.log('\n' + chalk.bold.cyan('═'.repeat(70)));
    console.log(chalk.bold.cyan('📊 错误统计分析报告'));
    console.log(chalk.bold.cyan('═'.repeat(70)));

    this.displaySummary(stats);
    this.displayByCategory(stats.byCategory);
    this.displayBySeverity(stats.bySeverity);
    this.displayByPlatform(stats.byPlatform);
    this.displayHourlyDistribution(stats.hourlyDistribution);
    this.displayDailyDistribution(stats.dailyDistribution);
    this.displayTopErrors(stats.topErrors);

    console.log(chalk.bold.cyan('═'.repeat(70)) + '\n');
  }

  private displaySummary(stats: ErrorStatistics): void {
    console.log(chalk.bold('\n📈 总体概况'));
    console.log(chalk.gray('─'.repeat(50)));
    
    const summaryTable = new Table({
      style: { head: ['cyan'], border: ['gray'] }
    });

    summaryTable.push(
      { '总错误数': chalk.yellow(stats.totalErrors.toString()) },
      { '24小时错误数': chalk.red(stats.errorRate.toString()) },
      { '平均解决时间': chalk.blue(this.formatDuration(stats.avgResolutionTime)) }
    );

    console.log(summaryTable.toString());
  }

  private displayByCategory(byCategory: Record<ErrorCategory, number>): void {
    console.log(chalk.bold('\n📂 按类别分布'));
    console.log(chalk.gray('─'.repeat(50)));

    const categoryNames: Record<ErrorCategory, string> = {
      [ErrorCategory.NETWORK]: '网络错误',
      [ErrorCategory.AUTHENTICATION]: '认证错误',
      [ErrorCategory.AUTHORIZATION]: '授权错误',
      [ErrorCategory.RATE_LIMIT]: '频率限制',
      [ErrorCategory.VALIDATION]: '验证错误',
      [ErrorCategory.CONTENT]: '内容错误',
      [ErrorCategory.PLATFORM]: '平台错误',
      [ErrorCategory.SYSTEM]: '系统错误',
      [ErrorCategory.UNKNOWN]: '未知错误'
    };

    const categoryIcons: Record<ErrorCategory, string> = {
      [ErrorCategory.NETWORK]: '🌐',
      [ErrorCategory.AUTHENTICATION]: '🔐',
      [ErrorCategory.AUTHORIZATION]: '🚫',
      [ErrorCategory.RATE_LIMIT]: '⏱️',
      [ErrorCategory.VALIDATION]: '✓',
      [ErrorCategory.CONTENT]: '📝',
      [ErrorCategory.PLATFORM]: '🏢',
      [ErrorCategory.SYSTEM]: '⚙️',
      [ErrorCategory.UNKNOWN]: '❓'
    };

    const table = new Table({
      head: ['类别', '数量', '占比', '图表'],
      style: { head: ['cyan'], border: ['gray'] }
    });

    const total = Object.values(byCategory).reduce((a, b) => a + b, 0) || 1;
    const sortedCategories = Object.entries(byCategory)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);

    sortedCategories.forEach(([category, count]) => {
      const cat = category as ErrorCategory;
      const percentage = ((count / total) * 100).toFixed(1);
      const bar = this.createBar(count, total, 20);
      
      table.push([
        `${categoryIcons[cat]} ${categoryNames[cat]}`,
        count.toString(),
        `${percentage}%`,
        bar
      ]);
    });

    console.log(table.toString());
  }

  private displayBySeverity(bySeverity: Record<ErrorSeverity, number>): void {
    console.log(chalk.bold('\n⚠️ 按严重程度分布'));
    console.log(chalk.gray('─'.repeat(50)));

    const severityColors = {
      [ErrorSeverity.LOW]: chalk.blue,
      [ErrorSeverity.MEDIUM]: chalk.yellow,
      [ErrorSeverity.HIGH]: chalk.red,
      [ErrorSeverity.CRITICAL]: chalk.red.bold.bgYellow
    };

    const severityNames = {
      [ErrorSeverity.LOW]: '低',
      [ErrorSeverity.MEDIUM]: '中',
      [ErrorSeverity.HIGH]: '高',
      [ErrorSeverity.CRITICAL]: '严重'
    };

    const table = new Table({
      head: ['严重程度', '数量', '图表'],
      style: { head: ['cyan'], border: ['gray'] }
    });

    const total = Object.values(bySeverity).reduce((a, b) => a + b, 0) || 1;

    Object.entries(bySeverity).forEach(([severity, count]) => {
      const sev = severity as ErrorSeverity;
      const color = severityColors[sev];
      const bar = this.createBar(count, total, 20, sev);
      
      table.push([
        color(severityNames[sev]),
        count.toString(),
        bar
      ]);
    });

    console.log(table.toString());
  }

  private displayByPlatform(byPlatform: Record<string, number>): void {
    const platforms = Object.entries(byPlatform).filter(([, count]) => count > 0);
    if (platforms.length === 0) return;

    console.log(chalk.bold('\n🏢 按平台分布'));
    console.log(chalk.gray('─'.repeat(50)));

    const table = new Table({
      head: ['平台', '错误数', '占比'],
      style: { head: ['cyan'], border: ['gray'] }
    });

    const total = Object.values(byPlatform).reduce((a, b) => a + b, 0);
    
    platforms
      .sort((a, b) => b[1] - a[1])
      .forEach(([platform, count]) => {
        const percentage = ((count / total) * 100).toFixed(1);
        table.push([platform, count.toString(), `${percentage}%`]);
      });

    console.log(table.toString());
  }

  private displayHourlyDistribution(hourly: number[]): void {
    console.log(chalk.bold('\n⏰ 24小时分布'));
    console.log(chalk.gray('─'.repeat(50)));

    const max = Math.max(...hourly) || 1;
    const displayHours = [0, 6, 12, 18, 23];
    
    let output = '';
    for (let i = 0; i < 24; i++) {
      const count = hourly[i];
      const barLength = Math.round((count / max) * 10);
      const bar = '█'.repeat(barLength) + '░'.repeat(10 - barLength);
      
      if (displayHours.includes(i)) {
        output += `${i.toString().padStart(2, '0')}时 ${bar} ${count}\n`;
      } else if (i % 3 === 0) {
        output += `${i.toString().padStart(2, '0')}时 ${bar} ${count}\n`;
      }
    }
    
    console.log(chalk.gray(output));
  }

  private displayDailyDistribution(daily: number[]): void {
    console.log(chalk.bold('\n📅 一周分布'));
    console.log(chalk.gray('─'.repeat(50)));

    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const max = Math.max(...daily) || 1;

    const table = new Table({
      head: ['日期', '错误数', '图表'],
      style: { head: ['cyan'], border: ['gray'] }
    });

    daily.forEach((count, index) => {
      const bar = this.createBar(count, max, 15);
      table.push([dayNames[index], count.toString(), bar]);
    });

    console.log(table.toString());
  }

  private displayTopErrors(errors: ErrorRecord[]): void {
    if (errors.length === 0) return;

    console.log(chalk.bold('\n🔝 Top 10 频发错误'));
    console.log(chalk.gray('─'.repeat(50)));

    const table = new Table({
      head: ['排名', '错误码', '消息', '平台', '次数'],
      style: { head: ['cyan'], border: ['gray'] },
      colWidths: [6, 12, 30, 10, 8]
    });

    errors.slice(0, 10).forEach((record, index) => {
      const severity = record.error.severity;
      const color = severity === ErrorSeverity.CRITICAL ? chalk.red :
                    severity === ErrorSeverity.HIGH ? chalk.yellow :
                    chalk.white;
      
      table.push([
        (index + 1).toString(),
        color(record.error.code),
        record.error.message.substring(0, 25) + '...',
        record.error.platformId || '-',
        record.occurrenceCount.toString()
      ]);
    });

    console.log(table.toString());
  }

  private createBar(
    value: number,
    max: number,
    length: number,
    severity?: ErrorSeverity
  ): string {
    const filled = Math.round((value / max) * length);
    const empty = length - filled;
    
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    
    if (severity === ErrorSeverity.CRITICAL) {
      return chalk.red.bgYellow(bar);
    } else if (severity === ErrorSeverity.HIGH) {
      return chalk.red(bar);
    } else if (severity === ErrorSeverity.MEDIUM) {
      return chalk.yellow(bar);
    }
    return chalk.blue(bar);
  }

  private formatDuration(ms: number): string {
    if (ms === 0) return '-';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}天${hours % 24}小时`;
    if (hours > 0) return `${hours}小时${minutes % 60}分钟`;
    if (minutes > 0) return `${minutes}分钟`;
    return `${seconds}秒`;
  }

  displayErrorTimeline(errors: ErrorRecord[]): void {
    console.log(chalk.bold.cyan('\n📅 错误时间线'));
    console.log(chalk.gray('─'.repeat(70)));

    const sorted = [...errors].sort((a, b) => b.lastOccurrence - a.lastOccurrence);
    const recent = sorted.slice(0, 20);

    recent.forEach(record => {
      const time = new Date(record.lastOccurrence).toLocaleString();
      const status = record.resolved 
        ? chalk.green('✓ 已解决') 
        : chalk.red('✗ 未解决');
      
      console.log(
        `${chalk.gray(time)} ${status} ${chalk.yellow(record.error.code)}: ${record.error.message.substring(0, 40)}`
      );
    });

    console.log(chalk.gray('─'.repeat(70)));
  }

  displayErrorHeatmap(hourly: number[]): void {
    console.log(chalk.bold.cyan('\n🌡️ 错误热力图 (24小时)'));
    console.log(chalk.gray('─'.repeat(70)));

    const max = Math.max(...hourly) || 1;
    const hours = Array.from({ length: 24 }, (_, i) => i);

    let header = '     ';
    hours.forEach(h => {
      header += h.toString().padStart(2, '0').substring(0, 2);
    });
    console.log(chalk.gray(header));

    let row = '错误 ';
    hours.forEach(h => {
      const count = hourly[h];
      const intensity = count / max;
      
      if (intensity === 0) {
        row += chalk.gray('░░');
      } else if (intensity < 0.25) {
        row += chalk.green('▒▒');
      } else if (intensity < 0.5) {
        row += chalk.yellow('▓▓');
      } else if (intensity < 0.75) {
        row += chalk.red('██');
      } else {
        row += chalk.red.bold('██');
      }
    });
    console.log(row);

    const legend = '图例: ' + 
      chalk.gray('░░') + ' 无 ' +
      chalk.green('▒▒') + ' 低 ' +
      chalk.yellow('▓▓') + ' 中 ' +
      chalk.red('██') + ' 高 ' +
      chalk.red.bold('██') + ' 严重';
    console.log(chalk.gray(legend));
    console.log(chalk.gray('─'.repeat(70)));
  }
}
