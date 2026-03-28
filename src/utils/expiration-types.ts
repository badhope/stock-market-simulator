export interface ExpirationItem {
  id: string;
  type: 'cookie' | 'token' | 'config' | 'data';
  platformId?: string;
  name: string;
  createdAt: number;
  expiresAt: number;
  lastChecked?: number;
  metadata?: Record<string, unknown>;
}

export interface ExpirationRule {
  type: ExpirationItem['type'];
  defaultTTL: number;
  warningThreshold: number;
  criticalThreshold: number;
}

export interface ExpirationAlert {
  id: string;
  itemId: string;
  itemName: string;
  itemType: ExpirationItem['type'];
  platformId?: string;
  level: 'warning' | 'critical' | 'expired';
  message: string;
  expiredAt: number;
  detectedAt: number;
  acknowledged: boolean;
}

export interface NotifierConfig {
  enableSound: boolean;
  enableVisual: boolean;
  checkInterval: number;
  alertCooldown: number;
  soundFile?: string;
}

export const DEFAULT_EXPIRATION_RULES: Record<string, ExpirationRule> = {
  cookie: {
    type: 'cookie',
    defaultTTL: 7 * 24 * 60 * 60 * 1000,
    warningThreshold: 2 * 24 * 60 * 60 * 1000,
    criticalThreshold: 12 * 60 * 60 * 1000
  },
  token: {
    type: 'token',
    defaultTTL: 24 * 60 * 60 * 1000,
    warningThreshold: 6 * 60 * 60 * 1000,
    criticalThreshold: 1 * 60 * 60 * 1000
  },
  config: {
    type: 'config',
    defaultTTL: 30 * 24 * 60 * 60 * 1000,
    warningThreshold: 7 * 24 * 60 * 60 * 1000,
    criticalThreshold: 3 * 24 * 60 * 60 * 1000
  },
  data: {
    type: 'data',
    defaultTTL: 90 * 24 * 60 * 60 * 1000,
    warningThreshold: 14 * 24 * 60 * 60 * 1000,
    criticalThreshold: 7 * 24 * 60 * 60 * 1000
  }
};

export const DEFAULT_NOTIFIER_CONFIG: NotifierConfig = {
  enableSound: true,
  enableVisual: true,
  checkInterval: 60 * 60 * 1000,
  alertCooldown: 30 * 60 * 1000
};
