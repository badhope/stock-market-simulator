export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL'
}

export enum LogCategory {
  OPERATION = 'OPERATION',
  ERROR = 'ERROR',
  SYSTEM = 'SYSTEM',
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  PUBLISH = 'PUBLISH',
  ACCOUNT = 'ACCOUNT',
  ARTICLE = 'ARTICLE'
}

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  category: LogCategory;
  message: string;
  details?: Record<string, unknown>;
  platformId?: string;
  userId?: string;
  operationId?: string;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export interface LogConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  enableJson: boolean;
  maxFileSize: number;
  maxFiles: number;
  logDir: string;
  dateFormat: string;
}

export const DEFAULT_LOG_CONFIG: LogConfig = {
  level: LogLevel.INFO,
  enableConsole: true,
  enableFile: true,
  enableJson: false,
  maxFileSize: 10 * 1024 * 1024,
  maxFiles: 10,
  logDir: '.data/logs',
  dateFormat: 'YYYY-MM-DD HH:mm:ss.SSS'
};

export const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
  [LogLevel.FATAL]: 4
};
