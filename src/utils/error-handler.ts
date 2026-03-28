import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import {
  ErrorCategory,
  ErrorSeverity,
  ErrorDetail,
  ErrorRecord,
  ErrorStatistics,
  ERROR_DEFINITIONS
} from './error-types.js';

export class ErrorHandler {
  private errors: Map<string, ErrorRecord> = new Map();
  private dataFile: string;
  private maxErrors: number = 1000;

  constructor() {
    this.dataFile = path.join(process.cwd(), '.data', 'logs', 'errors.json');
    this.loadErrors();
  }

  private loadErrors(): void {
    try {
      if (fs.existsSync(this.dataFile)) {
        const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf-8'));
        data.forEach((record: ErrorRecord) => {
          this.errors.set(record.id, record);
        });
      }
    } catch (error) {
      console.error('加载错误记录失败:', error);
    }
  }

  private saveErrors(): void {
    try {
      const dir = path.dirname(this.dataFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = Array.from(this.errors.values())
        .sort((a, b) => b.lastOccurrence - a.lastOccurrence)
        .slice(0, this.maxErrors);
      fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('保存错误记录失败:', error);
    }
  }

  handleError(
    error: Error | unknown,
    context?: {
      platformId?: string;
      operation?: string;
      additionalInfo?: Record<string, unknown>;
    }
  ): ErrorDetail {
    const errorDetail = this.parseError(error, context);
    this.recordError(errorDetail);
    this.displayError(errorDetail);
    return errorDetail;
  }

  private parseError(
    error: Error | unknown,
    context?: {
      platformId?: string;
      operation?: string;
      additionalInfo?: Record<string, unknown>;
    }
  ): ErrorDetail {
    let code = 'E_UNKNOWN';
    let message = '未知错误';
    let httpStatus: number | undefined;
    let stack: string | undefined;

    if (error instanceof Error) {
      message = error.message;
      stack = error.stack;

      if ('code' in error) {
        const errorCode = (error as any).code;
        if (typeof errorCode === 'string') {
          code = this.mapErrorCode(errorCode);
        }
      }

      if ('response' in error) {
        const response = (error as any).response;
        if (response?.status) {
          httpStatus = response.status;
          code = `E${response.status}`;
        }
        if (response?.data?.message) {
          message = response.data.message;
        }
      }

      if ('status' in error) {
        httpStatus = (error as any).status;
        if (httpStatus) {
          code = `E${httpStatus}`;
        }
      }
    } else if (typeof error === 'string') {
      message = error;
    }

    const definition = ERROR_DEFINITIONS[code] || ERROR_DEFINITIONS.E_UNKNOWN;

    return {
      ...definition,
      message: message || definition.message,
      httpStatus: httpStatus || definition.httpStatus,
      platformId: context?.platformId,
      timestamp: Date.now(),
      context: {
        operation: context?.operation,
        ...context?.additionalInfo
      },
      stack,
      suggestions: this.enhanceSuggestions(definition.suggestions, context)
    };
  }

  private mapErrorCode(code: string): string {
    const mapping: Record<string, string> = {
      'ETIMEDOUT': 'E_TIMEOUT',
      'ECONNREFUSED': 'E_NETWORK_OFFLINE',
      'ECONNRESET': 'E_NETWORK_OFFLINE',
      'ENOTFOUND': 'E_DNS',
      'EAI_AGAIN': 'E_DNS',
      'CERT_HAS_EXPIRED': 'E_SSL',
      'UNABLE_TO_VERIFY_LEAF_SIGNATURE': 'E_SSL',
      'DEPTH_ZERO_SELF_SIGNED_CERT': 'E_SSL'
    };
    return mapping[code] || code;
  }

  private enhanceSuggestions(
    suggestions: string[],
    context?: { platformId?: string; operation?: string }
  ): string[] {
    const enhanced = [...suggestions];
    
    if (context?.platformId) {
      enhanced.push(`针对 ${context.platformId} 平台的特殊处理建议`);
    }
    
    if (context?.operation) {
      enhanced.push(`操作: ${context.operation}`);
    }
    
    return enhanced;
  }

  private recordError(error: ErrorDetail): void {
    const existingRecord = Array.from(this.errors.values()).find(
      r => r.error.code === error.code && r.error.platformId === error.platformId
    );

    if (existingRecord) {
      existingRecord.occurrenceCount++;
      existingRecord.lastOccurrence = error.timestamp;
      existingRecord.error = error;
    } else {
      const record: ErrorRecord = {
        id: this.generateId(),
        error,
        resolved: false,
        occurrenceCount: 1,
        lastOccurrence: error.timestamp,
        firstOccurrence: error.timestamp
      };
      this.errors.set(record.id, record);
    }

    this.saveErrors();
  }

  private displayError(error: ErrorDetail): void {
    const severityColors = {
      [ErrorSeverity.LOW]: chalk.blue,
      [ErrorSeverity.MEDIUM]: chalk.yellow,
      [ErrorSeverity.HIGH]: chalk.red,
      [ErrorSeverity.CRITICAL]: chalk.red.bold.bgYellow
    };

    const categoryIcons = {
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

    const color = severityColors[error.severity];
    const icon = categoryIcons[error.category];

    console.log('\n' + color('═'.repeat(70)));
    console.log(color(`${icon} 错误报告 [${error.code}]`));
    console.log(color('═'.repeat(70)));
    console.log(color(`消息: ${error.message}`));
    console.log(color(`类别: ${error.category}`));
    console.log(color(`严重程度: ${error.severity}`));
    if (error.httpStatus) {
      console.log(color(`HTTP状态: ${error.httpStatus}`));
    }
    if (error.platformId) {
      console.log(color(`平台: ${error.platformId}`));
    }
    console.log(color(`时间: ${new Date(error.timestamp).toLocaleString()}`));
    
    if (error.context && Object.keys(error.context).length > 0) {
      console.log(color('\n上下文信息:'));
      Object.entries(error.context).forEach(([key, value]) => {
        console.log(color(`  ${key}: ${JSON.stringify(value)}`));
      });
    }
    
    console.log(color('\n建议解决方案:'));
    error.suggestions.forEach((suggestion, index) => {
      console.log(color(`  ${index + 1}. ${suggestion}`));
    });
    
    if (error.documentation) {
      console.log(color(`\n文档: ${error.documentation}`));
    }
    
    console.log(color('═'.repeat(70)) + '\n');
  }

  resolveError(errorId: string, note?: string): boolean {
    const record = this.errors.get(errorId);
    if (record) {
      record.resolved = true;
      record.resolvedAt = Date.now();
      record.resolveNote = note;
      this.saveErrors();
      return true;
    }
    return false;
  }

  getStatistics(): ErrorStatistics {
    const records = Array.from(this.errors.values());
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const byCategory: Record<ErrorCategory, number> = {} as any;
    const bySeverity: Record<ErrorSeverity, number> = {} as any;
    const byPlatform: Record<string, number> = {};

    Object.values(ErrorCategory).forEach(cat => byCategory[cat] = 0);
    Object.values(ErrorSeverity).forEach(sev => bySeverity[sev] = 0);

    const hourlyDistribution = new Array(24).fill(0);
    const dailyDistribution = new Array(7).fill(0);

    let totalInPeriod = 0;

    records.forEach(record => {
      byCategory[record.error.category]++;
      bySeverity[record.error.severity]++;
      
      if (record.error.platformId) {
        byPlatform[record.error.platformId] = 
          (byPlatform[record.error.platformId] || 0) + 1;
      }

      const hour = new Date(record.lastOccurrence).getHours();
      hourlyDistribution[hour]++;

      const day = new Date(record.lastOccurrence).getDay();
      dailyDistribution[day]++;

      if (record.lastOccurrence > oneDayAgo) {
        totalInPeriod++;
      }
    });

    const resolvedRecords = records.filter(r => r.resolved && r.resolvedAt);
    const avgResolutionTime = resolvedRecords.length > 0
      ? resolvedRecords.reduce((sum, r) => sum + (r.resolvedAt! - r.firstOccurrence), 0) / resolvedRecords.length
      : 0;

    const topErrors = records
      .filter(r => !r.resolved)
      .sort((a, b) => b.occurrenceCount - a.occurrenceCount)
      .slice(0, 10);

    return {
      totalErrors: records.length,
      byCategory,
      bySeverity,
      byPlatform,
      hourlyDistribution,
      dailyDistribution,
      topErrors,
      errorRate: totalInPeriod,
      avgResolutionTime
    };
  }

  private generateId(): string {
    return `err-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
