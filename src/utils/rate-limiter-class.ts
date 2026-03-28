import fs from 'fs';
import path from 'path';
import {
  RateLimitConfig,
  RateLimitState,
  RequestRecord,
  RateLimitResult,
  RateLimitError,
  DEFAULT_RATE_LIMIT_CONFIG,
  PLATFORM_RATE_LIMITS
} from './rate-limiter.js';

export class RateLimiter {
  private config: RateLimitConfig;
  private state: RateLimitState;
  private requestHistory: RequestRecord[] = [];
  private historyFile: string;
  private platformId: string;

  constructor(platformId: string, config?: Partial<RateLimitConfig>) {
    this.platformId = platformId;
    
    const platformConfig = PLATFORM_RATE_LIMITS[platformId] || {};
    this.config = {
      ...DEFAULT_RATE_LIMIT_CONFIG,
      ...platformConfig,
      ...config
    };

    this.state = this.getInitialState();
    this.historyFile = path.join(process.cwd(), '.data', 'rate-limits', `${platformId}-history.json`);
    this.loadState();
  }

  private getInitialState(): RateLimitState {
    const now = Date.now();
    return {
      lastRequestTime: 0,
      currentConcurrent: 0,
      dailyCount: 0,
      dailyResetTime: this.getNextDayReset(),
      burstCount: 0,
      burstResetTime: now + 60000,
      isBackoff: false,
      backoffUntil: 0
    };
  }

  private getNextDayReset(): number {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime();
  }

  private loadState(): void {
    try {
      const stateFile = path.join(process.cwd(), '.data', 'rate-limits', `${this.platformId}-state.json`);
      if (fs.existsSync(stateFile)) {
        const data = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
        this.state = { ...this.getInitialState(), ...data };
        this.checkDailyReset();
      }
    } catch (error) {
      this.state = this.getInitialState();
    }
  }

  private saveState(): void {
    try {
      const dir = path.dirname(this.historyFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const stateFile = path.join(dir, `${this.platformId}-state.json`);
      fs.writeFileSync(stateFile, JSON.stringify(this.state, null, 2));
    } catch (error) {
      console.error('保存频率限制状态失败:', error);
    }
  }

  private checkDailyReset(): void {
    const now = Date.now();
    if (now >= this.state.dailyResetTime) {
      this.state.dailyCount = 0;
      this.state.dailyResetTime = this.getNextDayReset();
    }
  }

  private checkBurstReset(): void {
    const now = Date.now();
    if (now >= this.state.burstResetTime) {
      this.state.burstCount = 0;
      this.state.burstResetTime = now + 60000;
    }
  }

  canMakeRequest(): RateLimitResult {
    const now = Date.now();

    this.checkDailyReset();
    this.checkBurstReset();

    if (this.state.isBackoff && now < this.state.backoffUntil) {
      return {
        allowed: false,
        error: RateLimitError.BACKOFF_ACTIVE,
        waitTime: this.state.backoffUntil - now,
        reason: `退避中，需等待 ${Math.ceil((this.state.backoffUntil - now) / 1000)} 秒`
      };
    }

    if (this.state.isBackoff && now >= this.state.backoffUntil) {
      this.state.isBackoff = false;
    }

    if (this.config.burstLimit && this.state.burstCount >= this.config.burstLimit) {
      const waitTime = this.state.burstResetTime - now;
      return {
        allowed: false,
        error: RateLimitError.BURST_LIMIT,
        waitTime,
        reason: `突发请求限制，需等待 ${Math.ceil(waitTime / 1000)} 秒`
      };
    }

    if (this.state.dailyCount >= this.config.dailyLimit) {
      const waitTime = this.state.dailyResetTime - now;
      return {
        allowed: false,
        error: RateLimitError.DAILY_LIMIT,
        waitTime,
        reason: `已达每日限制 (${this.config.dailyLimit})，明天 0 点重置`
      };
    }

    if (this.state.currentConcurrent >= this.config.maxConcurrent) {
      return {
        allowed: false,
        error: RateLimitError.CONCURRENT_LIMIT,
        reason: `并发请求已达上限 (${this.config.maxConcurrent})`
      };
    }

    const timeSinceLastRequest = now - this.state.lastRequestTime;
    if (timeSinceLastRequest < this.config.minInterval) {
      const waitTime = this.config.minInterval - timeSinceLastRequest;
      return {
        allowed: false,
        error: RateLimitError.INTERVAL_TOO_SHORT,
        waitTime,
        reason: `请求间隔过短，需等待 ${Math.ceil(waitTime / 1000)} 秒`
      };
    }

    return { allowed: true };
  }

  async waitForAvailability(timeout: number = 300000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const result = this.canMakeRequest();
      
      if (result.allowed) {
        return true;
      }
      
      if (result.waitTime) {
        const waitTime = Math.min(result.waitTime, 5000);
        await this.sleep(waitTime);
      } else {
        await this.sleep(1000);
      }
    }
    
    return false;
  }

