export interface RateLimitConfig {
  minInterval: number;
  maxConcurrent: number;
  dailyLimit: number;
  burstLimit?: number;
  backoffMultiplier?: number;
  maxBackoff?: number;
}

export interface RateLimitState {
  lastRequestTime: number;
  currentConcurrent: number;
  dailyCount: number;
  dailyResetTime: number;
  burstCount: number;
  burstResetTime: number;
  isBackoff: boolean;
  backoffUntil: number;
}

export interface RequestRecord {
  timestamp: number;
  platformId: string;
  success: boolean;
  responseTime: number;
}

export enum RateLimitError {
  INTERVAL_TOO_SHORT = 'INTERVAL_TOO_SHORT',
  CONCURRENT_LIMIT = 'CONCURRENT_LIMIT',
  DAILY_LIMIT = 'DAILY_LIMIT',
  BURST_LIMIT = 'BURST_LIMIT',
  BACKOFF_ACTIVE = 'BACKOFF_ACTIVE'
}

export interface RateLimitResult {
  allowed: boolean;
  error?: RateLimitError;
  waitTime?: number;
  reason?: string;
}

export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  minInterval: 1000,
  maxConcurrent: 3,
  dailyLimit: 100,
  burstLimit: 10,
  backoffMultiplier: 2,
  maxBackoff: 60000
};

export const PLATFORM_RATE_LIMITS: Record<string, Partial<RateLimitConfig>> = {
  juejin: {
    minInterval: 2000,
    maxConcurrent: 2,
    dailyLimit: 50,
    burstLimit: 5
  },
  csdn: {
    minInterval: 3000,
    maxConcurrent: 2,
    dailyLimit: 30,
    burstLimit: 3
  },
  cnblogs: {
    minInterval: 2000,
    maxConcurrent: 3,
    dailyLimit: 50,
    burstLimit: 5
  },
  zhihu: {
    minInterval: 5000,
    maxConcurrent: 1,
    dailyLimit: 20,
    burstLimit: 2
  },
  segmentfault: {
    minInterval: 3000,
    maxConcurrent: 2,
    dailyLimit: 30,
    burstLimit: 3
  }
};
