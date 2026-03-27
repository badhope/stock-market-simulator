import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import {
  addAccount,
  getAllAccounts,
  getAccount,
  deleteAccount,
  updateAccount,
  getCredentials,
  SUPPORTED_PLATFORMS,
  getPlatform
} from '../core/account.js';
import { logSuccess, logError, logInfo, createSpinner, formatTable } from '../utils/display.js';
import { platformManager } from '../platforms/index.js';

export function registerAccountCommands(program: Command): void {
  const accountCmd = program.command('account').description('账号管理');
  
  accountCmd
    .command('list')
    .alias('ls')
    .description('列出所有账号')
    .option('-p, --platform <platform>', '按平台筛选')
    .action(async (options) => {
      const accounts = getAllAccounts();
      const filtered = options.platform
        ? accounts.filter(a => a.platformId === options.platform)
        : accounts;
      
      if (filtered.length === 0) {
        logInfo('暂无账号');
        return;
      }
      
      const rows = filtered.map(account => {
        const platform = getPlatform(account.platformId);
        return [
          account.id.slice(0, 8),
          platform?.name || account.platformId,
          account.username,
          account.nickname || '-',
          account.status === 'active' ? chalk.green('正常') : chalk.red('异常'),
          account.lastUsed ? new Date(account.lastUsed).toLocaleDateString() : '-'
        ];
      });
      
      console.log(formatTable(
        ['ID', '平台', '用户名', '昵称', '状态', '最后使用'],
        rows
      ));
    });
  
  accountCmd
    .command('add')
    .description('添加账号')
    .option('-p, --platform <platform>', '平台ID')
    .action(async (options) => {
      let platformId = options.platform;
      
      if (!platformId) {
        const { selected } = await inquirer.prompt([
          {
            type: 'list',
            name: 'selected',
            message: '选择平台:',
            choices: SUPPORTED_PLATFORMS.map(p => ({
              name: `${p.name} (${p.id})`,
              value: p.id
            }))
          }
        ]);
        platformId = selected;
      }
      
      const platform = getPlatform(platformId);
      if (!platform) {
        logError('不支持的平台');
        return;
      }
      
      console.log(chalk.cyan(`\n添加 ${platform.name} 账号\n`));
      console.log(chalk.gray('请输入登录凭证（Cookie或Token）\n'));
      
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'username',
          message: '用户名/邮箱:',
          validate: (input) => input.length > 0 || '请输入用户名'
        },
        {
          type: 'input',
          name: 'cookie',
          message: 'Cookie:',
          validate: (input) => input.length > 0 || '请输入Cookie'
        },
        {
          type: 'input',
          name: 'nickname',
          message: '昵称（可选）:'
        }
      ]);
      
      const spinner = createSpinner('验证账号...');
      
      const publisher = platformManager.getPublisher(platformId);
      const isValid = publisher
        ? await publisher.validateCredentials({ cookie: answers.cookie })
        : true;
      
      if (!isValid) {
        spinner.fail('账号验证失败');
        logError('Cookie无效或已过期');
        return;
      }
      
      const account = addAccount(
        platformId,
        answers.username,
        { cookie: answers.cookie },
        answers.nickname || undefined
      );
      
      spinner.succeed('账号添加成功');
      logSuccess(`账号ID: ${account.id}`);
    });
  
  accountCmd
    .command('remove <id>')
    .alias('rm')
    .description('删除账号')
    .action(async (id) => {
      const account = getAccount(id);
      if (!account) {
        logError('账号不存在');
        return;
      }
      
      const platform = getPlatform(account.platformId);
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `确定删除 ${platform?.name} 账号 ${account.username}？`,
          default: false
        }
      ]);
      
      if (confirm) {
        deleteAccount(id);
        logSuccess('账号已删除');
      }
    });
  
  accountCmd
    .command('test <id>')
    .description('测试账号连接')
    .action(async (id) => {
      const account = getAccount(id);
      if (!account) {
        logError('账号不存在');
        return;
      }
      
      const spinner = createSpinner('测试连接...');
      const publisher = platformManager.getPublisher(account.platformId);
      
      if (!publisher) {
        spinner.fail('不支持的平台');
        return;
      }
      
      const credentials = getCredentials(account);
      const isValid = await publisher.validateCredentials(credentials);
      
      if (isValid) {
        spinner.succeed('连接正常');
        updateAccount(id, { status: 'active' });
      } else {
        spinner.fail('连接失败');
        updateAccount(id, { status: 'expired' });
        logError('Cookie可能已过期，请重新添加账号');
      }
    });
  
  accountCmd
    .command('platforms')
    .alias('ps')
    .description('列出支持的平台')
    .action(() => {
      console.log(chalk.cyan('\n支持的平台:\n'));
      
      SUPPORTED_PLATFORMS.forEach(platform => {
        console.log(`  ${chalk.green(platform.name)} (${platform.id})`);
        platform.features.forEach(feature => {
          const status = feature.supported ? chalk.green('✓') : chalk.gray('✗');
          console.log(`    ${status} ${feature.name}`);
        });
        console.log();
      });
    });
}
