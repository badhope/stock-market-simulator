import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import {
  ExpirationItem,
  ExpirationAlert,
  NotifierConfig,
  DEFAULT_EXPIRATION_RULES,
  DEFAULT_NOTIFIER_CONFIG
} from './expiration-types.js';

export class ExpirationNotifier {
  private items: Map<string, ExpirationItem> = new Map();
  private alerts: ExpirationAlert[] = [];
  private config: NotifierConfig;
  private dataFile: string;
  private checkTimer?: NodeJS.Timeout;
  private lastAlertTime: Map<string, number> = new Map();

  constructor(config?: Partial<NotifierConfig>) {
    this.config = { ...DEFAULT_NOTIFIER_CONFIG, ...config };
    this.dataFile = path.join(process.cwd(), '.data', 'expiration', 'items.json');
    this.loadItems();
  }

  private loadItems(): void {
    try {
      if (fs.existsSync(this.dataFile)) {
        const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf-8'));
        data.items?.forEach((item: ExpirationItem) => {
          this.items.set(item.id, item);
        });
        this.alerts = data.alerts || [];
      }
    } catch (error) {
      console.error('加载时效性数据失败:', error);
    }
  }

  private saveItems(): void {
    try {
      const dir = path.dirname(this.dataFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.dataFile, JSON.stringify({
        items: Array.from(this.items.values()),
        alerts: this.alerts
      }, null, 2));
    } catch (error) {
      console.error('保存时效性数据失败:', error);
    }
  }

  registerItem(item: Omit<ExpirationItem, 'id' | 'createdAt'>): string {
    const id = this.generateId();
    const newItem: ExpirationItem = {
      ...item,
      id,
      createdAt: Date.now()
    };
    
    this.items.set(id, newItem);
    this.saveItems();
    
    console.log(chalk.green(`✓ 已注册时效性项目: ${item.name}`));
    console.log(chalk.gray(`  过期时间: ${new Date(item.expiresAt).toLocaleString()}`));
    
    return id;
  }

  updateItem(id: string, updates: Partial<ExpirationItem>): boolean {
    const item = this.items.get(id);
    if (!item) {
      return false;
    }
    
    Object.assign(item, updates, { lastChecked: Date.now() });
    this.items.set(id, item);
    this.saveItems();
    
    return true;
  }

  removeItem(id: string): boolean {
    const result = this.items.delete(id);
    if (result) {
      this.saveItems();
    }
    return result;
  }

  checkExpiration(): ExpirationAlert[] {
    const now = Date.now();
    const newAlerts: ExpirationAlert[] = [];

    this.items.forEach(item => {
      const alert = this.checkItem(item, now);
      if (alert && this.shouldSendAlert(alert)) {
        newAlerts.push(alert);
        this.alerts.push(alert);
        this.sendAlert(alert);
      }
    });

    this.saveItems();
    return newAlerts;
  }

  private checkItem(item: ExpirationItem, now: number): ExpirationAlert | null {
    const rule = DEFAULT_EXPIRATION_RULES[item.type];
    const timeUntilExpiry = item.expiresAt - now;

    if (timeUntilExpiry <= 0) {
      return {
        id: this.generateId(),
        itemId: item.id,
        itemName: item.name,
        itemType: item.type,
        platformId: item.platformId,
        level: 'expired',
        message: `${item.name} 已过期`,
        expiredAt: item.expiresAt,
        detectedAt: now,
        acknowledged: false
      };
    }

    if (timeUntilExpiry <= rule.criticalThreshold) {
      return {
        id: this.generateId(),
        itemId: item.id,
        itemName: item.name,
        itemType: item.type,
        platformId: item.platformId,
        level: 'critical',
        message: `${item.name} 即将过期 (${this.formatTime(timeUntilExpiry)})`,
        expiredAt: item.expiresAt,
        detectedAt: now,
        acknowledged: false
      };
    }

    if (timeUntilExpiry <= rule.warningThreshold) {
      return {
        id: this.generateId(),
        itemId: item.id,
        itemName: item.name,
        itemType: item.type,
        platformId: item.platformId,
        level: 'warning',
        message: `${item.name} 将在 ${this.formatTime(timeUntilExpiry)} 后过期`,
        expiredAt: item.expiresAt,
        detectedAt: now,
        acknowledged: false
      };
    }

    return null;
  }

