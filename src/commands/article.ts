import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import {
  createArticle,
  getAllArticles,
  getArticle,
  updateArticle,
  deleteArticle,
  importFromFile,
  exportToFile,
  createTemplate,
  getAllTemplates
} from '../core/article.js';
import { logSuccess, logError, logInfo, createSpinner, formatTable, formatDate, truncate } from '../utils/display.js';

export function registerArticleCommands(program: Command): void {
  const articleCmd = program.command('article').alias('a').description('文章管理');
  
  articleCmd
    .command('list')
    .alias('ls')
    .description('列出所有文章')
    .option('-s, --status <status>', '按状态筛选 (draft/published/scheduled)')
    .option('-p, --platform <platform>', '按平台筛选')
    .action((options) => {
      let articles = getAllArticles();
      
      if (options.status) {
        articles = articles.filter(a => a.status === options.status);
      }
      
      if (options.platform) {
        articles = articles.filter(a =>
          a.platforms.some(p => p.platformId === options.platform)
        );
      }
      
      if (articles.length === 0) {
        logInfo('暂无文章');
        return;
      }
      
      const rows = articles.map(article => {
        const statusColors: Record<string, string> = {
          draft: chalk.yellow('草稿'),
          published: chalk.green('已发布'),
          scheduled: chalk.blue('定时')
        };
        
        const platforms = article.platforms
          .map(p => p.platformId)
          .slice(0, 3)
          .join(', ');
        
        return [
          article.id.slice(0, 8),
          truncate(article.title, 25),
          statusColors[article.status] || article.status,
          platforms || '-',
          formatDate(article.createdAt)
        ];
      });
      
      console.log(formatTable(
        ['ID', '标题', '状态', '平台', '创建时间'],
        rows
      ));
    });
  
  articleCmd
    .command('create')
    .description('创建新文章')
    .option('-t, --title <title>', '文章标题')
    .option('-f, --file <file>', '从文件导入')
    .option('-T, --template <id>', '使用模板')
    .action(async (options) => {
      let title = options.title;
      let content = '';
      let tags: string[] = [];
      let category: string | undefined;
      
      if (options.file) {
        const filePath = path.resolve(options.file);
        if (!fs.existsSync(filePath)) {
          logError('文件不存在');
          return;
        }
        
        const spinner = createSpinner('导入文件...');
        const article = importFromFile(filePath);
        spinner.succeed('文件导入成功');
        
        console.log(chalk.cyan(`\n文章ID: ${article.id}`));
        console.log(chalk.cyan(`标题: ${article.title}`));
        return;
      }
      
      if (options.template) {
        const template = getAllTemplates().find(t => t.id.startsWith(options.template));
        if (template) {
          content = template.content;
          tags = template.tags;
          category = template.category;
        }
      }
      
      if (!title) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'title',
            message: '文章标题:',
            validate: (input) => input.length > 0 || '请输入标题'
          }
        ]);
        title = answers.title;
      }
      
      const { editNow } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'editNow',
          message: '是否现在编辑文章内容？',
          default: false
        }
      ]);
      
      if (editNow) {
        const tempFile = path.join(process.cwd(), `.temp-${Date.now()}.md`);
        fs.writeFileSync(tempFile, content || `# ${title}\n\n开始写作...\n`);
        
        const editor = process.env.EDITOR || 'notepad';
        const { execSync } = require('child_process');
        
        try {
          execSync(`${editor} "${tempFile}"`, { stdio: 'inherit' });
          content = fs.readFileSync(tempFile, 'utf-8');
          fs.unlinkSync(tempFile);
        } catch {
          logInfo(`请编辑文件: ${tempFile}`);
          logInfo('编辑完成后使用 article edit 命令更新');
        }
      }
      
      const article = createArticle(title, content, { tags, category });
      logSuccess(`文章创建成功，ID: ${article.id}`);
    });
  
  articleCmd
    .command('edit <id>')
    .description('编辑文章')
    .action(async (id) => {
      const article = getArticle(id);
      if (!article) {
        logError('文章不存在');
        return;
      }
      
      const tempFile = path.join(process.cwd(), `.temp-${id}.md`);
      fs.writeFileSync(tempFile, article.content);
      
      const editor = process.env.EDITOR || 'notepad';
      const { execSync } = require('child_process');
      
      try {
        execSync(`${editor} "${tempFile}"`, { stdio: 'inherit' });
        const newContent = fs.readFileSync(tempFile, 'utf-8');
        fs.unlinkSync(tempFile);
        
        updateArticle(id, { content: newContent });
        logSuccess('文章已更新');
      } catch {
        logInfo(`请编辑文件: ${tempFile}`);
      }
    });
  
  articleCmd
    .command('show <id>')
    .description('查看文章详情')
    .action((id) => {
      const article = getArticle(id);
      if (!article) {
        logError('文章不存在');
        return;
      }
      
      console.log(chalk.cyan(`\n标题: ${article.title}`));
      console.log(chalk.gray(`ID: ${article.id}`));
      console.log(chalk.gray(`状态: ${article.status}`));
      console.log(chalk.gray(`创建: ${formatDate(article.createdAt)}`));
      console.log(chalk.gray(`更新: ${formatDate(article.updatedAt)}`));
      
      if (article.tags.length > 0) {
        console.log(chalk.gray(`标签: ${article.tags.join(', ')}`));
      }
      
      if (article.summary) {
        console.log(chalk.gray(`摘要: ${article.summary}`));
      }
      
      if (article.platforms.length > 0) {
        console.log(chalk.cyan('\n发布状态:'));
        article.platforms.forEach(p => {
          const status = p.status === 'published'
            ? chalk.green('✓ 已发布')
            : p.status === 'failed'
              ? chalk.red('✗ 失败')
              : chalk.yellow('○ 待发布');
          console.log(`  ${p.platformId}: ${status}`);
          if (p.url) {
            console.log(chalk.gray(`    ${p.url}`));
          }
        });
      }
      
      console.log(chalk.cyan('\n内容预览:'));
      console.log(chalk.gray(article.content.slice(0, 200) + '...'));
    });
  
  articleCmd
    .command('remove <id>')
    .alias('rm')
    .description('删除文章')
    .action(async (id) => {
      const article = getArticle(id);
      if (!article) {
        logError('文章不存在');
        return;
      }
      
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `确定删除文章 "${article.title}"？`,
          default: false
        }
      ]);
      
      if (confirm) {
        deleteArticle(id);
        logSuccess('文章已删除');
      }
    });
  
  articleCmd
    .command('export <id> <output>')
    .description('导出文章到文件')
    .action((id, output) => {
      const article = getArticle(id);
      if (!article) {
        logError('文章不存在');
        return;
      }
      
      exportToFile(article, path.resolve(output));
      logSuccess(`文章已导出到 ${output}`);
    });
  
  const templateCmd = articleCmd.command('template').alias('t').description('模板管理');
  
  templateCmd
    .command('list')
    .alias('ls')
    .description('列出所有模板')
    .action(() => {
      const templates = getAllTemplates();
      
      if (templates.length === 0) {
        logInfo('暂无模板');
        return;
      }
      
      const rows = templates.map(t => [
        t.id.slice(0, 8),
        t.name,
        t.category || '-',
        t.tags.join(', ') || '-',
        formatDate(t.createdAt)
      ]);
      
      console.log(formatTable(
        ['ID', '名称', '分类', '标签', '创建时间'],
        rows
      ));
    });
  
  templateCmd
    .command('create')
    .description('创建模板')
    .action(async () => {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: '模板名称:',
          validate: (input) => input.length > 0 || '请输入名称'
        },
        {
          type: 'editor',
          name: 'content',
          message: '模板内容:'
        },
        {
          type: 'input',
          name: 'tags',
          message: '标签（逗号分隔）:'
        },
        {
          type: 'input',
          name: 'category',
          message: '分类:'
        }
      ]);
      
      const template = createTemplate(
        answers.name,
        answers.content,
        {
          tags: answers.tags ? answers.tags.split(',').map((t: string) => t.trim()) : [],
          category: answers.category || undefined
        }
      );
      
      logSuccess(`模板创建成功，ID: ${template.id}`);
    });
}
