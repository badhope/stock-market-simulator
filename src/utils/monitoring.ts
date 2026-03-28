import { RateLimiter, RateLimiterManager } from './rate-limiter-class.js';
import { ExpirationNotifier } from './expiration-notifier.js';
import { ErrorHandler } from './error-handler.js';
import { ErrorVisualizer } from './error-visualizer.js';
import { Logger, logger } from './logger.js';
import { RateLimitConfig } from './rate-limiter.js';
import { ExpirationItem } from './expiration-types.js';

export interface MonitoringConfig {
  enableRateLimit: boolean;
  enableExpiration: boolean;
  enableErrorTracking: boolean;
  enableLogging: boolean;
}

export const DEFAULT_MONITORING_CONFIG: MonitoringConfig = {
  enableRateLimit: true,
  enableExpiration: true,
  enableErrorTracking: true,
  enableLogging: true
};

export class MonitoringSystem {
  public rateLimiterManager: RateLimiterManager;
  public expirationNotifier: ExpirationNotifier;
  public errorHandler: ErrorHandler;
  public errorVisualizer: ErrorVisualizer;
  public logger: Logger;
  private config: MonitoringConfig;

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = { ...DEFAULT_MONITORING_CONFIG, ...config };
    this.rateLimiterManager = new RateLimiterManager();
    this.expirationNotifier = new ExpirationNotifier();
    this.errorHandler = new ErrorHandler();
    this.errorVisualizer = new ErrorVisualizer();
    this.logger = logger;
  }

  initialize(): void {
    this.logger.info('监控系统初始化中...');
    
    if (this.config.enableExpiration) {
      this.expirationNotifier.startMonitoring();
    }
    
    this.logger.info('监控系统初始化完成');
  }

  shutdown(): void {
    this.logger.info('监控系统关闭中...');
    
    if (this.config.enableExpiration) {
      this.expirationNotifier.stopMonitoring();
    }
    
    this.logger.close();
  }

  getRateLimiter(platformId: string, config?: Partial<RateLimitConfig>): RateLimiter {
    return this.rateLimiterManager.getLimiter(platformId, config);
  }

  registerExpirationItem(item: Omit<ExpirationItem, 'id' | 'createdAt'>): string {
    return this.expirationNotifier.registerItem(item);
  }

  handleError(
    error: Error | unknown,
    context?: {
      platformId?: string;
      operation?: string;
      additionalInfo?: Record<string, unknown>;
    }
  ): void {
    if (this.config.enableErrorTracking) {
      this.errorHandler.handleError(error, context);
    }
  }

  displayErrorStatistics(): void {
    const stats = this.errorHandler.getStatistics();
    this.errorVisualizer.displayStatistics(stats);
  }

  getSystemStatus(): {
    rateLimit: Record<string, ReturnType<RateLimiter['getStats']>>;
    expiringItems: ExpirationItem[];
    activeAlerts: number;
    recentErrors: number;
  } {
    return {
      rateLimit: this.rateLimiterManager.getAllStats(),
      expiringItems: this.expirationNotifier.getExpiringItems(),
      activeAlerts: this.expirationNotifier.getActiveAlerts().length,
      recentErrors: this.errorHandler.getStatistics().errorRate
    };
  }

  displaySystemStatus(): void {
    const status = this.getSystemStatus();
    
    console.log('\n📊 系统状态概览');
    console.log('═'.repeat(60));
    
    console.log('\n⏱️ 频率控制状态:');
    Object.entries(status.rateLimit).forEach(([platform, stats]) => {
      console.log(`  ${platform}: 日用量 ${stats.dailyUsed}/${stats.dailyLimit}, 成功率 ${stats.successRate.toFixed(1)}%`);
    });
    
    console.log('\n⏰ 即将过期项目:');
    if (status.expiringItems.length === 0) {
      console.log('  无即将过期项目');
    } else {
      status.expiringItems.slice(5).forEach(item => {
        const timeLeft = item.expiresAt - Date.now();
        const hours = Math.floor(timeLeft / (60 * 60 * 1000));
        console.log(`  ${item.name}: 剩余 ${hours} 小时`);
      });
    }
    
    console.log('\n⚠️ 活跃告警:', status.activeAlerts);
    console.log('❌ 24小时错误数:', status.recentErrors);
    
    console.log('═'.repeat(60) + '\n');
  }
}

export const monitoringSystem = new MonitoringSystem();
