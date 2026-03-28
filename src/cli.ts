import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import { initConfig, getConfig, updateConfig } from './utils/config.js';
import { initAccountManager } from './core/account.js';
import { initArticleManager } from './core/article.js';
import { registerAccountCommands } from './commands/account.js';
import { registerArticleCommands } from './commands/article.js';
import { registerPublishCommands } from './commands/publish.js';
import { registerMonitorCommands } from './commands/monitor.js';
import { monitoringSystem } from './utils/monitoring.js';
import { generateKey } from './utils/crypto.js';
import fs from 'fs';
import path from 'path';

const CONFIG_FILE = '.adrc';

function init(): void {
  const homeDir = process.env.HOME || process.env.USERPROFILE || process.cwd();
  const configPath = path.join(homeDir, CONFIG_FILE);
  
  let encryptionKey: string;
  
  if (fs.existsSync(configPath)) {
    const content = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(content);
    encryptionKey = config.encryptionKey;
  } else {
    encryptionKey = generateKey();
    fs.writeFileSync(configPath, JSON.stringify({ encryptionKey }, null, 2));
    console.log(chalk.gray('已生成加密密钥并保存到 ~/.adrc\n'));
  }
  
  const dataDir = path.join(process.cwd(), '.data');
  initConfig(process.cwd());
  updateConfig({ dataDir, encryptionKey });
  
  initAccountManager(encryptionKey);
  initArticleManager();
}

export async function main(): Promise<void> {
  init();
  
  const program = new Command();
  
  program
    .name('ad')
    .description('文章分发器 - 多平台文章发布CLI工具')
    .version('1.0.0')
    .hook('preAction', () => {
      console.log(chalk.cyan(figlet.textSync('Article Distributor', { horizontalLayout: 'full' })));
      console.log();
    });
  
  registerAccountCommands(program);
  registerArticleCommands(program);
  registerPublishCommands(program);
  registerMonitorCommands(program);
  
  monitoringSystem.initialize();
  
  process.on('SIGINT', () => {
    monitoringSystem.shutdown();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    monitoringSystem.shutdown();
    process.exit(0);
  });
  
  program
    .command('init')
    .description('初始化项目')
    .action(() => {
      const dataDir = path.join(process.cwd(), '.data');
      const articlesDir = path.join(dataDir, 'articles');
      
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      if (!fs.existsSync(articlesDir)) {
        fs.mkdirSync(articlesDir, { recursive: true });
      }
      
      console.log(chalk.green('✓ 项目初始化完成'));
      console.log(chalk.gray(`  数据目录: ${dataDir}`));
      console.log(chalk.gray(`  文章目录: ${articlesDir}`));
    });
  
  program
    .command('config')
    .description('查看/修改配置')
    .option('-k, --key <key>', '配置项')
    .option('-v, --value <value>', '配置值')
    .action((options) => {
      const config = getConfig();
      
      if (options.key && options.value) {
        updateConfig({ [options.key]: options.value });
        console.log(chalk.green(`✓ 已更新 ${options.key} = ${options.value}`));
      } else if (options.key) {
        console.log(config[options.key as keyof typeof config] || '未设置');
      } else {
        console.log(chalk.cyan('\n当前配置:\n'));
        console.log(JSON.stringify(config, null, 2));
      }
    });
  
  program.parse();
}

main().catch(console.error);
