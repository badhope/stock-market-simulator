import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import {
  LogLevel,
  LogCategory,
  LogEntry,
  LogConfig,
  DEFAULT_LOG_CONFIG,
  LOG_LEVEL_PRIORITY
} from './logger-types.js';

export class Logger {
  private config: LogConfig;
  private currentLogFile: string;
  private currentFileSize: number = 0;
  private logBuffer: LogEntry[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor(config?: Partial<LogConfig>) {
    this.config = { ...DEFAULT_LOG_CONFIG, ...config };
    this.currentLogFile = this.getLogFilePath();
    this.ensureLogDir();
    this.startFlushTimer();
  }

  private ensureLogDir(): void {
    const logDir = path.join(process.cwd(), this.config.logDir);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  private getLogFilePath(): string {
    const date = new Date().toISOString().split('T')[0];
    const ext = this.config.enableJson ? 'json' : 'log';
    return path.join(process.cwd(), this.config.logDir, `app-${date}.${ext}`);
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, 5000);
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.config.level];
  }

  debug(message: string, details?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, LogCategory.SYSTEM, message, details);
  }

  info(message: string, details?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, LogCategory.SYSTEM, message, details);
  }

  warn(message: string, details?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, LogCategory.SYSTEM, message, details);
  }

  error(message: string, error?: Error, details?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, LogCategory.ERROR, message, {
      ...details,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }

  fatal(message: string, error?: Error, details?: Record<string, unknown>): void {
    this.log(LogLevel.FATAL, LogCategory.ERROR, message, {
      ...details,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }

  operation(
    operation: string,
    details?: Record<string, unknown>,
    duration?: number
  ): void {
    this.log(LogLevel.INFO, LogCategory.OPERATION, operation, {
      ...details,
      duration
    });
  }

  network(
    method: string,
    url: string,
    status?: number,
    duration?: number,
    details?: Record<string, unknown>
  ): void {
    this.log(LogLevel.DEBUG, LogCategory.NETWORK, `${method} ${url}`, {
      status,
      duration,
      ...details
    });
  }

  auth(
    action: string,
    platformId?: string,
    success: boolean = true,
    details?: Record<string, unknown>
  ): void {
    this.log(
      success ? LogLevel.INFO : LogLevel.WARN,
      LogCategory.AUTH,
      action,
      { platformId, success, ...details }
    );
  }

  publish(
    articleId: string,
    platformId: string,
    status: 'start' | 'success' | 'failed',
    details?: Record<string, unknown>
  ): void {
    const level = status === 'failed' ? LogLevel.ERROR : LogLevel.INFO;
    this.log(level, LogCategory.PUBLISH, `发布文章到 ${platformId}`, {
      articleId,
      platformId,
      status,
      ...details
    });
  }

  account(
    action: string,
    platformId: string,
    success: boolean = true,
    details?: Record<string, unknown>
  ): void {
    this.log(
      success ? LogLevel.INFO : LogLevel.WARN,
      LogCategory.ACCOUNT,
      action,
      { platformId, success, ...details }
    );
  }

  article(
    action: string,
    articleId?: string,
    details?: Record<string, unknown>
  ): void {
    this.log(LogLevel.INFO, LogCategory.ARTICLE, action, {
      articleId,
      ...details
    });
  }

  private log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    details?: Record<string, unknown>
  ): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      level,
      category,
      message,
      details
    };

    this.logBuffer.push(entry);

    if (this.config.enableConsole) {
      this.writeToConsole(entry);
    }

    if (this.logBuffer.length >= 100) {
      this.flush();
    }
  }

  private writeToConsole(entry: LogEntry): void {
    const levelColors = {
      [LogLevel.DEBUG]: chalk.gray,
      [LogLevel.INFO]: chalk.blue,
      [LogLevel.WARN]: chalk.yellow,
      [LogLevel.ERROR]: chalk.red,
      [LogLevel.FATAL]: chalk.red.bold.bgYellow
    };

    const levelIcons = {
      [LogLevel.DEBUG]: '🔍',
      [LogLevel.INFO]: 'ℹ️',
      [LogLevel.WARN]: '⚠️',
      [LogLevel.ERROR]: '❌',
      [LogLevel.FATAL]: '💀'
    };

    const color = levelColors[entry.level];
    const icon = levelIcons[entry.level];
    const time = new Date(entry.timestamp).toLocaleTimeString();

    let output = `${chalk.gray(time)} ${icon} ${color(`[${entry.level}]`)} ${chalk.cyan(`[${entry.category}]`)} ${entry.message}`;

    if (entry.details?.duration) {
      output += ` ${chalk.gray(`(${entry.details.duration}ms)`)}`;
    }

    console.log(output);

    if (entry.level === LogLevel.ERROR || entry.level === LogLevel.FATAL) {
      if (entry.details?.error) {
        const errorInfo = entry.details.error as { message: string; stack?: string };
        console.log(chalk.red(`  └─ ${errorInfo.message}`));
        if (errorInfo.stack && this.config.level === LogLevel.DEBUG) {
          console.log(chalk.gray(errorInfo.stack));
        }
      }
    }
  }

  private writeToFileSync(entry: LogEntry): void {
    if (!this.config.enableFile) return;

    try {
      const newLogFile = this.getLogFilePath();
      if (newLogFile !== this.currentLogFile) {
        this.currentLogFile = newLogFile;
        this.currentFileSize = 0;
        this.rotateLogs();
      }

      const logLine = this.formatLogLine(entry) + '\n';
      const lineSize = Buffer.byteLength(logLine, 'utf-8');

      if (this.currentFileSize + lineSize > this.config.maxFileSize) {
        this.rotateLogs();
        this.currentLogFile = this.getLogFilePath();
        this.currentFileSize = 0;
      }

      fs.appendFileSync(this.currentLogFile, logLine);
      this.currentFileSize += lineSize;
    } catch (error) {
      console.error('写入日志文件失败:', error);
    }
  }

  private formatLogLine(entry: LogEntry): string {
    if (this.config.enableJson) {
      return JSON.stringify(entry);
    }

    const time = new Date(entry.timestamp).toISOString();
    let line = `[${time}] [${entry.level}] [${entry.category}] ${entry.message}`;
    
    if (entry.details && Object.keys(entry.details).length > 0) {
      line += ` | ${JSON.stringify(entry.details)}`;
    }
    
    return line;
  }

  private rotateLogs(): void {
    const logDir = path.join(process.cwd(), this.config.logDir);
    const files = fs.readdirSync(logDir)
      .filter(f => f.startsWith('app-') && (f.endsWith('.log') || f.endsWith('.json')))
      .sort()
      .reverse();

    while (files.length >= this.config.maxFiles) {
      const fileToDelete = files.pop();
      if (fileToDelete) {
        fs.unlinkSync(path.join(logDir, fileToDelete));
      }
    }
  }

  flush(): void {
    if (this.logBuffer.length === 0) return;

    const toWrite = [...this.logBuffer];
    this.logBuffer = [];

    toWrite.forEach(entry => {
      this.writeToFileSync(entry);
    });
  }

  close(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }

  private generateId(): string {
    return `log-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
  }

  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  getRecentLogs(count: number = 100, level?: LogLevel): LogEntry[] {
    const logFile = this.getLogFilePath();
    if (!fs.existsSync(logFile)) return [];

    try {
      const content = fs.readFileSync(logFile, 'utf-8');
      const lines = content.trim().split('\n').slice(-count);

      return lines.map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return this.parseLogLine(line);
        }
      }).filter((entry: LogEntry) => !level || entry.level === level);
    } catch {
      return [];
    }
  }

  private parseLogLine(line: string): LogEntry {
    const match = line.match(/\[([^\]]+)\] \[([^\]]+)\] \[([^\]]+)\] (.+?)(?: \| (.+))?$/);
    
    if (match) {
      return {
        id: '',
        timestamp: new Date(match[1]).getTime(),
        level: match[2] as LogLevel,
        category: match[3] as LogCategory,
        message: match[4],
        details: match[5] ? JSON.parse(match[5]) : undefined
      };
    }

    return {
      id: '',
      timestamp: Date.now(),
      level: LogLevel.INFO,
      category: LogCategory.SYSTEM,
      message: line
    };
  }

  searchLogs(query: string, options?: {
    level?: LogLevel;
    category?: LogCategory;
    startDate?: Date;
    endDate?: Date;
  }): LogEntry[] {
    const logFile = this.getLogFilePath();
    if (!fs.existsSync(logFile)) return [];

    try {
      const content = fs.readFileSync(logFile, 'utf-8');
      const lines = content.trim().split('\n');

      return lines.map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return this.parseLogLine(line);
        }
      }).filter((entry: LogEntry) => {
        if (!entry.message.toLowerCase().includes(query.toLowerCase())) {
          return false;
        }
        if (options?.level && entry.level !== options.level) return false;
        if (options?.category && entry.category !== options.category) return false;
        if (options?.startDate && entry.timestamp < options.startDate.getTime()) return false;
        if (options?.endDate && entry.timestamp > options.endDate.getTime()) return false;
        return true;
      });
    } catch {
      return [];
    }
  }
}

export const logger = new Logger();