  startRequest(): void {
    const now = Date.now();
    this.state.lastRequestTime = now;
    this.state.currentConcurrent++;
    this.state.dailyCount++;
    if (this.config.burstLimit) {
      this.state.burstCount++;
    }
    this.saveState();
  }

  endRequest(success: boolean, responseTime: number): void {
    this.state.currentConcurrent = Math.max(0, this.state.currentConcurrent - 1);
    
    const record: RequestRecord = {
      timestamp: Date.now(),
      platformId: this.platformId,
      success,
      responseTime
    };
    
    this.requestHistory.push(record);
    this.trimHistory();
    this.saveHistory();

    if (!success) {
      this.triggerBackoff();
    }

    this.saveState();
  }

  private triggerBackoff(): void {
    const backoffTime = Math.min(
      this.config.minInterval * (this.config.backoffMultiplier || 2),
      this.config.maxBackoff || 60000
    );
    
    this.state.isBackoff = true;
    this.state.backoffUntil = Date.now() + backoffTime;
    
    console.log(`⚠️ 触发退避机制，等待 ${backoffTime / 1000} 秒`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private trimHistory(): void {
    const maxRecords = 10000;
    if (this.requestHistory.length > maxRecords) {
      this.requestHistory = this.requestHistory.slice(-maxRecords);
    }
  }

  private saveHistory(): void {
    try {
      const dir = path.dirname(this.historyFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.historyFile, JSON.stringify(this.requestHistory, null, 2));
    } catch (error) {
      console.error('保存请求历史失败:', error);
    }
  }

  getStats(): {
    dailyUsed: number;
    dailyLimit: number;
    burstUsed: number;
    burstLimit: number;
    currentConcurrent: number;
    maxConcurrent: number;
    isBackoff: boolean;
    successRate: number;
    avgResponseTime: number;
  } {
    const recentHistory = this.requestHistory.slice(-100);
    const successCount = recentHistory.filter(r => r.success).length;
    const successRate = recentHistory.length > 0 
      ? (successCount / recentHistory.length) * 100 
      : 100;
    
    const avgResponseTime = recentHistory.length > 0
      ? recentHistory.reduce((sum, r) => sum + r.responseTime, 0) / recentHistory.length
      : 0;

    return {
      dailyUsed: this.state.dailyCount,
      dailyLimit: this.config.dailyLimit,
      burstUsed: this.state.burstCount,
      burstLimit: this.config.burstLimit || 0,
      currentConcurrent: this.state.currentConcurrent,
      maxConcurrent: this.config.maxConcurrent,
      isBackoff: this.state.isBackoff,
      successRate,
      avgResponseTime
    };
  }

  reset(): void {
    this.state = this.getInitialState();
    this.requestHistory = [];
    this.saveState();
    this.saveHistory();
  }

  updateConfig(newConfig: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveState();
  }
}

export class RateLimiterManager {
  private limiters: Map<string, RateLimiter> = new Map();

  getLimiter(platformId: string, config?: Partial<RateLimitConfig>): RateLimiter {
    if (!this.limiters.has(platformId)) {
      this.limiters.set(platformId, new RateLimiter(platformId, config));
    }
    return this.limiters.get(platformId)!;
  }

  getAllStats(): Record<string, ReturnType<RateLimiter['getStats']>> {
    const stats: Record<string, ReturnType<RateLimiter['getStats']>> = {};
    this.limiters.forEach((limiter, platformId) => {
      stats[platformId] = limiter.getStats();
    });
    return stats;
  }

  resetAll(): void {
    this.limiters.forEach(limiter => limiter.reset());
  }
}
