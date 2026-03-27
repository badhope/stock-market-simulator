import chalk from 'chalk';
import ora, { Ora } from 'ora';

export function logSuccess(message: string): void {
  console.log(chalk.green('✓'), message);
}

export function logError(message: string): void {
  console.log(chalk.red('✗'), message);
}

export function logInfo(message: string): void {
  console.log(chalk.blue('ℹ'), message);
}

export function logWarning(message: string): void {
  console.log(chalk.yellow('⚠'), message);
}

export function createSpinner(text: string): Ora {
  return ora(text).start();
}

export function formatTable(headers: string[], rows: string[][]): string {
  const columnWidths = headers.map((header, i) => {
    const maxWidth = Math.max(
      header.length,
      ...rows.map(row => row[i]?.length || 0)
    );
    return maxWidth;
  });

  const border = columnWidths.map(w => '─'.repeat(w + 2)).join('┼');
  const headerRow = headers.map((h, i) => ` ${h.padEnd(columnWidths[i])} `).join('│');
  const dataRows = rows.map(row =>
    row.map((cell, i) => ` ${(cell || '').padEnd(columnWidths[i])} `).join('│')
  );

  return [
    `┌${border}┐`,
    `│${headerRow}│`,
    `├${border}┤`,
    ...dataRows.map(r => `│${r}│`),
    `└${border}┘`
  ].join('\n');
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length - 3) + '...';
}
