import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { getArticle, updatePublishStatus, getAllArticles } from '../core/article.js';
import { getAccount, getAccountsByPlatform, getPlatform, SUPPORTED_PLATFORMS } from '../core/account.js';
import { platformManager } from '../platforms/index.js';
import { logSuccess, logError, logInfo, logWarning, createSpinner, formatTable } from '../utils/display.js';
import { PublishResult } from '../types/index.js';

export function registerPublishCommands(program: Command): void {
  const publishCmd = program.command('publish').alias('p').description('发布管理');
  
  publishCmd
    .command('run <articleId>')
    .description('发布文章到指定平台')
    .option('-p, --platforms <platforms>', '平台ID（逗号分隔）')
    .option('-a, --account <accountId>', '指定账号ID')
    .option('--dry-run', '模拟发布（不实际发布）')
    .action(async (articleId, options) => {
      const article = getArticle(articleId);
      if (!article) {
        logError('文章不存在');
        return;
      }
      
      let targetPlatforms: string[] = [];
      
      if (options.platforms) {
        targetPlatforms = options.platforms.split(',').map((p: string) => p.trim());
      } else {
        const { selected } = await inquirer.prompt([
          {
            type: 'checkbox',
            name: 'selected',
            message: '选择发布平台:',
            choices: SUPPORTED_PLATFORMS.map(p => ({
              name: p.name,
              value: p.id,
              checked: article.platforms.some(ap => ap.platformId === p.id)
            }))
          }
        ]);
        targetPlatforms = selected;
      }
      
      if (targetPlatforms.length === 0) {
        logWarning('未选择任何平台');
        return;
      }
      
      const publishAccounts = [];
      
      for (const platformId of targetPlatforms) {
        const platform = getPlatform(platformId);
        if (!platform) {
          logWarning(`不支持的平台: ${platformId}`);
          continue;
        }
        
        let account;
        
        if (options.account) {
          account = getAccount(options.account);
        } else {
          const platformAccounts = getAccountsByPlatform(platformId);
          
          if (platformAccounts.length === 0) {
            logWarning(`${platform.name} 暂无账号，请先添加`);
            continue;
          }
          
          if (platformAccounts.length === 1) {
            account = platformAccounts[0];
          } else {
            const { selected } = await inquirer.prompt([
              {
                type: 'list',
                name: 'selected',
                message: `选择 ${platform.name} 账号:`,
                choices: platformAccounts.map(a => ({
                  name: `${a.username} ${a.nickname ? `(${a.nickname})` : ''}`,
                  value: a.id
                }))
              }
            ]);
            account = platformAccounts.find(a => a.id === selected);
          }
        }
        
        if (account) {
          publishAccounts.push(account);
        }
      }
      
      if (publishAccounts.length === 0) {
        logError('没有可用的账号');
        return;
      }
      
      console.log(chalk.cyan('\n即将发布到以下平台:\n'));
      publishAccounts.forEach(account => {
        const platform = getPlatform(account.platformId);
        console.log(`  ${platform?.name}: ${account.username}`);
      });
      
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: '确认发布？',
          default: true
        }
      ]);
      
      if (!confirm) {
        logInfo('已取消发布');
        return;
      }
      
      if (options.dryRun) {
        logInfo('模拟发布模式...');
        for (const account of publishAccounts) {
          const platform = getPlatform(account.platformId);
          console.log(chalk.gray(`  [模拟] 发布到 ${platform?.name}`));
          updatePublishStatus(articleId, account.platformId, 'published', {
            url: `https://example.com/${account.platformId}/${articleId}`,
            articleId: `mock-${articleId}`
          });
        }
        logSuccess('模拟发布完成');
        return;
      }
      
      const spinner = createSpinner('发布中...');
      const results = await platformManager.publishToMultiple(article, publishAccounts);
      spinner.stop();
      
      console.log(chalk.cyan('\n发布结果:\n'));
      
      let successCount = 0;
      let failCount = 0;
      
      results.forEach((result: PublishResult, platformId: string) => {
        const platform = getPlatform(platformId);
        
        if (result.success) {
          console.log(chalk.green(`  ✓ ${platform?.name}`));
          if (result.url) {
            console.log(chalk.gray(`    ${result.url}`));
          }
          updatePublishStatus(articleId, platformId, 'published', {
            url: result.url,
            articleId: result.articleId
          });
          successCount++;
        } else {
          console.log(chalk.red(`  ✗ ${platform?.name}`));
          console.log(chalk.gray(`    ${result.error}`));
          updatePublishStatus(articleId, platformId, 'failed', {
            error: result.error
          });
          failCount++;
        }
      });
      
      console.log();
      logSuccess(`成功: ${successCount}, 失败: ${failCount}`);
    });
  
  publishCmd
    .command('status <articleId>')
    .description('查看发布状态')
    .action((articleId) => {
      const article = getArticle(articleId);
      if (!article) {
        logError('文章不存在');
        return;
      }
      
      if (article.platforms.length === 0) {
        logInfo('该文章尚未发布到任何平台');
        return;
      }
      
      console.log(chalk.cyan(`\n文章: ${article.title}\n`));
      
      const rows = article.platforms.map(p => {
        const platform = getPlatform(p.platformId);
        const statusMap: Record<string, string> = {
          pending: chalk.yellow('待发布'),
          publishing: chalk.blue('发布中'),
          published: chalk.green('已发布'),
          failed: chalk.red('失败')
        };
        
        return [
          platform?.name || p.platformId,
          statusMap[p.status] || p.status,
          p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : '-',
          p.url || p.error || '-'
        ];
      });
      
      console.log(formatTable(
        ['平台', '状态', '发布时间', '链接/错误'],
        rows
      ));
    });
  
  publishCmd
    .command('history')
    .alias('h')
    .description('查看发布历史')
    .option('-l, --limit <number>', '显示数量', '10')
    .action((options) => {
      const articles = getAllArticles()
        .filter(a => a.status === 'published')
        .sort((a, b) => {
          const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
          const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
          return bTime - aTime;
        })
        .slice(0, parseInt(options.limit));
      
      if (articles.length === 0) {
        logInfo('暂无发布历史');
        return;
      }
      
      const rows = articles.map(article => {
        const platforms = article.platforms
          .filter(p => p.status === 'published')
          .map(p => getPlatform(p.platformId)?.name || p.platformId)
          .join(', ');
        
        return [
          article.id.slice(0, 8),
          article.title.slice(0, 30),
          platforms || '-',
          article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : '-'
        ];
      });
      
      console.log(formatTable(
        ['ID', '标题', '平台', '发布时间'],
        rows
      ));
    });
  
  publishCmd
    .command('stats <articleId>')
    .description('查看文章统计数据')
    .action(async (articleId) => {
      const article = getArticle(articleId);
      if (!article) {
        logError('文章不存在');
        return;
      }
      
      const spinner = createSpinner('获取统计数据...');
      
      const accounts = article.platforms
        .map(p => getAccountsByPlatform(p.platformId)[0])
        .filter(Boolean);
      
      const stats = await platformManager.getStatsFromMultiple(article, accounts);
      
      spinner.stop();
      
      console.log(chalk.cyan(`\n文章: ${article.title}\n`));
      
      const rows: string[][] = [];
      
      stats.forEach((stat, platformId) => {
        const platform = getPlatform(platformId);
        rows.push([
          platform?.name || platformId,
          String(stat.views),
          String(stat.likes),
          String(stat.comments)
        ]);
      });
      
      if (rows.length === 0) {
        logInfo('暂无统计数据');
        return;
      }
      
      console.log(formatTable(
        ['平台', '阅读', '点赞', '评论'],
        rows
      ));
    });
}