  private shouldSendAlert(alert: ExpirationAlert): boolean {
    const lastAlert = this.lastAlertTime.get(alert.itemId);
    if (lastAlert && Date.now() - lastAlert < this.config.alertCooldown) {
      return false;
    }
    
    this.lastAlertTime.set(alert.itemId, Date.now());
    return true;
  }

  private sendAlert(alert: ExpirationAlert): void {
    if (this.config.enableVisual) {
      this.visualAlert(alert);
    }
    
    if (this.config.enableSound) {
      this.soundAlert(alert);
    }
  }

  private visualAlert(alert: ExpirationAlert): void {
    const levelColors = {
      warning: chalk.yellow,
      critical: chalk.red,
      expired: chalk.red.bold
    };

    const levelIcons = {
      warning: '⚠️',
      critical: '🚨',
      expired: '❌'
    };

    const color = levelColors[alert.level];
    const icon = levelIcons[alert.level];

    console.log('\n' + color('═'.repeat(60)));
    console.log(color(`${icon} 时效性提醒`));
    console.log(color('═'.repeat(60)));
    console.log(color(`项目: ${alert.itemName}`));
    console.log(color(`类型: ${alert.itemType}`));
    if (alert.platformId) {
      console.log(color(`平台: ${alert.platformId}`));
    }
    console.log(color(`状态: ${alert.message}`));
    console.log(color(`过期时间: ${new Date(alert.expiredAt).toLocaleString()}`));
    console.log(color('═'.repeat(60)) + '\n');
  }

  private soundAlert(alert: ExpirationAlert): void {
    if (process.platform === 'win32') {
      const soundMap = {
        warning: 'SystemNotification',
        critical: 'SystemExclamation',
        expired: 'SystemHand'
      };
      
      try {
        const { execSync } = require('child_process');
        execSync(`powershell -c "(New-Object Media.SoundPlayer 'C:\\Windows\\Media\\${soundMap[alert.level]}.wav').PlaySync()"`, 
          { timeout: 5000 });
      } catch {
        try {
          require('child_process').execSync('powershell -c "[console]::beep(800, 200)"', { timeout: 5000 });
        } catch {}
      }
    } else if (process.platform === 'darwin') {
      try {
        require('child_process').execSync('afplay /System/Library/Sounds/Glass.aiff', { timeout: 5000 });
      } catch {}
    } else {
      try {
        require('child_process').execSync('beep -f 800 -l 200', { timeout: 5000 });
      } catch {}
    }
  }

  private formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}天${hours % 24}小时`;
    }
    if (hours > 0) {
      return `${hours}小时${minutes % 60}分钟`;
    }
    if (minutes > 0) {
      return `${minutes}分钟`;
    }
    return `${seconds}秒`;
  }

  startMonitoring(): void {
    this.checkExpiration();
    
    this.checkTimer = setInterval(() => {
      this.checkExpiration();
    }, this.config.checkInterval);
    
    console.log(chalk.green('✓ 时效性监控已启动'));
    console.log(chalk.gray(`  检查间隔: ${this.config.checkInterval / 60000} 分钟`));
  }

  stopMonitoring(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = undefined;
    }
    console.log(chalk.yellow('时效性监控已停止'));
  }

  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.saveItems();
      return true;
    }
    return false;
  }

  getActiveAlerts(): ExpirationAlert[] {
    return this.alerts.filter(a => !a.acknowledged);
  }

  getAllItems(): ExpirationItem[] {
    return Array.from(this.items.values());
  }

  getItem(id: string): ExpirationItem | undefined {
    return this.items.get(id);
  }

  getExpiringItems(within: number = 24 * 60 * 60 * 1000): ExpirationItem[] {
    const now = Date.now();
    return Array.from(this.items.values())
      .filter(item => item.expiresAt - now <= within && item.expiresAt > now)
      .sort((a, b) => a.expiresAt - b.expiresAt);
  }

  private generateId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
